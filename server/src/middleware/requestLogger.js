import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    // Suppress logs for socket.io or notices (e.g., from browser/port collisions with other apps)
    if (req.originalUrl.startsWith("/socket.io") || req.originalUrl.startsWith("/api/notices")) {
      return;
    }

    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      userId: req.user?._id,
    };

    if (res.statusCode >= 500) {
      logger.error("Request failed", logData);
    } else if (res.statusCode >= 400) {
      logger.warn("Request error", logData);
    } else {
      logger.debug("Request completed", logData);
    }
  });

  next();
};
