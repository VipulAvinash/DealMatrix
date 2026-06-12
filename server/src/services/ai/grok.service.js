import axios from "axios";
import axiosRetry from "axios-retry";
import { logger } from "../../utils/logger.js";
import { AMAZON_SEARCH_PROMPT } from "../../prompts/amazon.prompt.js";

const grokClient = axios.create({
  baseURL: "https://api.x.ai/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.GROK_API_KEY}`,
  },
});

axiosRetry(grokClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status === 429 ||
    error.response?.status === 503,
});

/**
 * Search Amazon products using Grok AI
 * @param {string} query - Product search query
 * @param {Object} filters - Optional search filters
 * @returns {Promise<Array>} Array of product objects
 */
export const searchAmazonWithGrok = async (query, filters = {}) => {
  if (!process.env.GROK_API_KEY) {
    logger.warn("Grok API key not configured — skipping Amazon search");
    return [];
  }

  try {
    logger.info(`[Grok] Searching Amazon for: "${query}"`);

    const prompt = AMAZON_SEARCH_PROMPT(query, filters);

    const response = await grokClient.post("/chat/completions", {
      model: "grok-beta",
      messages: [
        {
          role: "system",
          content:
            "You are a product data extraction assistant. You ONLY respond with valid JSON arrays of product objects. Never include markdown or explanations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    const content = response.data.choices[0]?.message?.content || "[]";
    const products = parseAIResponse(content);

    logger.info(`[Grok] Found ${products.length} Amazon products`);

    return products.map((p) => ({
      ...p,
      source: { platform: "amazon", ...p.source },
    }));
  } catch (error) {
    logger.error("[Grok] Amazon search failed:", {
      message: error.message,
      status: error.response?.status,
    });
    return []; // Graceful degradation
  }
};

/**
 * Parse and validate AI JSON response
 */
const parseAIResponse = (content) => {
  try {
    // Strip markdown code fences if present
    const cleaned = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : parsed.products || [];
  } catch (err) {
    logger.warn("[Grok] Failed to parse AI response:", err.message);
    return [];
  }
};
