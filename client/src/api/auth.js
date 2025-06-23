import axios from 'axios';

// Cấu hình base URL cho API
const API_BASE_URL = 'http://localhost:5000/api';

// Tạo axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động gắn token vào request
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

// Auth API functions
export const authAPI = {
  // Đăng nhập
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi kết nối server' };
    }
  },

  // Đăng ký
  register: async (fullName, email, password) => {
    try {
      const response = await api.post('/auth/register', { fullName, email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi kết nối server' };
    }
  },

  // Lấy thông tin user hiện tại
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi kết nối server' };
    }
  },

  // Đăng xuất (xóa token)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default api;