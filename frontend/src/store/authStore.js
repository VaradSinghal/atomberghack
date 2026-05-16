import { create } from "zustand";
import api from "../lib/api";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("goaltrack_user") || "null"),
  token: localStorage.getItem("goaltrack_token") || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("goaltrack_token", data.token);
      localStorage.setItem("goaltrack_user", JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem("goaltrack_token");
    localStorage.removeItem("goaltrack_user");
    set({ user: null, token: null });
  },

  get isAuthenticated() {
    return !!this.token;
  },
}));

export default useAuthStore;
