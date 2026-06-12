import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger.js";

const createLimiter = (options) =>
  rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: options.message || "Too many requests. Please try again later.",
      retryAfter: Math.ceil(options.windowMs / 1000),
    },
    handler: (req, res, _next, options) => {
      logger.warn(`Rate limit exceeded: ${req.ip} - ${req.originalUrl}`);
      res.status(429).json(options.message);
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === "/health";
    },
  });

// Global rate limiter
export const globalRateLimiter = createLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: "Too many requests from this IP. Please try again in 15 minutes.",
});

// Auth routes limiter (stricter)
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

// Search limiter
export const searchLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: "Too many search requests. Please slow down.",
});
