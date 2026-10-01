import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const ADMIN_TOKEN_KEY = "savora_admin_token";
const ADMIN_ROLE_KEY = "savora_admin_role";

export const api = axios.create({ baseURL: BASE_URL });
export const API_BASE = BASE_URL;

// Attach the admin session token to every request automatically — the
// backend only checks it on /api/admin/* routes, so this is harmless on
// public endpoints (menu, orders, tracking) that don't look at it.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the backend ever rejects the stored token (expired session, server
// restarted and cleared its in-memory sessions, etc.), clear it here and
// tell StaffDashboard to fall back to the login screen instead of leaving
// the admin UI stuck showing stale "authenticated" state.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem(ADMIN_TOKEN_KEY)) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_ROLE_KEY);
      window.dispatchEvent(new Event("savora-admin-logout"));
    }
    return Promise.reject(err);
  }
);

export const getMenu = () => api.get("/api/menu").then((r) => r.data);

export const placeOrder = (payload) => api.post("/api/orders", payload).then((r) => r.data);

export const getOrder = (id) => api.get(`/api/orders/${id}`).then((r) => r.data);

export const getOrderByToken = (token) => api.get(`/api/track/${token}`).then((r) => r.data);

export const requestPayment = (method, orderId) =>
  api.post(`/api/payments/${method}/${orderId}`).then((r) => r.data);

export const adminLogin = (username, password) =>
  api.post("/api/admin/login", { username, password }).then((r) => r.data);

export const adminLogout = () => api.post("/api/admin/logout").catch(() => {}); // best-effort — clearing localStorage matters more than this succeeding

export const getActiveOrders = () => api.get("/api/admin/orders").then((r) => r.data);

export const getStats = () => api.get("/api/admin/stats").then((r) => r.data);

export const updateOrderStatus = (id, status) =>
  api.patch(`/api/admin/orders/${id}/status`, { status }).then((r) => r.data);

export const cancelOrder = (id, reason) =>
  api.patch(`/api/admin/orders/${id}/cancel`, { reason }).then((r) => r.data);

export const addDish = (payload) => api.post("/api/admin/menu/dishes", payload).then((r) => r.data);

export const uploadDishImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/api/admin/menu/upload-image", formData).then((r) => r.data);
};

export const updateDish = (dishId, updates) =>
  api.patch(`/api/admin/menu/dishes/${dishId}`, updates).then((r) => r.data);

export const deleteDish = (dishId) => api.delete(`/api/admin/menu/dishes/${dishId}`).then((r) => r.data);

export const sendHelpRequest = (orderType, tableNumber) =>
  api.post("/api/help", { orderType, tableNumber }).then((r) => r.data);

export const getPendingHelpRequests = () => api.get("/api/admin/help").then((r) => r.data);

export const resolveHelpRequest = (id) => api.patch(`/api/admin/help/${id}/resolve`).then((r) => r.data);

export const getSalesAnalytics = () => api.get("/api/admin/analytics").then((r) => r.data);

export const getStaffList = () => api.get("/api/admin/staff").then((r) => r.data);

export const addStaffMember = (username, password, role) =>
  api.post("/api/admin/staff", { username, password, role }).then((r) => r.data);

export const deleteStaffMember = (id) => api.delete(`/api/admin/staff/${id}`).then((r) => r.data);
