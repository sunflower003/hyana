const News = require('../models/News');
const SentimentService = require('../services/sentimentService');

/**
 * News Controller
 * Xử lý các API endpoints cho tin tức và sentiment analysis
 */

// Lấy danh sách tin tức mới nhất
const getLatestNews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const impact = req.query.impact; // 'positive', 'negative', 'neutral'
    
    console.log(`📰 API: Getting latest news (limit: ${limit}, impact: ${impact || 'all'})...`);
    
    let query = { isProcessed: true };
    
    if (impact && ['positive', 'negative', 'neutral'].includes(impact)) {
      query.impactOnGold = impact;
    }
    
    const news = await News.find(query)
      .sort({ publishedAt: -1, confidence: -1 })
      .limit(limit)
      .select('title source publishedAt aiSentiment impactOnGold confidence summary category keywords url');

    res.status(200).json({
      success: true,
      data: {
        news,
        count: news.length,
        filter: impact || 'all'
      }
    });

  } catch (error) {
    console.error('❌ Get Latest News Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tin tức'
    });
  }
};

// Lấy tin tức theo category
const getNewsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`📰 API: Getting news by category: ${category}`);
    
    // ✅ FIXED: Include all categories that frontend uses
    const validCategories = [
      'fed_policy', 
      'inflation', 
      'employment', 
      'economic_growth', 
      'consumer_data', 
      'geopolitical', 
      'central_bank', 
      'market_sentiment', 
      'currency', 
      'commodities', // ✅ Add commodities
      'other'
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category: ${category}. Valid categories: ${validCategories.join(', ')}`
      });
    }

    const news = await News.find({ 
      category: category,
      isProcessed: true 
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('title source publishedAt aiSentiment impactOnGold confidence summary keywords url');

    res.status(200).json({
      success: true,
      data: {
        news,
        category,
        count: news.length
      }
    });

  } catch (error) {
    console.error('❌ Get News by Category Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tin tức theo danh mục'
    });
  }
};

// Lấy sentiment summary
const getSentimentSummary = async (req, res) => {
  try {
    console.log('📊 API: Getting sentiment summary...');
    
    // Get news from last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const sentimentStats24h = await News.aggregate([
      {
        $match: {
          isProcessed: true,
          publishedAt: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: '$impactOnGold',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          articles: {
            $push: {
              title: '$title',
              source: '$source',
              publishedAt: '$publishedAt',
              confidence: '$confidence'
            }
          }
        }
      }
    ]);

    // ✅ IMPROVED: Also get overall stats regardless of date
    const overallStats = await News.aggregate([
      {
        $match: { isProcessed: true }
      },
      {
        $group: {
          _id: '$impactOnGold',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          latestDate: { $max: '$publishedAt' }
        }
      }
    ]);

    // Initialize counters for 24h
    let totalPositive24h = 0;
    let totalNegative24h = 0;
    let totalNeutral24h = 0;
    
    // Map 24h results
    sentimentStats24h.forEach(stat => {
      switch (stat._id) {
        case 'positive':
          totalPositive24h = stat.count;
          break;
        case 'negative':
          totalNegative24h = stat.count;
          break;
        case 'neutral':
          totalNeutral24h = stat.count;
          break;
        default:
          console.log(`Unknown sentiment in 24h: ${stat._id}`);
      }
    });

    const total24h = totalPositive24h + totalNegative24h + totalNeutral24h;
    
    // ✅ IMPROVED: Initialize counters for overall
    let totalPositiveOverall = 0;
    let totalNegativeOverall = 0;
    let totalNeutralOverall = 0;
    
    // Map overall results
    overallStats.forEach(stat => {
      switch (stat._id) {
        case 'positive':
          totalPositiveOverall = stat.count;
          break;
        case 'negative':
          totalNegativeOverall = stat.count;
          break;
        case 'neutral':
          totalNeutralOverall = stat.count;
          break;
        default:
          console.log(`Unknown sentiment overall: ${stat._id}`);
      }
    });

    const totalOverall = totalPositiveOverall + totalNegativeOverall + totalNeutralOverall;
    
    console.log(`📊 24h Stats - Total: ${total24h}, Positive: ${totalPositive24h}, Negative: ${totalNegative24h}, Neutral: ${totalNeutral24h}`);
    console.log(`📊 Overall Stats - Total: ${totalOverall}, Positive: ${totalPositiveOverall}, Negative: ${totalNegativeOverall}, Neutral: ${totalNeutralOverall}`);
    
    // ✅ ENHANCED: Use 24h if available, otherwise use recent data
    const displayData = total24h > 0 ? {
      total: total24h,
      positive: totalPositive24h,
      negative: totalNegative24h,
      neutral: totalNeutral24h,
      sentiment: total24h > 0 ? (totalPositive24h > totalNegative24h ? 'bullish' : 
                                 totalNegative24h > totalPositive24h ? 'bearish' : 'neutral') : 'no_data',
      period: '24h'
    } : {
      total: totalOverall,
      positive: totalPositiveOverall,
      negative: totalNegativeOverall,
      neutral: totalNeutralOverall,
      sentiment: totalOverall > 0 ? (totalPositiveOverall > totalNegativeOverall ? 'bullish' : 
                                     totalNegativeOverall > totalPositiveOverall ? 'bearish' : 'neutral') : 'no_data',
      period: 'overall'
    };

    const summary = {
      last24Hours: displayData,
      overall: overallStats,
      details: sentimentStats24h,
      lastUpdated: new Date(),
      debug: {
        totalArticles24h: total24h,
        totalArticlesOverall: totalOverall,
        hasData24h: total24h > 0,
        hasDataOverall: totalOverall > 0,
        usingData: displayData.period,
        aggregationResults24h: sentimentStats24h,
        aggregationResultsOverall: overallStats
      }
    };

    console.log('📊 Sentiment Summary Response:', JSON.stringify(summary, null, 2));

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('❌ Get Sentiment Summary Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tổng quan sentiment'
    });
  }
};

// Trigger manual update (for testing)
const triggerNewsUpdate = async (req, res) => {
  try {
    console.log('🔄 API: Manual news sentiment analysis trigger...');
    
    const sentimentService = new SentimentService();
    const result = await sentimentService.updateNewsAnalysis();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Cập nhật phân tích tin tức thành công',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Cập nhật phân tích tin tức thất bại',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Trigger News Update Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thực hiện cập nhật tin tức'
    });
  }
};

// Lấy một bài tin cụ thể
const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📰 API: Getting news by ID: ${id}`);
    
    const news = await News.findById(id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tin'
      });
    }

    res.status(200).json({
      success: true,
      data: news
    });

  } catch (error) {
    console.error('❌ Get News by ID Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin bài tin'
    });
  }
};

module.exports = {
  getLatestNews,
  getNewsByCategory,
  getSentimentSummary,
  triggerNewsUpdate,
  getNewsById
};