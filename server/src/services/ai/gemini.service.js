import axios from "axios";
import axiosRetry from "axios-retry";
import { logger } from "../../utils/logger.js";
import { FLIPKART_SEARCH_PROMPT } from "../../prompts/flipkart.prompt.js";
import { AMAZON_SEARCH_PROMPT } from "../../prompts/amazon.prompt.js";

const geminiClient = axios.create({
  baseURL: "https://generativelanguage.googleapis.com/v1beta",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

axiosRetry(geminiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status === 429,
});

/**
 * Follow redirects to find the actual target URL
 */
const resolveUrl = async (url) => {
  if (!url) return "";

  // Skip HTTP resolution if the URL is already a direct product/page link on target ecommerce domains
  const lowerUrl = url.toLowerCase();
  const isDirectStore =
    lowerUrl.includes("flipkart.com") ||
    lowerUrl.includes("amazon.in") ||
    lowerUrl.includes("amazon.com") ||
    lowerUrl.includes("croma.com") ||
    lowerUrl.includes("reliancedigital.in");

  if (isDirectStore && !lowerUrl.includes("google.com/url") && !lowerUrl.includes("redirect")) {
    return url;
  }

  try {
    const res = await axios.get(url, {
      maxRedirects: 5,
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    return res.request.res.responseUrl || url;
  } catch (err) {
    if (err.request?.res?.responseUrl) {
      logger.debug(`[Gemini Grounding] Resolved URL redirect via fallback: ${err.request.res.responseUrl}`);
      return err.request.res.responseUrl;
    }
    logger.debug(`[Gemini Grounding] Failed to resolve URL redirect: ${err.message}`);
    return url;
  }
};

/**
 * Check if a URL is a direct product detail page instead of a search, category, or listing page.
 */
const isDirectProductUrl = (url, platform) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();

  // Exclude search pages, category pages, brand list pages
  if (
    lowerUrl.includes("/search") ||
    lowerUrl.includes("?q=") ||
    lowerUrl.includes("?k=") ||
    lowerUrl.includes("/category/") ||
    lowerUrl.includes("/categories/") ||
    lowerUrl.includes("/brand/") ||
    lowerUrl.includes("/brands/")
  ) {
    // Exception: Reliance Digital product page with search_collection query param is valid
    if (platform === "reliance" && lowerUrl.includes("/product/")) {
      return true;
    }
    return false;
  }

  if (platform === "reliance") {
    return lowerUrl.includes("/product/");
  }
  if (platform === "croma") {
    return lowerUrl.includes("/p/");
  }
  if (platform === "flipkart") {
    return lowerUrl.includes("/p/");
  }
  if (platform === "amazon") {
    return lowerUrl.includes("/dp/") || lowerUrl.includes("/gp/");
  }

  return true;
};

/**
 * Fetch HTML and extract og:image meta tag
 */
const scrapeProductImage = async (url) => {
  if (!url || !url.startsWith("http")) return null;
  // Skip Amazon as it blocks
  if (url.includes("amazon.")) return null;

  try {
    const res = await axios.get(url, {
      timeout: 5000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    const html = res.data;
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
                        html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
    return ogImageMatch ? ogImageMatch[1] : null;
  } catch (err) {
    logger.debug(`[Gemini Grounding] Failed to scrape image from ${url}: ${err.message}`);
    return null;
  }
};

/**
 * Generic search with Google grounding
 */
export const searchWithGrounding = async (query, platformFilter, filters = {}) => {
  if (!process.env.GEMINI_API_KEY) {
    logger.warn(`Gemini API key not configured — skipping search for ${platformFilter}`);
    return [];
  }

  try {
    logger.info(`[Gemini Grounding] Performing search on ${platformFilter} for: "${query}"`);

    // Build platform specific instructions
    let platformInst = "";
    if (platformFilter === "flipkart") {
      platformInst = "Flipkart.com in Indian market pricing (INR)";
    } else if (platformFilter === "amazon") {
      platformInst = "Amazon.in in Indian market pricing (INR)";
    } else {
      platformInst = "Reliance Digital and Croma in Indian market pricing (INR)";
    }

    const promptText = `You are a product search grounding assistant. Search for "${query}" on ${platformInst}.
Return a list of 4-6 real products available right now.
For each product, you MUST cite the Google Search source by adding a citation marker like [1], [2], etc. inside the "description" field. Every product must have a citation marker matching one of the search results you used.
Return ONLY a valid JSON array of objects. No markdown formatting. No explanation.
Required JSON format:
[
  {
    "name": "Full product name with variant/color/model",
    "brand": "Brand name",
    "description": "A detailed description of the product [1].", // MUST include citation marker
    "category": "Category path (e.g. Electronics > Mobiles > Smartphones)",
    "price": {
      "amount": 119900,
      "currency": "INR",
      "originalAmount": 119900,
      "discountPercent": 0
    },
    "rating": {
      "average": 4.6,
      "count": 1250
    },
    "availability": {
      "inStock": true,
      "deliveryEstimate": "Delivery in 2 days"
    },
    "source": {
      "platform": "${platformFilter === "global" ? "reliance" : platformFilter}" // must be: amazon, flipkart, reliance, or croma
    },
    "features": [
      "Feature 1 with specification",
      "Feature 2 with specification"
    ]
  }
]`;

    const response = await geminiClient.post(
      `/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: promptText,
              },
            ],
          },
        ],
        tools: [
          {
            google_search: {},
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      }
    );

    const parts = response.data.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p) => p.text);
    const content = textPart ? textPart.text : "[]";

    const cleaned = content.substring(content.indexOf("["), content.lastIndexOf("]") + 1).trim();
    if (!cleaned) {
      logger.warn(`[Gemini Grounding] Empty JSON returned for ${platformFilter}`);
      return [];
    }

    const products = JSON.parse(cleaned);
    logger.info(`[Gemini Grounding] Found ${products.length} products for ${platformFilter}`);

    // Extract grounding chunks
    const chunks = response.data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    logger.info(`[Gemini Grounding] Grounding chunks count: ${chunks.length}`);

    // Resolve URLs in parallel
    const resolvedUrls = [];
    await Promise.all(
      chunks.map(async (chunk) => {
        if (chunk.web?.uri) {
          const resolved = await resolveUrl(chunk.web.uri);
          resolvedUrls.push({
            original: chunk.web.uri,
            resolved,
            title: chunk.web.title || "",
          });
        }
      })
    );

    // Scrape images from resolved URLs (in parallel)
    const urlImages = {};
    await Promise.all(
      resolvedUrls.map(async (item) => {
        if (
          item.resolved.includes("flipkart.com") ||
          item.resolved.includes("croma.com") ||
          item.resolved.includes("reliancedigital.in")
        ) {
          const image = await scrapeProductImage(item.resolved);
          if (image) {
            urlImages[item.resolved] = image;
          }
        }
      })
    );

    // Match each product to a resolved URL and set correct properties
    products.forEach((p) => {
      const platform = p.source?.platform || (platformFilter === "global" ? "reliance" : platformFilter);
      const nameWords = p.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

      let bestMatch = null;
      let maxOverlap = 0;

      resolvedUrls.forEach((item) => {
        const resolvedLower = item.resolved.toLowerCase();

        let platformMatch = false;
        if (platform === "amazon" && (resolvedLower.includes("amazon.") || item.title.toLowerCase().includes("amazon"))) {
          platformMatch = true;
        } else if (platform === "flipkart" && (resolvedLower.includes("flipkart.com") || item.title.toLowerCase().includes("flipkart"))) {
          platformMatch = true;
        } else if (platform === "croma" && (resolvedLower.includes("croma.com") || item.title.toLowerCase().includes("croma"))) {
          platformMatch = true;
        } else if (platform === "reliance" && (resolvedLower.includes("reliancedigital") || item.title.toLowerCase().includes("reliance"))) {
          platformMatch = true;
        }

        // Only match direct product URLs to avoid selecting listing/search result pages
        if (platformMatch && isDirectProductUrl(item.resolved, platform)) {
          let overlap = 0;
          nameWords.forEach((word) => {
            if (resolvedLower.includes(word) || item.title.toLowerCase().includes(word)) {
              overlap++;
            }
          });
          if (overlap > maxOverlap) {
            maxOverlap = overlap;
            bestMatch = item;
          }
        }
      });

      // Assign matched URL and image
      if (bestMatch) {
        p.source = {
          platform,
          url: bestMatch.resolved,
          productId: p.source?.productId || bestMatch.resolved.split("/p/")?.[1]?.split("?")?.[0] || p.name,
        };
        if (urlImages[bestMatch.resolved]) {
          p.images = [urlImages[bestMatch.resolved]];
        }
      } else {
        // Safe fallback URL
        p.source = {
          platform,
          url: p.source?.url || `https://www.google.com/search?q=${encodeURIComponent(p.name)}`,
          productId: p.source?.productId || p.name,
        };
      }
    });

    return products;
  } catch (err) {
    logger.error(`[Gemini Grounding] Search failed for ${platformFilter}:`, {
      message: err.message,
      stack: err.stack,
      data: err.response?.data
    });
    return [];
  }
};

/**
 * Search Flipkart products using Gemini AI with grounding
 * @param {string} query - Product search query
 * @param {Object} filters - Optional search filters
 * @returns {Promise<Array>} Array of product objects
 */
export const searchFlipkartWithGemini = async (query, filters = {}) => {
  const products = await searchWithGrounding(query, "flipkart", filters);
  return products.map((p) => ({
    ...p,
    source: { platform: "flipkart", ...p.source },
  }));
};

/**
 * Search Amazon products using Gemini AI with grounding
 * @param {string} query - Product search query
 * @param {Object} filters - Optional search filters
 * @returns {Promise<Array>} Array of product objects
 */
export const searchAmazonWithGemini = async (query, filters = {}) => {
  const products = await searchWithGrounding(query, "amazon", filters);
  return products.map((p) => ({
    ...p,
    source: { platform: "amazon", ...p.source },
  }));
};

const parseAIResponse = (content) => {
  try {
    const cleaned = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : parsed.products || [];
  } catch (err) {
    logger.warn("[Gemini] Failed to parse AI response:", err.message);
    return [];
  }
};
