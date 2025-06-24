const cron = require('node-cron');
const SignalService = require('../services/signalService');

// Initialize service
const signalService = new SignalService();

/**
 * Cron job để sinh tín hiệu giao dịch tổng hợp
 * Chạy mỗi 1 giờ
 */
const startSignalGenerationCron = () => {
  console.log('🎯 Starting Signal Generation Cron Job...');
  
  // ✅ ADD: Test cron pattern more frequently for debugging
  // Thay đổi từ '5 * * * *' thành '*/2 * * * *' (mỗi 2 phút) để test
  cron.schedule('*/2 * * * *', async () => {
    console.log('\n⏰ [CRON] Signal Generation Job Started:', new Date().toISOString());
    console.log('🕐 Current time:', new Date());
    
    try {
      // ✅ ADD: More detailed logging
      console.log('🔄 Checking dependencies...');
      
      const result = await signalService.generateSignal();
      
      if (result.success) {
        console.log(`✅ [CRON] Signal generated: ${result.signal.action} (${result.signal.confidence}%)`);
        
        // ✅ SAVE TO DATABASE
        const Signal = require('../models/Signal');
        const savedSignal = await Signal.create(result.signal);
        console.log(`💾 Signal saved with ID: ${savedSignal._id}`);
        
      } else {
        console.error(`❌ [CRON] Signal generation failed: ${result.error}`);
        
        // ✅ MORE DETAILED ERROR LOGGING
        console.error('🚨 DEPENDENCY CHECK:');
        
        // Check technical data
        const TechnicalSnapshot = require('../models/TechnicalSnapshot');
        const latestTech = await TechnicalSnapshot.findOne().sort({ timestamp: -1 });
        console.error(`- Technical: ${latestTech ? '✓' : '✗'} (${latestTech ? latestTech.timestamp : 'none'})`);
        
        // Check news data
        const News = require('../models/News');
        const latestNews = await News.findOne({ isProcessed: true }).sort({ publishedAt: -1 });
        console.error(`- News: ${latestNews ? '✓' : '✗'} (${latestNews ? latestNews.publishedAt : 'none'})`);
        
        // Check macro data
        const EconomicFactor = require('../models/EconomicFactor');
        const latestMacro = await EconomicFactor.findOne().sort({ releaseDate: -1 });
        console.error(`- Macro: ${latestMacro ? '✓' : '✗'} (${latestMacro ? latestMacro.releaseDate : 'none'})`);
      }
      
    } catch (error) {
      console.error('❌ [CRON] Signal Generation Error:', error.message);
      console.error('🔍 Error stack:', error.stack);
    }
    
    console.log('⏰ [CRON] Signal Generation Job Finished\n');
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('✅ Signal Generation Cron Job scheduled successfully');
  console.log('📅 Schedule: Every 2 minutes (for debugging)');
};

// Manual trigger function for testing
const triggerSignalGeneration = async () => {
  console.log('🔄 Manual signal generation triggered...');
  
  try {
    const result = await signalService.generateSignal();
    console.log('Manual signal trigger result:', result);
    return result;
  } catch (error) {
    console.error('Manual signal trigger error:', error.message);
    throw error;
  }
};

module.exports = {
  startSignalGenerationCron,
  triggerSignalGeneration
};