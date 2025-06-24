const axios = require('axios');
const EconomicFactor = require('../models/EconomicFactor');

/**
 * Service phân tích dữ liệu kinh tế vĩ mô - CHỈ DÙNG FRED API
 * Lấy dữ liệu từ FRED API → mapping sentiment → tác động GOLD
 */
class MacroService {
  constructor() {
    this.fredApiKey = process.env.FRED_API_KEY;
    
    if (!this.fredApiKey || this.fredApiKey === 'demo') {
      console.warn('⚠️ FRED API key not configured - macro analysis will be limited');
    }

    // FRED Economic indicators mapping
    this.fredIndicators = {
      // Fed Policy
      'FEDFUNDS': {
        name: 'Federal Funds Rate',
        category: 'fed_policy',
        impact: 'high',
        goldMapping: 'inverse' // Tăng lãi suất → vàng giảm
      },
      
      // Inflation
      'CPIAUCSL': {
        name: 'Consumer Price Index (CPI)',
        category: 'inflation', 
        impact: 'high',
        goldMapping: 'complex' // Phụ thuộc vào mức độ và kỳ vọng Fed
      },
      
      'CPILFESL': {
        name: 'Core CPI (Less Food & Energy)',
        category: 'inflation',
        impact: 'high', 
        goldMapping: 'complex'
      },
      
      // Employment
      'UNRATE': {
        name: 'Unemployment Rate',
        category: 'employment',
        impact: 'medium',
        goldMapping: 'inverse' // Thất nghiệp cao → kinh tế yếu → vàng tăng
      },
      
      'PAYEMS': {
        name: 'Nonfarm Payrolls',
        category: 'employment',
        impact: 'high',
        goldMapping: 'inverse'
      },
      
      // GDP
      'GDP': {
        name: 'Gross Domestic Product',
        category: 'economic_growth',
        impact: 'medium',
        goldMapping: 'inverse' // GDP mạnh → kinh tế tốt → vàng giảm
      },
      
      // Other important indicators
      'DGS10': {
        name: '10-Year Treasury Rate',
        category: 'treasury',
        impact: 'high',
        goldMapping: 'inverse' // Lãi suất trái phiếu cao → vàng giảm
      },
      
      'DGS2': {
        name: '2-Year Treasury Rate', 
        category: 'treasury',
        impact: 'medium',
        goldMapping: 'inverse'
      }
    };
  }

  /**
   * Main function: Cập nhật tất cả dữ liệu kinh tế từ FRED
   */
  async updateMacroAnalysis() {
    try {
      console.log('\n📊 Starting FRED Macro Economic Analysis...');
      
      if (!this.fredApiKey || this.fredApiKey === 'demo') {
        console.log('❌ FRED API key not configured');
        return {
          success: false,
          error: 'FRED API key not configured'
        };
      }
      
      let processedCount = 0;
      let savedCount = 0;
      
      // Lấy dữ liệu từ tất cả FRED indicators
      for (const [seriesId, config] of Object.entries(this.fredIndicators)) {
        try {
          console.log(`🔄 Fetching ${config.name} (${seriesId})...`);
          
          const data = await this.fetchFREDSeries(seriesId);
          if (data && data.length > 0) {
            await this.processFREDData(seriesId, data, config);
            processedCount++;
            savedCount++;
          }
          
          // Delay để tránh rate limit
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`❌ Error processing ${seriesId}: ${error.message}`);
        }
      }
      
      console.log(`✅ FRED analysis completed: ${savedCount}/${processedCount} indicators processed`);
      
      return {
        success: true,
        processed: processedCount,
        saved: savedCount,
        message: `Processed ${processedCount} FRED economic indicators`
      };
      
    } catch (error) {
      console.error('❌ FRED Macro Analysis Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lấy dữ liệu từ FRED API
   */
  async fetchFREDSeries(seriesId, limit = 5) {
    try {
      const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
        params: {
          series_id: seriesId,
          api_key: this.fredApiKey,
          file_type: 'json',
          limit: limit,
          sort_order: 'desc', // Lấy dữ liệu mới nhất trước
          offset: 0
        },
        timeout: 10000
      });

      if (response.data && response.data.observations) {
        const validObservations = response.data.observations.filter(obs => 
          obs.value !== '.' && !isNaN(parseFloat(obs.value))
        );
        
        console.log(`✅ Found ${validObservations.length} valid observations for ${seriesId}`);
        return validObservations;
      }

      return [];
    } catch (error) {
      console.error(`❌ FRED API Error for ${seriesId}:`, error.message);
      return [];
    }
  }

  /**
   * Xử lý dữ liệu FRED và lưu vào database
   */
  async processFREDData(seriesId, observations, config) {
    try {
      // Lấy observation mới nhất
      const latest = observations[0];
      const previous = observations[1] || null;
      
      const latestValue = parseFloat(latest.value);
      const previousValue = previous ? parseFloat(previous.value) : null;
      
      // Check if this data already exists
      const existing = await EconomicFactor.findOne({
        eventName: config.name,
        releaseDate: new Date(latest.date)
      });

      if (existing) {
        console.log(`📊 Data already exists: ${config.name} for ${latest.date}`);
        return;
      }

      // Analyze impact
      const analysis = this.analyzeFREDData(seriesId, latestValue, previousValue, config);
      
      const economicFactor = new EconomicFactor({
        eventName: config.name,
        releaseDate: new Date(latest.date),
        actual: latestValue,
        previous: previousValue,
        change: previousValue ? latestValue - previousValue : null,
        changePercent: previousValue ? ((latestValue - previousValue) / previousValue * 100) : null,
        sentiment: analysis.sentiment,
        impactOnGold: analysis.impact,
        confidence: analysis.confidence,
        summary: analysis.summary,
        category: config.category,
        importance: config.impact,
        source: 'FRED'
      });

      await economicFactor.save();
      console.log(`✅ Saved: ${config.name} = ${latestValue} (${analysis.impact} for gold)`);
      
    } catch (error) {
      console.error(`❌ Process FRED Data Error for ${seriesId}:`, error.message);
    }
  }

  /**
   * Phân tích tác động của dữ liệu FRED
   */
  analyzeFREDData(seriesId, currentValue, previousValue, config) {
    let sentiment = 'neutral';
    let impact = 'neutral';
    let confidence = 60;
    let summary = '';
    
    const change = previousValue ? currentValue - previousValue : 0;
    const changePercent = previousValue ? (change / previousValue * 100) : 0;
    
    // Phân tích theo từng loại indicator
    switch (seriesId) {
      case 'FEDFUNDS': // Fed Funds Rate
        if (change > 0.1) {
          sentiment = 'hawkish_usd';
          impact = 'negative'; // Lãi suất tăng → vàng giảm
          confidence = 85;
          summary = `Fed tăng lãi suất ${change.toFixed(2)}% → USD mạnh → Vàng giảm`;
        } else if (change < -0.1) {
          sentiment = 'dovish_usd';
          impact = 'positive'; // Lãi suất giảm → vàng tăng
          confidence = 85;
          summary = `Fed giảm lãi suất ${Math.abs(change).toFixed(2)}% → USD yếu → Vàng tăng`;
        } else {
          sentiment = 'neutral';
          impact = 'neutral';
          confidence = 50;
          summary = `Fed giữ nguyên lãi suất ${currentValue}% → Trung tính cho vàng`;
        }
        break;
        
      case 'CPIAUCSL': // CPI Inflation
      case 'CPILFESL': // Core CPI
        if (changePercent > 0.5) {
          sentiment = 'hawkish_usd'; // Lạm phát cao → Fed có thể tăng lãi suất
          impact = 'negative';
          confidence = 75;
          summary = `Lạm phát tăng ${changePercent.toFixed(2)}% → Fed có thể thắt chặt → Vàng giảm`;
        } else if (changePercent < -0.3) {
          sentiment = 'dovish_usd'; // Lạm phát thấp → Fed có thể nới lỏng
          impact = 'positive';
          confidence = 75;
          summary = `Lạm phát giảm ${Math.abs(changePercent).toFixed(2)}% → Fed có thể nới lỏng → Vàng tăng`;
        } else {
          sentiment = 'neutral';
          impact = 'neutral';
          confidence = 60;
          summary = `Lạm phát ổn định ${currentValue.toFixed(1)} → Trung tính cho vàng`;
        }
        break;
        
      case 'UNRATE': // Unemployment Rate
        if (change > 0.3) {
          sentiment = 'dovish_usd'; // Thất nghiệp tăng → kinh tế yếu → vàng tăng
          impact = 'positive';
          confidence = 70;
          summary = `Thất nghiệp tăng lên ${currentValue}% → Kinh tế yếu → Vàng tăng`;
        } else if (change < -0.3) {
          sentiment = 'hawkish_usd'; // Thất nghiệp giảm → kinh tế mạnh → vàng giảm
          impact = 'negative';
          confidence = 70;
          summary = `Thất nghiệp giảm xuống ${currentValue}% → Kinh tế mạnh → Vàng giảm`;
        } else {
          sentiment = 'neutral';
          impact = 'neutral';
          confidence = 55;
          summary = `Thất nghiệp ổn định ${currentValue}% → Trung tính cho vàng`;
        }
        break;
        
      case 'PAYEMS': // Nonfarm Payrolls (in thousands)
        const payrollChange = change;
        if (payrollChange > 50) {
          sentiment = 'hawkish_usd'; // Việc làm tăng mạnh → kinh tế tốt → vàng giảm
          impact = 'negative';
          confidence = 75;
          summary = `Việc làm tăng ${payrollChange.toFixed(0)}K → Kinh tế mạnh → Vàng giảm`;
        } else if (payrollChange < -50) {
          sentiment = 'dovish_usd'; // Việc làm giảm → kinh tế yếu → vàng tăng
          impact = 'positive';
          confidence = 75;
          summary = `Việc làm giảm ${Math.abs(payrollChange).toFixed(0)}K → Kinh tế yếu → Vàng tăng`;
        } else {
          sentiment = 'neutral';
          impact = 'neutral';
          confidence = 60;
          summary = `Việc làm ổn định → Trung tính cho vàng`;
        }
        break;
        
      case 'DGS10': // 10-Year Treasury Rate
      case 'DGS2':  // 2-Year Treasury Rate
        if (change > 0.2) {
          sentiment = 'hawkish_usd'; // Lãi suất trái phiếu tăng → vàng giảm
          impact = 'negative';
          confidence = 80;
          summary = `Lãi suất trái phiếu tăng ${change.toFixed(2)}% → Vàng kém hấp dẫn → Vàng giảm`;
        } else if (change < -0.2) {
          sentiment = 'dovish_usd'; // Lãi suất trái phiếu giảm → vàng tăng
          impact = 'positive';
          confidence = 80;
          summary = `Lãi suất trái phiếu giảm ${Math.abs(change).toFixed(2)}% → Vàng hấp dẫn hơn → Vàng tăng`;
        } else {
          sentiment = 'neutral';
          impact = 'neutral';
          confidence = 55;
          summary = `Lãi suất trái phiếu ổn định ${currentValue.toFixed(2)}% → Trung tính cho vàng`;
        }
        break;
        
      case 'GDP': // GDP Growth Rate
        if (changePercent > 1.0) {
          sentiment = 'hawkish_usd'; // GDP mạnh → kinh tế tốt → vàng giảm
          impact = 'negative';
          confidence = 70;
          summary = `GDP tăng mạnh ${changePercent.toFixed(2)}% → Kinh tế mạnh → Vàng giảm`;
        } else if (changePercent < -1.0) {
          sentiment = 'dovish_usd'; // GDP yếu → kinh tế chậm → vàng tăng
          impact = 'positive';
          confidence = 70;
          summary = `GDP giảm ${Math.abs(changePercent).toFixed(2)}% → Kinh tế yếu → Vàng tăng`;
        } else {
          sentiment = 'neutral';
          impact = 'neutral';
          confidence = 60;
          summary = `GDP ổn định → Trung tính cho vàng`;
        }
        break;
        
      default:
        summary = `${config.name}: ${currentValue} → ${impact} cho vàng`;
    }

    return { sentiment, impact, confidence, summary };
  }

  /**
   * Lấy tóm tắt macro gần nhất
   */
  async getLatestMacroSummary() {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentFactors = await EconomicFactor.find({
        releaseDate: { $gte: last24Hours },
        source: 'FRED'
      })
      .sort({ releaseDate: -1 })
      .limit(10);

      // Tính tổng quan sentiment
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;
      
      recentFactors.forEach(factor => {
        switch (factor.impactOnGold) {
          case 'positive':
            positiveCount++;
            break;
          case 'negative':
            negativeCount++;
            break;
          default:
            neutralCount++;
        }
      });

      const totalCount = recentFactors.length;
      const overallSentiment = positiveCount > negativeCount ? 'bullish' :
                              negativeCount > positiveCount ? 'bearish' : 'neutral';

      return {
        summary: {
          total: totalCount,
          positive: positiveCount,
          negative: negativeCount,
          neutral: neutralCount,
          sentiment: overallSentiment
        },
        recent: recentFactors.slice(0, 5), // 5 events gần nhất
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error('❌ Get FRED Macro Summary Error:', error.message);
      return null;
    }
  }

  /**
   * Test FRED API connectivity
   */
  async testFREDConnection() {
    try {
      if (!this.fredApiKey || this.fredApiKey === 'demo') {
        throw new Error('FRED API key not configured');
      }

      console.log('🔍 Testing FRED API connection...');
      
      // Test với Fed Funds Rate
      const testData = await this.fetchFREDSeries('FEDFUNDS', 1);
      
      if (testData && testData.length > 0) {
        console.log(`✅ FRED API working - Latest Fed Rate: ${testData[0].value}%`);
        return true;
      } else {
        throw new Error('No data returned from FRED API');
      }
      
    } catch (error) {
      console.error('❌ FRED Connection Test Failed:', error.message);
      return false;
    }
  }
}

module.exports = MacroService;