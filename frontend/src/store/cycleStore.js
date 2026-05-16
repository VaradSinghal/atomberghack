import { create } from "zustand";
import api from "../lib/api";

const useCycleStore = create((set) => ({
  cycle: null,
  loading: false,

  fetchActiveCycle: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/cycles/active");
      set({ cycle: data.cycle, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));

export default useCycleStore;
