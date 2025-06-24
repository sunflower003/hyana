const app = require('./app');
const connectDB = require('./utils/database');
const { startTechnicalCron, runImmediateUpdate } = require('./cron/updateTechnical');
const { startNewsUpdateCron } = require('./cron/updateNews');
const { startMacroUpdateCron } = require('./cron/updateMacro');
const { startSignalGenerationCron } = require('./cron/updateSignal');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    // ✅ SIMPLIFIED: Test API connection
    const { TwelveDataClient } = require('./utils/apiClients');
    const client = new TwelveDataClient();
    
    try {
      const testPrice = await client.getCurrentPrice('XAU/USD');
      console.log(`💰 XAU/USD: $${testPrice.price.toFixed(2)}`);
    } catch (error) {
      console.error(`❌ API connection failed: ${error.message}`);
      process.exit(1);
    }
    
    // ✅ SIMPLIFIED: Start cron jobs
    startTechnicalCron();
    startNewsUpdateCron();
    startMacroUpdateCron();
    startSignalGenerationCron();
    console.log('✅ Cron jobs started');
    
    // ✅ SIMPLIFIED: Initial update
    if (process.env.NODE_ENV !== 'production') {
      setTimeout(async () => {
        try {
          await runImmediateUpdate();
          console.log('✅ Initial data loaded');
        } catch (error) {
          console.error('❌ Initial update failed:', error.message);
        }
      }, 5000);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 HYANA Server running on port ${PORT}`);
      console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();