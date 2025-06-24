const mongoose = require('mongoose');

const economicFactorSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: [true, 'Event name is required'],
    maxlength: [200, 'Event name must be less than 200 characters'],
    trim: true,
    index: true
  },
  
  releaseDate: {
    type: Date,
    required: [true, 'Release date is required'],
    index: true
  },
  
  // Economic data values
  actual: {
    type: Number,
    default: null
  },
  
  forecast: {
    type: Number,
    default: null
  },
  
  previous: {
    type: Number,
    default: null
  },
  
  // For DXY and other price data
  change: {
    type: Number,
    default: null
  },
  
  changePercent: {
    type: Number,
    default: null
  },
  
  // AI Analysis Results
  sentiment: {
    type: String,
    enum: [
      'dovish_usd',      // USD yếu -> vàng tăng
      'hawkish_usd',     // USD mạnh -> vàng giảm
      'neutral',         // Trung tính
      'risk_on',         // Thích rủi ro -> vàng giảm
      'risk_off'         // Tránh rủi ro -> vàng tăng
    ],
    required: [true, 'Sentiment is required']
  },
  
  impactOnGold: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: [true, 'Impact on gold is required']
  },
  
  confidence: {
    type: Number,
    min: [0, 'Confidence must be between 0-100'],
    max: [100, 'Confidence must be between 0-100'],
    required: [true, 'Confidence is required']
  },
  
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    maxlength: [500, 'Summary must be less than 500 characters']
  },
  
  // Categories
  category: {
    type: String,
    enum: [
      'fed_policy',        // Fed & monetary policy
      'inflation',         // CPI, PPI, inflation data
      'employment',        // Jobs, unemployment
      'economic_growth',   // GDP, recession, expansion
      'consumer_data',     // Retail sales, consumer confidence
      'currency',          // DXY, forex
      'treasury',          // Bond yields
      'other'
    ],
    default: 'other'
  },
  
  importance: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Processing metadata
  source: {
    type: String,
    default: 'Finnhub'
  },
  
  isProcessed: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true
});

// Indexes for better query performance
economicFactorSchema.index({ releaseDate: -1 });
economicFactorSchema.index({ sentiment: 1, impactOnGold: 1 });
economicFactorSchema.index({ category: 1, releaseDate: -1 });
economicFactorSchema.index({ importance: 1, releaseDate: -1 });

// Compound index for recent important events
economicFactorSchema.index({ 
  importance: 1, 
  releaseDate: -1, 
  impactOnGold: 1 
});

// Static method để lấy events theo impact
economicFactorSchema.statics.getByImpact = function(impact, limit = 10) {
  return this.find({ 
    impactOnGold: impact,
    releaseDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 ngày gần nhất
  })
  .sort({ releaseDate: -1, confidence: -1 })
  .limit(limit);
};

// Static method để lấy events theo category
economicFactorSchema.statics.getByCategory = function(category, limit = 10) {
  return this.find({ 
    category: category,
    releaseDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 ngày gần nhất
  })
  .sort({ releaseDate: -1 })
  .limit(limit);
};

module.exports = mongoose.model('EconomicFactor', economicFactorSchema);