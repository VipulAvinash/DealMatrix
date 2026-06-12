/**
 * Generates the Flipkart product search prompt for Gemini AI
 * @param {string} query - User search query
 * @param {Object} filters - Search filters
 * @returns {string} Formatted prompt
 */
export const FLIPKART_SEARCH_PROMPT = (query, filters = {}) => {
  const filterStr = buildFilterString(filters);

  return `You are Flipkart's product search engine returning results for Indian customers.

Search query: "${query}"${filterStr}

Return a JSON array of 6-8 realistic Flipkart product listings. Products must reflect what is actually sold on Flipkart.com — Indian market pricing in INR, Flipkart-specific logistics and seller ecosystem.

Required JSON structure (return ONLY the array, no markdown, no explanation):
[
  {
    "name": "Full product name with model/variant/color",
    "description": "2–3 sentence description covering key use case and standout specs",
    "category": "Flipkart category path (e.g. Electronics > Mobiles > Smartphones)",
    "brand": "Brand name",
    "price": {
      "amount": 24999,
      "currency": "INR",
      "originalAmount": 29999,
      "discountPercent": 17
    },
    "rating": {
      "average": 4.3,
      "count": 6842
    },
    "availability": {
      "inStock": true,
      "deliveryEstimate": "Delivery by Tomorrow, Sun Jun 15",
      "deliveryCity": "Hyderabad",
      "fAssured": true
    },
    "seller": {
      "name": "Retailnet",
      "rating": 4.6,
      "type": "F-Assured Seller"
    },
    "features": [
      "Specific feature with spec (e.g. 6.7-inch AMOLED 120Hz display)",
      "Specific feature with spec (e.g. 50MP triple rear camera)",
      "Specific feature with spec (e.g. 5000mAh battery with 67W fast charging)",
      "Specific feature with spec"
    ],
    "images": ["https://rukminim2.flixcart.com/image/placeholder.jpg"],
    "source": {
      "platform": "flipkart",
      "url": "https://www.flipkart.com/product/p/placeholder",
      "productId": "PLACEHOLDER123456"
    },
    "tags": ["relevant", "search", "tags"],
    "badges": ["Flipkart Choice"],
    "highlights": {
      "exchangeOffer": "Up to ₹15,000 off on exchange",
      "bankOffer": "5% cashback on Flipkart Axis Bank Card",
      "emiAvailable": true
    }
  }
]

Constraints:
- currency: always INR, amounts as integers (no paise)
- price tiers: budget <₹2K, mid ₹2K–15K, premium >₹15K — include variety unless price filter is set
- ratings: 3.5–5.0 only; review counts realistic for Indian market (300–75,000 typical)
- sellers: use real Flipkart sellers — Retailnet, WS Retail, Cloudtail, brand official stores (e.g. "Samsung India Store"), or generic F-Assured sellers
- fAssured: true for established sellers, false for smaller third-party sellers
- delivery: Indian cities (Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Pune, Kolkata)
- badges: pick from ["Flipkart Choice", "Best Seller", "Trending", "SuperCoin eligible"] or omit
- features: specific specs with numbers, no vague marketing copy
- highlights.exchangeOffer: realistic exchange values per product price range
- highlights.bankOffer: use Flipkart Axis Bank Card, ICICI, or Kotak offers
- all products must be directly relevant to: "${query}"`;
};

const buildFilterString = (filters) => {
  const parts = [];
  if (filters.priceMin) parts.push(`minimum price ₹${filters.priceMin}`);
  if (filters.priceMax) parts.push(`maximum price ₹${filters.priceMax}`);
  if (filters.brand) parts.push(`brand: ${filters.brand}`);
  if (filters.rating) parts.push(`minimum rating: ${filters.rating} stars`);
  if (filters.city) parts.push(`delivery city: ${filters.city}`);
  if (filters.fAssured) parts.push(`F-Assured products only`);
  return parts.length > 0 ? ` with filters: ${parts.join(", ")}` : "";
};