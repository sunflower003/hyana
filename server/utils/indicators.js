// indicator.js

// Tính RSI (Relative Strength Index)
const calculateRSI = (prices, period = 14) => {
  if (prices.length < period + 1) {
    throw new Error(`Cần ít nhất ${period + 1} giá trị để tính RSI`);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - (100 / (1 + rs))) * 100) / 100;
};

// Tính EMA (Exponential Moving Average)
const calculateEMA = (prices, period) => {
  if (prices.length < period) {
    throw new Error(`Cần ít nhất ${period} giá trị để tính EMA`);
  }

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * multiplier + ema * (1 - multiplier);
  }

  return Math.round(ema * 100) / 100;
};

// Tính MACD
const calculateMACD = (prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (prices.length < slowPeriod + signalPeriod) {
    throw new Error(`Cần ít nhất ${slowPeriod + signalPeriod} giá trị`);
  }

  const macdLine = [];

  for (let i = slowPeriod - 1; i < prices.length; i++) {
    const fastEMA = calculateEMA(prices.slice(i - fastPeriod + 1, i + 1), fastPeriod);
    const slowEMA = calculateEMA(prices.slice(i - slowPeriod + 1, i + 1), slowPeriod);
    macdLine.push(fastEMA - slowEMA);
  }

  const signalLine = [];
  for (let i = signalPeriod - 1; i < macdLine.length; i++) {
    signalLine.push(calculateEMA(macdLine.slice(i - signalPeriod + 1, i + 1), signalPeriod));
  }

  const macd = macdLine[macdLine.length - 1];
  const signal = signalLine[signalLine.length - 1];
  const histogram = macd - signal;

  let trend = 'neutral';
  const prevMacd = macdLine[macdLine.length - 2];
  const prevSignal = signalLine[signalLine.length - 2];

  if (prevMacd <= prevSignal && macd > signal) {
    trend = 'bullish_cross';
  } else if (prevMacd >= prevSignal && macd < signal) {
    trend = 'bearish_cross';
  } else if (macd > signal && histogram > 0) {
    trend = 'bullish';
  } else if (macd < signal && histogram < 0) {
    trend = 'bearish';
  }

  return {
    macd: Math.round(macd * 1000) / 1000,
    signal: Math.round(signal * 1000) / 1000,
    histogram: Math.round(histogram * 1000) / 1000,
    trend
  };
};

// Volume Ratio calculation
const calculateVolumeRatio = (volumes, period = 20) => {
  if (!volumes || volumes.length === 0) {
    console.log('⚠️ No volume data, using default VolumeRatio: 1.0');
    return 1.0; // Default volume ratio
  }

  // Filter out invalid volumes
  const validVolumes = volumes.filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);
  
  if (validVolumes.length === 0) {
    console.log('⚠️ No valid volume data, using default VolumeRatio: 1.0');
    return 1.0;
  }

  if (validVolumes.length < period) {
    period = validVolumes.length;
  }

  try {
    // Get recent volumes
    const recentVolumes = validVolumes.slice(-period);
    const currentVolume = recentVolumes[recentVolumes.length - 1] || 0;
    
    // Calculate average volume
    const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    
    if (avgVolume === 0 || isNaN(avgVolume)) {
      console.log('⚠️ Average volume is 0 or NaN, using default VolumeRatio: 1.0');
      return 1.0;
    }

    const volumeRatio = currentVolume / avgVolume;
    
    // Validate result
    if (isNaN(volumeRatio) || !isFinite(volumeRatio)) {
      console.log('⚠️ VolumeRatio calculation resulted in NaN/Infinity, using default: 1.0');
      return 1.0;
    }

    // Cap extreme values
    const cappedRatio = Math.max(0.1, Math.min(10, volumeRatio));
    
    console.log(`📊 VolumeRatio: ${cappedRatio.toFixed(2)} (current: ${currentVolume}, avg: ${avgVolume.toFixed(0)})`);
    return parseFloat(cappedRatio.toFixed(2));

  } catch (error) {
    console.error('❌ VolumeRatio calculation error:', error.message);
    return 1.0;
  }
};

// Trend từ EMA
const determineTrend = (ema20, ema50, ema200, price) => {
  if (price > ema20 && ema20 > ema50 && ema50 > ema200) return 'uptrend';
  if (price < ema20 && ema20 < ema50 && ema50 < ema200) return 'downtrend';
  return 'sideways';
};

// Support / Resistance đơn giản
const calculateSupportResistance = (ohlc, period = 20) => {
  if (ohlc.length < period) return { support: [], resistance: [] };

  const recent = ohlc.slice(-period);
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);

  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);

  return {
    support: [Math.round(minLow * 100) / 100, Math.round(minLow * 0.98 * 100) / 100],
    resistance: [Math.round(maxHigh * 100) / 100, Math.round(maxHigh * 1.02 * 100) / 100]
  };
};

// Độ biến động (volatility)
const calculateVolatility = (ohlc, period = 14) => {
  if (ohlc.length < period) return 0;
  let trSum = 0;

  for (let i = 1; i < period; i++) {
    const curr = ohlc[ohlc.length - i];
    const prev = ohlc[ohlc.length - i - 1];
    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    trSum += tr;
  }

  return Math.round((trSum / (period - 1)) * 100) / 100;
};

// Đánh giá lực thị trường
const calculateMarketStrength = (rsi, macd, trend) => {
  let strength = 50; // Base strength

  // RSI analysis
  if (rsi > 70) {
    strength += 5; // Quá mua nhưng vẫn mạnh
  } else if (rsi > 60) {
    strength += 15; // Vùng mạnh
  } else if (rsi > 50) {
    strength += 10; // Bullish momentum
  } else if (rsi < 30) {
    strength -= 15; // Quá bán
  } else if (rsi < 40) {
    strength -= 10; // Bearish momentum
  } else {
    strength -= 5; // Trung tính yếu
  }

  // MACD trend analysis
  if (macd.trend === 'bullish_cross') {
    strength += 20; // Tín hiệu mạnh nhất
  } else if (macd.trend === 'bearish_cross') {
    strength -= 20; // Tín hiệu yếu nhất
  } else if (macd.trend === 'bullish') {
    strength += 10; // Momentum tăng
  } else if (macd.trend === 'bearish') {
    strength -= 10; // Momentum giảm
  }

  // Overall trend analysis
  if (trend === 'uptrend') {
    strength += 15; // Xu hướng tăng mạnh
  } else if (trend === 'downtrend') {
    strength -= 15; // Xu hướng giảm mạnh
  }

  // MACD histogram strength
  if (Math.abs(macd.histogram) > 0.5) {
    if (macd.histogram > 0) {
      strength += 5; // Histogram dương mạnh
    } else {
      strength -= 5; // Histogram âm mạnh
    }
  }

  return Math.max(0, Math.min(100, Math.round(strength)));
};

module.exports = {
  calculateRSI,
  calculateEMA,
  calculateMACD,
  determineTrend,
  calculateSupportResistance,
  calculateVolatility,
  calculateMarketStrength
};
