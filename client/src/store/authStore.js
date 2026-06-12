import { create } from "zustand";
import api from "../services/api";

const loadFromStorage = () => {
  try {
    const token = sessionStorage.getItem("accessToken");
    const user = sessionStorage.getItem("user");
    return {
      accessToken: token || null,
      user: user ? JSON.parse(user) : null,
    };
  } catch {
    return { accessToken: null, user: null };
  }
};

const { accessToken: storedToken, user: storedUser } = loadFromStorage();

export const useAuthStore = create((set, get) => ({
  // State
  user: storedUser,
  accessToken: storedToken,
  refreshToken: localStorage.getItem("refreshToken") || null,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,

  // Actions
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      const { user, accessToken, refreshToken } = res.data.data;

      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("refreshToken", refreshToken);

      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/auth/register", { name, email, password });
      const { user, accessToken, refreshToken } = res.data.data;

      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("refreshToken", refreshToken);

      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {}

    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    delete api.defaults.headers.common.Authorization;

    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  refreshTokens: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return false;

    try {
      const res = await api.post("/auth/refresh", { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = res.data.data;

      sessionStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      set({ accessToken, refreshToken: newRefreshToken });
      return true;
    } catch {
      get().logout();
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
