const Signal = require('../models/Signal');
const SignalService = require('../services/signalService');

/**
 * Signal Controller
 * Xử lý các API endpoints cho tín hiệu giao dịch
 */

// Lấy tín hiệu mới nhất
const getLatestSignal = async (req, res) => {
  try {
    console.log('🎯 API: Getting latest trading signal...');
    
    const signal = await Signal.findOne()
      .sort({ createdAt: -1 })
      .limit(1);

    if (!signal) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tín hiệu giao dịch'
      });
    }

    // Check if signal is recent (within 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const isRecent = signal.createdAt >= sixHoursAgo;

    res.status(200).json({
      success: true,
      data: {
        signal,
        isRecent,
        age: Math.round((Date.now() - signal.createdAt.getTime()) / (1000 * 60 * 60)) // hours
      }
    });

  } catch (error) {
    console.error('❌ Get Latest Signal Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tín hiệu giao dịch'
    });
  }
};

// Lấy lịch sử tín hiệu
const getSignalHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const action = req.query.action; // 'BUY', 'SELL', 'HOLD'
    
    console.log(`🎯 API: Getting signal history (limit: ${limit}, action: ${action || 'all'})...`);
    
    let query = {};
    if (action && ['BUY', 'SELL', 'HOLD'].includes(action.toUpperCase())) {
      query.action = action.toUpperCase();
    }
    
    const signals = await Signal.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('action confidence entryZone stopLoss takeProfit summary technicalScore newsScore macroScore overallScore createdAt');

    res.status(200).json({
      success: true,
      data: {
        signals,
        count: signals.length,
        filter: action || 'all'
      }
    });

  } catch (error) {
    console.error('❌ Get Signal History Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử tín hiệu'
    });
  }
};

// Lấy thống kê tín hiệu
const getSignalStats = async (req, res) => {
  try {
    console.log('📊 API: Getting signal statistics...');
    
    // Get overall stats
    const totalSignals = await Signal.countDocuments();
    
    // Get stats by action
    const actionStats = await Signal.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          avgTechnicalScore: { $avg: '$technicalScore' },
          avgNewsScore: { $avg: '$newsScore' },
          avgMacroScore: { $avg: '$macroScore' }
        }
      }
    ]);

    // Get recent performance (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignals = await Signal.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    // Calculate confidence distribution
    const confidenceRanges = {
      high: 0,    // 75-100%
      medium: 0,  // 50-74%
      low: 0      // 0-49%
    };

    recentSignals.forEach(signal => {
      if (signal.confidence >= 75) confidenceRanges.high++;
      else if (signal.confidence >= 50) confidenceRanges.medium++;
      else confidenceRanges.low++;
    });

    const stats = {
      total: totalSignals,
      last30Days: recentSignals.length,
      actionBreakdown: actionStats,
      confidenceDistribution: confidenceRanges,
      averageScores: {
        technical: Math.round(recentSignals.reduce((sum, s) => sum + s.technicalScore, 0) / recentSignals.length) || 0,
        news: Math.round(recentSignals.reduce((sum, s) => sum + s.newsScore, 0) / recentSignals.length) || 0,
        macro: Math.round(recentSignals.reduce((sum, s) => sum + s.macroScore, 0) / recentSignals.length) || 0
      },
      lastUpdated: recentSignals[0]?.createdAt || null
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Get Signal Stats Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê tín hiệu'
    });
  }
};

// Trigger manual update (for testing)
const triggerSignalUpdate = async (req, res) => {
  try {
    console.log('🔄 API: Manual signal generation trigger...');
    
    const signalService = new SignalService();
    const result = await signalService.generateSignal();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Sinh tín hiệu thành công',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Sinh tín hiệu thất bại',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Trigger Signal Update Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thực hiện sinh tín hiệu'
    });
  }
};

// Thêm method này vào signalController

const forceSignalGeneration = async (req, res) => {
  try {
    console.log('🔄 MANUAL: Force signal generation triggered by admin');
    
    const signalService = new SignalService();
    const result = await signalService.generateSignal();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Tín hiệu được sinh thành công',
        data: {
          signal: result.signal,
          breakdown: result.breakdown,
          timestamp: new Date()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Không thể sinh tín hiệu',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Force Signal Generation Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi sinh tín hiệu',
      error: error.message
    });
  }
};

// Export thêm function này
module.exports = {
  getLatestSignal,
  getSignalHistory,
  getSignalStats,
  triggerSignalUpdate,
  forceSignalGeneration // ✅ NEW
};