import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export const http = axios.create({
  baseURL,
  timeout: 20000
});

http.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("scrm-token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

