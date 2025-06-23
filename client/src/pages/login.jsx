import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading, error, isAuthenticated, clearError } = useAuth();

  // Clear error khi component mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Đăng nhập thành công! Chuyển hướng...');
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password) {
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-black px-4">
      <form 
        onSubmit={handleLogin} 
        className="bg-zinc-900 text-white p-8 rounded-xl w-full max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-500 mb-2">HYANA</h1>
          <h2 className="text-xl font-semibold mb-2">Gold Analysis Platform (Demo)</h2>
          <p className="text-zinc-400 text-sm">Phân tích vàng XAUUSD với AI</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Success message */}
        {isAuthenticated && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm text-center">Đăng nhập thành công!</p>
          </div>
        )}

        {/* Email field */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            placeholder="admin@hyana.ai"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 transition-all"
            required
          />
        </div>

        {/* Password field */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Mật khẩu</label>
            <a href="#" className="text-sm text-zinc-400 hover:text-yellow-500 transition-colors">
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Login button */}
        <button 
          type="submit" 
          disabled={isLoading || !email || !password}
          className="w-full py-3 mb-6 bg-yellow-600 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
              Đang đăng nhập...
            </div>
          ) : (
            'Truy cập Dashboard'
          )}
        </button>

        {/* Demo account info */}
        <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
          <p className="text-zinc-400 text-xs mb-3 text-center">💡 Tài khoản demo</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">📧 Email:</span>
              <span className="text-white text-sm font-mono">admin@hyana.ai</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">🔑 Mật khẩu:</span>
              <span className="text-white text-sm font-mono">123456</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-xs">
            © 2024 HYANA Gold Analysis Platform
          </p>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
