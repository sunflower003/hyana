const cron = require('node-cron');
const MacroService = require('../services/macroService');

// Initialize service
const macroService = new MacroService();

/**
 * Cron job để cập nhật dữ liệu kinh tế vĩ mô
 * Chạy mỗi 12 giờ
 */
const startMacroUpdateCron = () => {
  console.log('📊 Starting Macro Economic Update Cron Job...');
  
  // Schedule: Chạy mỗi 12 giờ vào lúc 6:00 AM và 6:00 PM
  cron.schedule('0 6,18 * * *', async () => {
    console.log('\n⏰ [CRON] Macro Update Job Started:', new Date().toISOString());
    
    try {
      const result = await macroService.updateMacroAnalysis();
      
      if (result.success) {
        console.log(`✅ [CRON] Macro update completed: ${result.processed} indicators processed`);
      } else {
        console.log(`❌ [CRON] Macro update failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ [CRON] Macro Update Error:', error.message);
    }
    
    console.log('⏰ [CRON] Macro Update Job Finished\n');
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  // Also run every 6 hours for DXY updates (more frequent)
  cron.schedule('0 */6 * * *', async () => {
    console.log('\n⏰ [CRON] DXY Update Job Started:', new Date().toISOString());
    
    try {
      // Only update DXY for more frequent monitoring
      const dxyData = await macroService.fetchDXYData();
      if (dxyData) {
        await macroService.processDXYData(dxyData);
        console.log('✅ [CRON] DXY update completed');
      }
      
    } catch (error) {
      console.error('❌ [CRON] DXY Update Error:', error.message);
    }
    
    console.log('⏰ [CRON] DXY Update Job Finished\n');
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  console.log('✅ Macro Economic Cron Jobs scheduled successfully');
  console.log('📅 Full macro update: Every 12 hours (6:00 AM & 6:00 PM UTC)');
  console.log('📅 DXY update: Every 6 hours');
};

// Manual trigger function for testing
const triggerMacroUpdate = async () => {
  console.log('🔄 Manual macro update triggered...');
  
  try {
    const result = await macroService.updateMacroAnalysis();
    console.log('Manual trigger result:', result);
    return result;
  } catch (error) {
    console.error('Manual trigger error:', error.message);
    throw error;
  }
};

module.exports = {
  startMacroUpdateCron,
  triggerMacroUpdate
};