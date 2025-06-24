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
  
  // Schedule: Chạy mỗi giờ vào phút thứ 5
  cron.schedule('5 * * * *', async () => {
    console.log('\n⏰ [CRON] Signal Generation Job Started:', new Date().toISOString());
    
    try {
      const result = await signalService.generateSignal();
      
      if (result.success) {
        console.log(`✅ [CRON] Signal generated: ${result.signal.action} (${result.signal.confidence}%)`);
        console.log(`📊 Scores - Technical: ${result.breakdown.technical.score}, News: ${result.breakdown.news.score}, Macro: ${result.breakdown.macro.score}`);
      } else {
        console.log(`❌ [CRON] Signal generation failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ [CRON] Signal Generation Error:', error.message);
    }
    
    console.log('⏰ [CRON] Signal Generation Job Finished\n');
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  // Also run on startup for immediate signal
  setTimeout(async () => {
    console.log('\n🚀 [STARTUP] Generating initial signal...');
    try {
      const result = await signalService.generateSignal();
      if (result.success) {
        console.log(`✅ [STARTUP] Initial signal: ${result.signal.action} (${result.signal.confidence}%)`);
      }
    } catch (error) {
      console.error('❌ [STARTUP] Initial signal failed:', error.message);
    }
  }, 10000); // Wait 10 seconds after startup

  console.log('✅ Signal Generation Cron Job scheduled successfully');
  console.log('📅 Schedule: Every hour at 5 minutes past');
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