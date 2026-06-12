import User from "../models/User.model.js";
import SearchHistory from "../models/SearchHistory.model.js";
import Product from "../models/Product.model.js";
import { asyncWrapper, sendSuccess, sendPaginated } from "../utils/responseHelper.js";

/**
 * GET /api/user/profile
 */
export const getProfile = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("savedProducts", "-embeddings")
    .lean();

  sendSuccess(res, user, "Profile loaded");
});

/**
 * GET /api/user/history
 */
export const getSearchHistory = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const [history, total] = await Promise.all([
    SearchHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    SearchHistory.countDocuments({ userId: req.user._id }),
  ]);

  sendPaginated(res, history, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }, "History loaded");
});

/**
 * GET /api/user/saved
 */
export const getSavedProducts = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: "savedProducts",
      select: "-embeddings",
      options: { sort: { createdAt: -1 } },
    })
    .lean();

  sendSuccess(res, user.savedProducts || [], "Saved products loaded");
});

/**
 * DELETE /api/user/history/:id
 */
export const deleteHistoryItem = asyncWrapper(async (req, res) => {
  await SearchHistory.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  sendSuccess(res, null, "History item deleted");
});

/**
 * PUT /api/user/preferences
 */
export const updatePreferences = asyncWrapper(async (req, res) => {
  const { currency, country, notifications } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      preferences: {
        currency: currency || "USD",
        country: country || "US",
        notifications: notifications !== false,
      },
    },
    { new: true, runValidators: true }
  );

  sendSuccess(res, user.preferences, "Preferences updated");
});
