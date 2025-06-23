const mongoose = require('mongoose');

const economicFactorSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: [true, 'Event name is required'],
    maxlength: [200, 'Event name must be less than 200 characters'],
    trim: true
  },
  
  releaseDate: {
    type: Date,
    required: [true, 'Release date is required'],
    index: true
  },
  
  // Economic Data Values
  actual: {
    type: Number,
    required: [true, 'Actual value is required']
  },
  
  forecast: {
    type: Number,
    required: [true, 'Forecast value is required']
  },
  
  previous: {
    type: Number,
    required: [true, 'Previous value is required']
  },
  
  // Analysis Results
  sentiment: {
    type: String,
    enum: [
      'hawkish_usd',     // USD mạnh -> vàng giảm
      'dovish_usd',      // USD yếu -> vàng tăng
      'bullish_gold',    // Trực tiếp tích cực cho vàng
      'bearish_gold',    // Trực tiếp tiêu cực cho vàng
      'neutral'
    ],
    required: [true, 'Sentiment is required']
  },
  
  impactOnGold: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: [true, 'Impact on gold is required']
  },
  
  note: {
    type: String,
    required: [true, 'Analysis note is required'],
    maxlength: [500, 'Note must be less than 500 characters']
  },
  
  // Event Classification
  category: {
    type: String,
    enum: [
      'inflation',       // CPI, PPI, PCE
      'employment',      // NFP, Unemployment Rate
      'fed_policy',      // Fed Rate, FOMC
      'gdp',            // GDP, GDP Growth
      'retail',         // Retail Sales, Consumer Spending
      'manufacturing',   // PMI, Industrial Production
      'housing',        // Housing Starts, Sales
      'trade',          // Trade Balance, Exports/Imports
      'other'
    ],
    required: [true, 'Category is required']
  },
  
  country: {
    type: String,
    default: 'US',
    enum: ['US', 'EU', 'UK', 'CN', 'JP', 'Other']
  },
  
  // Impact metrics
  importance: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: [true, 'Importance level is required']
  },
  
  deviation: {
    type: Number,
    default: 0 // Actual vs Forecast deviation
  },
  
  deviationPercent: {
    type: Number,
    default: 0
  },
  
  // Data source
  dataSource: {
    type: String,
    default: 'fred',
    enum: ['fred', 'finnhub', 'forexfactory', 'manual']
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware để tính deviation
economicFactorSchema.pre('save', function(next) {
  if (this.actual !== undefined && this.forecast !== undefined) {
    this.deviation = this.actual - this.forecast;
    
    if (this.forecast !== 0) {
      this.deviationPercent = ((this.actual - this.forecast) / Math.abs(this.forecast) * 100);
    }
  }
  next();
});

// Indexes
economicFactorSchema.index({ releaseDate: -1 });
economicFactorSchema.index({ category: 1, releaseDate: -1 });
economicFactorSchema.index({ importance: 1, releaseDate: -1 });
economicFactorSchema.index({ impactOnGold: 1, releaseDate: -1 });

// Static methods
economicFactorSchema.statics.getRecentEvents = function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    releaseDate: { $gte: startDate }
  }).sort({ releaseDate: -1 });
};

economicFactorSchema.statics.getByCategory = function(category, limit = 10) {
  return this.find({ category })
    .sort({ releaseDate: -1 })
    .limit(limit);
};

module.exports = mongoose.model('EconomicFactor', economicFactorSchema);