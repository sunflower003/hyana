import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const MacroDashboard = () => {
  const [macroData, setMacroData] = useState({
    latest: [],
    summary: null,
    loading: true,
    error: null
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMacroData();
    fetchMacroSummary();
  }, [selectedCategory]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const fetchMacroData = async () => {
    try {
      setMacroData(prev => ({ ...prev, loading: true, error: null }));
      
      const params = { limit: 10 };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      const response = await api.get('/api/econ/latest', { params });
      
      if (response.data.success) {
        setMacroData(prev => ({
          ...prev,
          latest: response.data.data.economicData,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error fetching macro data:', error);
      setMacroData(prev => ({
        ...prev,
        loading: false,
        error: 'Không thể tải dữ liệu kinh tế'
      }));
    }
  };

  const fetchMacroSummary = async () => {
    try {
      const response = await api.get('/api/econ/summary');
      
      if (response.data.success) {
        setMacroData(prev => ({
          ...prev,
          summary: response.data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching macro summary:', error);
    }
  };

  const handleManualUpdate = async () => {
    try {
      await api.post('/api/econ/update');
      setTimeout(() => {
        fetchMacroData();
        fetchMacroSummary();
      }, 3000);
    } catch (error) {
      console.error('Error triggering macro update:', error);
    }
  };

  const openEventDetail = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    document.body.style.overflow = 'unset';
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'positive': return '📈';
      case 'negative': return '📉';
      default: return '➡️';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-zinc-400';
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'dovish_usd': return 'text-green-500';
      case 'hawkish_usd': return 'text-red-500';
      case 'risk_off': return 'text-yellow-500';
      case 'risk_on': return 'text-blue-500';
      default: return 'text-zinc-400';
    }
  };

  const getSentimentText = (sentiment) => {
    switch (sentiment) {
      case 'dovish_usd': return 'Fed nới lỏng';
      case 'hawkish_usd': return 'Fed thắt chặt';
      case 'risk_off': return 'Tránh rủi ro';
      case 'risk_on': return 'Thích rủi ro';
      default: return 'Trung tính';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'fed_policy': return '🏦';
      case 'inflation': return '📊';
      case 'employment': return '👥';
      case 'economic_growth': return '📈';
      case 'treasury': return '💰';
      case 'currency': return '💵';
      default: return '📋';
    }
  };

  // Safe number formatting with null checks
  const formatValue = (value, category) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return 'N/A';
    }
    
    try {
      switch (category) {
        case 'fed_policy':
        case 'treasury':
          return `${numValue.toFixed(2)}%`;
        case 'employment':
          if (numValue > 1000) {
            return `${(numValue / 1000).toFixed(0)}K`;
          }
          return `${numValue.toFixed(1)}%`;
        case 'inflation':
          return numValue.toFixed(1);
        default:
          return numValue.toFixed(2);
      }
    } catch (error) {
      console.error('Error formatting value:', value, category, error);
      return 'N/A';
    }
  };

  // Safe change calculation
  const formatChange = (current, previous) => {
    if (current === null || current === undefined || 
        previous === null || previous === undefined ||
        isNaN(current) || isNaN(previous)) {
      return 'N/A';
    }
    
    try {
      const currentNum = typeof current === 'string' ? parseFloat(current) : current;
      const previousNum = typeof previous === 'string' ? parseFloat(previous) : previous;
      
      if (isNaN(currentNum) || isNaN(previousNum)) {
        return 'N/A';
      }
      
      const change = currentNum - previousNum;
      return `${change >= 0 ? '+' : ''}${change.toFixed(3)}`;
    } catch (error) {
      console.error('Error calculating change:', current, previous, error);
      return 'N/A';
    }
  };

  const categories = [
    { value: 'all', label: 'Tất cả', icon: '📊' },
    { value: 'fed_policy', label: 'Fed Policy', icon: '🏦' },
    { value: 'inflation', label: 'Lạm phát', icon: '📊' },
    { value: 'employment', label: 'Việc làm', icon: '👥' },
    { value: 'treasury', label: 'Trái phiếu', icon: '💰' },
    { value: 'currency', label: 'Tiền tệ', icon: '💵' }
  ];

  if (macroData.loading) {
    return (
      <div className="bg-zinc-900 p-6 rounded-xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-zinc-400">Đang tải dữ liệu kinh tế...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-zinc-900 p-6 rounded-xl flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-orange-500">📊 Phân tích kinh tế vĩ mô</h3>
          <button 
            onClick={fetchMacroData}
            className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
          >
            🔄 Refresh
          </button>
        </div>

        {/* ✅ Summary Cards - flex-shrink-0 to prevent shrinking */}
        {macroData.summary && macroData.summary.summary.total > 0 && (
          <div className="mb-6 p-4 bg-zinc-800 rounded-lg flex-shrink-0">
            <h4 className="text-sm font-medium text-zinc-300 mb-3">📊 Tóm tắt 24h</h4>
            
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white">
                  {macroData.summary.summary.total}
                </div>
                <div className="text-xs text-zinc-400">Tổng sự kiện</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-500">
                  {macroData.summary.summary.positive}
                </div>
                <div className="text-xs text-zinc-400">Tích cực</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-500">
                  {macroData.summary.summary.negative}
                </div>
                <div className="text-xs text-zinc-400">Tiêu cực</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-500">
                  {macroData.summary.summary.neutral}
                </div>
                <div className="text-xs text-zinc-400">Trung tính</div>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <span className="text-sm text-zinc-400">Xu hướng: </span>
              <span className={`font-medium ${
                macroData.summary.summary.sentiment === 'bullish' ? 'text-green-500' :
                macroData.summary.summary.sentiment === 'bearish' ? 'text-red-500' : 'text-yellow-500'
              }`}>
                {macroData.summary.summary.sentiment === 'bullish' ? '🐂 Tăng giá' :
                 macroData.summary.summary.sentiment === 'bearish' ? '🐻 Giảm giá' : '⚖️ Trung tính'}
              </span>
            </div>
          </div>
        )}

        {/* ✅ Category Filter - flex-shrink-0 to prevent shrinking */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-3 py-1 text-xs rounded-full transition ${
                  selectedCategory === category.value
                    ? 'bg-orange-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                {category.icon} {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* ✅ FIXED: Economic Events List with Fixed Height and Scroll */}
        <div className="flex-1 overflow-hidden">
          {macroData.error ? (
            <div className="text-center text-red-400 py-8">
              <p>{macroData.error}</p>
              <button 
                onClick={handleManualUpdate}
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Cập nhật dữ liệu
              </button>
            </div>
          ) : macroData.latest.length === 0 ? (
            <div className="text-center text-zinc-400 py-8">
              <p>📊 Chưa có dữ liệu kinh tế</p>
              <button 
                onClick={handleManualUpdate}
                className="mt-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Cập nhật dữ liệu FRED
              </button>
            </div>
          ) : (
            <div 
              className="h-full news-scrollbar pr-2"
              style={{
                maxHeight: '400px',
                overflowY: 'scroll'
              }}
            >
              <div className="space-y-2">
                {macroData.latest.map((event, index) => (
                  <div 
                    key={index}
                    onClick={() => openEventDetail(event)}
                    className="bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition h-20 overflow-hidden cursor-pointer"
                  >
                    <div className="flex justify-between items-start h-full">
                      {/* Left side: Event content */}
                      <div className="flex-1 min-w-0 pr-3">
                        {/* Event Name with 2 lines max */}
                        <h4 className="text-sm font-medium text-white line-clamp-2 leading-tight mb-1">
                          {getCategoryIcon(event.category)} {event.eventName}
                        </h4>
                        
                        {/* Bottom info in one line */}
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono">{formatValue(event.actual, event.category)}</span>
                            <span className={`px-1 py-0.5 rounded text-xs ${getSentimentColor(event.sentiment)} bg-zinc-700`}>
                              {event.sentiment}
                            </span>
                          </div>
                          <span className="text-xs">
                            {new Date(event.releaseDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Right side: Impact and confidence */}
                      <div className="flex flex-col items-end justify-center space-y-1 flex-shrink-0">
                        <span className={`text-lg ${getImpactColor(event.impactOnGold)}`}>
                          {getImpactIcon(event.impactOnGold)}
                        </span>
                        <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded text-zinc-300">
                          {event.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {showModal && selectedEvent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-zinc-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-700">
              <div className="flex items-center space-x-3">
                <span className={`text-2xl ${getImpactColor(selectedEvent.impactOnGold)}`}>
                  {getImpactIcon(selectedEvent.impactOnGold)}
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-white">Chi tiết sự kiện kinh tế</h2>
                  <p className="text-sm text-zinc-400">{selectedEvent.source}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-zinc-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Event Name */}
              <h1 className="text-2xl font-bold text-white mb-4 leading-tight">
                {getCategoryIcon(selectedEvent.category)} {selectedEvent.eventName}
              </h1>

              {/* Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-800 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">📊 Dữ liệu kinh tế</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Giá trị thực tế:</span>
                      <span className="text-white font-mono">
                        {formatValue(selectedEvent.actual, selectedEvent.category)}
                      </span>
                    </div>
                    {selectedEvent.forecast && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Dự báo:</span>
                        <span className="text-zinc-300 font-mono">
                          {formatValue(selectedEvent.forecast, selectedEvent.category)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Kỳ trước:</span>
                      <span className="text-zinc-300 font-mono">
                        {formatValue(selectedEvent.previous, selectedEvent.category)}
                      </span>
                    </div>
                    {selectedEvent.change !== null && selectedEvent.change !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Thay đổi:</span>
                        <span className={`font-mono ${
                          selectedEvent.change >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {formatChange(selectedEvent.actual, selectedEvent.previous)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-800 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">🧠 Phân tích AI</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Sentiment:</span>
                      <span className={`font-medium ${getSentimentColor(selectedEvent.sentiment)}`}>
                        {getSentimentText(selectedEvent.sentiment)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Tác động vàng:</span>
                      <span className={`font-medium ${getImpactColor(selectedEvent.impactOnGold)}`}>
                        {selectedEvent.impactOnGold === 'positive' ? 'Tích cực' :
                         selectedEvent.impactOnGold === 'negative' ? 'Tiêu cực' : 'Trung tính'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Độ tin cậy:</span>
                      <span className="font-medium text-blue-400">{selectedEvent.confidence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Danh mục:</span>
                      <span className="text-white capitalize">{selectedEvent.category.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Ngày:</span>
                      <span className="text-white">
                        {new Date(selectedEvent.releaseDate).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-zinc-800 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">📝 Tóm tắt phân tích</h3>
                <p className="text-white text-sm leading-relaxed">
                  {selectedEvent.summary}
                </p>
              </div>

              {/* Source & Category Info */}
              <div className="bg-zinc-800 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">ℹ️ Thông tin nguồn</h3>
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-zinc-400">Nguồn: </span>
                    <span className="text-white">{selectedEvent.source}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Mức độ quan trọng: </span>
                    <span className={`capitalize ${
                      selectedEvent.importance === 'high' ? 'text-red-400' :
                      selectedEvent.importance === 'medium' ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {selectedEvent.importance}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MacroDashboard;