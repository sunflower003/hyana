const cron = require('node-cron');
const TechnicalService = require('../services/technicalService');

/**
 * Cron job để cập nhật phân tích kỹ thuật định kỳ
 * Theo thututrienkhai.txt: chạy mỗi 30 phút
 */

let isRunning = false;

// Hàm thực hiện update
const runTechnicalUpdate = async () => {
  if (isRunning) {
    console.log('⚠️ Technical update is already running, skipping...');
    return;
  }

  try {
    isRunning = true;
    console.log('\n⏰ CRON: Starting scheduled technical analysis...');
    
    const technicalService = new TechnicalService();
    const result = await technicalService.updateTechnicalAnalysis();
    
    if (result.success) {
      console.log('✅ CRON: Technical analysis completed successfully');
      console.log(`📊 Recommendation: ${result.analysis?.recommendation || 'N/A'}`);
    } else {
      console.error('❌ CRON: Technical analysis failed:', result.error);
    }

  } catch (error) {
    console.error('❌ CRON: Technical update error:', error.message);
  } finally {
    isRunning = false;
  }
};

// Cron job: chạy mỗi 30 phút vào phút 0 và 30
const startTechnicalCron = () => {
  console.log('🕒 Setting up technical analysis cron job (every 30 minutes)...');
  
  // Cron pattern: "0,30 * * * *" = phút 0 và 30 của mỗi giờ
  const cronJob = cron.schedule('0,30 * * * *', async () => {
    await runTechnicalUpdate();
  }, {
    scheduled: false, // Don't start immediately
    timezone: 'UTC'
  });

  // Start the cron job
  cronJob.start();
  console.log('✅ Technical analysis cron job started');

  return cronJob;
};

// Test function để chạy ngay lập tức
const runImmediateUpdate = async () => {
  console.log('🚀 Running immediate technical update...');
  await runTechnicalUpdate();
};

module.exports = {
  startTechnicalCron,
  runImmediateUpdate,
  runTechnicalUpdate
};