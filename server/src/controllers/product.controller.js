import { z } from "zod";
import { searchProducts } from "../services/productSearch.service.js";
import Product from "../models/Product.model.js";
import User from "../models/User.model.js";
import { asyncWrapper, sendSuccess, sendPaginated, AppError } from "../utils/responseHelper.js";
import { checkPromptInjection, sanitizeQuery } from "../utils/promptGuard.js";
import { logger } from "../utils/logger.js";

const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query required").max(200),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  brand: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Search products across multiple platforms with AI
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 */
export const search = asyncWrapper(async (req, res) => {
  const validated = searchQuerySchema.safeParse(req.query);
  if (!validated.success) {
    throw new AppError(
      "Invalid search parameters",
      400,
      validated.error.errors.map((e) => `${e.path}: ${e.message}`)
    );
  }

  const { q, page, limit, ...filters } = validated.data;

  // Prompt injection protection
  const guardCheck = checkPromptInjection(q);
  if (!guardCheck.safe) {
    throw new AppError("Invalid search query detected.", 400);
  }

  const sanitizedQuery = sanitizeQuery(q);
  logger.info(`[Controller] Search: "${sanitizedQuery}" by ${req.user?._id || req.ip}`);

  const result = await searchProducts(sanitizedQuery, filters, {
    userId: req.user?._id,
    ipAddress: req.ip,
  });

  // Apply pagination to products
  const start = (page - 1) * limit;
  const paginatedProducts = result.products.slice(start, start + limit);

  sendPaginated(
    res,
    {
      ...result,
      products: paginatedProducts,
    },
    {
      total: result.totalCount,
      page,
      limit,
      totalPages: Math.ceil(result.totalCount / limit),
    },
    "Search completed"
  );
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a specific product by ID
 *     tags: [Products]
 */
export const getProduct = asyncWrapper(async (req, res) => {
  const product = await Product.findById(req.params.id).select("-embeddings");
  if (!product) throw new AppError("Product not found", 404);
  sendSuccess(res, product, "Product fetched");
});

/**
 * @swagger
 * /api/products/compare:
 *   post:
 *     summary: Compare multiple products side-by-side
 *     tags: [Products]
 */
export const compareProducts = asyncWrapper(async (req, res) => {
  const { productIds } = req.body;

  if (!Array.isArray(productIds) || productIds.length < 2 || productIds.length > 5) {
    throw new AppError("Please provide 2-5 product IDs for comparison", 400);
  }

  const products = await Product.find({ _id: { $in: productIds } }).select("-embeddings");

  if (products.length < 2) {
    throw new AppError("At least 2 valid products required for comparison", 400);
  }

  // Build comparison table
  const comparison = {
    products,
    attributes: buildComparisonAttributes(products),
    winner: determineWinner(products),
  };

  sendSuccess(res, comparison, "Products compared");
});

/**
 * @swagger
 * /api/products/save:
 *   post:
 *     summary: Save a product to user's collection
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
export const saveProduct = asyncWrapper(async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw new AppError("Product ID required", 400);

  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found", 404);

  const user = await User.findById(req.user._id);
  const alreadySaved = user.savedProducts.includes(productId);

  if (alreadySaved) {
    user.savedProducts = user.savedProducts.filter(
      (id) => id.toString() !== productId
    );
    await user.save();
    sendSuccess(res, { saved: false }, "Product removed from saved");
  } else {
    user.savedProducts.push(productId);
    await user.save();
    sendSuccess(res, { saved: true }, "Product saved successfully");
  }
});

/**
 * Build comparison attributes from multiple products
 */
const buildComparisonAttributes = (products) => {
  const attrs = {};

  products.forEach((p) => {
    const pObj = p.toObject ? p.toObject() : p;

    // Price
    if (!attrs.price) attrs.price = [];
    attrs.price.push({
      productId: p._id,
      value: pObj.price?.amount,
      currency: pObj.price?.currency,
    });

    // Rating
    if (!attrs.rating) attrs.rating = [];
    attrs.rating.push({
      productId: p._id,
      value: pObj.rating?.average,
      count: pObj.rating?.count,
    });

    // Availability
    if (!attrs.availability) attrs.availability = [];
    attrs.availability.push({
      productId: p._id,
      value: pObj.availability?.inStock ? "In Stock" : "Out of Stock",
    });

    // Platform
    if (!attrs.platform) attrs.platform = [];
    attrs.platform.push({
      productId: p._id,
      value: pObj.source?.platform,
    });
  });

  return attrs;
};

const determineWinner = (products) => {
  return products.reduce((best, p) => {
    const score =
      (p.rating?.average || 0) * 10 + (p.availability?.inStock ? 5 : 0);
    const bestScore =
      (best?.rating?.average || 0) * 10 + (best?.availability?.inStock ? 5 : 0);
    return score > bestScore ? p : best;
  }, products[0]);
};
