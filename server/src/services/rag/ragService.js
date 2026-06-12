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
export const ragSearch = async (query, limit = 10) => {
  try {
    // Step 1: Try vector embedding search
    const embedding = await generateEmbedding(query);

    if (embedding && Array.isArray(embedding)) {
      // Try MongoDB Atlas Vector Search (if configured)
      try {
        const vectorResults = await Product.aggregate([
          {
            $vectorSearch: {
              index: "product_embeddings",
              path: "embeddings",
              queryVector: embedding,
              numCandidates: limit * 5,
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
              aiSummary: 1,
              score: { $meta: "vectorSearchScore" },
            },
          },
        ]);

        if (vectorResults.length > 0) {
          logger.info(`[RAG] Vector search returned ${vectorResults.length} results`);
          return { results: vectorResults, source: "vector" };
        }
      } catch (vectorErr) {
        // Atlas Vector Search not configured — fall through to text search
        logger.debug("[RAG] Vector search unavailable, using text search:", vectorErr.message);
      }
    }

    // Step 2: Fall back to MongoDB full-text search
    const textResults = await mongoTextSearch(query, limit);
    return { results: textResults, source: "text" };
  } catch (err) {
    logger.error("[RAG] Search failed:", err.message);
    return { results: [], source: "none" };
  }
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
