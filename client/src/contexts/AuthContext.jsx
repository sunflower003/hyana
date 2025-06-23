import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth';

// Tạo Context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };

    case 'AUTH_FAIL':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };

    case 'LOGOUT':
      return {
        ...initialState
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Kiểm tra token khi app khởi động
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          token,
          user: JSON.parse(user)
        }
      });
    }
  }, []);

  // Login function - sử dụng useCallback để tránh re-create
  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authAPI.login(email, password);
      
      // Lưu vào localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: response.data
      });
      
      return response;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAIL',
        payload: error.message
      });
      throw error;
    }
  }, []);

  // Register function - sử dụng useCallback
  const register = useCallback(async (fullName, email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authAPI.register(fullName, email, password);
      
      // Lưu vào localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: response.data
      });
      
      return response;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAIL',
        payload: error.message
      });
      throw error;
    }
  }, []);

  // Logout function - sử dụng useCallback
  const logout = useCallback(() => {
    authAPI.logout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Clear error function - sử dụng useCallback
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook để sử dụng AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};