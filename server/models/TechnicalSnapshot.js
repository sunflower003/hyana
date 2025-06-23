const mongoose = require('mongoose');

// Technical Analysis Snapshot Schema
const technicalSnapshotSchema = new mongoose.Schema({
  // Timestamp của snapshot
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },

  // Dữ liệu giá OHLC
  price: {
    open: {
      type: Number,
      required: true
    },
    high: {
      type: Number,
      required: true
    },
    low: {
      type: Number,
      required: true
    },
    close: {
      type: Number,
      required: true
    }
  },

  // Các chỉ báo kỹ thuật
  indicators: {
    // RSI (14 periods)
    RSI: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    // MACD components
    MACD: {
      line: Number,
      signal: Number,
      histogram: Number,
      trend: {
        type: String,
        enum: ['bullish', 'bearish', 'bullish_cross', 'bearish_cross', 'neutral']
      }
    },

    // EMA lines
    EMA_20: {
      type: Number,
      required: true
    },
    EMA_50: {
      type: Number,
      required: true
    },
    EMA_200: {
      type: Number,
      required: false // Optional vì có thể không đủ dữ liệu
    },

    // Trend direction
    trend: {
      type: String,
      required: true,
      enum: ['uptrend', 'downtrend', 'sideways']
    }
  },

  // Support/Resistance levels
  supportResistance: {
    support: [Number],
    resistance: [Number],
    pivotPoint: Number
  },

  // Market volatility
  volatility: {
    type: Number,
    required: true
  },

  // Market strength (0-100)
  strength: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },

  // Data source info
  dataSource: {
    type: String,
    default: 'finnhub',
    enum: ['finnhub', 'alpha_vantage', 'twelvedata', 'manual', 'mock']
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
technicalSnapshotSchema.index({ timestamp: -1 });
technicalSnapshotSchema.index({ 'indicators.trend': 1 });
technicalSnapshotSchema.index({ dataSource: 1 });

// Virtual for price change percentage
technicalSnapshotSchema.virtual('priceChange').get(function() {
  if (this.price.open && this.price.close) {
    return ((this.price.close - this.price.open) / this.price.open * 100).toFixed(2);
  }
  return 0;
});

// Static methods for common queries
technicalSnapshotSchema.statics.getLatest = function() {
  return this.findOne().sort({ timestamp: -1 });
};

technicalSnapshotSchema.statics.getLastNCandles = function(count = 20) {
  return this.find().sort({ timestamp: -1 }).limit(count);
};

technicalSnapshotSchema.statics.getTrendData = function(trend, limit = 10) {
  return this.find({ 'indicators.trend': trend })
    .sort({ timestamp: -1 })
    .limit(limit);
};

technicalSnapshotSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ timestamp: -1 });
};

technicalSnapshotSchema.statics.getDataSourceStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$dataSource',
        count: { $sum: 1 },
        latestTimestamp: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Instance methods
technicalSnapshotSchema.methods.getSignalStrength = function() {
  const { RSI, trend } = this.indicators;
  let signalStrength = 'neutral';
  
  if (trend === 'uptrend' && RSI < 65) {
    signalStrength = 'strong_buy';
  } else if (trend === 'uptrend' && RSI >= 65) {
    signalStrength = 'buy';
  } else if (trend === 'downtrend' && RSI > 35) {
    signalStrength = 'strong_sell';
  } else if (trend === 'downtrend' && RSI <= 35) {
    signalStrength = 'sell';
  }
  
  return signalStrength;
};

technicalSnapshotSchema.methods.toAnalysisFormat = function() {
  return {
    id: this._id,
    timestamp: this.timestamp,
    price: this.price,
    trend: this.indicators.trend,
    rsi: this.indicators.RSI,
    strength: this.strength,
    volatility: this.volatility,
    signal: this.getSignalStrength(),
    dataSource: this.dataSource,
    priceChange: this.priceChange
  };
};

// Pre-save middleware for validation
technicalSnapshotSchema.pre('save', function(next) {
  // Validate RSI range
  if (this.indicators.RSI < 0 || this.indicators.RSI > 100) {
    return next(new Error('RSI must be between 0 and 100'));
  }
  
  // Validate strength range
  if (this.strength < 0 || this.strength > 100) {
    return next(new Error('Strength must be between 0 and 100'));
  }
  
  // Validate price data
  if (this.price.high < this.price.low) {
    return next(new Error('High price cannot be lower than low price'));
  }
  
  if (this.price.close < this.price.low || this.price.close > this.price.high) {
    return next(new Error('Close price must be between low and high'));
  }
  
  next();
});

module.exports = mongoose.model('TechnicalSnapshot', technicalSnapshotSchema);