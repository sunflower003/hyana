import { useState, useEffect } from 'react';
import api from '../api/axios'; // ✅ Use authenticated axios instance

const TechnicalDashboard = () => {
  const [technicalData, setTechnicalData] = useState({
    latest: null,
    recent: [],
    stats: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchTechnicalData();
    fetchTechnicalStats();
  }, []);

  const fetchTechnicalData = async () => {
    try {
      setTechnicalData(prev => ({ ...prev, loading: true }));
      
      // ✅ Use authenticated api instance
      const response = await api.get('/api/technical/latest');
      
      if (response.data.success) {
        setTechnicalData(prev => ({
          ...prev,
          latest: response.data.data,
          loading: false,
          error: null
        }));
      }
    } catch (error) {
      console.error('Error fetching technical data:', error);
      setTechnicalData(prev => ({
        ...prev,
        loading: false,
        error: 'Không thể tải dữ liệu kỹ thuật'
      }));
    }
  };

  const fetchTechnicalStats = async () => {
    try {
      // ✅ Use authenticated api instance
      const response = await api.get('/api/technical/stats');
      
      if (response.data.success) {
        setTechnicalData(prev => ({
          ...prev,
          stats: response.data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching technical stats:', error);
    }
  };

  // ✅ Update manual update function
  const handleManualUpdate = async () => {
    try {
      await api.post('/api/technical/update');
      // Refresh data after update
      setTimeout(() => {
        fetchTechnicalData();
      }, 2000);
    } catch (error) {
      console.error('Error triggering manual update:', error);
    }
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'BUY': return 'text-green-500 bg-green-900';
      case 'SELL': return 'text-red-500 bg-red-900';
      default: return 'text-yellow-500 bg-yellow-900';
    }
  };

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'BUY': return '📈';
      case 'SELL': return '📉';
      default: return '⏸️';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'uptrend': return 'text-green-500';
      case 'downtrend': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getRSIColor = (rsi) => {
    if (rsi > 70) return 'text-red-500'; // Overbought
    if (rsi < 30) return 'text-green-500'; // Oversold
    return 'text-blue-500'; // Normal
  };

  const getMACDColor = (trend) => {
    switch (trend) {
      case 'bullish_cross':
      case 'bullish':
        return 'text-green-500';
      case 'bearish_cross':
      case 'bearish':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (technicalData.loading) {
    return (
      <div className="bg-zinc-900 p-6 rounded-xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          <span className="ml-2 text-zinc-400">Đang tải phân tích kỹ thuật...</span>
        </div>
      </div>
    );
  }

  if (technicalData.error) {
    return (
      <div className="bg-zinc-900 p-6 rounded-xl">
        <div className="text-center text-red-400 py-8">
          <p>{technicalData.error}</p>
          <button 
            onClick={handleManualUpdate}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Cập nhật phân tích
          </button>
        </div>
      </div>
    );
  }

  const { latest } = technicalData;
  const snapshot = latest?.snapshot;
  const analysis = latest?.analysis;

  return (
    <div className="bg-zinc-900 p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-yellow-500">📊 Phân tích kỹ thuật 4H</h3>
        <button 
          onClick={fetchTechnicalData}
          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
        >
          🔄 Refresh
        </button>
      </div>

      {technicalData.loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          <span className="ml-2 text-zinc-400">Đang tải phân tích kỹ thuật...</span>
        </div>
      )}

      {technicalData.error && (
        <div className="text-center text-red-400 py-8">
          <p>{technicalData.error}</p>
          <button 
            onClick={handleManualUpdate}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Cập nhật phân tích
          </button>
        </div>
      )}

      {technicalData.latest && (
        <>
          {/* Price & Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Current Price */}
            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="text-sm text-zinc-400 mb-1">Giá XAUUSD hiện tại</div>
              <div className="text-2xl font-bold text-white">
                ${snapshot.price.close.toFixed(2)}
              </div>
              <div className="text-xs text-zinc-500">
                H: ${snapshot.price.high.toFixed(2)} | L: ${snapshot.price.low.toFixed(2)}
              </div>
            </div>

            {/* Recommendation */}
            {analysis && (
              <div className="bg-zinc-800 p-4 rounded-lg">
                <div className="text-sm text-zinc-400 mb-1">Khuyến nghị</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold ${getRecommendationColor(analysis.recommendation)}`}>
                  <span className="mr-2">{getRecommendationIcon(analysis.recommendation)}</span>
                  {analysis.recommendation}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Độ tin cậy: {analysis.confidence}%
                </div>
              </div>
            )}
          </div>

          {/* Technical Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* RSI */}
            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="text-sm text-zinc-400 mb-2">RSI (14)</div>
              <div className={`text-xl font-bold ${getRSIColor(snapshot.indicators.RSI)}`}>
                {snapshot.indicators.RSI.toFixed(1)}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {snapshot.indicators.RSI > 70 ? 'Quá mua' : 
                 snapshot.indicators.RSI < 30 ? 'Quá bán' : 'Bình thường'}
              </div>
            </div>

            {/* MACD */}
            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="text-sm text-zinc-400 mb-2">MACD</div>
              <div className={`text-sm font-bold ${getMACDColor(snapshot.indicators.MACD.trend)}`}>
                {snapshot.indicators.MACD.trend.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Signal: {snapshot.indicators.MACD.signal?.toFixed(4) || 'N/A'}
              </div>
            </div>

            {/* Trend */}
            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="text-sm text-zinc-400 mb-2">Xu hướng</div>
              <div className={`text-sm font-bold ${getTrendColor(snapshot.indicators.trend)}`}>
                {snapshot.indicators.trend === 'uptrend' ? '📈 Tăng' :
                 snapshot.indicators.trend === 'downtrend' ? '📉 Giảm' : '➡️ Sideway'}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Strength: {snapshot.strength}/100
              </div>
            </div>
          </div>

          {/* EMA Levels */}
          <div className="bg-zinc-800 p-4 rounded-lg mb-6">
            <div className="text-sm text-zinc-400 mb-3">📈 EMA Levels</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-zinc-500">EMA 20</div>
                <div className="text-white font-medium">
                  ${snapshot.indicators.EMA_20?.toFixed(2) || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">EMA 50</div>
                <div className="text-white font-medium">
                  ${snapshot.indicators.EMA_50?.toFixed(2) || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">EMA 200</div>
                <div className="text-white font-medium">
                  ${snapshot.indicators.EMA_200?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Signals */}
          {analysis && analysis.signals && (
            <div className="bg-zinc-800 p-4 rounded-lg mb-6">
              <div className="text-sm text-zinc-400 mb-3">🔍 Tín hiệu phân tích</div>
              <div className="space-y-2">
                {analysis.signals.map((signal, index) => (
                  <div key={index} className="text-xs text-zinc-300 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {signal}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Reasoning */}
          {analysis && analysis.reasoning && (
            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="text-sm text-zinc-400 mb-3">💡 Lý do phân tích</div>
              <div className="space-y-2">
                {analysis.reasoning.map((reason, index) => (
                  <div key={index} className="text-xs text-zinc-300 flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="mt-4 text-xs text-zinc-500 text-center">
            Cập nhật lần cuối: {new Date(technicalData.latest.lastUpdated).toLocaleString('vi-VN')}
          </div>
        </>
      )}
    </div>
  );
};

export default TechnicalDashboard;