import SearchHistory from "../models/SearchHistory.model.js";
import { asyncWrapper, sendSuccess } from "../utils/responseHelper.js";
import { getCacheStats } from "../services/cache/cacheService.js";

/**
 * GET /api/analytics/dashboard (admin)
 */
export const getDashboard = asyncWrapper(async (_req, res) => {
  const [
    totalSearches,
    topQueries,
    cacheStats,
    recentActivity,
    platformStats,
  ] = await Promise.all([
    SearchHistory.countDocuments(),

    SearchHistory.aggregate([
      { $group: { _id: "$normalizedQuery", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { query: "$_id", count: 1, _id: 0 } },
    ]),

    getCacheStats(),

    SearchHistory.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select("query resultsCount cacheHit responseTimeMs createdAt status")
      .lean(),

    SearchHistory.aggregate([
      {
        $group: {
          _id: null,
          amazon: { $sum: { $cond: ["$sources.amazon", 1, 0] } },
          flipkart: { $sum: { $cond: ["$sources.flipkart", 1, 0] } },
          global: { $sum: { $cond: ["$sources.global", 1, 0] } },
        },
      },
    ]),
  ]);

  const avgCacheHitRate = await SearchHistory.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        hits: { $sum: { $cond: ["$cacheHit", 1, 0] } },
        avgResponseTime: { $avg: "$responseTimeMs" },
      },
    },
  ]);

  const stats = avgCacheHitRate[0] || { total: 0, hits: 0, avgResponseTime: 0 };

  sendSuccess(res, {
    overview: {
      totalSearches,
      cacheHitRate: stats.total > 0 ? (stats.hits / stats.total * 100).toFixed(1) : 0,
      avgResponseTimeMs: Math.round(stats.avgResponseTime || 0),
    },
    topQueries,
    platformStats: platformStats[0] || { amazon: 0, flipkart: 0, global: 0 },
    cacheStats,
    recentActivity,
  }, "Dashboard loaded");
});

/**
 * GET /api/analytics/trends
 */
export const getSearchTrends = asyncWrapper(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const trends = await SearchHistory.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        },
        searches: { $sum: 1 },
        cacheHits: { $sum: { $cond: ["$cacheHit", 1, 0] } },
        avgResponseTime: { $avg: "$responseTimeMs" },
      },
    },
    { $sort: { "_id.date": 1 } },
    {
      $project: {
        date: "$_id.date",
        searches: 1,
        cacheHits: 1,
        avgResponseTime: { $round: ["$avgResponseTime", 0] },
        _id: 0,
      },
    },
  ]);

  sendSuccess(res, trends, "Trends loaded");
});
