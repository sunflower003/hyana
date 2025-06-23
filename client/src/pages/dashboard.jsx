import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import NewsDashboard from '../components/NewsDashboard';
import TechnicalDashboard from '../components/TechnicalDashboard';
import api from '../api/axios'; // ✅ Use authenticated axios instance

function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    console.log('Đã đăng xuất');
  };

  // ✅ Update manual update functions
  const handleTechnicalUpdate = async () => {
    try {
      await api.post('/api/technical/update');
      console.log('✅ Technical analysis update triggered');
    } catch (error) {
      console.error('❌ Technical update failed:', error);
    }
  };

  const handleNewsUpdate = async () => {
    try {
      await api.post('/api/news/update');
      console.log('✅ News sentiment update triggered');
    } catch (error) {
      console.error('❌ News update failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-yellow-500">HYANA Gold Analysis</h1>
            <p className="text-zinc-400 text-sm">Phân tích vàng XAUUSD với AI - Real-time Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Đăng xuất
          </button>
        </div>

        {/* User Info */}
        <div className="bg-zinc-900 p-6 rounded-xl mb-8">
          <h2 className="text-xl font-semibold mb-4">👤 Thông tin tài khoản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Họ tên</label>
              <p className="text-white">{user?.fullName}</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Email</label>
              <p className="text-white">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Vai trò</label>
              <p className="text-white capitalize">{user?.role}</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Ngày tạo</label>
              <p className="text-white">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Technical Analysis */}
          <TechnicalDashboard />
          
          {/* News Analysis */}
          <NewsDashboard />
        </div>

        {/* Quick Actions */}
        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">⚡ Thao tác nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => window.open('https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD', '_blank')}
              className="bg-blue-800 hover:bg-blue-700 p-4 rounded-lg transition"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📈</div>
                <div className="font-medium">TradingView Chart</div>
                <div className="text-xs text-zinc-400">Xem biểu đồ XAUUSD</div>
              </div>
            </button>
            
            <button 
              onClick={handleTechnicalUpdate}
              className="bg-yellow-800 hover:bg-yellow-700 p-4 rounded-lg transition"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🔄</div>
                <div className="font-medium">Cập nhật kỹ thuật</div>
                <div className="text-xs text-zinc-400">Force update technical</div>
              </div>
            </button>
            
            <button 
              onClick={handleNewsUpdate}
              className="bg-green-800 hover:bg-green-700 p-4 rounded-lg transition"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📰</div>
                <div className="font-medium">Cập nhật tin tức</div>
                <div className="text-xs text-zinc-400">Force update news</div>
              </div>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">🔧 Trạng thái hệ thống</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Technical Analysis</span>
                <span className="text-green-500">🟢 Active</span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">Cron: Every 30 minutes</div>
            </div>
            
            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">News Sentiment</span>
                <span className="text-green-500">🟢 Active</span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">Cron: Every 2 hours</div>
            </div>
            
            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Economic Data</span>
                <span className="text-orange-500">🟡 Coming soon</span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">Giai đoạn 3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;