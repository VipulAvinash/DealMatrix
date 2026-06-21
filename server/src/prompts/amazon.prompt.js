/**
 * Generates the Amazon India product search prompt for Claude/Grok AI
 * @param {string} query - User search query
 * @param {Object} filters - Search filters
 * @returns {string} Formatted prompt
 */
export const AMAZON_SEARCH_PROMPT = (query, filters = {}) => {
  const filterStr = buildFilterString(filters);

  return `You are an Amazon.in product search engine returning results for Indian customers.

Search query: "${query}"${filterStr}

Return a JSON array of 6-8 realistic Amazon India product listings. Products must reflect what is actually sold on Amazon.in — Indian brands, pricing in INR, and Indian logistics.

Do NOT use generic placeholders for URLs or images. You must return real, actual, or highly accurate product detail page URLs (using real ASINs) and real, working product image URLs from the Amazon CDN (m.media-amazon.com/images/I/...) that match the exact product model. Ensure each product has a unique, correct image corresponding to its specific color/model.

Required JSON structure (return ONLY the array, no markdown, no explanation):
[
  {
    "name": "Full product name with model/variant",
    "description": "2–3 sentence product description highlighting key use case",
    "category": "Amazon category path (e.g. Electronics > Mobiles > Smartphones)",
    "brand": "Brand name",
    "price": {
      "amount": 24999,
      "currency": "INR",
      "originalAmount": 29999,
      "discountPercent": 17
    },
    "rating": {
      "average": 4.3,
      "count": 8421
    },
    "availability": {
      "inStock": true,
      "deliveryEstimate": "FREE delivery by Tomorrow, Sunday Jun 15",
      "deliveryCity": "Hyderabad"
    },
    "seller": {
      "name": "Cloudtail India Pvt Ltd",
      "rating": 4.6,
      "type": "Amazon Fulfilled"
    },
    "features": [
      "Specific feature with spec (e.g. 5000mAh battery)",
      "Specific feature with spec",
      "Specific feature with spec",
      "Specific feature with spec"
    ],
    "images": ["https://m.media-amazon.com/images/I/71w3oJ7a0-L._SL1500_.jpg"],
    "source": {
      "platform": "amazon.in",
      "url": "https://www.amazon.in/dp/B09G9FPGNY",
      "productId": "B09G9FPGNY"
    },
    "tags": ["relevant", "search", "tags"],
    "badges": ["Amazon's Choice"]
  }
]

Constraints:
- currency: always INR, amounts as integers (no paise)
- price ranges: budget <₹2K, mid ₹2K–15K, premium >₹15K — include variety unless price filter is set
- ratings: 3.5–5.0 only; review counts realistic for Indian market (500–50,000 typical)
- sellers: use real Indian Amazon sellers — Cloudtail India, Appario Retail, brand official stores, or third-party with "Fulfilled by Amazon"
- delivery: Indian cities (Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Pune, Kolkata)
- badges: pick from ["Amazon's Choice", "Best Seller", "Limited Deal", "Climate Pledge Friendly"] or omit
- features: be specific with actual specs/numbers, not vague marketing copy
- image and url: must be real and specific to the exact product model. Do not repeat the same image or use placeholders.
- all products must be directly relevant to: "${query}"`;
};

const buildFilterString = (filters) => {
  const parts = [];
  if (filters.priceMin) parts.push(`minimum price ₹${filters.priceMin}`);
  if (filters.priceMax) parts.push(`maximum price ₹${filters.priceMax}`);
  if (filters.brand) parts.push(`brand: ${filters.brand}`);
  if (filters.rating) parts.push(`minimum rating: ${filters.rating} stars`);
  if (filters.city) parts.push(`delivery city: ${filters.city}`);
  return parts.length > 0 ? ` with filters: ${parts.join(", ")}` : "";
};