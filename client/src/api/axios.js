import axios from 'axios';

// ✅ FIXED: Use proper backend URL for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://hyana.onrender.com' // ✅ Remove trailing slash and use correct URL
    : 'http://localhost:5000');

console.log('🌐 Environment:', import.meta.env.MODE);
console.log('🌐 API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // ✅ Increased timeout for Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;