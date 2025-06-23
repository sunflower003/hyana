const mongoose = require('mongoose');
const TechnicalService = require('./services/technicalService');
require('dotenv').config();

// Test chiến lược theo techincal.txt
const testTechnicalStrategy = async () => {
  try {
    console.log('🧪 Testing Technical Strategy from techincal.txt...');
    console.log('=' .repeat(60));

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test technical service với chiến lược mới
    const technicalService = new TechnicalService();
    
    console.log('\n1️⃣ Testing swing trading analysis...');
    const result = await technicalService.updateTechnicalAnalysis();
    
    if (result.success) {
      console.log('✅ Swing trading analysis successful');
      
      // Hiển thị phân tích chi tiết
      const analysis = result.analysis;
      console.log('\n📊 DETAILED ANALYSIS:');
      console.log('─' .repeat(40));
      console.log(`Trend: ${analysis.trend.toUpperCase()}`);
      console.log(`Strength: ${analysis.strength}/100`);
      console.log(`Recommendation: ${analysis.recommendation}`);
      console.log(`Confidence: ${analysis.confidence}%`);
      
      if (analysis.entry) {
        console.log(`Entry Zone: $${analysis.entry[0]} - $${analysis.entry[1]}`);
      }
      if (analysis.stopLoss) {
        console.log(`Stop Loss: $${analysis.stopLoss}`);
      }
      if (analysis.takeProfit) {
        console.log(`Take Profit: $${analysis.takeProfit}`);
      }
      
      console.log('\n🔍 REASONING:');
      analysis.reasoning.forEach((reason, index) => {
        console.log(`${index + 1}. ${reason}`);
      });
      
      console.log('\n📈 SIGNALS:');
      analysis.signals.forEach((signal, index) => {
        console.log(`• ${signal}`);
      });

      // Hiển thị thông tin indicators
      const snapshot = result.snapshot;
      console.log('\n📋 INDICATORS:');
      console.log('─' .repeat(40));
      console.log(`Price: $${snapshot.price.close}`);
      console.log(`RSI: ${snapshot.indicators.RSI}`);
      console.log(`MACD: ${snapshot.indicators.MACD.macd} (${snapshot.indicators.MACD.trend})`);
      console.log(`EMA 20: $${snapshot.indicators.EMA_20}`);
      console.log(`EMA 50: $${snapshot.indicators.EMA_50}`);
      console.log(`Volume Ratio: ${snapshot.indicators.VolumeRatio}x`);
      console.log(`Volatility: ${snapshot.volatility}`);
      
      // Test detailed analysis
      if (analysis.detailed) {
        console.log('\n🔬 DETAILED ANALYSIS:');
        console.log('─' .repeat(40));
        
        if (analysis.detailed.rsi) {
          console.log(`RSI Analysis: ${analysis.detailed.rsi.description}`);
        }
        
        if (analysis.detailed.macd) {
          console.log(`MACD Analysis: ${analysis.detailed.macd.description}`);
        }
        
        if (analysis.detailed.trend) {
          console.log(`Trend Analysis: ${analysis.detailed.trend.description}`);
        }
        
        if (analysis.detailed.volume) {
          console.log(`Volume Analysis: ${analysis.detailed.volume.description}`);
        }
      }
      
    } else {
      console.error('❌ Technical analysis failed:', result.error);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Technical strategy test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
};

testTechnicalStrategy().catch(console.error);