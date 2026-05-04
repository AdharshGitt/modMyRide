import axios from "axios";

const TOKEN_KEY = "modmyride_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getHealthStatus = async () => {
  const { data } = await api.get("/health");
  return data;
};

export const registerUser = async (email, password) => {
  const { data } = await api.post("/auth/register", { email, password });
  return data;
};

export const loginUser = async (email, password) => {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

export default api;
