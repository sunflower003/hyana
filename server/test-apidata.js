const mongoose = require('mongoose');
const SentimentService = require('./services/sentimentService');
const News = require('./models/News');
require('dotenv').config();

/**
 * Complete test suite for Sentiment Service
 */

const testSentimentService = async () => {
  try {
    console.log('🧪 TESTING SENTIMENT SERVICE - COMPLETE SUITE');
    console.log('=' .repeat(80));

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const sentimentService = new SentimentService();
    
    console.log('\n1️⃣ TESTING API KEYS...');
    console.log('─'.repeat(50));
    console.log(`NewsAPI Key: ${process.env.NEWS_API_KEY ? '✅ Available' : '❌ Missing'}`);
    console.log(`GNews Key: ${process.env.GNEWS_API_KEY ? '✅ Available' : '❌ Missing'}`);
    console.log(`HuggingFace Key: ${process.env.HUGGINGFACE_API_KEY ? '✅ Available' : '❌ Missing'}`);

    console.log('\n2️⃣ TESTING HUGGINGFACE MODELS...');
    console.log('─'.repeat(50));
    
    const testTexts = [
      "Fed signals potential pause in rate hikes as inflation cools",
      "Gold prices surge amid geopolitical tensions and dollar weakness",
      "Strong jobs report boosts dollar, pressures gold prices",
      "Central bank maintains dovish stance, supports precious metals",
      "War escalates, investors flee to safe haven assets"
    ];

    let modelTestResults = [];

    for (const [index, text] of testTexts.entries()) {
      console.log(`\n📰 Test ${index + 1}: ${text.substring(0, 60)}...`);
      
      try {
        const sentiment = await sentimentService.analyzeSentiment(text);
        const goldImpact = sentimentService.mapSentimentToGoldImpact(sentiment, text);
        
        console.log(`🤖 Sentiment: ${sentiment.label} (${sentiment.confidence}%) [${sentiment.model}]`);
        console.log(`📊 Gold Impact: ${goldImpact.impact} (${goldImpact.sentiment})`);
        
        modelTestResults.push({
          text: text.substring(0, 40) + '...',
          sentiment: sentiment.label,
          confidence: sentiment.confidence,
          model: sentiment.model,
          goldImpact: goldImpact.impact
        });
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        modelTestResults.push({
          text: text.substring(0, 40) + '...',
          error: error.message
        });
      }
      
      // Delay để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n3️⃣ TESTING NEWS FETCHING...');
    console.log('─'.repeat(50));
    
    try {
      const articles = await sentimentService.fetchLatestNews();
      console.log(`📰 Found ${articles.length} gold-related articles`);
      
      if (articles.length > 0) {
        console.log('\n📋 Sample articles:');
        articles.slice(0, 3).forEach((article, i) => {
          console.log(`   ${i + 1}. ${article.title.substring(0, 50)}... [${article.source}]`);
        });
      }
      
    } catch (error) {
      console.log(`❌ News fetching failed: ${error.message}`);
    }

    console.log('\n4️⃣ TESTING FULL NEWS ANALYSIS...');
    console.log('─'.repeat(50));
    
    try {
      const result = await sentimentService.updateNewsAnalysis();
      
      if (result.success) {
        console.log(`✅ News analysis successful`);
        console.log(`📊 Processed: ${result.processed} articles`);
        console.log(`💾 Saved: ${result.saved} new articles`);
        console.log(`📝 Message: ${result.message}`);
      } else {
        console.log(`❌ News analysis failed: ${result.error || result.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Full analysis error: ${error.message}`);
    }

    console.log('\n5️⃣ TESTING DATABASE OPERATIONS...');
    console.log('─'.repeat(50));
    
    try {
      // Get latest news from database
      const latestNews = await News.find({ isProcessed: true })
        .sort({ publishedAt: -1 })
        .limit(5)
        .select('title source aiSentiment impactOnGold confidence publishedAt');
      
      console.log(`📊 Found ${latestNews.length} processed news in database:`);
      
      latestNews.forEach((news, i) => {
        console.log(`   ${i + 1}. [${news.impactOnGold.toUpperCase()}] ${news.title.substring(0, 40)}...`);
        console.log(`      Source: ${news.source} | Sentiment: ${news.aiSentiment} | Confidence: ${news.confidence}%`);
      });

      // Sentiment statistics
      const sentimentStats = await News.aggregate([
        { $match: { isProcessed: true } },
        { 
          $group: {
            _id: '$impactOnGold',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$confidence' }
          }
        }
      ]);

      console.log('\n📈 Sentiment Statistics:');
      sentimentStats.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count} articles (avg confidence: ${stat.avgConfidence.toFixed(1)}%)`);
      });

    } catch (error) {
      console.log(`❌ Database operations failed: ${error.message}`);
    }

    console.log('\n6️⃣ TESTING CATEGORIZATION & KEYWORDS...');
    console.log('─'.repeat(50));
    
    const testCategorizationTexts = [
      "Federal Reserve Chairman Powell signals potential rate cuts",
      "Consumer Price Index rises 3.2% year-over-year",
      "Geopolitical tensions escalate in Middle East",
      "Non-farm payrolls exceed expectations",
      "Gold market sentiment turns bullish"
    ];

    testCategorizationTexts.forEach((text, i) => {
      // ✅ FIXED: Use correct method name
      const category = sentimentService.categorizeNewsEnhanced(text); // ✅ Fixed method name
      const keywords = sentimentService.extractKeywords(text);
      
      console.log(`   ${i + 1}. Text: ${text.substring(0, 40)}...`);
      console.log(`      Category: ${category}`);
      console.log(`      Keywords: [${keywords.join(', ')}]`);
    });

    console.log('\n7️⃣ PERFORMANCE SUMMARY...');
    console.log('─'.repeat(50));
    
    const successfulModels = modelTestResults.filter(r => !r.error);
    const failedModels = modelTestResults.filter(r => r.error);
    
    console.log(`✅ Successful sentiment analyses: ${successfulModels.length}/${modelTestResults.length}`);
    console.log(`❌ Failed sentiment analyses: ${failedModels.length}/${modelTestResults.length}`);
    
    if (successfulModels.length > 0) {
      const modelUsage = {};
      successfulModels.forEach(result => {
        modelUsage[result.model] = (modelUsage[result.model] || 0) + 1;
      });
      
      console.log('\n📊 Model Usage:');
      Object.entries(modelUsage).forEach(([model, count]) => {
        console.log(`   ${model}: ${count} times`);
      });

      const avgConfidence = successfulModels.reduce((sum, r) => sum + r.confidence, 0) / successfulModels.length;
      console.log(`📈 Average Confidence: ${avgConfidence.toFixed(1)}%`);
    }

    console.log('\n🎯 RECOMMENDATIONS...');
    console.log('─'.repeat(50));
    
    if (successfulModels.length === 0) {
      console.log('⚠️  All HuggingFace models failed - relying on fallback analysis');
      console.log('💡 Consider checking HuggingFace API key or model availability');
    } else if (successfulModels.length < modelTestResults.length) {
      console.log('⚠️  Some sentiment analyses failed - backup models are working');
      console.log('💡 Primary model may have issues, backup is functioning');
    } else {
      console.log('✅ All sentiment analyses successful - system is working optimally');
    }

    console.log('\n✅ SENTIMENT SERVICE TEST COMPLETED');
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ MAJOR TEST ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the test
testSentimentService();