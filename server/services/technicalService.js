const { createPriceClient } = require('../utils/apiClients');
const {
  calculateRSI,
  calculateEMA,
  calculateMACD,
  determineTrend,
  calculateSupportResistance,
  calculateVolatility,
  calculateMarketStrength
} = require('../utils/indicators');
const TechnicalSnapshot = require('../models/TechnicalSnapshot');

class TechnicalService {
  constructor() {
    this.priceClient = createPriceClient();
  }

  async analyzeTechnical() {
    console.log('\n🔍 Starting Technical Analysis (Swing Trading H4)...');
    
    const ohlcData = await this.priceClient.getGoldPrice('XAUUSD', '4h', 250);

    if (!ohlcData || ohlcData.length < 50) {
      throw new Error('Insufficient price data for technical analysis');
    }

    const closes = ohlcData.map(c => c.close);
    const latest = ohlcData[ohlcData.length - 1];

    console.log(`📊 Analyzing ${ohlcData.length} candles, latest: $${latest.close}`);

    const indicators = await this.calculateIndicators(closes, ohlcData);

    // Xác định dataSource
    let dataSource = 'manual';
    const twelveDataKey = process.env.TWELVEDATA_API_KEY;
    const finnhubKey = process.env.FINNHUB_API_KEY;
    
    if (twelveDataKey && twelveDataKey !== 'demo' && twelveDataKey.length > 10) {
      dataSource = 'twelvedata';
    } else if (finnhubKey && finnhubKey !== 'demo') {
      dataSource = 'finnhub';
    }

    const snapshot = {
      timestamp: latest.timestamp,
      price: {
        open: latest.open,
        high: latest.high,
        low: latest.low,
        close: latest.close
      },
      indicators,
      supportResistance: calculateSupportResistance(ohlcData),
      volatility: calculateVolatility(ohlcData),
      strength: calculateMarketStrength(
        indicators.RSI,
        indicators.MACD,
        indicators.trend
      ),
      dataSource: dataSource
    };

    console.log(`✅ Analysis completed | Trend: ${indicators.trend} | RSI: ${indicators.RSI} | Strength: ${snapshot.strength}`);
    return snapshot;
  }

  // ✅ UPDATED: calculateIndicators without volume
  async calculateIndicators(closes, ohlcData) {
    try {
      // RSI (14 periods)
      const RSI = calculateRSI(closes, 14);

      // MACD (12, 26, 9)
      const MACD = calculateMACD(closes, 12, 26, 9);

      // EMA 20 và 50
      const EMA_20 = calculateEMA(closes, 20);
      const EMA_50 = calculateEMA(closes, 50);

      // EMA 200 - nếu đủ dữ liệu
      let EMA_200 = null;
      if (closes.length >= 200) {
        EMA_200 = calculateEMA(closes, 200);
        console.log(`📈 EMA 200: $${EMA_200}`);
      } else {
        console.log(`⚠️ Không đủ dữ liệu cho EMA 200 (có ${closes.length}, cần 200)`);
      }

      // Xác định trend
      const currentPrice = closes[closes.length - 1];
      const trend = this.determineTrendByStrategy(currentPrice, EMA_20, EMA_50, EMA_200);

      return {
        RSI,
        MACD,
        EMA_20,
        EMA_50,
        EMA_200,
        trend
      };

    } catch (error) {
      console.error('❌ Indicator Calculation Error:', error.message);
      throw error;
    }
  }

  determineTrendByStrategy(currentPrice, ema20, ema50, ema200) {
    // Nếu có EMA 200, dùng full strategy
    if (ema200) {
      if (ema50 > ema200 && currentPrice > ema50 && currentPrice > ema20) {
        return 'uptrend';
      } else if (ema50 < ema200 && currentPrice < ema50 && currentPrice < ema20) {
        return 'downtrend';
      }
    } else {
      // Fallback: chỉ dùng EMA 20 và 50
      console.log(`📊 Using EMA 20/50 fallback strategy`);
      if (currentPrice > ema20 && ema20 > ema50) {
        return 'uptrend';
      } else if (currentPrice < ema20 && ema20 < ema50) {
        return 'downtrend';
      }
    }
    
    return 'sideways';
  }

  generateTrendAnalysis(snapshot) {
    if (!snapshot) return null;
    const { indicators, strength, volatility } = snapshot;
    const { RSI, MACD, trend, EMA_200 } = indicators;

    const analysis = {
      trend,
      strength,
      signals: [],
      recommendation: 'HOLD',
      confidence: 50,
      reasoning: []
    };

    // Phân tích RSI (ngưỡng 65/35 cho H4)
    if (RSI > 65) {
      analysis.signals.push(`RSI quá mua (${RSI}) - cảnh báo đảo chiều xuống`);
      analysis.reasoning.push('RSI trong vùng quá mua');
    } else if (RSI < 35) {
      analysis.signals.push(`RSI quá bán (${RSI}) - cơ hội mua vào`);
      analysis.reasoning.push('RSI trong vùng quá bán');
    } else if (RSI > 50) {
      analysis.signals.push(`RSI bullish (${RSI}) - xu hướng tăng`);
    } else {
      analysis.signals.push(`RSI bearish (${RSI}) - xu hướng giảm`);
    }

    // Phân tích MACD
    switch (MACD.trend) {
      case 'bullish_cross':
        analysis.signals.push('MACD bullish crossover - tín hiệu mua mạnh');
        analysis.reasoning.push('MACD crossover bullish');
        analysis.recommendation = 'BUY';
        analysis.confidence = 75;
        break;
      case 'bearish_cross':
        analysis.signals.push('MACD bearish crossover - tín hiệu bán mạnh');
        analysis.reasoning.push('MACD crossover bearish');
        analysis.recommendation = 'SELL';
        analysis.confidence = 75;
        break;
      case 'bullish':
        analysis.signals.push('MACD bullish - động lượng tăng');
        break;
      case 'bearish':
        analysis.signals.push('MACD bearish - động lượng giảm');
        break;
    }

    // Phân tích trend
    if (trend === 'uptrend' && strength >= 70) {
      analysis.recommendation = 'BUY';
      analysis.confidence = Math.min(85, analysis.confidence + 10);
      analysis.reasoning.push('Xu hướng tăng mạnh');
    } else if (trend === 'downtrend' && strength <= 30) {
      analysis.recommendation = 'SELL';
      analysis.confidence = Math.min(85, analysis.confidence + 10);
      analysis.reasoning.push('Xu hướng giảm mạnh');
    }

    // Note về EMA 200
    if (!EMA_200) {
      analysis.signals.push('📊 Sử dụng EMA 20/50 (chưa đủ dữ liệu cho EMA 200)');
    }

    // Cảnh báo volatility
    if (volatility > 10.0) { // Điều chỉnh cho XAUUSD
      analysis.signals.push(`Volatility cao (${volatility}) - cần quản lý rủi ro cẩn thận`);
    }

    return analysis;
  }

  // ✅ UPDATED: saveSnapshot without VolumeRatio
  async saveSnapshot(technicalData) {
    try {
      console.log('💾 Saving technical snapshot to database...');

      await TechnicalSnapshot.deleteOne({ 
        timestamp: technicalData.timestamp 
      });

      const snapshotData = {
        timestamp: technicalData.timestamp,
        price: technicalData.price,
        indicators: {
          RSI: technicalData.indicators.RSI,
          MACD: technicalData.indicators.MACD,
          EMA_20: technicalData.indicators.EMA_20,
          EMA_50: technicalData.indicators.EMA_50,
          trend: technicalData.indicators.trend
        },
        supportResistance: technicalData.supportResistance,
        volatility: technicalData.volatility,
        strength: technicalData.strength,
        dataSource: technicalData.dataSource
      };

      // Only include EMA_200 if it exists
      if (technicalData.indicators.EMA_200) {
        snapshotData.indicators.EMA_200 = technicalData.indicators.EMA_200;
      }

      const snapshot = new TechnicalSnapshot(snapshotData);
      await snapshot.save();

      console.log('✅ Technical snapshot saved successfully');
      return snapshot;

    } catch (error) {
      console.error('❌ Save Snapshot Error:', error.message);
      throw error;
    }
  }

  async getLatestSnapshot() {
    try {
      const snapshot = await TechnicalSnapshot.getLatest();
      return snapshot;
    } catch (error) {
      console.error('❌ Get Latest Snapshot Error:', error.message);
      throw error;
    }
  }

  async getRecentSnapshots(limit = 20) {
    try {
      const snapshots = await TechnicalSnapshot.getLastNCandles(limit);
      return snapshots;
    } catch (error) {
      console.error('❌ Get Recent Snapshots Error:', error.message);
      throw error;
    }
  }

  async updateTechnicalAnalysis() {
    try {
      console.log('\n🚀 Running Technical Analysis Update (Swing Trading Strategy)...');

      const technicalData = await this.analyzeTechnical();
      const snapshot = await this.saveSnapshot(technicalData);
      const analysis = this.generateTrendAnalysis(technicalData);

      console.log('✅ Technical Analysis Update completed successfully');
      console.log(`📊 Recommendation: ${analysis.recommendation} (${analysis.confidence}%)`);

      return {
        snapshot,
        analysis,
        success: true,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Technical Analysis Update Failed:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

module.exports = TechnicalService;
