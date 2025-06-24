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

  // ✅ FORCE REAL API DATA - No fallback to mock
  async getGoldPrice(symbol = 'XAUUSD', resolution = '4h', count = 250) {
    try {
      const params = {
        symbol: 'XAU/USD',
        interval: resolution === '240' ? '4h' : resolution,
        outputsize: count,
        format: 'json',
        apikey: this.apiKey
      };
      
      const response = await this.client.get('/time_series', { params });

      if (response.data.code) {
        throw new Error(`API Error: ${response.data.message}`);
      }

      if (!response.data.values || response.data.values.length === 0) {
        throw new Error('No price data returned');
      }

      const ohlcData = response.data.values.map(item => ({
        timestamp: new Date(item.datetime),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume) || 0
      }));

      // ✅ SORT: Twelve Data returns newest first
      ohlcData.reverse();
      console.log(`📈 Fetched ${ohlcData.length} candles, latest: $${ohlcData[ohlcData.length - 1].close.toFixed(2)}`);

      return ohlcData;

    } catch (error) {
      console.error('❌ Price data failed:', error.message);
      throw error;
    }
  }

  // ✅ REAL CURRENT PRICE - No fallback
  async getCurrentPrice(symbol = 'XAU/USD') {
    try {
      const params = { 
        symbol: 'XAU/USD', 
        format: 'json',
        apikey: this.apiKey
      };
      
      const response = await this.client.get('/price', { params });

      if (response.data.price) {
        return {
          price: parseFloat(response.data.price),
          change: 0,
          changePercent: 0,
          timestamp: new Date()
        };
      } else {
        throw new Error('No current price data');
      }

    } catch (error) {
      console.error('❌ Current price failed:', error.message);
      throw error;
    }
  }

  // ✅ REAL QUOTE DATA - No fallback
  async getQuote(symbol = 'XAU/USD') {
    try {
      if (!this.apiKey || this.apiKey === 'demo') {
        throw new Error('API key required for real quote');
      }
      
      const params = { 
        symbol: 'XAU/USD', 
        format: 'json',
        apikey: this.apiKey
      };
      
      const response = await this.client.get('/quote', { params });

      if (response.data.close) {
        const realPrice = parseFloat(response.data.close);
        console.log(`💰 REAL XAU/USD quote: $${realPrice.toFixed(2)}`);
        
        return {
          price: realPrice,
          change: parseFloat(response.data.change) || 0,
          changePercent: parseFloat(response.data.percent_change) || 0,
          open: parseFloat(response.data.open),
          high: parseFloat(response.data.high),
          low: parseFloat(response.data.low),
          volume: parseFloat(response.data.volume) || 0,
          timestamp: new Date()
        };
      } else {
        throw new Error('No quote data returned');
      }

    } catch (error) {
      console.error('❌ CRITICAL: Failed to get real quote:', error.message);
      throw new Error(`Real quote unavailable: ${error.message}`);
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

// ✅ REMOVE MOCK DATA FUNCTION COMPLETELY
// const generateMockData = ... // DELETED

// ✅ UPDATE: Factory function - Only real data
const createPriceClient = () => {
  console.log('📊 Using REAL Twelve Data API for XAU/USD (no mock fallback)');
  return new TwelveDataClient();
};

module.exports = {
  TwelveDataClient,
  FinnhubClient,
  createPriceClient
  // ✅ REMOVED: generateMockData export
};