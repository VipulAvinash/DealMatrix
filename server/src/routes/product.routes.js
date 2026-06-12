import express from "express";
import { search, getProduct, compareProducts, saveProduct } from "../controllers/product.controller.js";
import { protect, optionalAuth } from "../middleware/auth.middleware.js";
import { searchLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product search and management
 */

// Search — optional auth (logged-in users get history tracking)
router.get("/search", searchLimiter, optionalAuth, search);

// Get single product
router.get("/:id", optionalAuth, getProduct);

// Compare products
router.post("/compare", optionalAuth, compareProducts);

// Save/unsave product (auth required)
router.post("/save", protect, saveProduct);

export default router;
