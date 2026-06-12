import mongoose from "mongoose";
import PQueue from "p-queue";
import { searchAmazonWithGrok } from "./ai/grok.service.js";
import { searchFlipkartWithGemini } from "./ai/gemini.service.js";
import { searchGlobalWithOpenRouter, aggregateWithAI } from "./ai/openrouter.service.js";
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
    // ─── Step 1: Check Cache ────────────────────────────────────────────────
    const cached = await getCache(cacheKey);
    if (cached) {
      cacheHit = true;
      logger.info(`[Search] Cache HIT for "${query}" (${cached.source})`);

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

    // ─── Step 2: RAG Search (previously cached products) ───────────────────
    logger.info(`[Search] RAG search for "${query}"`);
    const { results: ragResults, source: ragSource } = await ragSearch(query, 5);

    if (ragResults.length >= 3) {
      logger.info(`[Search] RAG returned ${ragResults.length} results — skipping AI search`);

      const result = buildSearchResult(ragResults, ragResults, query, {
        source: "rag",
        ragSource,
        responseTimeMs: Date.now() - startTime,
      });

      await setCache(cacheKey, result, 15 * 60); // 15 min for RAG results
      await recordSearch(query, filters, { ...options, resultsCount: ragResults.length, responseTimeMs: Date.now() - startTime });

      return result;
    }

    // ─── Step 3: Parallel AI Search ─────────────────────────────────────────
    logger.info(`[Search] Running parallel AI search for "${query}"`);

    const [amazonResults, flipkartResults, globalResults] = await Promise.allSettled([
      apiQueue.add(() => searchAmazonWithGrok(query, filters)),
      apiQueue.add(() => searchFlipkartWithGemini(query, filters)),
      apiQueue.add(() => searchGlobalWithOpenRouter(query, filters)),
    ]);

    const amazon = amazonResults.status === "fulfilled" ? amazonResults.value : [];
    const flipkart = flipkartResults.status === "fulfilled" ? flipkartResults.value : [];
    const global = globalResults.status === "fulfilled" ? globalResults.value : [];

    // Combine all results
    const allProducts = [...amazon, ...flipkart, ...global, ...ragResults];

    // ─── Step 4: Deduplicate & Rank ─────────────────────────────────────────
    const uniqueProducts = deduplicateProducts(allProducts);
    const rankedProducts = rankProducts(uniqueProducts);

    // Assign ObjectId to any products that don't have one (e.g. live AI search results)
    // to ensure they have consistent, valid IDs for detail links and DB storage
    rankedProducts.forEach((product) => {
      if (!product._id) {
        product._id = new mongoose.Types.ObjectId();
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
 * Build standardized search result object
 */
const buildSearchResult = (products, rawProducts, query, meta) => {
  // Ensure every product has a valid display image for the UI since AI simulates the URLs
  // Also, replace hallucinated 404 URLs with working search URLs for each platform
  const processedProducts = products.map((product) => {
    let images = product.images || [];
    
    // 1. Fix Images: Use a highly reliable picsum.photos seed based placeholder
    if (images.length === 0 || (images[0] && images[0].includes("example.com")) || (images[0] && images[0].includes("loremflickr"))) {
      const seed = encodeURIComponent((product.name || "product").replace(/\s+/g, "").substring(0, 15));
      images = [`https://picsum.photos/seed/${seed}/400/400`];
    }

    // 2. Fix URLs: AI hallucinates fake product IDs leading to 404s. 
    // Replace with a real search URL for that platform so the link always works.
    let url = product.source?.url;
    const platform = product.source?.platform || "other";
    const encodedName = encodeURIComponent(product.name || query);
    
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
        url = `https://www.croma.com/searchB?q=${encodedName}`;
        break;
      default:
        url = `https://www.google.com/search?tbm=shop&q=${encodedName}`;
        break;
    }
    
    const source = { ...product.source, url };
    
    return { ...product, images, source };
  });

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
