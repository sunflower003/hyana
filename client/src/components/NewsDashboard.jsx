import { useState, useEffect } from 'react';
import React from 'react';
import api from '../api/axios';

const NewsDashboard = () => {
  const [newsData, setNewsData] = useState({
    latest: [],
    sentiment: null,
    loading: true,
    error: null
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  // ✅ NEW: State for modal
  const [selectedNews, setSelectedNews] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchNewsData();
    fetchSentimentSummary();
  }, [selectedCategory]);

  // ✅ NEW: Function to open news detail modal
  const openNewsDetail = (news) => {
    setSelectedNews(news);
    setShowModal(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  // ✅ NEW: Function to close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedNews(null);
    // Restore body scroll
    document.body.style.overflow = 'unset';
  };

  // ✅ NEW: Handle escape key to close modal
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

  const fetchNewsData = async () => {
    try {
      setNewsData(prev => ({ ...prev, loading: true }));
      
      const endpoint = selectedCategory === 'all' 
        ? '/api/news/latest?limit=10'
        : `/api/news/category/${selectedCategory}?limit=10`;
      
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        setNewsData(prev => ({
          ...prev,
          latest: response.data.data.news,
          loading: false,
          error: null
        }));
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setNewsData(prev => ({
        ...prev,
        loading: false,
        error: 'Không thể tải tin tức'
      }));
    }
  };

  const fetchSentimentSummary = async () => {
    try {
      const response = await api.get('/api/news/sentiment');
      
      console.log('📊 Sentiment API Response:', response.data);
      
      if (response.data.success) {
        console.log('📊 Sentiment Data:', response.data.data);
        setNewsData(prev => ({
          ...prev,
          sentiment: response.data.data
        }));
      } else {
        console.error('❌ Sentiment API failed:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching sentiment:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  const handleManualUpdate = async () => {
    try {
      await api.post('/api/news/update');
      setTimeout(() => {
        fetchNewsData();
        fetchSentimentSummary();
      }, 2000);
    } catch (error) {
      console.error('Error triggering news update:', error);
    }
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
      default: return 'text-yellow-500';
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'dovish_usd':
      case 'risk_off':
      case 'bullish_gold':
        return 'text-green-400';
      case 'hawkish_usd':
      case 'risk_on':
      case 'bearish_gold':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getSentimentText = (sentiment) => {
    switch (sentiment) {
      case 'dovish_usd': return 'Fed nới lỏng';
      case 'hawkish_usd': return 'Fed thắt chặt';
      case 'risk_off': return 'Tránh rủi ro';
      case 'risk_on': return 'Thích rủi ro';
      case 'bullish_gold': return 'Tăng giá vàng';
      case 'bearish_gold': return 'Giảm giá vàng';
      default: return 'Trung tính';
    }
  };

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'fed_policy', label: 'Fed Policy' },
    { value: 'inflation', label: 'Lạm phát' },
    { value: 'employment', label: 'Việc làm' },
    { value: 'geopolitical', label: 'Địa chính trị' },
    { value: 'commodities', label: 'Hàng hóa' }
  ];

  if (newsData.loading) {
    return (
      <div className="bg-zinc-900 p-6 rounded-xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-zinc-400">Đang tải tin tức...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-zinc-900 p-6 rounded-xl flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-blue-500">📰 Phân tích tin tức AI</h3>
          <button 
            onClick={fetchNewsData}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Sentiment Summary */}
        {newsData.sentiment && (
          <div className="mb-6 p-4 bg-zinc-800 rounded-lg flex-shrink-0">
            <h4 className="text-sm font-medium text-zinc-300 mb-3">📊 Sentiment 24h</h4>
            
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white">
                  {newsData.sentiment.last24Hours?.total || 0}
                </div>
                <div className="text-xs text-zinc-400">Tổng tin</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-500">
                  {newsData.sentiment.last24Hours?.positive || 0}
                </div>
                <div className="text-xs text-zinc-400">Tích cực</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-500">
                  {newsData.sentiment.last24Hours?.negative || 0}
                </div>
                <div className="text-xs text-zinc-400">Tiêu cực</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-500">
                  {newsData.sentiment.last24Hours?.neutral || 0}
                </div>
                <div className="text-xs text-zinc-400">Trung tính</div>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <span className="text-sm text-zinc-400">Xu hướng: </span>
              <span className={`font-medium ${
                newsData.sentiment.last24Hours?.sentiment === 'bullish' ? 'text-green-500' :
                newsData.sentiment.last24Hours?.sentiment === 'bearish' ? 'text-red-500' : 'text-yellow-500'
              }`}>
                {newsData.sentiment.last24Hours?.sentiment === 'bullish' ? '🐂 Tăng giá' :
                 newsData.sentiment.last24Hours?.sentiment === 'bearish' ? '🐻 Giảm giá' : 
                 newsData.sentiment.last24Hours?.sentiment === 'no_data' ? '📊 Chưa có dữ liệu 24h' : '⚖️ Trung tính'}
              </span>
            </div>

            {/* Show overall stats if no 24h data */}
            {newsData.sentiment.last24Hours?.total === 0 && newsData.sentiment.overall && (
              <div className="mt-4 p-3 bg-zinc-700 rounded">
                <div className="text-xs text-zinc-400 mb-2">📈 Thống kê tổng thể:</div>
                <div className="flex justify-around text-xs">
                  {newsData.sentiment.overall.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="font-bold">{stat.count}</div>
                      <div className="text-zinc-500 capitalize">{stat._id}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1 text-xs rounded-full transition ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* News List with Click Handler */}
        <div className="flex-1 overflow-hidden">
          {newsData.error ? (
            <div className="text-center text-red-400 py-4">
              {newsData.error}
            </div>
          ) : newsData.latest.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              <p>📰 Chưa có tin tức nào</p>
              <button 
                onClick={handleManualUpdate}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Cập nhật tin tức
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
                {newsData.latest.map((news, index) => (
                  // ✅ NEW: Add click handler and cursor pointer
                  <div 
                    key={index} 
                    className="bg-zinc-800 p-3 rounded-lg hover:bg-zinc-700 transition h-20 overflow-hidden cursor-pointer"
                    onClick={() => openNewsDetail(news)}
                  >
                    <div className="flex justify-between items-start h-full">
                      {/* Left side: News content */}
                      <div className="flex-1 min-w-0 pr-3">
                        {/* Title with 2 lines max */}
                        <h4 className="text-sm font-medium text-white line-clamp-2 leading-tight mb-1">
                          {news.title}
                        </h4>
                        
                        {/* Bottom info in one line */}
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <div className="flex items-center space-x-2">
                            <span className="truncate max-w-20">{news.source}</span>
                            <span className={`px-1 py-0.5 rounded text-xs ${getSentimentColor(news.aiSentiment)} bg-zinc-700`}>
                              {news.aiSentiment}
                            </span>
                          </div>
                          <span className="text-xs">
                            {new Date(news.publishedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Right side: Impact and confidence */}
                      <div className="flex flex-col items-end justify-center space-y-1 flex-shrink-0">
                        <span className={`text-lg ${getImpactColor(news.impactOnGold)}`}>
                          {getImpactIcon(news.impactOnGold)}
                        </span>
                        <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded text-zinc-300">
                          {news.confidence}%
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

      {/* ✅ NEW: News Detail Modal */}
      {showModal && selectedNews && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-zinc-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-700">
              <div className="flex items-center space-x-3">
                <span className={`text-2xl ${getImpactColor(selectedNews.impactOnGold)}`}>
                  {getImpactIcon(selectedNews.impactOnGold)}
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-white">Chi tiết tin tức</h2>
                  <p className="text-sm text-zinc-400">{selectedNews.source}</p>
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
              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-4 leading-tight">
                {selectedNews.title}
              </h1>

              {/* Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-800 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">📊 Phân tích AI</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Sentiment:</span>
                      <span className={`font-medium ${getSentimentColor(selectedNews.aiSentiment)}`}>
                        {getSentimentText(selectedNews.aiSentiment)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Tác động vàng:</span>
                      <span className={`font-medium ${getImpactColor(selectedNews.impactOnGold)}`}>
                        {selectedNews.impactOnGold === 'positive' ? 'Tích cực' :
                         selectedNews.impactOnGold === 'negative' ? 'Tiêu cực' : 'Trung tính'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Độ tin cậy:</span>
                      <span className="font-medium text-blue-400">{selectedNews.confidence}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">ℹ️ Thông tin</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Nguồn:</span>
                      <span className="text-white">{selectedNews.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Danh mục:</span>
                      <span className="text-blue-400 capitalize">{selectedNews.category?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Ngày:</span>
                      <span className="text-white">
                        {new Date(selectedNews.publishedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              {selectedNews.summary && (
                <div className="bg-zinc-800 p-4 rounded-lg mb-6">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">🤖 Tóm tắt AI</h3>
                  <p className="text-white text-sm leading-relaxed">
                    {selectedNews.summary}
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="bg-zinc-800 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">📄 Nội dung</h3>
                <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedNews.content || 'Nội dung không có sẵn.'}
                </div>
              </div>

              {/* Keywords */}
              {selectedNews.keywords && selectedNews.keywords.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">🏷️ Từ khóa</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNews.keywords.map((keyword, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* External Link */}
              {selectedNews.url && (
                <div className="border-t border-zinc-700 pt-4">
                  <a
                    href={selectedNews.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>🔗</span>
                    <span>Đọc bài gốc</span>
                    <span>↗</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsDashboard;