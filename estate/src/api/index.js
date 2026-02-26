/*
API service for making HTTP requests to backend.
Centralized axios configuration with authentication.
*/
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (data) => api.post('/auth/signup', data),
  sendOTP: (email) => api.post('/auth/send-otp', { email }),
  verifyOTP: (email, code) => api.post('/auth/verify-otp', { email, code }),
  resetPassword: (email, code, new_password) => 
    api.post('/auth/reset-password', { email, code, new_password }),
};

// Admin endpoints
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  
  // Houses
  getHouses: () => api.get('/admin/houses'),
  createHouse: (data) => api.post('/admin/houses', data),
  updateHouse: (id, data) => api.put(`/admin/houses/${id}`, data),
  deleteHouse: (id) => api.delete(`/admin/houses/${id}`),
  
  // Tenants
  getTenants: () => api.get('/admin/tenants'),
  updateTenant: (id, data) => api.put(`/admin/tenants/${id}`, data),
  deleteTenant: (id) => api.delete(`/admin/tenants/${id}`),
  
  // Notices
  getNotices: () => api.get('/admin/notices'),
  sendNotice: (data) => api.post('/admin/notices', data),
  
  // Payments
  getPayments: () => api.get('/admin/payments'),
  createPayment: (data) => api.post('/admin/payments', data),
  
  // Events
  getEvents: () => api.get('/admin/events'),
  createEvent: (data) => api.post('/admin/events', data),
  
  // Warnings
  sendWarning: (data) => api.post('/admin/warnings', data),
  
  // Photos
  uploadPhoto: (data) => api.post('/admin/photos', data),
  
  // Maintenance
  getMaintenanceRequests: () => api.get('/admin/maintenance-requests'),
  updateMaintenanceRequest: (id, data) => api.put(`/admin/maintenance-requests/${id}`, data),
};

// Tenant endpoints
export const tenantAPI = {
  getDashboard: () => api.get('/tenant/dashboard'),
  getPayments: () => api.get('/tenant/payments'),
  getNotices: () => api.get('/tenant/notices'),
  getEvents: () => api.get('/tenant/events'),
  getWarnings: () => api.get('/tenant/warnings'),
  getPhotos: () => api.get('/tenant/photos'),
  getHouse: () => api.get('/tenant/house'),
  
  // Maintenance
  getMaintenanceRequests: () => api.get('/tenant/maintenance-requests'),
  createMaintenanceRequest: (data) => api.post('/tenant/maintenance-requests', data),
};

// Chat endpoints
export const chatAPI = {
  getMessages: () => api.get('/chat/messages'),
  getConversation: (userId) => api.get(`/chat/messages/conversation/${userId}`),
  sendMessage: (data) => api.post('/chat/messages', data),
  markAsRead: (messageId) => api.put(`/chat/messages/${messageId}/read`),
  getUsers: () => api.get('/chat/users'),
  getUnreadCount: () => api.get('/chat/unread-count'),
};

export default api;
