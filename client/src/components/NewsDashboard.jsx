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

  useEffect(() => {
    fetchNewsData();
    fetchSentimentSummary();
  }, [selectedCategory]);

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

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'fed_policy', label: 'Fed Policy' },
    { value: 'inflation', label: 'Lạm phát' },
    { value: 'employment', label: 'Việc làm' },
    { value: 'geopolitical', label: 'Địa chính trị' },
    { value: 'commodities', label: 'Hàng hóa' }
  ];

  // ✅ FIXED: Check for development mode using Vite environment
  const isDevelopment = import.meta.env.MODE === 'development';

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
    <div className="bg-zinc-900 p-6 rounded-xl">
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
        <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
          <h4 className="text-sm font-medium text-zinc-300 mb-3">📊 Sentiment 24h</h4>
          
          {/* ✅ FIXED: Use Vite environment check */}
          {isDevelopment && newsData.sentiment.debug && (
            <div className="mb-2 text-xs text-zinc-500 font-mono bg-zinc-900 p-2 rounded">
              <div className="text-yellow-400 mb-1">🐛 Debug Info:</div>
              <pre>{JSON.stringify(newsData.sentiment.debug, null, 2)}</pre>
            </div>
          )}
          
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

          {/* ✅ Show overall stats if no 24h data */}
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
      <div className="mb-4">
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

      {/* News List */}
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
        <div className="space-y-3">
          {newsData.latest.map((news, index) => (
            <div key={index} className="bg-zinc-800 p-4 rounded-lg hover:bg-zinc-750 transition">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium text-white line-clamp-2 flex-1">
                  {news.title}
                </h4>
                <div className="flex items-center ml-3 space-x-2">
                  <span className={`text-lg ${getImpactColor(news.impactOnGold)}`}>
                    {getImpactIcon(news.impactOnGold)}
                  </span>
                  <span className="text-xs bg-zinc-700 px-2 py-1 rounded text-zinc-300">
                    {news.confidence}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>{news.source}</span>
                <span>{new Date(news.publishedAt).toLocaleDateString('vi-VN')}</span>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded ${getSentimentColor(news.aiSentiment)} bg-zinc-700`}>
                  {news.aiSentiment}
                </span>
                
                {news.keywords && news.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {news.keywords.slice(0, 3).map((keyword, i) => (
                      <span key={i} className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {news.summary && (
                <div className="mt-2 text-xs text-zinc-300 italic">
                  {news.summary}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsDashboard;