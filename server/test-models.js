const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Signal = require('./models/Signal');
const News = require('./models/News');
const TechnicalSnapshot = require('./models/TechnicalSnapshot');
const EconomicFactor = require('./models/EconomicFactor');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test functions
const testSignalModel = async () => {
  console.log('\n🔄 Testing Signal Model...');
  
  try {
    const signal = new Signal({
      action: 'BUY',
      confidence: 85,
      entryZone: [2325.0, 2328.0],
      stopLoss: 2308.0,
      takeProfit: 2365.0,
      reasoning: [
        'MACD bullish crossover',
        'RSI 63.5 (chưa quá mua)',
        'Volume tăng mạnh'
      ],
      summary: 'Kỹ thuật ủng hộ xu hướng tăng giá vàng',
      technicalScore: 75,
      newsScore: 80,
      macroScore: 90,
      priceAtSignal: 2326.5
    });
    
    await signal.save();
    console.log('✅ Signal model test passed');
    console.log('📊 Risk/Reward Ratio:', signal.riskRewardRatio);
    
  } catch (error) {
    console.error('❌ Signal model test failed:', error.message);
  }
};

const testNewsModel = async () => {
  console.log('\n🔄 Testing News Model...');
  
  try {
    const news = new News({
      title: 'Fed Signals Pause in Rate Hikes',
      source: 'Reuters',
      publishedAt: new Date(),
      content: 'Fed Chairman Powell announced potential pause in rate hiking cycle...',
      aiSentiment: 'dovish_usd',
      impactOnGold: 'positive',
      confidence: 88,
      summary: 'Fed ngưng tăng lãi suất → USD yếu → GOLD tăng',
      category: 'fed_policy',
      keywords: ['Fed', 'Powell', 'rate hikes', 'pause'],
      isProcessed: true
    });
    
    await news.save();
    console.log('✅ News model test passed');
    
  } catch (error) {
    console.error('❌ News model test failed:', error.message);
  }
};

const testTechnicalModel = async () => {
  console.log('\n🔄 Testing TechnicalSnapshot Model...');
  
  try {
    const technical = new TechnicalSnapshot({
      timestamp: new Date(),
      price: {
        open: 2320.5,
        high: 2335.0,
        low: 2315.0,
        close: 2330.2
      },
      indicators: {
        RSI: 63.5,
        MACD: {
          macd: 0.012,
          signal: 0.005,
          histogram: 0.007,
          trend: 'bullish_cross'
        },
        EMA_20: 2324.1,
        EMA_50: 2318.0,
        VolumeRatio: 1.32,
        trend: 'uptrend'
      },
      supportResistance: {
        support: [2310, 2295],
        resistance: [2345, 2365]
      },
      volatility: 1.2,
      strength: 75
    });
    
    await technical.save();
    console.log('✅ TechnicalSnapshot model test passed');
    console.log('📈 Price Change:', technical.priceChange);
    console.log('📊 Price Change %:', technical.priceChangePercent + '%');
    
  } catch (error) {
    console.error('❌ TechnicalSnapshot model test failed:', error.message);
  }
};

const testEconomicModel = async () => {
  console.log('\n🔄 Testing EconomicFactor Model...');
  
  try {
    const economic = new EconomicFactor({
      eventName: 'US CPI (YoY)',
      releaseDate: new Date(),
      actual: 2.8,
      forecast: 3.1,
      previous: 3.3,
      sentiment: 'dovish_usd',
      impactOnGold: 'positive',
      note: 'Lạm phát thấp hơn dự báo → kỳ vọng Fed nới lỏng → GOLD tăng',
      category: 'inflation',
      importance: 'high'
    });
    
    await economic.save();
    console.log('✅ EconomicFactor model test passed');
    console.log('📊 Deviation:', economic.deviation);
    console.log('📈 Deviation %:', economic.deviationPercent.toFixed(2) + '%');
    
  } catch (error) {
    console.error('❌ EconomicFactor model test failed:', error.message);
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting Models Testing...');
  console.log('=' .repeat(50));
  
  await connectDB();
  
  await testSignalModel();
  await testNewsModel();
  await testTechnicalModel();
  await testEconomicModel();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ All model tests completed!');
  
  // Cleanup - xóa test data
  try {
    await Signal.deleteMany({});
    await News.deleteMany({});
    await TechnicalSnapshot.deleteMany({});
    await EconomicFactor.deleteMany({});
    console.log('🧹 Test data cleaned up');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
  
  process.exit(0);
};

runAllTests().catch(console.error);