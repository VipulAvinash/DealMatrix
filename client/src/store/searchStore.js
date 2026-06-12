import { create } from "zustand";

// Session storage helpers
const getRecentSearches = () => {
  try {
    return JSON.parse(sessionStorage.getItem("recentSearches") || "[]");
  } catch {
    return [];
  }
};

const saveRecentSearch = (query) => {
  try {
    const recent = getRecentSearches();
    const updated = [query, ...recent.filter((q) => q !== query)].slice(0, 10);
    sessionStorage.setItem("recentSearches", JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

export const useSearchStore = create((set, get) => ({
  // State
  query: "",
  filters: {
    priceMin: null,
    priceMax: null,
    brand: null,
    category: null,
    rating: null,
  },
  compareList: [],
  recentSearches: getRecentSearches(),
  lastResults: null,

  // Actions
  setQuery: (query) => set({ query }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  clearFilters: () =>
    set({
      filters: {
        priceMin: null,
        priceMax: null,
        brand: null,
        category: null,
        rating: null,
      },
    }),

  addToCompare: (product) => {
    const { compareList } = get();
    if (compareList.length >= 4) return false;
    if (compareList.some((p) => p._id === product._id)) return false;
    set({ compareList: [...compareList, product] });
    return true;
  },

  removeFromCompare: (productId) =>
    set((state) => ({
      compareList: state.compareList.filter((p) => p._id !== productId),
    })),

  clearCompare: () => set({ compareList: [] }),

  addRecentSearch: (query) => {
    const updated = saveRecentSearch(query);
    set({ recentSearches: updated });
  },

  clearRecentSearches: () => {
    sessionStorage.removeItem("recentSearches");
    set({ recentSearches: [] });
  },

  setLastResults: (results) => set({ lastResults: results }),
}));
