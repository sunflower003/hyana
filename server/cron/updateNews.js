const cron = require('node-cron');
const SentimentService = require('../services/sentimentService');

/**
 * Cron job cập nhật tin tức và phân tích sentiment
 * Chạy mỗi 2 giờ
 */

let isNewsUpdateRunning = false;

// Cron job: mỗi 2 giờ (0 */2 * * *)
const startNewsUpdateCron = () => {
  console.log('🕒 Setting up news sentiment analysis cron job (every 2 hours)...');
  
  // Run every 2 hours at minute 0
  cron.schedule('0 */2 * * *', async () => {
    if (isNewsUpdateRunning) {
      console.log('⚠️ News update already running, skipping...');
      return;
    }

    try {
      isNewsUpdateRunning = true;
      console.log('\n⏰ CRON: Starting scheduled news sentiment analysis...');
      
      const sentimentService = new SentimentService();
      const result = await sentimentService.updateNewsAnalysis();
      
      if (result.success) {
        console.log(`✅ CRON: News analysis completed successfully`);
        console.log(`📊 Result: ${result.message}`);
      } else {
        console.log(`❌ CRON: News analysis failed: ${result.error || result.message}`);
      }
      
    } catch (error) {
      console.error('❌ CRON News Error:', error.message);
    } finally {
      isNewsUpdateRunning = false;
    }
  });

  console.log('✅ News sentiment analysis cron job started');
};

// Function để chạy manual (for testing)
const runNewsUpdateNow = async () => {
  if (isNewsUpdateRunning) {
    console.log('⚠️ News update already running...');
    return;
  }

  try {
    isNewsUpdateRunning = true;
    console.log('🚀 Running manual news sentiment analysis...');
    
    const sentimentService = new SentimentService();
    const result = await sentimentService.updateNewsAnalysis();
    
    return result;
    
  } catch (error) {
    console.error('❌ Manual News Update Error:', error.message);
    return { success: false, error: error.message };
  } finally {
    isNewsUpdateRunning = false;
  }
};

module.exports = {
  startNewsUpdateCron,
  runNewsUpdateNow
};