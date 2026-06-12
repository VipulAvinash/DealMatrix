import express from "express";
import { getDashboard, getSearchTrends } from "../controllers/analytics.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/dashboard", protect, adminOnly, getDashboard);
router.get("/trends", protect, getSearchTrends);

export default router;
