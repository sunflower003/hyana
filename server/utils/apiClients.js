const axios = require('axios');

/**
 * API Clients để lấy dữ liệu từ các nguồn khác nhau
 */

// Twelve Data API Client
class TwelveDataClient {
  constructor() {
    this.baseURL = 'https://api.twelvedata.com';
    this.apiKey = process.env.TWELVEDATA_API_KEY || null;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Lấy dữ liệu giá vàng 4H - Sử dụng XAU/USD trực tiếp
  async getGoldPrice(symbol = 'XAUUSD', resolution = '4h', count = 250) {
    try {
      // ✅ Sử dụng XAU/USD trực tiếp từ Twelve Data
      let twelveDataSymbol = 'XAU/USD';
      
      // ✅ Mapping interval format từ Finnhub sang Twelve Data
      let twelveDataInterval = resolution;
      if (resolution === '240') {
        twelveDataInterval = '4h'; // Convert from Finnhub to Twelve Data format
      }
      
      console.log(`🔄 Fetching XAU/USD data from Twelve Data (${twelveDataSymbol}, ${twelveDataInterval})...`);
      
      const params = {
        symbol: twelveDataSymbol,
        interval: twelveDataInterval, // ✅ Use correct format
        outputsize: count,
        format: 'json'
      };
      
      // Thêm API key nếu có
      if (this.apiKey) {
        params.apikey = this.apiKey;
      }
      
      const response = await this.client.get('/time_series', { params });

      // Kiểm tra response
      if (response.data.code) {
        console.log(`⚠️ Twelve Data API error: ${response.data.message}, using mock data...`);
        return generateMockData(count);
      }

      if (!response.data.values || response.data.values.length === 0) {
        console.log('⚠️ No data from Twelve Data, using mock data...');
        return generateMockData(count);
      }

      // Convert Twelve Data format to OHLC
      const ohlcData = response.data.values.map(item => ({
        timestamp: new Date(item.datetime),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume) || 0
      }));

      // Twelve Data trả về data mới nhất trước -> đảo ngược
      ohlcData.reverse();

      console.log(`✅ Fetched ${ohlcData.length} candles from Twelve Data`);
      console.log(`📊 Latest XAU/USD price: $${ohlcData[ohlcData.length - 1].close}`);
      
      return ohlcData;

    } catch (error) {
      console.error('❌ Twelve Data API Error:', error.message);
      
      // Rate limit handling
      if (error.response?.status === 429) {
        console.log('⚠️ Rate limited, using mock data...');
      } else if (error.response?.status === 401) {
        console.log('⚠️ Invalid API key, using mock data...');
      }
      
      console.log('🔄 Fallback to mock data...');
      return generateMockData(count);
    }
  }

  // Lấy giá real-time XAU/USD
  async getCurrentPrice(symbol = 'XAU/USD') {
    try {
      const params = { symbol: 'XAU/USD', format: 'json' };
      if (this.apiKey) params.apikey = this.apiKey;
      
      const response = await this.client.get('/price', { params });

      if (response.data.price) {
        return {
          price: parseFloat(response.data.price),
          change: 0,
          changePercent: 0,
          timestamp: new Date()
        };
      } else {
        throw new Error('No price data');
      }

    } catch (error) {
      console.error('❌ Twelve Data Current Price Error:', error.message);
      // Return mock current price với giá realistic
      return {
        price: 2635 + Math.random() * 20 - 10, // 2625-2645
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 0.5,
        timestamp: new Date()
      };
    }
  }

  // Lấy quote XAU/USD với change information
  async getQuote(symbol = 'XAU/USD') {
    try {
      const params = { symbol: 'XAU/USD', format: 'json' };
      if (this.apiKey) params.apikey = this.apiKey;
      
      const response = await this.client.get('/quote', { params });

      if (response.data.close) {
        return {
          price: parseFloat(response.data.close),
          change: parseFloat(response.data.change) || 0,
          changePercent: parseFloat(response.data.percent_change) || 0,
          open: parseFloat(response.data.open),
          high: parseFloat(response.data.high),
          low: parseFloat(response.data.low),
          volume: parseFloat(response.data.volume) || 0,
          timestamp: new Date()
        };
      } else {
        throw new Error('No quote data');
      }

    } catch (error) {
      console.error('❌ Twelve Data Quote Error:', error.message);
      return {
        price: 2635 + Math.random() * 20 - 10,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 0.5,
        timestamp: new Date()
      };
    }
  }
}

// Finnhub API Client (backup)
class FinnhubClient {
  constructor() {
    this.baseURL = 'https://finnhub.io/api/v1';
    this.apiKey = process.env.FINNHUB_API_KEY || 'demo';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'X-Finnhub-Token': this.apiKey
      }
    });
  }

  async getGoldPrice(symbol = 'XAUUSD', resolution = '240', count = 50) {
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - (count * 4 * 60 * 60);
      
      console.log(`🔄 Fetching XAUUSD data from Finnhub (backup)...`);
      
      const response = await this.client.get('/stock/candle', {
        params: { symbol, resolution, from, to }
      });

      if (response.status === 403 || response.data.s !== 'ok') {
        console.log('⚠️ Finnhub API failed, using mock data...');
        return generateMockData(count);
      }

      const { o, h, l, c, v, t } = response.data;
      const ohlcData = [];
      
      for (let i = 0; i < o.length; i++) {
        ohlcData.push({
          timestamp: new Date(t[i] * 1000),
          open: o[i],
          high: h[i],
          low: l[i],
          close: c[i],
          volume: v[i] || 0
        });
      }

      console.log(`✅ Fetched ${ohlcData.length} candles from Finnhub`);
      return ohlcData;

    } catch (error) {
      console.error('❌ Finnhub API Error:', error.message);
      return generateMockData(count);
    }
  }

  async getCurrentPrice(symbol = 'XAUUSD') {
    try {
      const response = await this.client.get('/quote', { params: { symbol } });
      return {
        price: response.data.c,
        change: response.data.d,
        changePercent: response.data.dp,
        timestamp: new Date(response.data.t * 1000)
      };
    } catch (error) {
      return {
        price: 2635 + Math.random() * 20 - 10,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 0.5,
        timestamp: new Date()
      };
    }
  }
}

// ✅ Cập nhật generateMockData với giá XAUUSD thực tế
const generateMockData = (count = 250) => {
  console.log(`🔄 Generating realistic mock XAUUSD data for testing (${count} candles)...`);
  
  const ohlcData = [];
  let basePrice = 2635; // ✅ Giá vàng thực tế hiện tại (December 2024)
  const now = new Date();
  
  const trendDirection = Math.random() > 0.5 ? 1 : -1;
  console.log(`📈 Mock trend: ${trendDirection > 0 ? 'UPTREND' : 'DOWNTREND'}`);
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 4 * 60 * 60 * 1000)); // 4 hours ago
    
    // Tạo biến động thực tế hơn cho vàng
    const trendStrength = 0.0002; // Giảm xuống để realistic hơn
    const noise = (Math.random() - 0.5) * 0.006; // Noise nhỏ hơn
    const trendMove = trendDirection * trendStrength;
    
    basePrice = basePrice * (1 + trendMove + noise);
    
    // Đảm bảo giá không đi quá xa khỏi thực tế (2600-2670)
    basePrice = Math.max(2600, Math.min(2670, basePrice));
    
    const open = basePrice;
    const volatility = 0.002; // Giảm volatility cho realistic hơn
    const close = open * (1 + (Math.random() - 0.5) * volatility);
    const high = Math.max(open, close) * (1 + Math.random() * 0.0008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.0008);
    
    const baseVolume = 500;
    const trendVolume = Math.abs(close - open) > (open * 0.0015) ? 1.3 : 1;
    const volume = Math.floor(baseVolume * trendVolume * (0.8 + Math.random() * 0.4));
    
    ohlcData.push({
      timestamp,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume
    });
  }
  
  const firstPrice = ohlcData[0].close;
  const lastPrice = ohlcData[ohlcData.length - 1].close;
  const change = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
  
  console.log(`✅ Generated ${ohlcData.length} mock candles`);
  console.log(`📊 Price range: $${firstPrice} → $${lastPrice} (${change}%)`);
  
  return ohlcData;
};

// Factory function với priority: Twelve Data > Finnhub > Mock
const createPriceClient = () => {
  console.log('📊 Using Twelve Data API for XAU/USD direct data');
  return new TwelveDataClient();
};

module.exports = {
  TwelveDataClient,
  FinnhubClient,
  createPriceClient,
  generateMockData
};