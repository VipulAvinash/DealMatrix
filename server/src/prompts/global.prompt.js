/**
 * Global multi-platform search prompt (Reliance, Croma)
 */
export const GLOBAL_SEARCH_PROMPT = (query, filters = {}) => {
  return `Simulate product search results from multiple global platforms for: "${query}"

Generate products from these platforms: Reliance Digital, Croma

Return a JSON array of 4-6 products from various platforms. Do NOT use generic placeholders for URLs or images. You must return real, actual, or highly accurate product detail page URLs and real, working product image URLs from Croma's CDN (media.croma.com/prod/...) or Reliance Digital's CDN (www.reliancedigital.in/medias/...) that match the exact product model. Ensure each product has a unique, correct image corresponding to its specific color/model.

Required JSON structure:
[
  {
    "name": "Product name with variant",
    "description": "Description",
    "category": "Category",
    "brand": "Brand",
    "price": {
      "amount": 69999.00,
      "currency": "INR",
      "originalAmount": 79999.00,
      "discountPercent": 12
    },
    "rating": {
      "average": 4.2,
      "count": 3201
    },
    "availability": {
      "inStock": true,
      "stockCount": 15,
      "deliveryEstimate": "Ships within 2-3 days"
    },
    "seller": {
      "name": "Reliance Digital",
      "rating": 4.5
    },
    "features": ["feature 1", "feature 2"],
    "images": ["https://www.reliancedigital.in/medias/OnePlus-9-Pro-5G-Smartphones-491997725-i-1-1200Wx1200H?context=bWFzdGVyfGltYWdlc3w4OTAzNnxpbWFnZS9qcGVnfGltYWdlcy9oNGYvaGE0Lzk1MTAxMTMxMzk3NDIuanBnfGJiNDUzYTVlZjNmMTUxNDQ0NjYyODFmYzNhZmM2YTU1YTliYTk2ZjUwMjAxMTY4ODQwOTBlNzU3MWU2ZWM5Yjk"],
    "source": {
      "platform": "reliance",
      "url": "https://www.reliancedigital.in/oneplus-9-pro-5d-smartphone/p/491997725",
      "productId": "491997725"
    },
    "tags": ["electronics", "top-rated"]
  }
]

Platform distribution:
- 2-3 products from Reliance Digital (INR prices)
- 2-3 products from Croma (INR prices)

Rules:
- Realistic prices for each platform's market
- Source platform field must be one of: "reliance", "croma", "other"
- All relevant to: "${query}"
- image and url: must be real and specific to the exact product model. Do not repeat the same image or use placeholders.
- Return ONLY the JSON array, no markdown`;
};

/**
 * AI aggregation and recommendation prompt
 */
export const AGGREGATION_PROMPT = (query, products) => {
  return `You searched for: "${query}"

Here are the products found across platforms:
${JSON.stringify(products, null, 2)}

Analyze these products and return a JSON object with the best recommendations:

{
  "bestOverall": {
    "productIndex": 0,
    "reason": "Detailed explanation of why this is the best overall choice (2-3 sentences)"
  },
  "bestValue": {
    "productIndex": 1,
    "reason": "Why this offers the best value for money (2-3 sentences)"
  },
  "bestPremium": {
    "productIndex": 2,
    "reason": "Why this is the best premium choice (2-3 sentences)"
  },
  "bestBudget": {
    "productIndex": 3,
    "reason": "Why this is the best budget option (2-3 sentences)"
  },
  "aiSummary": "Overall market summary for this search query in 2-3 sentences. What should buyers know?",
  "buyingTips": ["tip 1", "tip 2", "tip 3"]
}

Rules:
- productIndex refers to the 0-based index in the provided products array
- Reasons must be specific and reference actual product attributes
- If fewer than 4 products, reuse products for multiple categories
- Return ONLY the JSON object`;
};
