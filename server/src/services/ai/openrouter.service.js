import axios from "axios";
import axiosRetry from "axios-retry";
import { logger } from "../../utils/logger.js";
import { GLOBAL_SEARCH_PROMPT, AGGREGATION_PROMPT } from "../../prompts/global.prompt.js";

const openRouterClient = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": "https://ai-product-search.com",
    "X-Title": "AI Product Search Hub",
  },
});

axiosRetry(openRouterClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status === 429 ||
    error.response?.status === 503,
});

/**
 * Search global platforms (Reliance, Croma) using OpenRouter
 * @param {string} query - Product search query
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of products
 */
export const searchGlobalWithOpenRouter = async (query, filters = {}) => {
  if (!process.env.OPENROUTER_API_KEY) {
    logger.warn("OpenRouter API key not configured — skipping global search");
    return [];
  }

  try {
    logger.info(`[OpenRouter] Global search for: "${query}"`);

    const prompt = GLOBAL_SEARCH_PROMPT(query, filters);

    const response = await openRouterClient.post("/chat/completions", {
      model: "anthropic/claude-3-haiku",
      messages: [
        {
          role: "system",
          content:
            "You are a product aggregation AI. Respond only with a valid JSON array of product objects from multiple platforms. No markdown, no explanations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 6000,
    });

    const content = response.data.choices[0]?.message?.content || "[]";
    const products = parseAIResponse(content);

    logger.info(`[OpenRouter] Found ${products.length} global products`);
    return products;
  } catch (error) {
    logger.error("[OpenRouter] Global search failed:", {
      message: error.message,
      status: error.response?.status,
    });
    return [];
  }
};

/**
 * Use OpenRouter to generate AI aggregation and recommendations
 * @param {Array} allProducts - All products from all sources
 * @param {string} query - Original search query
 * @returns {Promise<Object>} Aggregated results with recommendations
 */
export const aggregateWithAI = async (allProducts, query) => {
  if (!process.env.OPENROUTER_API_KEY || allProducts.length === 0) {
    return generateFallbackAggregation(allProducts);
  }

  try {
    logger.info(`[OpenRouter] Aggregating ${allProducts.length} products`);

    // Trim products to avoid token limit
    const trimmedProducts = allProducts.slice(0, 20).map((p) => ({
      name: p.name,
      price: p.price,
      rating: p.rating,
      source: p.source?.platform,
      features: p.features?.slice(0, 3),
      availability: p.availability?.inStock,
    }));

    const prompt = AGGREGATION_PROMPT(query, trimmedProducts);

    const response = await openRouterClient.post("/chat/completions", {
      model: "anthropic/claude-3-haiku",
      messages: [
        {
          role: "system",
          content:
            "You are a product recommendation AI. Analyze products and return a JSON object with bestOverall, bestValue, bestPremium, bestBudget recommendations with reasoning. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.data.choices[0]?.message?.content || "{}";
    return parseAIResponse(content, {});
  } catch (error) {
    logger.error("[OpenRouter] Aggregation failed:", error.message);
    return generateFallbackAggregation(allProducts);
  }
};

/**
 * Generate embeddings using OpenRouter
 */
export const generateEmbedding = async (text) => {
  if (!process.env.OPENROUTER_API_KEY) return null;

  try {
    const response = await openRouterClient.post("/embeddings", {
      model: "openai/text-embedding-ada-002",
      input: text.substring(0, 8000),
    });

    return response.data.data[0]?.embedding || null;
  } catch (error) {
    logger.error("[OpenRouter] Embedding generation failed:", error.message);
    return null;
  }
};

/**
 * Fallback aggregation when AI is unavailable
 */
const generateFallbackAggregation = (products) => {
  if (products.length === 0) return {};

  const sorted = [...products].sort(
    (a, b) => (b.rating?.average || 0) - (a.rating?.average || 0)
  );
  const byPrice = [...products].sort(
    (a, b) => (a.price?.amount || 0) - (b.price?.amount || 0)
  );

  return {
    bestOverall: sorted[0] || null,
    bestValue: byPrice[0] || null,
    bestPremium: byPrice[byPrice.length - 1] || null,
    bestBudget: byPrice[1] || byPrice[0] || null,
    reasoning: {
      bestOverall: "Highest rated product across all platforms.",
      bestValue: "Best price-to-quality ratio.",
      bestPremium: "Premium tier with top-tier features.",
      bestBudget: "Most affordable option available.",
    },
  };
};

const parseAIResponse = (content, fallback = []) => {
  try {
    const cleaned = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
};
