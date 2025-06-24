import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import NewsDashboard from '../components/NewsDashboard';
import TechnicalDashboard from '../components/TechnicalDashboard';
import MacroDashboard from '../components/MacroDashboard';
import SignalDashboard from '../components/SignalDashboard'; // ✅ NEW IMPORT
import api from '../api/axios';

function Dashboard() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    console.log('Đã đăng xuất');
  };

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

  const handleMacroUpdate = async () => {
    try {
      await api.post('/api/econ/update');
      console.log('✅ Macro economic update triggered');
    } catch (error) {
      console.error('❌ Macro update failed:', error);
    }
  };

  // ✅ NEW: Handle signal update
  const handleSignalUpdate = async () => {
    try {
      await api.post('/api/signal/update');
      console.log('✅ Signal generation update triggered');
    } catch (error) {
      console.error('❌ Signal update failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-yellow-500">HYANA Gold Analysis</h1>
            <p className="text-zinc-400 text-sm">Phân tích vàng XAUUSD với AI</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Đăng xuất
          </button>
        </div>

        {/* ✅ NEW: Signal Dashboard - Full Width */}
        <div className="mb-8">
          <SignalDashboard />
        </div>

        {/* ✅ UPDATED: Analysis Dashboard Grid - 3 columns */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Technical Analysis */}
          <TechnicalDashboard />
          
          {/* News Analysis */}
          <NewsDashboard />
          
          {/* Macro Economic Analysis */}
          <MacroDashboard />
        </div>

        {/* ✅ UPDATED: Quick Actions with Signal */}
        <div className="bg-zinc-900 p-6 rounded-xl hidden">
          <h2 className="text-xl font-semibold mb-4">⚡ Thao tác nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            
            <button 
              onClick={handleMacroUpdate}
              className="bg-orange-800 hover:bg-orange-700 p-4 rounded-lg transition"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium">Cập nhật kinh tế</div>
                <div className="text-xs text-zinc-400">Force update FRED</div>
              </div>
            </button>

            {/* ✅ NEW: Signal Update Button */}
            <button 
              onClick={handleSignalUpdate}
              className="bg-blue-800 hover:bg-blue-700 p-4 rounded-lg transition"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-medium">Tạo tín hiệu</div>
                <div className="text-xs text-zinc-400">Force update signal</div>
              </div>
            </button>
          </div>
        </div>

        {/* ✅ UPDATED: System Status */}
        <div className="mt-8 bg-zinc-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">🔧 Trạng thái hệ thống</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <span className="text-zinc-300">Economic Data (FRED)</span>
                <span className="text-green-500">🟢 Active</span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">Cron: Every 12 hours</div>
            </div>

            {/* ✅ NEW: Signal Generation Status */}
            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Signal Generation</span>
                <span className="text-green-500">🟢 Active</span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">Cron: Every hour</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;