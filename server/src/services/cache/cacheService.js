import NodeCache from "node-cache";
import { logger } from "../../utils/logger.js";

// ─── In-Memory Cache (always available) ─────────────────────────────────────
const memCache = new NodeCache({
  stdTTL: 30 * 60,      // 30 minutes
  checkperiod: 60,       // check for expired keys every 60s
  useClones: false,
  maxKeys: 500,
});

// ─── Redis Cache (optional) ──────────────────────────────────────────────────
let redisClient = null;
const REDIS_TTL = 60 * 60; // 1 hour

const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    logger.info("Redis URL not configured — using memory cache only");
    return;
  }

  try {
    const { default: Redis } = await import("ioredis");
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy: () => null,
    });

    redisClient.on("connect", () => logger.info("✅ Redis connected"));
    redisClient.on("error", (err) => {
      logger.warn("Redis error (falling back to memory cache):", err.message);
      redisClient = null;
    });

    await redisClient.connect();
  } catch (err) {
    logger.warn("Redis initialization failed — using memory cache only:", err.message);
    redisClient = null;
  }
};

// Initialize Redis on startup
initRedis();

/**
 * Normalize a search query for consistent cache keys
 */
export const normalizeCacheKey = (query, filters = {}) => {
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, "_");
  const filterStr = Object.entries(filters)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  return filterStr ? `search:${normalizedQuery}:${filterStr}` : `search:${normalizedQuery}`;
};

/**
 * Get value from cache (Redis → Memory fallback)
 */
export const getCache = async (key) => {
  try {
    // Try Redis first
    if (redisClient) {
      const value = await redisClient.get(key);
      if (value) {
        logger.debug(`[Cache] Redis HIT: ${key}`);
        return { data: JSON.parse(value), source: "redis" };
      }
    }

    // Fall back to memory cache
    const memValue = memCache.get(key);
    if (memValue !== undefined) {
      logger.debug(`[Cache] Memory HIT: ${key}`);
      return { data: memValue, source: "memory" };
    }

    logger.debug(`[Cache] MISS: ${key}`);
    return null;
  } catch (err) {
    logger.error("[Cache] Get error:", err.message);
    return null;
  }
};

/**
 * Set value in cache (both Redis and Memory)
 */
export const setCache = async (key, data, ttl = null) => {
  try {
    const redisTTL = ttl || REDIS_TTL;
    const memTTL = ttl || 30 * 60;

    // Set in Redis
    if (redisClient) {
      await redisClient.setex(key, redisTTL, JSON.stringify(data));
    }

    // Set in memory cache
    memCache.set(key, data, memTTL);

    logger.debug(`[Cache] SET: ${key} (TTL: ${memTTL}s)`);
  } catch (err) {
    logger.error("[Cache] Set error:", err.message);
  }
};

/**
 * Delete from cache
 */
export const deleteCache = async (key) => {
  try {
    if (redisClient) await redisClient.del(key);
    memCache.del(key);
  } catch (err) {
    logger.error("[Cache] Delete error:", err.message);
  }
};

/**
 * Flush all search cache
 */
export const flushSearchCache = async () => {
  try {
    if (redisClient) {
      const keys = await redisClient.keys("search:*");
      if (keys.length > 0) await redisClient.del(...keys);
    }
    memCache.flushAll();
    logger.info("[Cache] Flushed all search cache");
  } catch (err) {
    logger.error("[Cache] Flush error:", err.message);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  const memStats = memCache.getStats();
  let redisInfo = null;

  if (redisClient) {
    try {
      const info = await redisClient.dbsize();
      redisInfo = { keyCount: info, connected: true };
    } catch {
      redisInfo = { connected: false };
    }
  }

  return {
    memory: {
      hits: memStats.hits,
      misses: memStats.misses,
      hitRate: memStats.hits / (memStats.hits + memStats.misses + 1),
      keyCount: memStats.keys,
    },
    redis: redisInfo,
  };
};
