import jwt from "jsonwebtoken";
import { AppError } from "../utils/responseHelper.js";
import { asyncWrapper } from "../utils/responseHelper.js";
import User from "../models/User.model.js";

export const protect = asyncWrapper(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Access denied. No token provided.", 401);
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    throw new AppError("User no longer exists.", 401);
  }

  req.user = user;
  next();
});

export const optionalAuth = asyncWrapper(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user) req.user = user;
    } catch {
      // Token invalid — continue as guest
    }
  }

  next();
});

export const adminOnly = (req, _res, next) => {
  if (req.user?.role !== "admin") {
    throw new AppError("Access denied. Admin privileges required.", 403);
  }
  next();
};
