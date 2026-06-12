import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchProducts,
  getProduct,
  compareProducts,
  saveProduct,
  getSavedProducts,
  getSearchHistory,
  getAnalyticsDashboard,
  getSearchTrends,
} from "../services/productService";
import { useSearchStore } from "../store/searchStore";

// ─── Search Hook ─────────────────────────────────────────────────────────────
export const useProductSearch = (query, filters = {}, options = {}) => {
  const { addRecentSearch } = useSearchStore();

  return useQuery({
    queryKey: ["products", "search", query, filters],
    queryFn: async () => {
      const result = await searchProducts({ query, ...filters });
      if (query) addRecentSearch(query);
      return result;
    },
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// ─── Single Product Hook ─────────────────────────────────────────────────────
export const useProduct = (id) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
};

// ─── Compare Hook ─────────────────────────────────────────────────────────────
export const useCompareProducts = (productIds) => {
  return useQuery({
    queryKey: ["compare", productIds],
    queryFn: () => compareProducts(productIds),
    enabled: productIds?.length >= 2,
  });
};

// ─── Save Product Mutation ────────────────────────────────────────────────────
export const useSaveProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedProducts"] });
    },
  });
};

// ─── Saved Products Hook ──────────────────────────────────────────────────────
export const useSavedProducts = () => {
  return useQuery({
    queryKey: ["savedProducts"],
    queryFn: getSavedProducts,
  });
};

// ─── Search History Hook ──────────────────────────────────────────────────────
export const useSearchHistory = (params) => {
  return useQuery({
    queryKey: ["searchHistory", params],
    queryFn: () => getSearchHistory(params),
  });
};

// ─── Analytics Hooks ──────────────────────────────────────────────────────────
export const useAnalyticsDashboard = () => {
  return useQuery({
    queryKey: ["analyticsDashboard"],
    queryFn: getAnalyticsDashboard,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSearchTrends = (days = 7) => {
  return useQuery({
    queryKey: ["searchTrends", days],
    queryFn: () => getSearchTrends(days),
  });
};
