import { api } from "../../shared/services/api";

export const authService = {
  login: async (username: string, password: string) => {
    const { data } = await api.post("/api/auth/login", { username, password });
    return data;
  },

  register: async (username: string, email: string, password: string, age: number) => {
    const { data } = await api.post("/api/auth/register", { username, email, password, age });
    return data;
  },

  logout: async () => {
    const { data } = await api.post("/api/auth/logout");
    return data;
  },
};