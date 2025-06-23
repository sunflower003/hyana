import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './pages/login';
import Dashboard from './pages/dashboard';
import './App.css';

// Component để điều hướng dựa trên trạng thái đăng nhập
function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  // Auto navigate khi đăng nhập thành công
  React.useEffect(() => {
    if (isAuthenticated) {
      console.log('Đăng nhập thành công! Đã vào dashboard');
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  // Chỉ hiển thị login form
  return <LoginForm />;
}

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
