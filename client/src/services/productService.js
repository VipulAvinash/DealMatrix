import api from "./api";

/**
 * Search products with query and filters
 */
export const searchProducts = async ({ query, page = 1, limit = 20, ...filters }) => {
  const params = new URLSearchParams({ q: query, page, limit });

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      params.append(key, value);
    }
  });

  const res = await api.get(`/products/search?${params.toString()}`);
  return res.data;
};

/**
 * Get product by ID
 */
export const getProduct = async (id) => {
  const res = await api.get(`/products/${id}`);
  return res.data;
};

/**
 * Compare multiple products
 */
export const compareProducts = async (productIds) => {
  const res = await api.post("/products/compare", { productIds });
  return res.data;
};

/**
 * Save/unsave a product
 */
export const saveProduct = async (productId) => {
  const res = await api.post("/products/save", { productId });
  return res.data;
};

/**
 * Get user search history
 */
export const getSearchHistory = async ({ page = 1, limit = 20 } = {}) => {
  const res = await api.get(`/user/history?page=${page}&limit=${limit}`);
  return res.data;
};

/**
 * Get saved products
 */
export const getSavedProducts = async () => {
  const res = await api.get("/user/saved");
  return res.data;
};

/**
 * Get analytics dashboard (admin only)
 */
export const getAnalyticsDashboard = async () => {
  const res = await api.get("/analytics/dashboard");
  return res.data;
};

/**
 * Get search trends
 */
export const getSearchTrends = async (days = 7) => {
  const res = await api.get(`/analytics/trends?days=${days}`);
  return res.data;
};
