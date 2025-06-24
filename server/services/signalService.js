const TechnicalSnapshot = require('../models/TechnicalSnapshot');
const News = require('../models/News');
const EconomicFactor = require('../models/EconomicFactor');
const Signal = require('../models/Signal');

/**
 * Service tổng hợp tín hiệu giao dịch từ 3 nguồn:
 * 1. Technical Analysis (RSI, MACD, EMA...)
 * 2. News Sentiment (AI analysis)
 * 3. Macro Economic (FRED data)
 */
class SignalService {
  constructor() {
    this.weights = {
      technical: 0.4,    // 40% trọng số
      news: 0.35,        // 35% trọng số
      macro: 0.25        // 25% trọng số
    };
  }

  /**
   * Main function: Sinh tín hiệu giao dịch tổng hợp
   */
  async generateSignal() {
    try {
      console.log('🎯 Generating signal...');
      
      // ✅ ADD: More detailed error handling
      let technicalData, newsData, macroData;
      
      try {
        technicalData = await this.getLatestTechnicalData();
        console.log(`📊 Technical data: ${technicalData ? '✓' : '✗'}`);
      } catch (error) {
        console.error('❌ Technical data error:', error.message);
        technicalData = null;
      }
      
      try {
        newsData = await this.getLatestNewsData();
        console.log(`📰 News data: ${newsData.length} articles`);
      } catch (error) {
        console.error('❌ News data error:', error.message);
        newsData = [];
      }
      
      try {
        macroData = await this.getLatestMacroData();
        console.log(`📈 Macro data: ${macroData.length} factors`);
      } catch (error) {
        console.error('❌ Macro data error:', error.message);
        macroData = [];
      }
      
      if (!technicalData) {
        return { success: false, error: 'No technical data available' };
      }
      
      // Continue với phần generate signal...
      const technicalAnalysis = this.analyzeTechnical(technicalData);
      const newsAnalysis = this.analyzeNews(newsData);
      const macroAnalysis = this.analyzeMacro(macroData);
      
      console.log('📊 Technical Score:', technicalAnalysis.score);
      console.log('📰 News Score:', newsAnalysis.score);
      console.log('📈 Macro Score:', macroAnalysis.score);

      // 3. Tổng hợp điểm số
      const overallScore = this.calculateOverallScore(
        technicalAnalysis, 
        newsAnalysis, 
        macroAnalysis
      );

      // 4. Sinh tín hiệu cuối cùng
      const finalSignal = await this.generateFinalSignal(
        overallScore,
        technicalData,
        technicalAnalysis,
        newsAnalysis,
        macroAnalysis
      );

      // ✅ SAVE TO DATABASE HERE
      const Signal = require('../models/Signal');
      const savedSignal = await Signal.create(finalSignal);
      
      console.log(`✅ Signal saved: ${finalSignal.action} (${finalSignal.confidence}%)`);

      return {
        success: true,
        signal: savedSignal,
        breakdown: {
          technical: technicalAnalysis,
          news: newsAnalysis,
          macro: macroAnalysis
        },
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Signal generation failed:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Lấy dữ liệu kỹ thuật mới nhất
   */
  async getLatestTechnicalData() {
    try {
      const snapshot = await TechnicalSnapshot.findOne()
        .sort({ timestamp: -1 })
        .limit(1);
      
      if (!snapshot) {
        console.log('⚠️ No technical snapshot found');
        return null;
      }

      // Check if data is recent (within 6 hours)
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      if (snapshot.timestamp < sixHoursAgo) {
        console.log('⚠️ Technical data is stale (>6h old)');
      }

      return snapshot;
    } catch (error) {
      console.error('❌ Get Technical Data Error:', error.message);
      return null;
    }
  }

  /**
   * Lấy dữ liệu tin tức 24h gần nhất
   */
  async getLatestNewsData() {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const news = await News.find({
        publishedAt: { $gte: last24Hours },
        isProcessed: true
      })
      .sort({ publishedAt: -1, confidence: -1 })
      .limit(10)
      .select('aiSentiment impactOnGold confidence category');

      console.log(`📰 Found ${news.length} news articles in last 24h`);
      return news;
    } catch (error) {
      console.error('❌ Get News Data Error:', error.message);
      return [];
    }
  }

  /**
   * Lấy dữ liệu kinh tế vĩ mô 7 ngày gần nhất
   */
  async getLatestMacroData() {
    try {
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const factors = await EconomicFactor.find({
        releaseDate: { $gte: last7Days },
        source: 'FRED'
      })
      .sort({ releaseDate: -1, importance: -1 })
      .limit(5)
      .select('sentiment impactOnGold confidence importance category');

      console.log(`📈 Found ${factors.length} economic factors in last 7 days`);
      return factors;
    } catch (error) {
      console.error('❌ Get Macro Data Error:', error.message);
      return [];
    }
  }

  /**
   * Phân tích kỹ thuật
   */
  analyzeTechnical(snapshot) {
    const { indicators, strength } = snapshot;
    const { RSI, MACD, trend } = indicators;
    
    let score = 50; // Base neutral score
    let reasoning = [];
    let signals = [];

    // RSI Analysis (điều chỉnh ngưỡng cho H4)
    if (RSI > 65) {
      score -= 15;
      reasoning.push('RSI quá mua (>65)');
      signals.push('⚠️ RSI overbought');
    } else if (RSI < 35) {
      score += 15;
      reasoning.push('RSI quá bán (<35)');
      signals.push('📈 RSI oversold - cơ hội mua');
    } else if (RSI > 55) {
      score += 10;
      reasoning.push('RSI bullish momentum');
      signals.push('💪 RSI trending up');
    } else if (RSI < 45) {
      score -= 10;
      reasoning.push('RSI bearish momentum');
      signals.push('📉 RSI trending down');
    }

    // MACD Analysis
    if (MACD.trend === 'bullish_cross') {
      score += 20;
      reasoning.push('MACD bullish crossover');
      signals.push('🚀 MACD golden cross');
    } else if (MACD.trend === 'bearish_cross') {
      score -= 20;
      reasoning.push('MACD bearish crossover');
      signals.push('💀 MACD death cross');
    } else if (MACD.trend === 'bullish') {
      score += 10;
      reasoning.push('MACD above signal line');
      signals.push('📈 MACD bullish');
    } else if (MACD.trend === 'bearish') {
      score -= 10;
      reasoning.push('MACD below signal line');
      signals.push('📉 MACD bearish');
    }

    // Trend Analysis
    if (trend === 'uptrend') {
      score += 15;
      reasoning.push('Price in uptrend');
      signals.push('⬆️ Uptrend confirmed');
    } else if (trend === 'downtrend') {
      score -= 15;
      reasoning.push('Price in downtrend');
      signals.push('⬇️ Downtrend confirmed');
    }

    // Market Strength
    if (strength >= 70) {
      score += 10;
      reasoning.push(`Strong momentum (${strength})`);
    } else if (strength <= 30) {
      score -= 10;
      reasoning.push(`Weak momentum (${strength})`);
    }

    // Normalize score to 0-100
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      reasoning,
      signals,
      details: {
        RSI,
        MACD: MACD.trend,
        trend,
        strength
      }
    };
  }

  /**
   * Phân tích tin tức
   */
  analyzeNews(newsArray) {
    if (!newsArray || newsArray.length === 0) {
      return {
        score: 50, // Neutral if no news
        reasoning: ['No recent news available'],
        signals: ['📰 No news impact'],
        details: { count: 0 }
      };
    }

    let totalScore = 0;
    let weightedSum = 0;
    let reasoning = [];
    let signals = [];
    
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    newsArray.forEach(news => {
      const weight = news.confidence / 100;
      let newsScore = 50; // Base neutral

      switch (news.impactOnGold) {
        case 'positive':
          newsScore = 70 + (news.confidence - 60) * 0.5; // 70-85 range
          positiveCount++;
          break;
        case 'negative':
          newsScore = 30 - (news.confidence - 60) * 0.5; // 15-30 range
          negativeCount++;
          break;
        default:
          newsScore = 50;
          neutralCount++;
      }

      totalScore += newsScore * weight;
      weightedSum += weight;
    });

    const finalScore = weightedSum > 0 ? totalScore / weightedSum : 50;

    // Generate reasoning
    if (positiveCount > negativeCount) {
      reasoning.push(`${positiveCount} positive vs ${negativeCount} negative news`);
      signals.push('📈 News sentiment bullish for gold');
    } else if (negativeCount > positiveCount) {
      reasoning.push(`${negativeCount} negative vs ${positiveCount} positive news`);
      signals.push('📉 News sentiment bearish for gold');
    } else {
      reasoning.push('Mixed news sentiment');
      signals.push('⚖️ Neutral news sentiment');
    }

    return {
      score: Math.round(finalScore),
      reasoning,
      signals,
      details: {
        count: newsArray.length,
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount
      }
    };
  }

  /**
   * Phân tích kinh tế vĩ mô
   */
  analyzeMacro(factorsArray) {
    if (!factorsArray || factorsArray.length === 0) {
      return {
        score: 50, // Neutral if no macro data
        reasoning: ['No recent economic data'],
        signals: ['📊 No macro impact'],
        details: { count: 0 }
      };
    }

    let totalScore = 0;
    let weightedSum = 0;
    let reasoning = [];
    let signals = [];
    
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    factorsArray.forEach(factor => {
      // Weight by importance and confidence
      const importanceWeight = factor.importance === 'high' ? 1.0 : 
                              factor.importance === 'medium' ? 0.7 : 0.4;
      const confidenceWeight = factor.confidence / 100;
      const weight = importanceWeight * confidenceWeight;

      let factorScore = 50; // Base neutral

      switch (factor.impactOnGold) {
        case 'positive':
          factorScore = 65 + (factor.confidence - 50) * 0.3;
          positiveCount++;
          break;
        case 'negative':
          factorScore = 35 - (factor.confidence - 50) * 0.3;
          negativeCount++;
          break;
        default:
          factorScore = 50;
          neutralCount++;
      }

      totalScore += factorScore * weight;
      weightedSum += weight;
    });

    const finalScore = weightedSum > 0 ? totalScore / weightedSum : 50;

    // Generate reasoning
    if (positiveCount > negativeCount) {
      reasoning.push(`${positiveCount} positive vs ${negativeCount} negative economic factors`);
      signals.push('📊 Macro environment bullish for gold');
    } else if (negativeCount > positiveCount) {
      reasoning.push(`${negativeCount} negative vs ${positiveCount} positive economic factors`);
      signals.push('📊 Macro environment bearish for gold');
    } else {
      reasoning.push('Mixed macro environment');
      signals.push('⚖️ Neutral macro environment');
    }

    return {
      score: Math.round(finalScore),
      reasoning,
      signals,
      details: {
        count: factorsArray.length,
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount
      }
    };
  }

  /**
   * Tính điểm tổng hợp
   */
  calculateOverallScore(technical, news, macro) {
    const weightedScore = 
      (technical.score * this.weights.technical) +
      (news.score * this.weights.news) + 
      (macro.score * this.weights.macro);

    return {
      overall: Math.round(weightedScore),
      breakdown: {
        technical: Math.round(technical.score * this.weights.technical),
        news: Math.round(news.score * this.weights.news),
        macro: Math.round(macro.score * this.weights.macro)
      },
      weights: this.weights
    };
  }

  /**
   * Sinh tín hiệu cuối cùng với phân tích chi tiết
   */
  async generateFinalSignal(overallScore, technicalData, technical, news, macro) {
    const currentPrice = technicalData.price.close;
    const score = overallScore.overall;
    
    let action = 'HOLD';
    let confidence = 50;
    let entryZone = [];
    let stopLoss = null;
    let takeProfit = null;
    
    // Determine action based on score
    if (score >= 65) {
      action = 'BUY';
      confidence = Math.min(85, score);
      
      // Calculate entry zone (current price ± 0.3%)
      const entryLow = currentPrice * 0.997;
      const entryHigh = currentPrice * 1.003;
      entryZone = [Math.round(entryLow * 100) / 100, Math.round(entryHigh * 100) / 100];
      
      // Calculate SL and TP for BUY
      stopLoss = Math.round(currentPrice * 0.985 * 100) / 100; // -1.5%
      takeProfit = Math.round(currentPrice * 1.025 * 100) / 100; // +2.5%
      
    } else if (score <= 35) {
      action = 'SELL';
      confidence = Math.min(85, 100 - score);
      
      // Calculate entry zone
      const entryLow = currentPrice * 0.997;
      const entryHigh = currentPrice * 1.003;
      entryZone = [Math.round(entryLow * 100) / 100, Math.round(entryHigh * 100) / 100];
      
      // Calculate SL and TP for SELL
      stopLoss = Math.round(currentPrice * 1.015 * 100) / 100; // +1.5%
      takeProfit = Math.round(currentPrice * 0.975 * 100) / 100; // -2.5%
      
    } else {
      action = 'HOLD';
      confidence = 100 - Math.abs(score - 50) * 2; // Closer to 50 = higher confidence in HOLD
    }

    // Combine all reasoning
    const allReasoning = [
      ...technical.reasoning,
      ...news.reasoning,
      ...macro.reasoning
    ];

    // ✅ NEW: Generate detailed analysis instead of simple summary
    const detailedAnalysis = this.generateDetailedAnalysis(action, technical, news, macro, confidence, technicalData);

    return {
      timeframe: '4H',
      action,
      confidence: Math.round(confidence),
      entryZone,
      stopLoss,
      takeProfit,
      priceAtSignal: currentPrice,
      reasoning: allReasoning,
      
      // ✅ NEW: Replace summary with detailed analysis
      summary: detailedAnalysis.fullAnalysis,
      detailedAnalysis: detailedAnalysis, // Keep structured version for potential future use
      
      // Detailed scores for transparency
      technicalScore: technical.score,
      newsScore: news.score,
      macroScore: macro.score,
      overallScore: score,
      
      // Risk metrics
      riskRewardRatio: action !== 'HOLD' ? 
        Math.round((Math.abs(takeProfit - currentPrice) / Math.abs(stopLoss - currentPrice)) * 100) / 100 : null,
      
      // Additional signals
      signals: [
        ...technical.signals,
        ...news.signals,
        ...macro.signals
      ]
    };
  }

  /**
   * Tạo phân tích chi tiết từ 3 nguồn thay vì tóm tắt ngắn
   */
  generateDetailedAnalysis(action, technical, news, macro, confidence, technicalData) {
    const currentPrice = technicalData.price.close;
    
    // 📊 Technical Analysis Section
    const technicalSection = this.generateTechnicalSection(technical, technicalData);
    
    // 📰 News Analysis Section  
    const newsSection = this.generateNewsSection(news);
    
    // 📈 Macro Analysis Section
    const macroSection = this.generateMacroSection(macro);
    
    // 🎯 Final Recommendation Section
    const recommendationSection = this.generateRecommendationSection(action, confidence, currentPrice, technical, news, macro);
    
    // Combine all sections
    return {
      technical: technicalSection,
      news: newsSection,
      macro: macroSection,
      recommendation: recommendationSection,
      fullAnalysis: `${technicalSection}\n\n${newsSection}\n\n${macroSection}\n\n${recommendationSection}`
    };
  }

  /**
   * 📊 Generate Technical Analysis Section
   */
  generateTechnicalSection(technical, technicalData) {
    const { RSI, MACD, trend, strength } = technical.details;
    const { price } = technicalData;
    
    let analysis = "📊 **PHÂN TÍCH KỸ THUẬT:**\n";
    
    // Price Action
    analysis += `• Giá hiện tại: $${price.close.toFixed(2)} (H: $${price.high.toFixed(2)} | L: $${price.low.toFixed(2)})\n`;
    
    // RSI Analysis
    if (RSI > 65) {
      analysis += `• RSI ${RSI}: VÙng quá mua - áp lực bán có thể xuất hiện\n`;
    } else if (RSI < 35) {
      analysis += `• RSI ${RSI}: Vùng quá bán - cơ hội mua vào tốt\n`;
    } else if (RSI > 55) {
      analysis += `• RSI ${RSI}: Momentum tích cực, xu hướng tăng khả quan\n`;
    } else if (RSI < 45) {
      analysis += `• RSI ${RSI}: Momentum tiêu cực, áp lực giảm\n`;
    } else {
      analysis += `• RSI ${RSI}: Trung tính, chờ tín hiệu rõ ràng hơn\n`;
    }
    
    // MACD Analysis
    switch (MACD) {
      case 'bullish_cross':
        analysis += `• MACD: Golden Cross - tín hiệu mua mạnh, động lực tăng\n`;
        break;
      case 'bearish_cross':
        analysis += `• MACD: Death Cross - tín hiệu bán mạnh, động lực giảm\n`;
        break;
      case 'bullish':
        analysis += `• MACD: Duy trì trên signal line - xu hướng tăng tiếp tục\n`;
        break;
      case 'bearish':
        analysis += `• MACD: Duy trì dưới signal line - xu hướng giảm tiếp tục\n`;
        break;
      default:
        analysis += `• MACD: Dao động gần vùng 0 - chờ đột phá\n`;
    }
    
    // Trend Analysis
    switch (trend) {
      case 'uptrend':
        analysis += `• Xu hướng: TĂNG rõ ràng - ưu tiên tìm điểm mua\n`;
        break;
      case 'downtrend':
        analysis += `• Xu hướng: GIẢM rõ ràng - ưu tiên tìm điểm bán\n`;
        break;
      default:
        analysis += `• Xu hướng: SIDEWAYS - thị trường đi ngang\n`;
    }
    
    // Market Strength
    if (strength >= 70) {
      analysis += `• Sức mạnh thị trường: ${strength}/100 - Rất mạnh\n`;
    } else if (strength >= 50) {
      analysis += `• Sức mạnh thị trường: ${strength}/100 - Trung bình khá\n`;
    } else {
      analysis += `• Sức mạnh thị trường: ${strength}/100 - Yếu\n`;
    }
    
    analysis += `➤ **Điểm kỹ thuật: ${technical.score}/100**`;
    
    return analysis;
  }

  /**
   * 📰 Generate News Analysis Section
   */
  generateNewsSection(news) {
    let analysis = "📰 **PHÂN TÍCH TIN TỨC (24H):**\n";
    
    const { count, positive, negative, neutral } = news.details;
    
    if (count === 0) {
      analysis += "• Không có tin tức đáng chú ý trong 24h qua\n";
      analysis += "• Thị trường thiếu catalyst từ tin tức\n";
      analysis += `➤ **Điểm tin tức: ${news.score}/100** (Trung tính)`;
      return analysis;
    }
    
    // News Summary
    analysis += `• Tổng ${count} tin trong 24h: ${positive} tích cực, ${negative} tiêu cực, ${neutral} trung tính\n`;
    
    // Sentiment Analysis
    if (positive > negative) {
      analysis += `• Sentiment: TÍCH CỰC cho vàng - tin tức hỗ trợ xu hướng tăng\n`;
      if (positive >= negative * 2) {
        analysis += `• Mức độ: Rất tích cực - nhiều yếu tố hỗ trợ vàng\n`;
      } else {
        analysis += `• Mức độ: Tích cực vừa phải - một số yếu tố hỗ trợ\n`;
      }
    } else if (negative > positive) {
      analysis += `• Sentiment: TIÊU CỰC cho vàng - tin tức tạo áp lực bán\n`;
      if (negative >= positive * 2) {
        analysis += `• Mức độ: Rất tiêu cực - nhiều yếu tố bất lợi cho vàng\n`;
      } else {
        analysis += `• Mức độ: Tiêu cực vừa phải - một số yếu tố bất lợi\n`;
      }
    } else {
      analysis += `• Sentiment: TRUNG TÍNH - tin tức trái chiều\n`;
      analysis += `• Mức độ: Cân bằng - không có bias rõ ràng\n`;
    }
    
    // Key factors
    if (news.signals && news.signals.length > 0) {
      analysis += `• Yếu tố chính: ${news.signals[0].replace(/📈|📉|⚖️|📰/g, '').trim()}\n`;
    }
    
    analysis += `➤ **Điểm tin tức: ${news.score}/100**`;
    
    return analysis;
  }

  /**
   * 📈 Generate Macro Analysis Section
   */
  generateMacroSection(macro) {
    let analysis = "📈 **PHÂN TÍCH VĨ MÔ (7 NGÀY):**\n";
    
    const { count, positive, negative, neutral } = macro.details;
    
    if (count === 0) {
      analysis += "• Không có dữ liệu kinh tế mới trong 7 ngày qua\n";
      analysis += "• Thị trường chờ đợi dữ liệu kinh tế tiếp theo\n";
      analysis += `➤ **Điểm vĩ mô: ${macro.score}/100** (Không có dữ liệu)`;
      return analysis;
    }
    
    // Macro Summary
    analysis += `• ${count} chỉ số kinh tế: ${positive} tích cực, ${negative} tiêu cực cho vàng\n`;
    
    // Economic Environment
    if (positive > negative) {
      analysis += `• Môi trường vĩ mô: HỖ TRỢ vàng\n`;
      analysis += `• Các yếu tố: Fed dovish, lạm phát thấp, hoặc tăng trưởng chậm\n`;
    } else if (negative > positive) {
      analysis += `• Môi trường vĩ mô: BẤT LỢI cho vàng\n`;
      analysis += `• Các yếu tố: Fed hawkish, kinh tế mạnh, hoặc DXY tăng\n`;
    } else {
      analysis += `• Môi trường vĩ mô: TRUNG TÍNH\n`;
      analysis += `• Các yếu tố: Dữ liệu kinh tế trái chiều\n`;
    }
    
    // Key macro signals
    if (macro.signals && macro.signals.length > 0) {
      analysis += `• Tín hiệu chính: ${macro.signals[0].replace(/📊|⚖️/g, '').trim()}\n`;
    }
    
    // Impact assessment
    if (macro.score >= 60) {
      analysis += `• Tác động: Hỗ trợ tích cực cho giá vàng\n`;
    } else if (macro.score <= 40) {
      analysis += `• Tác động: Tạo áp lực giảm lên giá vàng\n`;
    } else {
      analysis += `• Tác động: Không tạo bias rõ ràng\n`;
    }
    
    analysis += `➤ **Điểm vĩ mô: ${macro.score}/100**`;
    
    return analysis;
  }

  /**
   * 🎯 Generate Final Recommendation Section
   */
  generateRecommendationSection(action, confidence, currentPrice, technical, news, macro) {
    let analysis = "🎯 **GỢI Ý GIAO DỊCH:**\n";
    
    // Overall Assessment
    const overallScore = Math.round((technical.score * 0.4) + (news.score * 0.35) + (macro.score * 0.25));
    
    analysis += `• Điểm tổng hợp: ${overallScore}/100 (Kỹ thuật: ${technical.score}, Tin tức: ${news.score}, Vĩ mô: ${macro.score})\n`;
    
    // Action Recommendation
    switch (action) {
      case 'BUY':
        analysis += `• **KHUYẾN NGHỊ: MUA VÀNG** 📈\n`;
        analysis += `• Độ tin cậy: ${confidence}% - ${confidence >= 75 ? 'Cao' : confidence >= 60 ? 'Trung bình' : 'Thấp'}\n`;
        analysis += `• Lý do chính: `;
        
        // Identify strongest factor
        if (technical.score >= 60 && news.score >= 60) {
          analysis += `Cả kỹ thuật và tin tức đều hỗ trợ\n`;
        } else if (technical.score >= 60) {
          analysis += `Tín hiệu kỹ thuật mạnh\n`;
        } else if (news.score >= 60) {
          analysis += `Tin tức tích cực cho vàng\n`;
        } else if (macro.score >= 60) {
          analysis += `Môi trường vĩ mô thuận lợi\n`;
        } else {
          analysis += `Tổng hợp các yếu tố nghiêng về tích cực\n`;
        }
        
        analysis += `• Vùng vào lệnh: Quanh $${currentPrice.toFixed(2)} ± 0.3%\n`;
        analysis += `• Quản lý rủi ro: Đặt stop loss nếu xu hướng đảo chiều\n`;
        break;
        
      case 'SELL':
        analysis += `• **KHUYẾN NGHỊ: BÁN VÀNG** 📉\n`;
        analysis += `• Độ tin cậy: ${confidence}% - ${confidence >= 75 ? 'Cao' : confidence >= 60 ? 'Trung bình' : 'Thấp'}\n`;
        analysis += `• Lý do chính: `;
        
        if (technical.score <= 40 && news.score <= 40) {
          analysis += `Cả kỹ thuật và tin tức đều bất lợi\n`;
        } else if (technical.score <= 40) {
          analysis += `Tín hiệu kỹ thuật yếu\n`;
        } else if (news.score <= 40) {
          analysis += `Tin tức tiêu cực cho vàng\n`;
        } else if (macro.score <= 40) {
          analysis += `Môi trường vĩ mô bất lợi\n`;
        } else {
          analysis += `Tổng hợp các yếu tố nghiêng về tiêu cực\n`;
        }
        
        analysis += `• Vùng vào lệnh: Quanh $${currentPrice.toFixed(2)} ± 0.3%\n`;
        analysis += `• Quản lý rủi ro: Đặt stop loss nếu xu hướng đảo chiều\n`;
        break;
        
      default: // HOLD
        analysis += `• **KHUYẾN NGHỊ: QUAN SÁT** ⏸️\n`;
        analysis += `• Độ tin cậy: ${confidence}% - Không có tín hiệu rõ ràng\n`;
        analysis += `• Lý do: `;
        
        if (Math.abs(technical.score - 50) <= 10 && Math.abs(news.score - 50) <= 10) {
          analysis += `Tất cả các yếu tố đều trung tính\n`;
        } else {
          analysis += `Các yếu tố trái chiều, chưa có consensus\n`;
        }
        
        analysis += `• Hành động: Chờ tín hiệu rõ ràng hơn từ kỹ thuật hoặc tin tức\n`;
        analysis += `• Theo dõi: Breakout khỏi vùng sideways hoặc tin tức quan trọng\n`;
    }
    
    // Risk Warning
    analysis += `\n⚠️ **LƯU Ý RỦI RO:**\n`;
    analysis += `• Vàng có biến động cao, luôn sử dụng stop loss\n`;
    analysis += `• Theo dõi tin tức Fed, CPI, và geopolitical events\n`;
    analysis += `• Không đầu tư quá 5% tổng tài khoản vào một lệnh\n`;
    
    return analysis;
  }
}

module.exports = SignalService;