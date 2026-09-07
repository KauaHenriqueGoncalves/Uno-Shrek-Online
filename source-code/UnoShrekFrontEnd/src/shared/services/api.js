import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "", // chamadas serão relativas para o proxy redirecionar
  withCredentials: true,
});