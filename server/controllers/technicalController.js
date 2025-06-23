const TechnicalService = require('../services/technicalService');
const TechnicalSnapshot = require('../models/TechnicalSnapshot');

/**
 * Technical Analysis Controller
 * Xử lý các API endpoints cho phân tích kỹ thuật
 */

// Lấy snapshot kỹ thuật mới nhất
const getLatestSnapshot = async (req, res) => {
  try {
    console.log('📊 API: Getting latest technical snapshot...');
    
    const snapshot = await TechnicalSnapshot.getLatest();
    
    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dữ liệu phân tích kỹ thuật'
      });
    }

    // Tạo analysis cho frontend
    const technicalService = new TechnicalService();
    const analysis = technicalService.generateTrendAnalysis(snapshot);

    res.status(200).json({
      success: true,
      data: {
        snapshot,
        analysis,
        lastUpdated: snapshot.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Get Latest Snapshot Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu phân tích kỹ thuật'
    });
  }
};

// Lấy nhiều snapshots gần nhất (cho chart)
const getRecentSnapshots = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    console.log(`📊 API: Getting ${limit} recent snapshots...`);
    
    const snapshots = await TechnicalSnapshot.getLastNCandles(limit);

    res.status(200).json({
      success: true,
      data: {
        snapshots,
        count: snapshots.length
      }
    });

  } catch (error) {
    console.error('❌ Get Recent Snapshots Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử dữ liệu kỹ thuật'
    });
  }
};

// Trigger manual update (for testing)
const triggerUpdate = async (req, res) => {
  try {
    console.log('🔄 API: Manual technical analysis trigger...');
    
    const technicalService = new TechnicalService();
    const result = await technicalService.updateTechnicalAnalysis();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Cập nhật phân tích kỹ thuật thành công',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Cập nhật phân tích kỹ thuật thất bại',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Trigger Update Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thực hiện cập nhật'
    });
  }
};

// Lấy thống kê tổng quan
const getTechnicalStats = async (req, res) => {
  try {
    console.log('📊 API: Getting technical statistics...');
    
    // Lấy snapshot mới nhất
    const latestSnapshot = await TechnicalSnapshot.getLatest();
    
    if (!latestSnapshot) {
      return res.status(404).json({
        success: false,
        message: 'Không có dữ liệu phân tích'
      });
    }

    // Lấy 24 snapshots gần nhất (24 x 4H = 4 ngày)
    const recentSnapshots = await TechnicalSnapshot.getLastNCandles(24);
    
    // Tính toán thống kê
    const prices = recentSnapshots.map(s => s.price.close);
    const rsiValues = recentSnapshots.map(s => s.indicators.RSI);
    
    const stats = {
      current: {
        price: latestSnapshot.price.close,
        trend: latestSnapshot.indicators.trend,
        rsi: latestSnapshot.indicators.RSI,
        strength: latestSnapshot.strength
      },
      last24h: {
        priceChange: prices.length >= 6 ? 
          ((prices[prices.length - 1] - prices[prices.length - 6]) / prices[prices.length - 6] * 100) : 0,
        avgRSI: rsiValues.reduce((sum, rsi) => sum + rsi, 0) / rsiValues.length,
        volatility: latestSnapshot.volatility
      },
      summary: {
        totalSnapshots: recentSnapshots.length,
        uptrendCount: recentSnapshots.filter(s => s.indicators.trend === 'uptrend').length,
        downtrendCount: recentSnapshots.filter(s => s.indicators.trend === 'downtrend').length,
        lastUpdated: latestSnapshot.createdAt
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Get Technical Stats Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê kỹ thuật'
    });
  }
};

module.exports = {
  getLatestSnapshot,
  getRecentSnapshots,
  triggerUpdate,
  getTechnicalStats
};