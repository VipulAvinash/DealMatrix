import express from "express";
import {
  getProfile,
  getSearchHistory,
  getSavedProducts,
  deleteHistoryItem,
  updatePreferences,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect); // All user routes require auth

router.get("/profile", getProfile);
router.get("/history", getSearchHistory);
router.get("/saved", getSavedProducts);
router.delete("/history/:id", deleteHistoryItem);
router.put("/preferences", updatePreferences);

export default router;
