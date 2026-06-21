import mongoose from "mongoose";
import PQueue from "p-queue";
import { searchAmazonWithGrok } from "./ai/grok.service.js";
import { searchFlipkartWithGemini, searchAmazonWithGemini } from "./ai/gemini.service.js";
import { searchGlobalWithOpenRouter, aggregateWithAI, generateEmbedding } from "./ai/openrouter.service.js";
import { ragSearch, storeProductEmbedding } from "./rag/ragService.js";
import { getCache, setCache, normalizeCacheKey } from "./cache/cacheService.js";
import SearchHistory from "../models/SearchHistory.model.js";
import Analytics from "../models/Analytics.model.js";
import { logger } from "../utils/logger.js";

// Request queue to prevent API abuse
const apiQueue = new PQueue({ concurrency: 3, timeout: 45000 });

/**
 * Main product search function — RAG → Cache → AI search
 *
 * @param {string} query - Search query
 * @param {Object} filters - Search filters
 * @param {Object} options - Options (userId, ipAddress)
 * @returns {Promise<Object>} Search results
 */
export const searchProducts = async (query, filters = {}, options = {}) => {
  const startTime = Date.now();
  const cacheKey = normalizeCacheKey(query, filters);
  let cacheHit = false;

  try {
    // ─── Step 1: Redis Cache (Always First — O(1), no DB hit) ────────────────
    const cached = await getCache(cacheKey);
    if (cached) {
      cacheHit = true;
      logger.info(`[Search] Cache HIT for "${query}" (${cached.source})`);

      // Cache individual products in Redis on cache hit as well to prevent 404s for stale/cached searches
      if (cached.data?.products && cached.data.products.length > 0) {
        const cachePromises = cached.data.products.map((p) =>
          setCache(`product:${p._id}`, p, 60 * 60)
        );
        await Promise.allSettled(cachePromises);
      }

      await recordSearch(query, filters, {
        ...options,
        cacheHit: true,
        resultsCount: cached.data.products?.length || 0,
        responseTimeMs: Date.now() - startTime,
      });

      return {
        ...cached.data,
        meta: { ...cached.data.meta, cacheHit: true, cacheSource: cached.source },
      };
    }

    // Generate query embedding (reused for RAG query)
    const embedding = await generateEmbedding(query);

    // ─── Step 2: DB Lookup (One call, env-appropriate strategy) ───────────────
    logger.info(`[Search] DB lookup first for "${query}"`);
    const { results: ragResults, source: ragSource } = await ragSearch(query, embedding, 5);

    const hasMockData = ragResults.some((p) => {
      const img = p.images?.[0] || "";
      const url = p.source?.url || "";
      return !img || 
             img.includes("unsplash.com/photo-") || 
             img.includes("example.com") ||
             img.includes("loremflickr") ||
             img.includes("placeholder") ||
             img.includes("picsum.photos") ||
             !url ||
             url.toLowerCase().includes("example") ||
             url.toLowerCase().includes("placeholder") ||
             !url.startsWith("http");
    });

    if (ragResults.length >= 3 && !hasMockData) {
      logger.info(`[Search] DB returned ${ragResults.length} results — skipping AI search`);

      const result = buildSearchResult(ragResults, ragResults, query, {
        source: "database",
        ragSource,
        responseTimeMs: Date.now() - startTime,
      });

      await setCache(cacheKey, result, 60 * 60); // 1 hour for DB results

      // Cache each product individually in Redis
      if (ragResults && ragResults.length > 0) {
        const cachePromises = ragResults.map((p) =>
          setCache(`product:${p._id}`, p, 60 * 60)
        );
        await Promise.allSettled(cachePromises);
      }

      await recordSearch(query, filters, { ...options, resultsCount: ragResults.length, responseTimeMs: Date.now() - startTime });

      return result;
    } else if (ragResults.length >= 3 && hasMockData) {
      logger.info(`[Search] DB returned results but they contain mock data — forcing live grounding search`);
    }

    // ─── Step 3: Parallel AI Search ─────────────────────────────────────────
    logger.info(`[Search] Running parallel AI search for "${query}"`);

    const [amazonResults, flipkartResults, globalResults] = await Promise.allSettled([
      apiQueue.add(async () => {
        logger.info(`[Search] Skipping Grok (no billing credits) — using Gemini for Amazon search`);
        return await searchAmazonWithGemini(query, filters);
      }),
      apiQueue.add(() => searchFlipkartWithGemini(query, filters)),
      apiQueue.add(() => searchGlobalWithOpenRouter(query, filters)),
    ]);

    const amazon = amazonResults.status === "fulfilled" ? amazonResults.value : [];
    const flipkart = flipkartResults.status === "fulfilled" ? flipkartResults.value : [];
    const global = globalResults.status === "fulfilled" ? globalResults.value : [];

    // Combine all results — DB results first to preserve existing MongoDB ObjectIds during deduplication
    const allProducts = [...ragResults, ...amazon, ...flipkart, ...global];

    // ─── Step 4: Deduplicate & Rank ─────────────────────────────────────────
    const uniqueProducts = deduplicateProducts(allProducts);
    const rankedProducts = rankProducts(uniqueProducts);

    // Build image propagation map based on name keywords
    const imagesByModel = {};
    rankedProducts.forEach((p) => {
      const img = p.images?.[0];
      const isReal = img && 
        !img.includes("example.com") && 
        !img.includes("loremflickr") && 
        !img.includes("placeholder") && 
        !img.includes("picsum.photos");

      if (isReal) {
        const key = p.name.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).slice(0, 4).join(" ");
        if (key && !imagesByModel[key]) {
          imagesByModel[key] = img;
        }
      }
    });

    // Assign ObjectId and fix placeholder images for any products that don't have them
    // to ensure they have consistent, valid IDs and high-quality images for detail links and DB storage
    rankedProducts.forEach((product) => {
      if (!product._id) {
        product._id = new mongoose.Types.ObjectId();
      }

      let images = product.images || [];
      const isPlaceholder = !images[0] || 
        images[0].includes("example.com") || 
        images[0].includes("loremflickr") || 
        images[0].includes("placeholder") || 
        images[0].includes("picsum.photos");

      if (isPlaceholder) {
        const key = product.name.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).slice(0, 4).join(" ");
        let propagatedImage = null;
        for (const k of Object.keys(imagesByModel)) {
          if (key.includes(k) || k.includes(key)) {
            propagatedImage = imagesByModel[k];
            break;
          }
        }

        if (propagatedImage) {
          product.images = [propagatedImage];
        } else {
          product.images = [getProductImage(product.name, product.category)];
        }
      }
    });

    // ─── Step 5: AI Aggregation & Recommendations ───────────────────────────
    const recommendations = await aggregateWithAI(rankedProducts, query);

    // ─── Step 6: Build Response ─────────────────────────────────────────────
    const result = buildSearchResult(rankedProducts, allProducts, query, {
      source: "ai",
      recommendations,
      sources: {
        amazon: amazon.length,
        flipkart: flipkart.length,
        global: global.length,
        rag: ragResults.length,
      },
      responseTimeMs: Date.now() - startTime,
    });

    // ─── Step 7: Cache & Store ──────────────────────────────────────────────
    await setCache(cacheKey, result, 60 * 60); // 1 hour cache

    // Cache each product individually in Redis for 1 hour to prevent 404s
    if (rankedProducts && rankedProducts.length > 0) {
      const cachePromises = rankedProducts.map((p) =>
        setCache(`product:${p._id}`, p, 60 * 60)
      );
      await Promise.allSettled(cachePromises);
    }

    // Store products in DB for future RAG (non-blocking)
    storeProductsAsync(rankedProducts.slice(0, 10), query);

    // ─── Step 8: Record Analytics ────────────────────────────────────────────
    await recordSearch(query, filters, {
      ...options,
      cacheHit: false,
      resultsCount: rankedProducts.length,
      responseTimeMs: Date.now() - startTime,
      sources: result.meta.sources,
    });

    return result;
  } catch (err) {
    logger.error("[Search] Product search failed:", err);
    throw err;
  }
};

/**
 * Remove duplicate products based on name similarity and price
 */
const deduplicateProducts = (products) => {
  const seen = new Map();

  return products.filter((product) => {
    if (!product?.name) return false;

    const key = `${product.name.toLowerCase().replace(/\s+/g, "")}_${
      product.source?.platform
    }`;

    if (seen.has(key)) return false;
    seen.set(key, true);
    return true;
  });
};

/**
 * Rank products by a weighted scoring system
 */
const rankProducts = (products) => {
  return products
    .map((product) => {
      let score = 0;

      // Rating score (0-40 points)
      if (product.rating?.average) {
        score += (product.rating.average / 5) * 40;
      }

      // Review count score (0-20 points)
      if (product.rating?.count) {
        score += Math.min(product.rating.count / 1000, 1) * 20;
      }

      // Availability score (0-15 points)
      if (product.availability?.inStock) score += 15;

      // Price competitiveness (0-15 points)
      if (product.price?.discountPercent > 0) {
        score += Math.min(product.price.discountPercent / 2, 15);
      }

      // Delivery (0-10 points)
      if (product.availability?.deliveryEstimate?.toLowerCase().includes("today")) {
        score += 10;
      } else if (product.availability?.deliveryEstimate?.toLowerCase().includes("tomorrow")) {
        score += 7;
      } else if (product.availability?.deliveryEstimate) {
        score += 3;
      }

      return { ...product, _score: score };
    })
    .sort((a, b) => b._score - a._score);
};

/**
 * Get a matching high-quality category or brand specific Unsplash image
 */
const getProductImage = (name = "", category = "") => {
  const lowercaseName = name.toLowerCase();
  const lowercaseCat = (category || "").toLowerCase();

  // Smartphones / Mobiles
  if (lowercaseName.includes("iphone")) {
    return "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&h=400&q=80"; // iPhone
  }
  if (lowercaseName.includes("samsung") && (lowercaseName.includes("galaxy") || lowercaseName.includes("s25") || lowercaseName.includes("s24"))) {
    return "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&h=400&q=80"; // Samsung Galaxy
  }
  if (lowercaseName.includes("oneplus")) {
    return "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&h=400&q=80"; // OnePlus phone
  }
  if (lowercaseCat.includes("phone") || lowercaseCat.includes("mobile") || lowercaseName.includes("phone") || lowercaseName.includes("mobile")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&h=400&q=80"; // Generic smartphone
  }

  // Laptops / Computers
  if (lowercaseName.includes("macbook")) {
    return "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&h=400&q=80"; // MacBook
  }
  if (lowercaseCat.includes("laptop") || lowercaseName.includes("laptop") || lowercaseName.includes("notebook")) {
    return "https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=400&h=400&q=80"; // Generic Laptop
  }

  // Tablets
  if (lowercaseCat.includes("tablet") || lowercaseName.includes("ipad") || lowercaseName.includes("tablet")) {
    return "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&h=400&q=80"; // Tablet
  }

  // Audio / Headphones
  if (lowercaseName.includes("sony") && lowercaseName.includes("wh-")) {
    return "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&h=400&q=80"; // Sony headphones
  }
  if (lowercaseCat.includes("audio") || lowercaseCat.includes("headphone") || lowercaseName.includes("headphone") || lowercaseName.includes("earbuds")) {
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&h=400&q=80"; // Headphones
  }

  // Smartwatches / Wearables
  if (lowercaseCat.includes("wearable") || lowercaseCat.includes("watch") || lowercaseName.includes("watch")) {
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&h=400&q=80"; // Smartwatch
  }

  // Cameras
  if (lowercaseCat.includes("camera") || lowercaseName.includes("camera") || lowercaseName.includes("canon") || lowercaseName.includes("nikon")) {
    return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&h=400&q=80"; // Camera
  }

  // TVs
  if (lowercaseCat.includes("tv") || lowercaseCat.includes("television") || lowercaseName.includes("tv") || lowercaseName.includes("television")) {
    return "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=400&h=400&q=80"; // TV
  }

  // Gaming
  if (lowercaseName.includes("playstation") || lowercaseName.includes("ps5") || lowercaseName.includes("xbox") || lowercaseName.includes("nintendo")) {
    return "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=400&h=400&q=80"; // Gaming Console
  }

  // Default fallback (generic clean product box)
  return "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&h=400&q=80";
};

/**
 * Normalize and fix product fields: fallback image and URL corrections
 */
export const normalizeProduct = (product, fallbackQuery = "") => {
  if (!product) return product;

  // Handle mongoose document vs plain object
  const productObj = typeof product.toObject === "function" ? product.toObject() : product;

  let images = productObj.images || [];
  const isPlaceholder = !images[0] || 
    images[0].includes("example.com") || 
    images[0].includes("loremflickr") || 
    images[0].includes("placeholder") || 
    images[0].includes("picsum.photos");

  if (isPlaceholder) {
    images = [getProductImage(productObj.name, productObj.category)];
  }

  let url = productObj.source?.url;
  const platform = productObj.source?.platform || "other";
  const searchName = productObj.name || fallbackQuery;
  const encodedName = encodeURIComponent(searchName || "");
  
  const isFakeUrl = !url || 
    url.toLowerCase().includes("example") || 
    url.toLowerCase().includes("placeholder") || 
    !url.startsWith("http");

  if (isFakeUrl && encodedName) {
    switch (platform) {
      case "amazon":
        url = `https://www.amazon.com/s?k=${encodedName}`;
        break;
      case "flipkart":
        url = `https://www.flipkart.com/search?q=${encodedName}`;
        break;
      case "reliance":
        url = `https://www.reliancedigital.in/search?q=${encodedName}`;
        break;
      case "croma":
        url = `https://www.croma.com/search/?q=${encodedName}`;
        break;
      default:
        url = `https://www.google.com/search?tbm=shop&q=${encodedName}`;
        break;
    }
  }

  const source = { ...productObj.source, url };
  return { ...productObj, images, source };
};

/**
 * Build standardized search result object
 */
const buildSearchResult = (products, rawProducts, query, meta) => {
  // Ensure every product has a valid display image for the UI since AI simulates the URLs
  // Also, replace hallucinated 404 URLs with working search URLs for each platform
  const processedProducts = products.map((product) => normalizeProduct(product, query));

  return {
    query,
    products: processedProducts,
    totalCount: processedProducts.length,
    recommendations: meta.recommendations || null,
    meta: {
      source: meta.source || "ai",
      cacheHit: meta.cacheHit || false,
      cacheSource: meta.cacheSource || null,
      responseTimeMs: meta.responseTimeMs || 0,
      sources: meta.sources || {},
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Store products asynchronously (non-blocking)
 */
const storeProductsAsync = async (products, query) => {
  try {
    const storePromises = products.map((p) =>
      storeProductEmbedding({ ...p, searchQuery: query }).catch((e) =>
        logger.debug("[Search] Product store error:", e.message)
      )
    );
    await Promise.allSettled(storePromises);
  } catch (err) {
    logger.debug("[Search] Async product store failed:", err.message);
  }
};

/**
 * Record search in history and update analytics
 */
const recordSearch = async (query, filters, options) => {
  try {
    await SearchHistory.create({
      query,
      normalizedQuery: query.toLowerCase().trim(),
      userId: options.userId || null,
      ipAddress: options.ipAddress || null,
      filters,
      resultsCount: options.resultsCount || 0,
      cacheHit: options.cacheHit || false,
      responseTimeMs: options.responseTimeMs || 0,
      sources: {
        amazon: (options.sources?.amazon || 0) > 0,
        flipkart: (options.sources?.flipkart || 0) > 0,
        global: (options.sources?.global || 0) > 0,
      },
      status: "success",
    });
  } catch (err) {
    logger.debug("[Search] Failed to record history:", err.message);
  }
};
