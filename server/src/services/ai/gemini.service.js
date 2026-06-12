import axios from "axios";
import axiosRetry from "axios-retry";
import { logger } from "../../utils/logger.js";
import { FLIPKART_SEARCH_PROMPT } from "../../prompts/flipkart.prompt.js";

const geminiClient = axios.create({
  baseURL: "https://generativelanguage.googleapis.com/v1beta",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

axiosRetry(geminiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status === 429,
});

/**
 * Search Flipkart products using Gemini AI
 * @param {string} query - Product search query
 * @param {Object} filters - Optional search filters
 * @returns {Promise<Array>} Array of product objects
 */
export const searchFlipkartWithGemini = async (query, filters = {}) => {
  if (!process.env.GEMINI_API_KEY) {
    logger.warn("Gemini API key not configured — skipping Flipkart search");
    return [];
  }

  try {
    logger.info(`[Gemini] Searching Flipkart for: "${query}"`);

    const prompt = FLIPKART_SEARCH_PROMPT(query, filters);

    const response = await geminiClient.post(
      `/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are a product data extraction assistant. Only respond with valid JSON arrays. No markdown. No explanations.\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4000,
          responseMimeType: "application/json",
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        ],
      }
    );

    const content =
      response.data.candidates[0]?.content?.parts[0]?.text || "[]";
    const products = parseAIResponse(content);

    logger.info(`[Gemini] Found ${products.length} Flipkart products`);

    return products.map((p) => ({
      ...p,
      source: { platform: "flipkart", ...p.source },
    }));
  } catch (error) {
    logger.error("[Gemini] Flipkart search failed:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return [];
  }
};

const parseAIResponse = (content) => {
  try {
    const cleaned = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : parsed.products || [];
  } catch (err) {
    logger.warn("[Gemini] Failed to parse AI response:", err.message);
    return [];
  }
};
