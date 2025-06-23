const axios = require('axios');
const News = require('../models/News');

/**
 * Service phân tích sentiment tin tức bằng AI
 * Lấy tin từ NewsAPI/GNews → HuggingFace → mapping tác động GOLD
 */
class SentimentService {
  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY;
    this.gNewsApiKey = process.env.GNEWS_API_KEY;
    this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
    
    // ✅ FIXED: Sử dụng model đã test thành công
    this.sentimentApiUrl = 'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment';
    
    // Backup model
    this.backupSentimentApiUrl = 'https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment';
    
    // Gold-related keywords for filtering
    this.goldKeywords = [
      'gold', 'fed', 'federal reserve', 'interest rate', 'inflation', 'cpi',
      'dxy', 'dollar', 'usd', 'powell', 'fomc', 'unemployment', 'jobs',
      'treasury', 'yield', 'geopolitical', 'war', 'crisis', 'recession',
      'gdp', 'ppi', 'nonfarm payrolls', 'retail sales'
    ];
  }

  /**
   * Main function: Lấy tin tức và phân tích sentiment
   */
  async updateNewsAnalysis() {
    try {
      console.log('\n🔄 Starting News Sentiment Analysis...');
      
      // 1. Lấy tin tức từ các nguồn
      const articles = await this.fetchLatestNews();
      
      if (!articles || articles.length === 0) {
        console.log('⚠️ No news articles found');
        return { success: false, message: 'No articles to process' };
      }

      console.log(`📰 Found ${articles.length} articles to analyze`);

      // 2. Phân tích sentiment từng bài
      let processedCount = 0;
      let savedCount = 0;

      for (const article of articles) {
        try {
          // Kiểm tra xem bài này đã xử lý chưa
          const existingNews = await News.findOne({
            title: article.title,
            source: article.source
          });

          if (existingNews) {
            console.log(`⏭️ Article already processed: ${article.title.substring(0, 50)}...`);
            continue;
          }

          // Phân tích sentiment
          const sentiment = await this.analyzeSentiment(article.content || article.title);
          
          // ✅ IMPROVED: Add confidence threshold
          if (sentiment.confidence < 60) {
            console.log(`⚠️ Low confidence (${sentiment.confidence}%) - skipping: ${article.title.substring(0, 50)}...`);
            continue;
          }
          
          // Mapping tác động lên vàng
          const goldImpact = this.mapSentimentToGoldImpact(sentiment, article.title + ' ' + (article.content || ''));

          // ✅ IMPROVED: Enhanced summary with reasons
          const summary = this.generateEnhancedSummary(article, sentiment, goldImpact);

          // Lưu vào database
          const newsData = {
            title: article.title,
            source: article.source,
            publishedAt: new Date(article.publishedAt),
            content: article.content || article.description || '',
            url: article.url,
            aiSentiment: goldImpact.sentiment,
            impactOnGold: goldImpact.impact,
            confidence: sentiment.confidence,
            summary: summary,
            category: this.categorizeNewsEnhanced(article.title + ' ' + (article.content || '')),
            keywords: this.extractKeywords(article.title + ' ' + (article.content || '')),
            // ✅ NEW: Add impact reasons
            impactReasons: goldImpact.reasons || [],
            contextScore: goldImpact.contextScore || 0,
            isProcessed: true
          };

          const newsItem = new News(newsData);
          await newsItem.save();
          
          savedCount++;
          console.log(`✅ Saved: ${article.title.substring(0, 50)}... | Impact: ${goldImpact.impact} (${sentiment.confidence}%)`);
          
        } catch (error) {
          console.error(`❌ Error processing article: ${error.message}`);
        }
        
        processedCount++;
        
        // Delay để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ News analysis completed: ${savedCount}/${processedCount} articles saved`);
      
      return {
        success: true,
        processed: processedCount,
        saved: savedCount,
        message: `Processed ${processedCount} articles, saved ${savedCount} new ones`
      };

    } catch (error) {
      console.error('❌ News Analysis Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lấy tin tức từ NewsAPI hoặc GNews
   */
  async fetchLatestNews() {
    try {
      let articles = [];

      // Try NewsAPI first
      if (this.newsApiKey && this.newsApiKey !== 'demo') {
        console.log('📡 Fetching from NewsAPI...');
        articles = await this.fetchFromNewsAPI();
      }

      // If NewsAPI fails or no key, try GNews
      if (articles.length === 0 && this.gNewsApiKey && this.gNewsApiKey !== 'demo') {
        console.log('📡 Fetching from GNews...');
        articles = await this.fetchFromGNews();
      }

      // Filter for gold-related articles
      const goldRelatedArticles = articles.filter(article => 
        this.isGoldRelated(article.title + ' ' + (article.content || article.description || ''))
      );

      console.log(`🔍 Filtered ${goldRelatedArticles.length}/${articles.length} gold-related articles`);
      
      return goldRelatedArticles.slice(0, 10); // Limit to 10 articles per run

    } catch (error) {
      console.error('❌ Fetch News Error:', error.message);
      return [];
    }
  }

  /**
   * Lấy tin từ NewsAPI
   */
  async fetchFromNewsAPI() {
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'gold OR fed OR "federal reserve" OR inflation OR "interest rate"',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 20,
          apiKey: this.newsApiKey
        },
        timeout: 15000
      });

      if (response.data.status === 'ok') {
        return response.data.articles.map(article => ({
          title: article.title,
          source: article.source.name,
          publishedAt: article.publishedAt,
          content: article.content,
          description: article.description,
          url: article.url
        }));
      }

      return [];
    } catch (error) {
      console.error('❌ NewsAPI Error:', error.message);
      return [];
    }
  }

  /**
   * Lấy tin từ GNews
   */
  async fetchFromGNews() {
    try {
      const response = await axios.get('https://gnews.io/api/v4/search', {
        params: {
          q: 'gold OR fed OR federal reserve OR inflation',
          lang: 'en',
          country: 'us',
          max: 20,
          apikey: this.gNewsApiKey
        },
        timeout: 15000
      });

      if (response.data.articles) {
        return response.data.articles.map(article => ({
          title: article.title,
          source: article.source.name,
          publishedAt: article.publishedAt,
          content: article.content,
          description: article.description,
          url: article.url
        }));
      }

      return [];
    } catch (error) {
      console.error('❌ GNews Error:', error.message);
      return [];
    }
  }

  /**
   * ✅ FIXED: Phân tích sentiment với model đã test thành công
   */
  async analyzeSentiment(text) {
    // Truncate text if too long
    const truncatedText = text.substring(0, 500);

    // ✅ Try primary model first
    try {
      console.log(`🤖 Analyzing sentiment with primary model...`);
      
      const response = await axios.post(
        this.sentimentApiUrl,
        { inputs: truncatedText },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingfaceApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data[0]) {
        const results = response.data[0];
        
        // ✅ Handle twitter-roberta format: LABEL_0, LABEL_1, LABEL_2
        let bestSentiment = results[0];
        for (const result of results) {
          if (result.score > bestSentiment.score) {
            bestSentiment = result;
          }
        }

        // ✅ Map LABEL format to readable sentiment
        let normalizedLabel = 'NEUTRAL';
        if (bestSentiment.label === 'LABEL_0') normalizedLabel = 'NEGATIVE';
        if (bestSentiment.label === 'LABEL_1') normalizedLabel = 'NEUTRAL'; 
        if (bestSentiment.label === 'LABEL_2') normalizedLabel = 'POSITIVE';

        console.log(`✅ Sentiment: ${normalizedLabel} (${(bestSentiment.score * 100).toFixed(1)}%)`);

        return {
          label: normalizedLabel,
          confidence: Math.round(bestSentiment.score * 100),
          model: 'twitter-roberta'
        };
      }

    } catch (error) {
      console.log(`❌ Primary model failed: ${error.message}`);
      
      // ✅ Try backup model
      try {
        console.log(`🤖 Trying backup model...`);
        
        const response = await axios.post(
          this.backupSentimentApiUrl,
          { inputs: truncatedText },
          {
            headers: {
              'Authorization': `Bearer ${this.huggingfaceApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        if (response.data && response.data[0]) {
          const results = response.data[0];
          
          // ✅ Handle star rating format: 1-5 stars
          let bestSentiment = results[0];
          for (const result of results) {
            if (result.score > bestSentiment.score) {
              bestSentiment = result;
            }
          }

          // ✅ Map star ratings to sentiment
          let normalizedLabel = 'NEUTRAL';
          if (bestSentiment.label.includes('1 star') || bestSentiment.label.includes('2 star')) {
            normalizedLabel = 'NEGATIVE';
          } else if (bestSentiment.label.includes('4 star') || bestSentiment.label.includes('5 star')) {
            normalizedLabel = 'POSITIVE';
          } else {
            normalizedLabel = 'NEUTRAL';
          }

          console.log(`✅ Backup sentiment: ${normalizedLabel} (${(bestSentiment.score * 100).toFixed(1)}%)`);

          return {
            label: normalizedLabel,
            confidence: Math.round(bestSentiment.score * 100),
            model: 'multilingual-bert'
          };
        }

      } catch (backupError) {
        console.log(`❌ Backup model also failed: ${backupError.message}`);
      }
    }

    // ✅ Enhanced fallback analysis
    console.log('🔄 Using enhanced fallback analysis...');
    return this.enhancedFallbackSentimentAnalysis(text);
  }

  /**
   * ✅ Enhanced fallback sentiment analysis for financial context
   */
  enhancedFallbackSentimentAnalysis(text) {
    const textLower = text.toLowerCase();
    
    // ✅ Financial-specific sentiment words
    const positiveWords = [
      'positive', 'good', 'increase', 'growth', 'strong', 'up', 'rise', 'gain',
      'bullish', 'optimistic', 'confident', 'surge', 'boost', 'improve', 'recovery',
      'dovish', 'stimulus', 'cut', 'lower', 'ease', 'support', 'rally'
    ];
    
    const negativeWords = [
      'negative', 'bad', 'decrease', 'fall', 'weak', 'down', 'drop', 'decline',
      'bearish', 'pessimistic', 'concern', 'crisis', 'crash', 'fear', 'uncertainty',
      'hawkish', 'tight', 'raise', 'hike', 'inflation', 'pressure', 'sell', 'dump'
    ];
    
    const neutralWords = [
      'neutral', 'stable', 'unchanged', 'maintain', 'hold', 'steady', 'flat',
      'sideways', 'pause', 'wait'
    ];

    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    // Count word occurrences with context weights
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) positiveScore += matches.length;
    });

    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) negativeScore += matches.length;
    });

    neutralWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) neutralScore += matches.length;
    });

    // ✅ Context-specific analysis for gold/finance
    if (/fed.*(pause|cut)|dovish|stimulus/i.test(text)) {
      positiveScore += 2; // Fed dovish = good for gold
    }
    
    if (/fed.*(hike|raise)|hawkish|tight/i.test(text)) {
      negativeScore += 2; // Fed hawkish = bad for gold
    }
    
    if (/crisis|war|uncertainty|geopolitical/i.test(text)) {
      positiveScore += 1; // Crisis = good for gold (safe haven)
    }

    // ✅ FIXED: Add missing opening parenthesis
    if (/(strong|robust).*economy/i.test(text)) {
      negativeScore += 1; // Strong economy = bad for gold
    }

    // Determine sentiment
    const total = positiveScore + negativeScore + neutralScore;
    
    if (total === 0) {
      return { label: 'NEUTRAL', confidence: 50, model: 'fallback' };
    }

    const maxScore = Math.max(positiveScore, negativeScore, neutralScore);
    const confidence = Math.min(85, Math.max(55, Math.round((maxScore / total) * 100 + 20)));

    if (positiveScore === maxScore) {
      return { label: 'POSITIVE', confidence, model: 'fallback' };
    } else if (negativeScore === maxScore) {
      return { label: 'NEGATIVE', confidence, model: 'fallback' };
    } else {
      return { label: 'NEUTRAL', confidence, model: 'fallback' };
    }
  }

  /**
   * ✅ IMPROVED: Enhanced gold impact mapping với context scoring
   */
  mapSentimentToGoldImpact(sentiment, content) {
    const contentLower = content.toLowerCase();
    
    let contextScore = 0;
    let impactReason = [];
    
    // ✅ Fed Policy Context (weight: high)
    const fedDovishPatterns = [
      /fed.*(pause|cut|lower|dovish|ease)/i,
      /powell.*(dovish|pause|cut)/i,
      /fomc.*(hold|pause|maintain)/i,
      /(stimulus|quantitative.easing|qe)/i
    ];
    
    const fedHawkishPatterns = [
      /fed.*(hike|raise|higher|hawkish|tight)/i,
      /powell.*(hawkish|aggressive|hike)/i,
      /fomc.*(increase|raise)/i,
      /(taper|reduce.*(stimulus|qe))/i
    ];
    
    // ✅ Economic Data Context (weight: medium)
    const inflationContext = [
      /cpi.*(lower|below|decrease)/i,   // Positive for gold
      /inflation.*(cool|slow|ease)/i,   // Positive for gold
      /ppi.*(drop|fall)/i               // Positive for gold
    ];
    
    const strongEconomyContext = [
      /gdp.*(strong|robust|exceed)/i,   // Negative for gold
      /employment.*(strong|beat)/i,     // Negative for gold
      /jobs.*(exceed|beat)/i            // Negative for gold
    ];
    
    // ✅ Risk Context (weight: high)
    const riskOffContext = [
      /(war|conflict|tension|crisis)/i,
      /(uncertainty|fear|safe.haven)/i,
      /(geopolitical|instability)/i
    ];
    
    const riskOnContext = [
      /(recovery|optimism|confidence)/i,
      /(risk.appetite|bull.market)/i,
      /(growth|expansion)/i
    ];
    
    // Calculate context scores
    fedDovishPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        contextScore += 3; // High weight
        impactReason.push('Fed dovish policy');
      }
    });
    
    fedHawkishPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        contextScore -= 3; // High weight
        impactReason.push('Fed hawkish policy');
      }
    });
    
    inflationContext.forEach(pattern => {
      if (pattern.test(content)) {
        contextScore += 2; // Medium weight
        impactReason.push('Lower inflation');
      }
    });
    
    strongEconomyContext.forEach(pattern => {
      if (pattern.test(content)) {
        contextScore -= 2; // Medium weight
        impactReason.push('Strong economy');
      }
    });
    
    riskOffContext.forEach(pattern => {
      if (pattern.test(content)) {
        contextScore += 2; // High weight for safe haven
        impactReason.push('Risk-off sentiment');
      }
    });
    
    riskOnContext.forEach(pattern => {
      if (pattern.test(content)) {
        contextScore -= 1; // Medium weight
        impactReason.push('Risk-on sentiment');
      }
    });
    
    // ✅ Determine final impact with enhanced logic
    let finalSentiment = 'neutral';
    let finalImpact = 'neutral';
    
    // Combine sentiment + context
    const sentimentScore = sentiment.label === 'POSITIVE' ? 1 : 
                          sentiment.label === 'NEGATIVE' ? -1 : 0;
    
    const totalScore = sentimentScore + contextScore;
    
    if (totalScore >= 2) {
      finalImpact = 'positive';
      if (impactReason.includes('Fed dovish policy')) {
        finalSentiment = 'dovish_usd';
      } else if (impactReason.includes('Risk-off sentiment')) {
        finalSentiment = 'risk_off';
      } else {
        finalSentiment = 'bullish_gold';
      }
    } else if (totalScore <= -2) {
      finalImpact = 'negative';
      if (impactReason.includes('Fed hawkish policy')) {
        finalSentiment = 'hawkish_usd';
      } else if (impactReason.includes('Strong economy')) {
        finalSentiment = 'risk_on';
      } else {
        finalSentiment = 'bearish_gold';
      }
    } else {
      finalImpact = 'neutral';
      finalSentiment = 'neutral';
    }
    
    return { 
      sentiment: finalSentiment, 
      impact: finalImpact,
      contextScore: totalScore,
      reasons: impactReason
    };
  }

  /**
   * ✅ IMPROVED: Enhanced categorization with more specific categories
   */
  categorizeNewsEnhanced(content) {
    const contentLower = content.toLowerCase();
    
    // Fed Policy (highest priority)
    if (/fed|federal.reserve|powell|fomc|monetary.policy/i.test(content)) {
      return 'fed_policy';
    }
    
    // Inflation Data
    if (/cpi|ppi|inflation|deflation|price.index|core.inflation/i.test(content)) {
      return 'inflation';
    }
    
    // Employment Data
    if (/employment|jobs|unemployment|nonfarm.payrolls|jobless|labor.market/i.test(content)) {
      return 'employment';
    }
    
    // GDP & Economic Growth
    if (/gdp|economic.growth|recession|expansion|contraction/i.test(content)) {
      return 'economic_growth';
    }
    
    // Retail & Consumer Data
    if (/retail.sales|consumer.spending|consumer.confidence|personal.income/i.test(content)) {
      return 'consumer_data';
    }
    
    // Geopolitical Events
    if (/war|conflict|tension|crisis|geopolitical|sanctions|trade.war/i.test(content)) {
      return 'geopolitical';
    }
    
    // Central Bank (other than Fed)
    if (/ecb|boe|boj|pboc|central.bank|interest.rate/i.test(content)) {
      return 'central_bank';
    }
    
    // Market Sentiment
    if (/sentiment|market|trading|investor|bulls|bears|volatility/i.test(content)) {
      return 'market_sentiment';
    }
    
    // Currency & DXY
    if (/dollar|dxy|currency|forex|exchange.rate/i.test(content)) {
      return 'currency';
    }
    
    // Commodities (Gold specific)
    if (/gold|precious.metals|commodities|mining/i.test(content)) {
      return 'commodities';
    }
    
    return 'other';
  }

  /**
   * Kiểm tra tin có liên quan đến vàng không
   */
  isGoldRelated(text) {
    const textLower = text.toLowerCase();
    return this.goldKeywords.some(keyword => textLower.includes(keyword));
  }

  /**
   * Trích xuất keywords
   */
  extractKeywords(content) {
    const keywords = [];
    const contentLower = content.toLowerCase();
    
    this.goldKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        keywords.push(keyword);
      }
    });
    
    return keywords.slice(0, 5); // Limit to 5 keywords
  }

  /**
   * ✅ IMPROVED: Enhanced summary with detailed reasoning
   */
  generateEnhancedSummary(article, sentiment, goldImpact) {
    const impact = goldImpact.impact === 'positive' ? '📈 TĂNG' : 
                   goldImpact.impact === 'negative' ? '📉 GIẢM' : '➡️ TRUNG TÍNH';
    
    const sentimentIcon = goldImpact.sentiment === 'dovish_usd' ? '🕊️' :
                         goldImpact.sentiment === 'hawkish_usd' ? '🦅' :
                         goldImpact.sentiment === 'risk_off' ? '🛡️' :
                         goldImpact.sentiment === 'risk_on' ? '🚀' :
                         '⚖️';
    
    const sentimentText = goldImpact.sentiment === 'dovish_usd' ? 'Fed nới lỏng → USD yếu' :
                         goldImpact.sentiment === 'hawkish_usd' ? 'Fed thắt chặt → USD mạnh' :
                         goldImpact.sentiment === 'risk_off' ? 'Tránh rủi ro → Safe haven' :
                         goldImpact.sentiment === 'risk_on' ? 'Thích rủi ro → Risk assets' :
                         'Trung tính';
    
    let reasonsText = '';
    if (goldImpact.reasons && goldImpact.reasons.length > 0) {
      reasonsText = ` | Lý do: ${goldImpact.reasons.join(', ')}`;
    }
    
    return `${sentimentIcon} ${sentimentText} → GOLD ${impact} (${sentiment.confidence}%)${reasonsText}`;
  }
}

module.exports = SentimentService;