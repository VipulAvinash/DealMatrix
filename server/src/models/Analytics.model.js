import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    metrics: {
      totalSearches: { type: Number, default: 0 },
      uniqueUsers: { type: Number, default: 0 },
      cacheHits: { type: Number, default: 0 },
      cacheMisses: { type: Number, default: 0 },
      avgResponseTimeMs: { type: Number, default: 0 },
    },
    apiCalls: {
      grok: { type: Number, default: 0 },
      gemini: { type: Number, default: 0 },
      openrouter: { type: Number, default: 0 },
    },
    topQueries: [
      {
        query: String,
        count: Number,
      },
    ],
    topCategories: [
      {
        category: String,
        count: Number,
      },
    ],
    errorCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

analyticsSchema.index({ date: -1 });

const Analytics = mongoose.model("Analytics", analyticsSchema);
export default Analytics;
