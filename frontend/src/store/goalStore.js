import { create } from "zustand";
import api from "../lib/api";

const useGoalStore = create((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/goals");
      set({ goals: data.goals, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error, loading: false });
    }
  },

  createGoal: async (goalData) => {
    const { data } = await api.post("/goals", goalData);
    set((s) => ({ goals: [...s.goals, data.goal] }));
    return data.goal;
  },

  updateGoal: async (id, goalData) => {
    const { data } = await api.put(`/goals/${id}`, goalData);
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? data.goal : g)) }));
    return data.goal;
  },

  deleteGoal: async (id) => {
    await api.delete(`/goals/${id}`);
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },

  submitGoals: async () => {
    const { data } = await api.post("/goals/submit");
    set({ goals: data.goals });
    return data;
  },

  approveGoal: async (id, body = {}) => {
    const { data } = await api.post(`/goals/${id}/approve`, body);
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? data.goal : g)) }));
    return data;
  },

  returnGoal: async (id, comment) => {
    const { data } = await api.post(`/goals/${id}/return`, { comment });
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? data.goal : g)) }));
    return data;
  },

  unlockGoal: async (id) => {
    const { data } = await api.post(`/goals/${id}/unlock`);
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? data.goal : g)) }));
    return data;
  },

  get totalWeightage() {
    return get().goals.reduce((sum, g) => sum + (g.weightage || 0), 0);
  },
}));

export default useGoalStore;
