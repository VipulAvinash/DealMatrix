import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    normalizedQuery: {
      type: String,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    filters: {
      priceMin: { type: Number, default: null },
      priceMax: { type: Number, default: null },
      brand: { type: String, default: null },
      category: { type: String, default: null },
      rating: { type: Number, default: null },
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
    sources: {
      amazon: { type: Boolean, default: false },
      flipkart: { type: Boolean, default: false },
      global: { type: Boolean, default: false },
    },
    cacheHit: {
      type: Boolean,
      default: false,
    },
    responseTimeMs: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["success", "partial", "failed"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
searchHistorySchema.index({ query: 1, createdAt: -1 });
searchHistorySchema.index({ userId: 1, createdAt: -1 });
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 day TTL

const SearchHistory = mongoose.model("SearchHistory", searchHistorySchema);
export default SearchHistory;
