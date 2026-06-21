import Product from "../../models/Product.model.js";
import { generateEmbedding } from "../ai/openrouter.service.js";
import { logger } from "../../utils/logger.js";

/**
 * Search products using vector similarity (RAG)
 * Falls back to MongoDB text search if embeddings unavailable
 *
 * Flow: User Query → Generate Embedding → Vector Search → Return cached products
 *
 * @param {string} query - Search query
 * @param {number} limit - Max results to return
 * @returns {Promise<Array>} Matching products
 */
/**
 * Local vector search using in-memory cosine similarity calculation
 */
const localVectorSearch = async (embedding, limit) => {
  try {
    if (!embedding || !Array.isArray(embedding)) return [];

    // Fetch all products that have embeddings
    const products = await Product.find({ embeddings: { $exists: true, $ne: [] } })
      .select("+embeddings")
      .lean();

    if (products.length === 0) return [];

    // Calculate cosine similarity for each product
    const scoredProducts = products.map((product) => {
      const sim = cosineSimilarity(embedding, product.embeddings);
      return { ...product, score: sim };
    });

    // Filter by threshold (0.75) and sort descending
    const matchedProducts = scoredProducts
      .filter((p) => p.score >= 0.75)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (matchedProducts.length > 0) {
      logger.info(`[RAG/Local Vector] Cosine similarity returned ${matchedProducts.length} results`);
      // Strip embeddings from the output for clean data propagation
      matchedProducts.forEach((p) => delete p.embeddings);
      return matchedProducts;
    }

    return [];
  } catch (err) {
    logger.warn("[RAG/Local Vector] Local vector search failed:", err.message);
    return [];
  }
};

const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return normA && normB ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
};

/**
 * Search products using RAG / Vector search
 * Branch strategy based on environment configuration
 */
export const ragSearch = async (query, embedding, limit = 10) => {
  const useAtlas = process.env.MONGODB_ENV === "atlas";

  if (useAtlas) {
    // Primary: Atlas Vector Search (semantic) — requires Atlas Search index
    try {
      const results = await Product.aggregate([
        {
          $vectorSearch: {
            index: "product_embeddings",
            path: "embeddings",
            queryVector: embedding,
            numCandidates: 100,
            limit,
          },
        },
        {
          $project: {
            name: 1,
            price: 1,
            rating: 1,
            source: 1,
            category: 1,
            brand: 1,
            images: 1,
            aiSummary: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
        { $match: { score: { $gte: 0.75 } } },
      ]);
      logger.info(`[RAG/Atlas Vector] Returned ${results.length} results`);
      return { results, source: "vector" };
    } catch (err) {
      logger.error("[ragSearch] Atlas vectorSearch failed:", err.message);
      // Surface error in Atlas environment
      throw err;
    }
  }

  // Local environment logic: Try local vector search first
  try {
    const localResults = await localVectorSearch(embedding, limit);
    if (localResults && localResults.length >= 3) {
      return { results: localResults, source: "local_vector" };
    }
  } catch (err) {
    logger.debug("[RAG] Local vector search fallback failed:", err.message);
  }

  // Step 3: Fall back to MongoDB standard full-text search locally
  const textResults = await mongoTextSearch(query, limit);
  return { results: textResults, source: "text" };
};

/**
 * MongoDB full-text search fallback
 */
const mongoTextSearch = async (query, limit) => {
  try {
    const results = await Product.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .select("-embeddings")
      .lean();

    // Also try regex if text search returns nothing
    if (results.length === 0) {
      const words = query.split(" ").filter((w) => w.length > 2);
      const regexResults = await Product.find({
        $or: words.map((word) => ({
          name: { $regex: word, $options: "i" },
        })),
      })
        .limit(limit)
        .select("-embeddings")
        .lean();

      return regexResults;
    }

    return results;
  } catch (err) {
    logger.error("[RAG] Text search failed:", err.message);
    return [];
  }
};

/**
 * Store product with embedding in the database (for RAG)
 * @param {Object} product - Product to store
 */
export const storeProductEmbedding = async (product) => {
  try {
    const text = buildProductText(product);
    const embedding = await generateEmbedding(text);

    const existingProduct = await Product.findOne({
      "source.platform": product.source?.platform,
      "source.productId": product.source?.productId,
    });

    if (existingProduct) {
      if (embedding) existingProduct.embeddings = embedding;
      existingProduct.lastUpdated = new Date();
      
      // Update other fields as well to keep DB data fresh
      existingProduct.name = product.name || existingProduct.name;
      existingProduct.description = product.description || existingProduct.description;
      existingProduct.category = product.category || existingProduct.category;
      existingProduct.brand = product.brand || existingProduct.brand;
      existingProduct.price = product.price || existingProduct.price;
      existingProduct.rating = product.rating || existingProduct.rating;
      existingProduct.availability = product.availability || existingProduct.availability;
      existingProduct.seller = product.seller || existingProduct.seller;
      existingProduct.features = product.features || existingProduct.features;
      existingProduct.specifications = product.specifications || existingProduct.specifications;
      existingProduct.images = (product.images && product.images.length > 0) ? product.images : existingProduct.images;
      existingProduct.source = product.source || existingProduct.source;
      existingProduct.aiSummary = product.aiSummary || existingProduct.aiSummary;

      await existingProduct.save();
      return existingProduct;
    }

    const newProduct = new Product({
      ...product,
      embeddings: embedding || undefined,
    });

    await newProduct.save();
    return newProduct;
  } catch (err) {
    logger.error("[RAG] Store product embedding failed:", err.message);
    return null;
  }
};

/**
 * Build text representation of a product for embedding
 */
const buildProductText = (product) => {
  const parts = [
    product.name,
    product.brand,
    product.category,
    product.description,
    ...(product.features || []),
    ...(product.tags || []),
  ].filter(Boolean);

  return parts.join(" ").substring(0, 8000);
};
