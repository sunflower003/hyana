const app = require('./app');
const connectDB = require('./utils/database');
const { startTechnicalCron, runImmediateUpdate } = require('./cron/updateTechnical'); // ✅ Fixed function name

const PORT = process.env.PORT || 5000;

// Kết nối Database trước khi start server
const startServer = async () => {
  try {
    // Kết nối MongoDB
    await connectDB();
    
    // Start cron jobs (moved to app.js but keep this for immediate update)
    console.log('\n🕒 Starting cron jobs...');
    startTechnicalCron(); // ✅ Fixed function name
    
    // Chạy một lần ngay khi start server để có dữ liệu
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n🚀 Running initial technical analysis...');
      setTimeout(async () => {
        try {
          await runImmediateUpdate();
        } catch (error) {
          console.error('❌ Initial technical analysis failed:', error.message);
        }
      }, 5000); // Delay 5s để server ổn định
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth endpoints:`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
      console.log(`📊 Technical endpoints:`);
      console.log(`   GET  http://localhost:${PORT}/api/technical/latest`);
      console.log(`   GET  http://localhost:${PORT}/api/technical/recent`);
      console.log(`   GET  http://localhost:${PORT}/api/technical/stats`);
      console.log(`   POST http://localhost:${PORT}/api/technical/update`);
      console.log(`📰 News endpoints:`); // ✅ Add news endpoints
      console.log(`   GET  http://localhost:${PORT}/api/news/latest`);
      console.log(`   GET  http://localhost:${PORT}/api/news/sentiment`);
      console.log(`   POST http://localhost:${PORT}/api/news/update`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();