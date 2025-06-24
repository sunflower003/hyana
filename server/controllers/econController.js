const EconomicFactor = require('../models/EconomicFactor');
const MacroService = require('../services/macroService');

/**
 * Economic Controller
 * Xử lý các API endpoints cho dữ liệu kinh tế vĩ mô
 */

// Lấy dữ liệu kinh tế mới nhất
const getLatestEconomicData = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const impact = req.query.impact; // 'positive', 'negative', 'neutral'
    
    console.log(`📊 API: Getting latest economic data (limit: ${limit}, category: ${category || 'all'}, impact: ${impact || 'all'})...`);
    
    let query = { isProcessed: true };
    
    if (category && ['fed_policy', 'inflation', 'employment', 'economic_growth', 'consumer_data', 'currency', 'treasury', 'other'].includes(category)) {
      query.category = category;
    }
    
    if (impact && ['positive', 'negative', 'neutral'].includes(impact)) {
      query.impactOnGold = impact;
    }
    
    const economicData = await EconomicFactor.find(query)
      .sort({ releaseDate: -1, confidence: -1 })
      .limit(limit)
      .select('eventName releaseDate actual forecast previous sentiment impactOnGold confidence summary category importance source');

    res.status(200).json({
      success: true,
      data: {
        economicData,
        count: economicData.length,
        filters: { category: category || 'all', impact: impact || 'all' }
      }
    });

  } catch (error) {
    console.error('❌ Get Latest Economic Data Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu kinh tế'
    });
  }
};

// Lấy tóm tắt macro sentiment
const getMacroSummary = async (req, res) => {
  try {
    console.log('📊 API: Getting macro sentiment summary...');
    
    const macroService = new MacroService();
    const summary = await macroService.getLatestMacroSummary();
    
    if (summary) {
      res.status(200).json({
        success: true,
        data: summary
      });
    } else {
      res.status(200).json({
        success: true,
        data: {
          summary: {
            total: 0,
            positive: 0,
            negative: 0,
            neutral: 0,
            sentiment: 'no_data'
          },
          recent: [],
          lastUpdated: new Date()
        }
      });
    }

  } catch (error) {
    console.error('❌ Get Macro Summary Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tổng quan macro'
    });
  }
};

// Lấy dữ liệu theo category
const getEconomicDataByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`📊 API: Getting economic data by category: ${category}`);
    
    const validCategories = ['fed_policy', 'inflation', 'employment', 'economic_growth', 'consumer_data', 'currency', 'treasury', 'other'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category: ${category}. Valid categories: ${validCategories.join(', ')}`
      });
    }

    const economicData = await EconomicFactor.find({ 
      category: category,
      isProcessed: true 
    })
      .sort({ releaseDate: -1 })
      .limit(limit)
      .select('eventName releaseDate actual forecast previous sentiment impactOnGold confidence summary importance');

    res.status(200).json({
      success: true,
      data: {
        economicData,
        category,
        count: economicData.length
      }
    });

  } catch (error) {
    console.error('❌ Get Economic Data by Category Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu kinh tế theo danh mục'
    });
  }
};

// Lấy DXY data hiện tại
const getCurrentDXY = async (req, res) => {
  try {
    console.log('📊 API: Getting current DXY data...');
    
    const dxyData = await EconomicFactor.findOne({
      eventName: 'US Dollar Index (DXY)'
    })
    .sort({ releaseDate: -1 })
    .select('actual previous change changePercent sentiment impactOnGold confidence summary releaseDate');

    if (dxyData) {
      res.status(200).json({
        success: true,
        data: dxyData
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy dữ liệu DXY'
      });
    }

  } catch (error) {
    console.error('❌ Get Current DXY Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu DXY'
    });
  }
};

// Trigger manual update (for testing)
const triggerMacroUpdate = async (req, res) => {
  try {
    console.log('🔄 API: Manual macro update trigger...');
    
    const macroService = new MacroService();
    const result = await macroService.updateMacroAnalysis();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Cập nhật dữ liệu kinh tế thành công',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Cập nhật dữ liệu kinh tế thất bại',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Trigger Macro Update Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thực hiện cập nhật dữ liệu kinh tế'
    });
  }
};

// Lấy một event cụ thể
const getEconomicEventById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📊 API: Getting economic event by ID: ${id}`);
    
    const economicEvent = await EconomicFactor.findById(id);
    
    if (!economicEvent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện kinh tế'
      });
    }

    res.status(200).json({
      success: true,
      data: economicEvent
    });

  } catch (error) {
    console.error('❌ Get Economic Event by ID Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin sự kiện kinh tế'
    });
  }
};

module.exports = {
  getLatestEconomicData,
  getMacroSummary,
  getEconomicDataByCategory,
  getCurrentDXY,
  triggerMacroUpdate,
  getEconomicEventById
};