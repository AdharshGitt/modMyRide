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

export const registerUser = async (email, password, username) => {
  const { data } = await api.post("/auth/register", { email, password, username });
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

export const fetchAdminUsers = async () => {
  const { data } = await api.get("/admin/users");
  return data;
};

export const fetchAdminStats = async () => {
  const { data } = await api.get("/admin/stats");
  return data;
};

export const deleteAdminUser = async (userId) => {
  const { data } = await api.delete(`/admin/users/${userId}`);
  return data;
};

export const updateAdminUser = async (userId, userData) => {
  const { data } = await api.put(`/admin/users/${userId}`, userData);
  return data;
};

// =======================
// Vehicle API Functions
// =======================

export const fetchAdminVehicles = async () => {
  const { data } = await api.get("/admin/vehicles");
  return data;
};

export const createAdminVehicle = async (vehicleData) => {
  const { data } = await api.post("/admin/vehicles", vehicleData);
  return data;
};

export const updateAdminVehicle = async (id, vehicleData) => {
  const { data } = await api.put(`/admin/vehicles/${id}`, vehicleData);
  return data;
};

export const deleteAdminVehicle = async (id) => {
  const { data } = await api.delete(`/admin/vehicles/${id}`);
  return data;
};

// =======================
// Upgrade API Functions
// =======================

export const fetchAdminUpgrades = async () => {
  const { data } = await api.get("/admin/upgrades");
  return data;
};

export const createAdminUpgrade = async (upgradeData) => {
  const { data } = await api.post("/admin/upgrades", upgradeData);
  return data;
};

export const updateAdminUpgrade = async (id, upgradeData) => {
  const { data } = await api.put(`/admin/upgrades/${id}`, upgradeData);
  return data;
};

export const deleteAdminUpgrade = async (id) => {
  const { data } = await api.delete(`/admin/upgrades/${id}`);
  return data;
};

export default api;
