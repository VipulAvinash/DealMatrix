import { z } from "zod";
import { registerUser, loginUser, refreshAccessToken, logoutUser } from "../services/auth.service.js";
import { asyncWrapper, sendSuccess, AppError } from "../utils/responseHelper.js";

const registerSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password required"),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already exists
 */
export const register = asyncWrapper(async (req, res) => {
  const validated = registerSchema.safeParse(req.body);
  if (!validated.success) {
    throw new AppError(
      "Validation failed",
      400,
      validated.error.errors.map((e) => e.message)
    );
  }

  const result = await registerUser(validated.data);
  sendSuccess(res, result, "Account created successfully", 201);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 */
export const login = asyncWrapper(async (req, res) => {
  const validated = loginSchema.safeParse(req.body);
  if (!validated.success) {
    throw new AppError("Invalid credentials format", 400);
  }

  const result = await loginUser(validated.data);
  sendSuccess(res, result, "Logged in successfully");
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 */
export const refresh = asyncWrapper(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await refreshAccessToken(refreshToken);
  sendSuccess(res, tokens, "Token refreshed");
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
export const logout = asyncWrapper(async (req, res) => {
  await logoutUser(req.user._id);
  sendSuccess(res, null, "Logged out successfully");
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
export const getMe = asyncWrapper(async (req, res) => {
  sendSuccess(res, req.user, "Profile fetched");
});
