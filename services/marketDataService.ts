
import { MarketIndicator, EconomicPoint, MarketScenario, SignalType } from '../types';

// Helper to generate a date range
const generateTimeSeries = (scenario: MarketScenario, months: number = 60): { dates: string[], isForecast: boolean } => {
  const dates: string[] = [];
  const today = new Date();
  const isForecast = scenario !== 'Current';

  for (let i = 0; i < months; i++) {
    const d = new Date(today);
    if (isForecast) {
      // Future: Start next month
      d.setMonth(today.getMonth() + i);
    } else {
      // Past: Start 5 years ago
      d.setMonth(today.getMonth() - (months - 1) + i);
    }
    // Format: "Jan 24"
    dates.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
  }
  return { dates, isForecast };
};

// --- Data Generators ---

const generateYieldCurve = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  return dates.map((date, i) => {
    let value = 0;
    if (!isForecast) {
      if (i < 24) value = 0.2 + (i/24) * 0.8; 
      else if (i < 48) value = 1.0 - ((i-24)/24) * 1.5; 
      else value = -0.5 - Math.sin((i-48)/5) * 0.2;
    } else {
      if (scenario === 'Housing Crisis') { value = -0.5 + (i * 0.15); if (value > 2.5) value = 2.5; }
      else if (scenario === 'Inflation Shock') { value = -0.8 - (Math.random() * 0.3); }
      else if (scenario === 'Tech Bubble') { value = 0.2 - (i * 0.05); }
    }
    return { date, value };
  });
};

const generateJoblessClaims = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  return dates.map((date, i) => {
    let value = 210000;
    if (!isForecast) {
      if (i > 5 && i < 15) value = 400000 + Math.random() * 200000; 
      else value = 200000 + (i * 500) + (Math.random() * 20000);
    } else {
      if (scenario === 'Housing Crisis') { const ramp = Math.min(i, 12) / 12; value = 220000 + (ramp * 400000); } 
      else if (scenario === 'Tech Bubble') { if (i < 36) value = 190000 + (Math.random() * 10000); else value = 250000 + ((i-36) * 10000); } 
      else { value = 220000 + (i * 2000); }
    }
    return { date, value };
  });
};

const generateSpreads = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  return dates.map((date, i) => {
    let value = 3.5;
    if (!isForecast) {
      if (i > 5 && i < 15) value = 8.0; 
      else if (i < 30) value = 3.0;
      else value = 3.2 + ((i-30)/30) * 1.5;
    } else {
      if (scenario === 'Housing Crisis') value = 4.0 + (i * 0.2); 
      else if (scenario === 'Tech Bubble') { if (i < 30) value = 2.8; else value = 5.0 + ((i-30) * 0.3); }
      else if (scenario === 'Inflation Shock') value = 4.0 + (Math.random() * 1.0);
    }
    return { date, value };
  });
};

const generateBuildingPermits = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  return dates.map((date, i) => {
    let value = 1500;
    if (!isForecast) {
      if (i < 36) value = 1400 + (i * 20);
      else value = 1800 - ((i-36) * 15);
    } else {
      if (scenario === 'Housing Crisis') value = 1400 * Math.pow(0.95, i); 
      else if (scenario === 'Inflation Shock') value = 1400 - (i * 10); 
      else value = 1500 + (Math.sin(i/10) * 100); 
    }
    return { date, value };
  });
};

const generateSentimentVsSP500 = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  let spVal = isForecast ? 5200 : 3200; 
  return dates.map((date, i) => {
    let sentiment = 75;
    if (!isForecast) {
      if (i < 12) spVal *= 1.01; else if (i < 15) spVal *= 0.85; else if (i < 36) spVal *= 1.02; else if (i < 48) spVal *= 0.99; else spVal *= 1.015;
      sentiment = 80 + (Math.sin(i/10) * 20);
    } else {
      if (scenario === 'Housing Crisis') { spVal *= 0.98; sentiment = 70 - i; } 
      else if (scenario === 'Tech Bubble') { if (i < 24) spVal *= 1.02; else spVal *= 0.95; sentiment = i < 24 ? 95 : 50; } 
      else if (scenario === 'Inflation Shock') { spVal *= 1.002; sentiment = 60 + (Math.random() * 5); }
    }
    return { date, value: sentiment, value2: spVal };
  });
};

const generateM2 = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  return dates.map((date, i) => {
    let value = 5.0;
    if (!isForecast) {
       if (i > 10 && i < 24) value = 25.0; else if (i > 40) value = -2.0 - (Math.random());
    } else {
       if (scenario === 'Inflation Shock') value = 8.0 + (i * 0.2);
       else if (scenario === 'Housing Crisis') value = 15.0; 
       else value = 3.0 + (Math.random() * 2);
    }
    return { date, value };
  });
};

const generateTradeBalance = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  return dates.map((date, i) => {
    let value = -60;
    if (!isForecast) value = -50 - (i * 0.5); 
    else {
      if (scenario === 'Housing Crisis') value = -60 + (i * 0.8); 
      else value = -80 - (Math.random() * 10);
    }
    return { date, value };
  });
};

const generateDurableGoods = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  return dates.map((date, i) => {
    let value = 240;
    if (!isForecast) value = 240 + (i * 1.5);
    else {
      if (scenario === 'Housing Crisis') value = 300 * Math.pow(0.98, i);
      else value = 300 + (i * 0.5);
    }
    return { date, value };
  });
};

const generateCopper = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  return dates.map((date, i) => {
    let value = 3.0;
    if (!isForecast) value = 2.5 + (i * 0.03) + (Math.random() * 0.5);
    else {
       if (scenario === 'Housing Crisis') value = 4.0 * Math.pow(0.97, i);
       else value = 4.0 + (i * 0.02);
    }
    return { date, value };
  });
};

// --- NEW GENERATORS ---

const generateFedLiquidity = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  const data: EconomicPoint[] = [];
  // Base values in Billions
  let walcl = 7500; // Fed Assets
  let tga = 750;    // Treasury General Account
  let rrp = 1500;   // Reverse Repo

  // Moving Average Helper
  const windowSize = 3; // Approx 3 month window for simulation visual
  const history: number[] = [];

  dates.forEach((date, i) => {
    if (!isForecast) {
      walcl += (Math.random() - 0.4) * 50; 
      // TGA Cycles (Tax Season April)
      if (date.includes('Apr')) tga += 200; else tga -= 20;
      if (tga < 200) tga = 400;
      
      rrp -= 30; // Draining RRP
      if (rrp < 300) rrp = 300;
    } else {
      if (scenario === 'Inflation Shock') { walcl -= 100; rrp += 50; } // QT
      else if (scenario === 'Housing Crisis') { walcl += 200; } // QE
      else { walcl -= 20; rrp -= 20; }
    }

    const netLiquidity = walcl - (tga + rrp);
    history.push(netLiquidity);
    if (history.length > windowSize) history.shift();
    const sma = history.reduce((a,b)=>a+b, 0) / history.length;

    data.push({ date, value: netLiquidity, value2: sma });
  });
  return data;
};

const generateMarketBreadth = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  let adLine = 10000;
  // Use SP500 from other gen or simulate simple track for divergence
  let sp500 = 4000;

  return dates.map((date, i) => {
    let move = 0;
    let spMove = 0;

    if (!isForecast) {
      // Simulate recent divergence: SP500 up, AD Line flat/down
      if (i > dates.length - 14) { 
         move = -50 - (Math.random() * 100); // AD Down
         spMove = 20 + (Math.random() * 10); // SP Up
      } else {
         move = 100 + (Math.random() * 200 - 100);
         spMove = 10 + (Math.random() * 40 - 20);
      }
    } else {
      if (scenario === 'Tech Bubble') { move = -200; spMove = 50; } // Classic Divergence
      else if (scenario === 'Housing Crisis') { move = -500; spMove = -100; }
      else { move = 50; spMove = 10; }
    }

    adLine += move;
    sp500 += spMove;
    // Normalize SP500 to fit on chart or just use for logic?
    // We will return SP500 as value2 just for the Alert Logic check in component
    return { date, value: adLine, value2: sp500 };
  });
};

const generateRealRates = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  return dates.map((date, i) => {
    let value = 1.5;
    if (!isForecast) {
      // Trending up recently
      value = 0.5 + (i / dates.length) * 1.7; 
    } else {
      if (scenario === 'Inflation Shock') value = 2.5 + (Math.random() * 0.5);
      else if (scenario === 'Housing Crisis') value = 0.5; // Fed cuts
      else value = 1.8 + (Math.random() * 0.4);
    }
    return { date, value };
  });
};

const generateAviationCorrelation = (scenario: MarketScenario): EconomicPoint[] => {
  const { dates, isForecast } = generateTimeSeries(scenario);
  return dates.map((date, i) => {
    let corr = -0.6; // Base negative correlation
    if (!isForecast) {
       // Volatile correlation
       corr = -0.6 + (Math.sin(i/5) * 0.3);
    } else {
       if (scenario === 'Inflation Shock') corr = -0.9; // Oil drives everything
       else corr = -0.5 + (Math.random() * 0.2);
    }
    return { date, value: corr };
  });
};

// --- Statistics Helper ---
const calculateStats = (data: EconomicPoint[]) => {
    const values = data.map(d => d.value);
    return {
        high5y: Math.max(...values),
        low5y: Math.min(...values),
        avg5y: values.reduce((a,b) => a+b, 0) / values.length
    };
};

export const getMarketIndicators = (scenario: MarketScenario = 'Current'): MarketIndicator[] => {
  const yieldData = generateYieldCurve(scenario);
  const joblessData = generateJoblessClaims(scenario);
  const spreadsData = generateSpreads(scenario);
  const permitsData = generateBuildingPermits(scenario);
  const sentimentData = generateSentimentVsSP500(scenario);
  const durableData = generateDurableGoods(scenario);
  const tradeData = generateTradeBalance(scenario);
  const m2Data = generateM2(scenario);
  const copperData = generateCopper(scenario);
  
  // New Data
  const liquidityData = generateFedLiquidity(scenario);
  const breadthData = generateMarketBreadth(scenario);
  const realRatesData = generateRealRates(scenario);
  const aviationData = generateAviationCorrelation(scenario);

  const currentYield = yieldData[yieldData.length - 1].value;
  const currentJobless = joblessData[joblessData.length - 1].value;
  const currentSpread = spreadsData[spreadsData.length - 1].value;
  const currentPermits = permitsData[permitsData.length - 1].value;
  const currentSentiment = sentimentData[sentimentData.length - 1].value;
  const currentSP500 = sentimentData[sentimentData.length - 1].value2 || 0;
  const currentDurable = durableData[durableData.length - 1].value;
  const currentTrade = tradeData[tradeData.length - 1].value;
  const currentM2 = m2Data[m2Data.length - 1].value;
  const currentCopper = copperData[copperData.length - 1].value;
  
  const currentLiquidity = liquidityData[liquidityData.length - 1].value;
  const currentBreadth = breadthData[breadthData.length - 1].value;
  const currentRealRate = realRatesData[realRatesData.length - 1].value;
  const currentAviationCorr = aviationData[aviationData.length - 1].value;

  let currentVix = 13.5;
  if (scenario === 'Housing Crisis') currentVix = 45.0;
  if (scenario === 'Tech Bubble') currentVix = 35.0;
  if (scenario === 'Inflation Shock') currentVix = 28.0;

  // --- Logic for Signals ---
  const getYieldSignal = (val: number): SignalType => val < 0 ? 'Bearish' : val < 0.2 ? 'Caution' : 'Neutral';
  const getJoblessSignal = (val: number): SignalType => val > 300000 ? 'Bearish' : val < 200000 ? 'Bullish' : 'Neutral';
  const getSpreadSignal = (val: number): SignalType => val > 5 ? 'Bearish' : val < 3 ? 'Bullish' : 'Neutral';
  const getSentimentSignal = (val: number): SignalType => val < 60 ? 'Bearish' : val > 90 ? 'Caution' : 'Neutral';
  const getPermitsSignal = (val: number): SignalType => val < 1300 ? 'Bearish' : 'Bullish';
  const getM2Signal = (val: number): SignalType => val < 0 ? 'Caution' : val > 10 ? 'Caution' : 'Neutral';
  const getCopperSignal = (val: number): SignalType => val > 4 ? 'Bullish' : val < 3 ? 'Bearish' : 'Neutral';
  const getVixSignal = (val: number): SignalType => val > 30 ? 'Strong Buy' : val > 20 ? 'Caution' : 'Neutral'; // VIX > 30 is contrarian buy
  
  const getLiquiditySignal = (val: number): SignalType => val > 6000 ? 'Bullish' : 'Caution';
  const getBreadthSignal = (val: number): SignalType => 'Neutral'; // Calculated in component via divergence
  const getRealRateSignal = (val: number): SignalType => val > 2.0 ? 'Bearish' : val < 0.5 ? 'Bullish' : 'Neutral';

  return [
    {
      id: 'yield_curve',
      title: '10Y-2Y Treasury Spread',
      category: 'Macro',
      source: 'FRED: T10Y2Y',
      description: 'The difference between long-term and short-term interest rates. The "Gold Standard" recession predictor.',
      implication: 'Inversion (negative) signals bond investors expect a crash. Recession probable within 6-18 months.',
      action: currentYield < 0 ? 'Shorten duration, increase cash' : 'Maintain standard allocation',
      signal: getYieldSignal(currentYield),
      currentValue: currentYield,
      stats: calculateStats(yieldData),
      status: currentYield < 0 ? 'danger' : 'success',
      data: yieldData,
      format: 'percent'
    },
    {
      id: 'm2',
      title: 'M2 Money Supply (YoY)',
      category: 'Macro',
      source: 'FRED: M2SL',
      description: 'The aggregate supply of cash and checking deposits in the US economy.',
      implication: 'Negative M2 (Contraction) is rare and deflationary. It acts as a brake on asset prices and economic activity.',
      action: currentM2 < 0 ? 'Avoid leverage, favor quality' : 'Inflation hedge needed',
      signal: getM2Signal(currentM2),
      currentValue: currentM2,
      stats: calculateStats(m2Data),
      status: currentM2 > 10 || currentM2 < 0 ? 'warning' : 'success',
      data: m2Data,
      format: 'percent'
    },
    {
      id: 'trade_balance',
      title: 'Trade Balance',
      category: 'Macro',
      source: 'FRED: BOPGSTB',
      description: 'Net difference between exports and imports.',
      implication: 'Deep deficits imply strong US consumer demand but reliance on foreign production. Often correlated with strong USD.',
      action: 'Monitor currency exposure',
      signal: 'Neutral',
      currentValue: currentTrade,
      stats: calculateStats(tradeData),
      status: 'warning',
      data: tradeData,
      format: 'currency'
    },
    {
      id: 'fed_liquidity',
      title: 'Fed Net Liquidity',
      category: 'Liquidity',
      source: 'FRED: WALCL - TGA - RRP',
      description: 'The actual amount of central bank liquidity available to support asset markets.',
      implication: 'Rising liquidity correlates strongly with rising equity prices. Falling liquidity creates headwinds.',
      action: currentLiquidity > 6000 ? 'Risk On' : 'Reduce Beta',
      signal: getLiquiditySignal(currentLiquidity),
      currentValue: currentLiquidity,
      stats: calculateStats(liquidityData),
      status: currentLiquidity > 6000 ? 'success' : 'warning',
      data: liquidityData,
      format: 'currency'
    },
    {
      id: 'copper',
      title: 'Copper Futures',
      category: 'Macro',
      source: 'Yahoo: HG=F',
      description: '"Dr. Copper" predicts global industrial expansion.',
      implication: 'Rising copper suggests global manufacturing is expanding. Falling copper warns of an industrial slowdown.',
      action: currentCopper > 4 ? 'Overweight Industrials/Materials' : 'Underweight Cyclicals',
      signal: getCopperSignal(currentCopper),
      currentValue: currentCopper,
      stats: calculateStats(copperData),
      status: 'success',
      data: copperData,
      format: 'currency'
    },
    {
      id: 'breadth',
      title: 'Market Breadth (A/D Line)',
      category: 'Technical',
      source: 'NYSE: ADD',
      description: 'Cumulative line of Advancing stocks minus Declining stocks.',
      implication: 'Divergence (Price Up, Breadth Down) is a major reversal signal. It means the rally is narrow and fragile.',
      action: 'Watch for Divergence Alert',
      signal: getBreadthSignal(currentBreadth),
      currentValue: currentBreadth,
      stats: calculateStats(breadthData),
      status: 'success', // Logic handled in component
      data: breadthData,
      format: 'number'
    },
    {
      id: 'real_rates',
      title: '10Y Real Interest Rates',
      category: 'Valuation',
      source: 'US Treasury: TIPS',
      description: 'Nominal 10Y Yield minus Inflation Expectations.',
      implication: 'Real Rates represent the true cost of capital. Rates > 2.0% crush P/E multiples for Growth stocks.',
      action: currentRealRate > 2.0 ? 'Favor Value/Cash Flows' : 'Long Duration Growth',
      signal: getRealRateSignal(currentRealRate),
      currentValue: currentRealRate,
      stats: calculateStats(realRatesData),
      status: currentRealRate > 2.0 ? 'danger' : 'success',
      data: realRatesData,
      format: 'percent'
    },
    {
      id: 'jobless_claims',
      title: 'Initial Jobless Claims',
      category: 'Consumer',
      source: 'FRED: ICSA',
      description: 'Weekly filings for unemployment insurance.',
      implication: 'The most real-time recession warning. A rapid vertical spike suggests immediate labor market distress.',
      action: currentJobless > 300000 ? 'Defensive rotation immediately' : 'Stay the course',
      signal: getJoblessSignal(currentJobless),
      currentValue: currentJobless,
      stats: calculateStats(joblessData),
      status: currentJobless > 300000 ? 'danger' : 'success',
      data: joblessData,
      format: 'number'
    },
    {
      id: 'sentiment',
      title: 'Consumer Sentiment',
      category: 'Consumer',
      source: 'FRED: UMCSENT',
      description: 'Survey of how consumers feel about their finances.',
      implication: 'Drives 70% of GDP. Low readings (<65) precede spending cuts. High readings favor discretionary sectors.',
      action: currentSentiment < 65 ? 'Overweight Staples/Utilities' : 'Overweight Discretionary',
      signal: getSentimentSignal(currentSentiment),
      currentValue: currentSentiment,
      stats: calculateStats(sentimentData),
      status: currentSentiment < 65 ? 'danger' : currentSentiment < 80 ? 'warning' : 'success',
      data: sentimentData,
      format: 'number'
    },
    {
      id: 'building_permits',
      title: 'Building Permits',
      category: 'Consumer',
      source: 'FRED: PERMIT',
      description: 'Authorization for new private housing units.',
      implication: 'Leading indicator. A downtrend signals contracting construction jobs and reduced demand for raw materials.',
      action: currentPermits < 1300 ? 'Avoid Homebuilders' : 'Monitor Real Estate',
      signal: getPermitsSignal(currentPermits),
      currentValue: currentPermits,
      stats: calculateStats(permitsData),
      status: 'warning',
      data: permitsData,
      format: 'number'
    },
    {
      id: 'vix',
      title: 'The VIX (Fear Gauge)',
      category: 'Risk',
      source: 'CBOE',
      description: 'Implied volatility of S&P 500 options.',
      implication: 'Extreme highs (>30) signal panic and often mark a market bottom (buying opportunity). Lows (<15) suggest complacency.',
      action: currentVix > 30 ? 'Deploy Cash (Buy the dip)' : 'Hedge downside',
      signal: getVixSignal(currentVix),
      currentValue: currentVix, 
      stats: { high5y: 80, low5y: 10, avg5y: 18 }, // Manual override for VIX typicals
      status: currentVix > 25 ? 'danger' : 'success',
      data: [], 
      format: 'number'
    },
    {
      id: 'credit_spreads',
      title: 'High Yield Spreads',
      category: 'Risk',
      source: 'FRED: BAMLH0A0HYM2',
      description: 'Yield gap between "Junk Bonds" and Safe Treasuries.',
      implication: 'Spikes indicate credit markets are freezing. Lenders fear default. A major "Risk-Off" signal.',
      action: currentSpread > 5 ? 'Exit High Yield / Leverage' : 'Yield seeking okay',
      signal: getSpreadSignal(currentSpread),
      currentValue: currentSpread,
      stats: calculateStats(spreadsData),
      status: currentSpread > 5.0 ? 'danger' : 'success',
      data: spreadsData,
      format: 'percent'
    },
    {
      id: 'sp500',
      title: 'S&P 500 Price',
      category: 'Risk',
      source: 'Yahoo: ^GSPC',
      description: 'Primary US Equity benchmark performance.',
      implication: 'The ultimate scorecard. Sustained drops below the 200-day moving average signal a "Risk-Off" regime.',
      action: 'Trend following',
      signal: 'Neutral',
      currentValue: currentSP500,
      stats: { ...calculateStats(sentimentData), high5y: 5200, low5y: 2200 }, // using rough scaling
      status: 'success',
      data: sentimentData, 
      format: 'number'
    },
    {
      id: 'aviation_corr',
      title: 'Aviation vs Fuel Correlation',
      category: 'Sector',
      source: 'Cross-Ref: BZ=F vs ^XAL',
      description: 'Rolling 60-day correlation between Brent Crude Oil and Airline Stocks.',
      implication: 'Strong negative correlation means fuel costs are the primary driver of airline stock prices. Decoupling implies demand is overpowering cost.',
      action: currentAviationCorr < -0.8 ? 'Hedge with Oil' : 'Focus on Passenger Load',
      signal: 'Neutral',
      currentValue: currentAviationCorr,
      stats: calculateStats(aviationData),
      status: 'warning',
      data: aviationData,
      format: 'number'
    },
    {
      id: 'durable_goods',
      title: 'Durable Goods Orders',
      category: 'Risk',
      source: 'FRED: DGORDER',
      description: 'New orders for hard goods (machines, planes).',
      implication: 'Proxy for business confidence. Rising trends signal corporate expansion and technology investment.',
      action: 'Monitor Tech/Industrial Capex',
      signal: 'Neutral',
      currentValue: currentDurable, 
      stats: calculateStats(durableData),
      status: 'success',
      data: durableData,
      format: 'currency'
    }
  ];
};

