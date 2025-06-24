import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const SignalDashboard = () => {
  const [signalData, setSignalData] = useState({
    latest: null,
    history: [],
    stats: null,
    loading: true,
    error: null
  });

  const [showHistory, setShowHistory] = useState(false);
  const [selectedAction, setSelectedAction] = useState('all');

  useEffect(() => {
    fetchLatestSignal();
    fetchSignalStats();
  }, []);

  useEffect(() => {
    if (showHistory) {
      fetchSignalHistory();
    }
  }, [showHistory, selectedAction]);

  const fetchLatestSignal = async () => {
    try {
      setSignalData(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('🔍 DEBUG: Fetching signal data...');
      const response = await api.get('/api/signal/latest');
      
      // ✅ DEBUG: Log signal price
      console.log('🔍 DEBUG: Signal API Response:', response.data);
      console.log('🔍 DEBUG: Signal price:', response.data.data?.signal?.priceAtSignal);
      
      if (response.data.success) {
        setSignalData(prev => ({
          ...prev,
          latest: response.data.data,
          loading: false
        }));
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ DEBUG: Signal fetch error:', error);
      setSignalData(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.response?.data?.message || error.message 
      }));
    }
  };

  const fetchSignalHistory = async () => {
    try {
      const params = { limit: 10 };
      if (selectedAction !== 'all') {
        params.action = selectedAction;
      }
      
      const response = await api.get('/api/signal/history', { params });
      
      if (response.data.success) {
        setSignalData(prev => ({
          ...prev,
          history: response.data.data.signals
        }));
      }
    } catch (error) {
      console.error('Error fetching signal history:', error);
    }
  };

  const fetchSignalStats = async () => {
    try {
      const response = await api.get('/api/signal/stats');
      
      if (response.data.success) {
        setSignalData(prev => ({
          ...prev,
          stats: response.data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching signal stats:', error);
    }
  };

  const handleManualUpdate = async () => {
    try {
      await api.post('/api/signal/update');
      setTimeout(() => {
        fetchLatestSignal();
        fetchSignalStats();
      }, 3000);
    } catch (error) {
      console.error('Error triggering signal update:', error);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'BUY': return '📈';
      case 'SELL': return '📉';
      default: return '⏸️';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'BUY': return 'text-green-500 bg-green-900';
      case 'SELL': return 'text-red-500 bg-red-900';
      default: return 'text-zinc-400 bg-zinc-800';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 75) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    if (confidence >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const signalDate = new Date(date);
    const diffInHours = Math.floor((now - signalDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours}h trước`;
    return `${Math.floor(diffInHours / 24)}d trước`;
  };

  // ✅ ADD: Complete formatDetailedAnalysis function (around line 180-250)
  const formatDetailedAnalysis = (summary) => {
    if (!summary) return <div className="text-zinc-400">Không có phân tích chi tiết</div>;
    
    // Split by sections and format
    return summary.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;
      
      // Section headers (with ** formatting)
      if (trimmedLine.includes('**') && (trimmedLine.includes('PHÂN TÍCH') || trimmedLine.includes('GỢI Ý'))) {
        return (
          <div key={index} className="text-yellow-400 font-bold text-base mt-4 mb-2 border-b border-yellow-400/30 pb-1">
            {trimmedLine.replace(/\*\*/g, '')}
          </div>
        );
      }
      
      // Recommendation highlights (KHUYẾN NGHỊ)
      if (trimmedLine.includes('KHUYẾN NGHỊ:')) {
        const actionMatch = trimmedLine.match(/(MUA VÀNG|BÁN VÀNG|QUAN SÁT)/);
        const action = actionMatch ? actionMatch[1] : '';
        const emoji = trimmedLine.includes('📈') ? '📈' : 
                     trimmedLine.includes('📉') ? '📉' : '⏸️';
        
        return (
          <div key={index} className={`font-bold text-base p-3 rounded-lg mb-3 border-l-4 ${
            action === 'MUA VÀNG' ? 'bg-green-900/30 border-green-500 text-green-300' :
            action === 'BÁN VÀNG' ? 'bg-red-900/30 border-red-500 text-red-300' :
            'bg-zinc-800/50 border-zinc-500 text-zinc-300'
          }`}>
            {emoji} {trimmedLine.replace(/\*\*/g, '').replace('•', '').trim()}
          </div>
        );
      }
      
      // Score highlights (➤ Điểm)
      if (trimmedLine.includes('➤') && trimmedLine.includes('Điểm')) {
        const scoreMatch = trimmedLine.match(/(\d+)\/100/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
        
        return (
          <div key={index} className={`text-sm font-medium p-2 rounded mt-2 mb-2 ${
            score >= 70 ? 'bg-green-900/30 text-green-300' :
            score >= 50 ? 'bg-blue-900/30 text-blue-300' :
            'bg-red-900/30 text-red-300'
          }`}>
            {trimmedLine.replace('➤', '→').trim()}
          </div>
        );
      }
      
      // Warning section (⚠️ LƯU Ý)
      if (trimmedLine.includes('⚠️') && trimmedLine.includes('LƯU Ý')) {
        return (
          <div key={index} className="text-orange-400 font-bold text-base mt-4 mb-2 border-b border-orange-400/30 pb-1">
            {trimmedLine.replace(/\*\*/g, '')}
          </div>
        );
      }
      
      // Important bullet points with special formatting
      if (trimmedLine.startsWith('•') && (
        trimmedLine.includes('Điểm tổng hợp') || 
        trimmedLine.includes('Độ tin cậy') ||
        trimmedLine.includes('Lý do chính') ||
        trimmedLine.includes('Vùng vào lệnh') ||
        trimmedLine.includes('Hành động')
      )) {
        return (
          <div key={index} className="text-white text-sm font-medium bg-zinc-800/50 p-2 rounded mb-2 border-l-2 border-blue-500">
            <span className="text-blue-400">•</span> {trimmedLine.substring(1).trim()}
          </div>
        );
      }
      
      // Regular bullet points
      if (trimmedLine.startsWith('•')) {
        return (
          <div key={index} className="text-zinc-300 text-sm leading-relaxed ml-3 mb-1 flex items-start">
            <span className="text-blue-400 mr-2 mt-1 text-xs">●</span> 
            <span>{trimmedLine.substring(1).trim()}</span>
          </div>
        );
      }
      
      // Regular text lines
      if (!trimmedLine.includes('**') && !trimmedLine.includes('➤') && !trimmedLine.includes('⚠️')) {
        return (
          <div key={index} className="text-zinc-300 text-sm leading-relaxed mb-1 ml-2">
            {trimmedLine}
          </div>
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  if (signalData.loading) {
    return (
      <div className="bg-zinc-900 p-6 rounded-xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-zinc-400">Đang tải tín hiệu giao dịch...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 p-6 rounded-xl flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-blue-500">🎯 Tín hiệu giao dịch AI</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1 rounded text-sm ${showHistory ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}
          >
            {showHistory ? 'Tín hiệu mới nhất' : 'Lịch sử'}
          </button>
          <button 
            onClick={fetchLatestSignal}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            🔄
          </button>
        </div>
      </div>

      {signalData.error ? (
        <div className="text-center text-red-400 py-8">
          <p>{signalData.error}</p>
          <button 
            onClick={handleManualUpdate}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tạo tín hiệu mới
          </button>
        </div>
      ) : !showHistory ? (
        // Latest Signal Display
        signalData.latest ? (
          <div className="space-y-6">
            {/* Main Signal Card */}
            <div className={`p-6 rounded-xl border-2 ${
              signalData.latest.signal.action === 'BUY' ? 'border-green-500 bg-green-900/20' :
              signalData.latest.signal.action === 'SELL' ? 'border-red-500 bg-red-900/20' :
              'border-zinc-600 bg-zinc-800/50'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`text-3xl p-3 rounded-lg ${getActionColor(signalData.latest.signal.action)}`}>
                    {getActionIcon(signalData.latest.signal.action)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{signalData.latest.signal.action}</h2>
                    <p className="text-zinc-400 text-sm">Khuyến nghị {signalData.latest.signal.timeframe}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getConfidenceColor(signalData.latest.signal.confidence)}`}>
                    {signalData.latest.signal.confidence}%
                  </div>
                  <p className="text-zinc-400 text-xs">Độ tin cậy</p>
                </div>
              </div>

              {/* Signal Summary */}
              {/* ✅ ENHANCED: Detailed Analysis Display */}
              <div className="bg-zinc-800 p-4 rounded-lg mb-4">
                <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center">
                  <span className="mr-2">🧠</span>
                  Phân tích chi tiết từ 3 nguồn
                </h4>
                <div className="max-h-96 overflow-y-auto news-scrollbar">
                  <div className="space-y-1">
                    {formatDetailedAnalysis(signalData.latest.signal.summary)}
                  </div>
                </div>
              </div>

              {/* Price Levels */}
              {signalData.latest.signal.action !== 'HOLD' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-zinc-800 p-3 rounded-lg text-center">
                    <div className="text-xs text-zinc-400 mb-1">Giá hiện tại</div>
                    <div className="text-white font-mono text-sm">
                      {formatPrice(signalData.latest.signal.priceAtSignal)}
                    </div>
                  </div>
                  <div className="bg-zinc-800 p-3 rounded-lg text-center">
                    <div className="text-xs text-zinc-400 mb-1">Vùng vào lệnh</div>
                    <div className="text-white font-mono text-sm">
                      {signalData.latest.signal.entryZone?.length === 2 
                        ? `${formatPrice(signalData.latest.signal.entryZone[0])} - ${formatPrice(signalData.latest.signal.entryZone[1])}`
                        : 'N/A'
                      }
                    </div>
                  </div>
                  <div className="bg-zinc-800 p-3 rounded-lg text-center">
                    <div className="text-xs text-zinc-400 mb-1">Stop Loss</div>
                    <div className="text-red-400 font-mono text-sm">
                      {formatPrice(signalData.latest.signal.stopLoss)}
                    </div>
                  </div>
                  <div className="bg-zinc-800 p-3 rounded-lg text-center">
                    <div className="text-xs text-zinc-400 mb-1">Take Profit</div>
                    <div className="text-green-400 font-mono text-sm">
                      {formatPrice(signalData.latest.signal.takeProfit)}
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Metrics */}
              {signalData.latest.signal.riskRewardRatio && (
                <div className="bg-zinc-800 p-3 rounded-lg mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Risk/Reward Ratio:</span>
                    <span className="text-white font-mono">1:{signalData.latest.signal.riskRewardRatio}</span>
                  </div>
                </div>
              )}

              {/* Score Breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-zinc-800 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-yellow-500">{signalData.latest.signal.technicalScore}</div>
                  <div className="text-xs text-zinc-400">Kỹ thuật</div>
                </div>
                <div className="bg-zinc-800 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-500">{signalData.latest.signal.newsScore}</div>
                  <div className="text-xs text-zinc-400">Tin tức</div>
                </div>
                <div className="bg-zinc-800 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-orange-500">{signalData.latest.signal.macroScore}</div>
                  <div className="text-xs text-zinc-400">Kinh tế</div>
                </div>
              </div>

              {/* Signal Age */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">
                  Cập nhật: {formatTimeAgo(signalData.latest.signal.createdAt)}
                </span>
                {signalData.latest.isRecent ? (
                  <span className="text-green-500">🟢 Fresh</span>
                ) : (
                  <span className="text-yellow-500">🟡 Stale ({signalData.latest.age}h)</span>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {signalData.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-zinc-800 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-white">{signalData.stats.total}</div>
                  <div className="text-xs text-zinc-400">Tổng tín hiệu</div>
                </div>
                <div className="bg-zinc-800 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-white">{signalData.stats.last30Days}</div>
                  <div className="text-xs text-zinc-400">30 ngày qua</div>
                </div>
                <div className="bg-zinc-800 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-500">
                    {signalData.stats.averageScores.technical}
                  </div>
                  <div className="text-xs text-zinc-400">TB Kỹ thuật</div>
                </div>
                <div className="bg-zinc-800 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-500">
                    {signalData.stats.confidenceDistribution.high}
                  </div>
                  <div className="text-xs text-zinc-400">High Conf</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-zinc-400 py-8">
            <p>Chưa có tín hiệu giao dịch</p>
            <button 
              onClick={handleManualUpdate}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tạo tín hiệu đầu tiên
            </button>
          </div>
        )
      ) : (
        // Signal History Display
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex space-x-2">
            {['all', 'BUY', 'SELL', 'HOLD'].map(action => (
              <button
                key={action}
                onClick={() => setSelectedAction(action)}
                className={`px-3 py-1 rounded text-xs ${
                  selectedAction === action
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {action === 'all' ? 'Tất cả' : action}
              </button>
            ))}
          </div>

          {/* History List */}
          <div className="space-y-3 max-h-96 overflow-y-auto news-scrollbar">
            {signalData.history.length === 0 ? (
              <div className="text-center text-zinc-400 py-8">
                Không có lịch sử tín hiệu
              </div>
            ) : (
              signalData.history.map((signal, index) => (
                <div key={index} className="bg-zinc-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg px-2 py-1 rounded ${getActionColor(signal.action)}`}>
                        {getActionIcon(signal.action)}
                      </span>
                      <div>
                        <span className="font-medium text-white">{signal.action}</span>
                        <div className="text-xs text-zinc-400">
                          {formatTimeAgo(signal.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getConfidenceColor(signal.confidence)}`}>
                        {signal.confidence}%
                      </div>
                    </div>
                  </div>

                  {/* Price Levels */}
                  {signal.action !== 'HOLD' && (
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-zinc-400">Entry: </span>
                        <span className="text-white font-mono">
                          {signal.entryZone?.length === 2 
                            ? `${formatPrice(signal.entryZone[0])}-${formatPrice(signal.entryZone[1])}`
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400">SL: </span>
                        <span className="text-red-400 font-mono">
                          {formatPrice(signal.stopLoss)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400">TP: </span>
                        <span className="text-green-400 font-mono">
                          {formatPrice(signal.takeProfit)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <p className="text-zinc-300 text-sm line-clamp-2">{signal.summary}</p>

                  {/* Scores */}
                  <div className="flex justify-between items-center mt-3 text-xs">
                    <div className="flex space-x-3">
                      <span className="text-yellow-500">T:{signal.technicalScore}</span>
                      <span className="text-green-500">N:{signal.newsScore}</span>
                      <span className="text-orange-500">M:{signal.macroScore}</span>
                    </div>
                    <span className="text-blue-400 font-bold">
                      Overall: {signal.overallScore}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Manual Update */}
      <div className="mt-4 text-center">
        <button 
          onClick={handleManualUpdate}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          🔄 Tạo tín hiệu mới
        </button>
      </div>
    </div>
  );
};

export default SignalDashboard;