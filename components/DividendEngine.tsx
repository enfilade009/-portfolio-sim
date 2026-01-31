import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, TrendingUp, Layers, Activity,
  Search, ChevronDown, ChevronUp, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight,
  Building, Landmark, Banknote, PieChart, CalendarCheck, Sparkles, Shield, AlertTriangle, Snowflake, Briefcase, Info, List,
  Target
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, PieChart as RePieChart, Pie, Cell as PieCell,
  AreaChart, Area, Legend
} from 'recharts';
import { DividendHolding, PayoutPattern } from '../types';
import { ValidatedInput } from './ValidatedInput';
import { analyzeDividendLadder, fetchTickerData } from '../services/dividendService';
import { COLORS } from '../constants';

const PAYOUT_PATTERNS: PayoutPattern[] = [
  'Monthly',
  'Q-Jan/Apr/Jul/Oct',
  'Q-Feb/May/Aug/Nov',
  'Q-Mar/Jun/Sep/Dec',
  'Semi-Annual',
  'Annual'
];

// Consistent Palette for Stacked Charts
const PALETTE = [
  COLORS.slate,
  COLORS.sage,
  COLORS.blue,
  COLORS.terra,
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#6366F1', // Indigo
];

const formatCurrency = (val: number) => {
    const absVal = Math.abs(val);
    let formatted = '';

    if (absVal >= 1000000) {
      formatted = `$${(absVal / 1000000).toFixed(2)}M`;
    } else if (absVal >= 1000) {
      formatted = `$${(absVal / 1000).toFixed(0)}k`;
    } else {
      formatted = `$${Math.round(absVal).toLocaleString()}`;
    }

    return val < 0 ? `(${formatted})` : formatted;
};

// Monte Carlo Utils
const normalRandom = (mean: number, stdDev: number) => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdDev + mean;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + (typeof entry.value === 'number' ? entry.value : 0), 0);
    const target = payload[0].payload.target || 0;
    const gap = total - target;

    return (
      <div className="bg-nordic-slate dark:bg-slate-800 text-nordic-oatmeal dark:text-white p-4 rounded-xl shadow-xl border border-gray-700 z-50 min-w-[220px]">
        <div className="flex items-center gap-2 mb-3 border-b border-gray-600 pb-2">
           <CalendarCheck size={16} className="text-nordic-blue"/>
           <span className="font-bold text-base text-white">{label} Cashflow</span>
        </div>

        <div className="space-y-2 mb-3">
            {payload.map((entry: any, index: number) => (
                entry.name !== 'target' && entry.value > 0 && (
                  <div key={index} className="flex justify-between items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-gray-300 font-medium">{entry.name}</span>
                    </div>
                    <span className="font-mono font-bold text-white">${Math.round(entry.value).toLocaleString()}</span>
                  </div>
                )
            ))}
        </div>

        <div className="pt-2 border-t border-gray-600 space-y-2">
            <div className="flex justify-between items-center gap-4">
                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total</span>
                <span className="font-mono font-bold text-white text-base">${Math.round(total).toLocaleString()}</span>
            </div>
             <div className="flex justify-between items-center gap-4">
                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Target</span>
                <span className="font-mono text-gray-500">${Math.round(target).toLocaleString()}</span>
            </div>
             <div className={`flex justify-between items-center gap-4 px-2 py-1 rounded ${gap >= 0 ? 'bg-nordic-sage/20' : 'bg-nordic-terra/20'}`}>
                <span className={`text-xs uppercase font-black ${gap >= 0 ? 'text-nordic-sageLight' : 'text-nordic-terraLight'}`}>
                   {gap >= 0 ? 'Surplus' : 'Deficit'}
                </span>
                <span className={`font-mono font-black text-sm ${gap >= 0 ? 'text-nordic-sageLight' : 'text-nordic-terraLight'}`}>
                   {gap >= 0 ? '+' : ''}${Math.round(gap).toLocaleString()}
                </span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomSnowballTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-nordic-slate dark:bg-slate-800 text-nordic-oatmeal dark:text-white p-4 rounded-xl shadow-xl border border-gray-700 z-50 min-w-[240px]">
        <div className="flex items-center gap-2 mb-3 border-b border-gray-600 pb-2">
           <Snowflake size={16} className="text-nordic-blue"/>
           <span className="font-bold text-base text-white">Year {label} Forecast</span>
        </div>

        <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center gap-4 mb-1">
                  <span className="text-nordic-blue font-bold uppercase text-xs tracking-wider">Median Outcome</span>
                  <span className="font-mono font-black text-white text-lg">{formatCurrency(data.p50)}</span>
              </div>
              <div className="text-[10px] text-gray-400 mb-2">Expected annual income</div>
              <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-nordic-blue w-1/2 opacity-100"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
              <div>
                 <span className="text-[9px] text-gray-400 uppercase font-bold block mb-0.5">Conservative</span>
                 <span className="font-mono text-gray-300 font-bold">{formatCurrency(data.p10)}</span>
              </div>
              <div className="text-right">
                 <span className="text-[9px] text-gray-400 uppercase font-bold block mb-0.5">Optimistic</span>
                 <span className="font-mono text-gray-300 font-bold">{formatCurrency(data.p90)}</span>
              </div>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-nordic-slate dark:bg-slate-800 text-nordic-oatmeal dark:text-white p-3 rounded-xl shadow-xl text-xs border border-gray-700 z-50 min-w-[180px]">
        <div className="flex items-center gap-2 mb-2 border-b border-gray-600 pb-2">
           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }}></div>
           <span className="font-bold text-sm text-white">{data.name}</span>
        </div>
        <div className="space-y-2">
           <div className="flex justify-between gap-4">
              <span className="text-gray-400 font-medium">Capital:</span>
              <span className="font-mono font-bold text-gray-200">{formatCurrency(data.value)}</span>
           </div>
           <div className="flex justify-between gap-4">
              <span className="text-gray-400 font-medium">Income:</span>
              <span className="font-mono font-bold text-nordic-sageLight">{formatCurrency(data.income)}</span>
           </div>
           <div className="pt-2 mt-1 border-t border-gray-700 flex justify-between gap-4">
              <span className="text-gray-400 font-medium">Income Share:</span>
              <span className="font-black text-white">{data.incomePct.toFixed(1)}%</span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

export const DividendEngine: React.FC = () => {
  const [targetMonthlyIncome, setTargetMonthlyIncome] = useState(2000);
  const [holdings, setHoldings] = useState<DividendHolding[]>([
    { id: '1', ticker: 'O', shares: 100, costBasis: 48.50, currentPrice: 58.20, annualDividendPerShare: 3.12, dividendGrowthRate: 0.03, payoutPattern: 'Monthly', type: 'REIT', sector: 'Real Estate', payoutRatio: 0.75 },
    { id: '2', ticker: 'KO', shares: 50, costBasis: 52.00, currentPrice: 61.50, annualDividendPerShare: 1.84, dividendGrowthRate: 0.045, payoutPattern: 'Q-Jan/Apr/Jul/Oct', type: 'Stock', sector: 'Cons. Staples', payoutRatio: 0.68 },
    { id: '3', ticker: 'SCHD', shares: 200, costBasis: 71.00, currentPrice: 78.00, annualDividendPerShare: 2.65, dividendGrowthRate: 0.08, payoutPattern: 'Q-Mar/Jun/Sep/Dec', type: 'Bond/ETF', sector: 'ETF', payoutRatio: 0 }
  ]);

  // UI State
  const [mobileView, setMobileView] = useState<'holdings' | 'analysis'>('analysis');
  const [analysis, setAnalysis] = useState<string>("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isHoldingsExpanded, setIsHoldingsExpanded] = useState(true);
  const [fetchingTickerId, setFetchingTickerId] = useState<string | null>(null);
  const [reinvestDividends, setReinvestDividends] = useState(true);
  const [allocationView, setAllocationView] = useState<'Type' | 'Sector'>('Type');

  // --- Calculations ---

  const calculateMonthlyCashFlow = () => {
    // Structure: Array of 12 objects. Each object has { total: number, 'Sector A': number, 'Sector B': number ... }
    const months = Array.from({ length: 12 }, () => ({ total: 0 } as Record<string, number>));

    holdings.forEach(h => {
      const annualTotal = h.shares * h.annualDividendPerShare;
      const sectorKey = h.sector || 'Unclassified';
      let payMonths: number[] = [];

      switch (h.payoutPattern) {
        case 'Monthly': payMonths = [0,1,2,3,4,5,6,7,8,9,10,11]; break;
        case 'Q-Jan/Apr/Jul/Oct': payMonths = [0, 3, 6, 9]; break;
        case 'Q-Feb/May/Aug/Nov': payMonths = [1, 4, 7, 10]; break;
        case 'Q-Mar/Jun/Sep/Dec': payMonths = [2, 5, 8, 11]; break;
        case 'Semi-Annual': payMonths = [5, 11]; break;
        case 'Annual': payMonths = [11]; break;
        default: payMonths = [0];
      }

      if (payMonths.length > 0) {
        const payPerPeriod = annualTotal / payMonths.length;
        payMonths.forEach(m => {
            months[m].total += payPerPeriod;
            months[m][sectorKey] = (months[m][sectorKey] || 0) + payPerPeriod;
        });
      }
    });

    return months;
  };

  const rawMonthlyData = calculateMonthlyCashFlow();

  // Extract unique sectors for Stacked Bar keys
  const uniqueSectors = useMemo(() => {
      const sectors = new Set<string>();
      holdings.forEach(h => sectors.add(h.sector || 'Unclassified'));
      return Array.from(sectors);
  }, [holdings]);

  const monthlyData = rawMonthlyData.map((data, idx) => {
    const date = new Date();
    date.setMonth(idx);
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      ...data, // Spread sector values
      target: targetMonthlyIncome,
    };
  });

  const totalAnnualDividend = holdings.reduce((sum, h) => sum + (h.shares * h.annualDividendPerShare), 0);
  const totalCostBasis = holdings.reduce((sum, h) => sum + (h.shares * h.costBasis), 0);
  const totalMarketValue = holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);

  const portfolioYieldOnCost = totalCostBasis > 0 ? (totalAnnualDividend / totalCostBasis) * 100 : 0;
  const portfolioCurrentYield = totalMarketValue > 0 ? (totalAnnualDividend / totalMarketValue) * 100 : 0;

  const totalUnrealizedGain = totalMarketValue - totalCostBasis;
  const totalUnrealizedGainPct = totalCostBasis > 0 ? (totalUnrealizedGain / totalCostBasis) * 100 : 0;

  const coverageRatio = (totalAnnualDividend / 12) / targetMonthlyIncome * 100;

  // --- Composition Data ---
  const typeAllocation = useMemo(() => {
     const alloc: Record<string, { value: number, income: number, count: number }> = {};

     holdings.forEach(h => {
        const key = allocationView === 'Type' ? h.type : (h.sector || 'Unclassified');
        if (!alloc[key]) alloc[key] = { value: 0, income: 0, count: 0 };
        alloc[key].value += h.shares * h.currentPrice;
        alloc[key].income += h.shares * h.annualDividendPerShare;
        alloc[key].count++;
     });

     return Object.keys(alloc).map(key => ({
        name: key,
        value: alloc[key].value,
        income: alloc[key].income,
        valuePct: totalMarketValue > 0 ? (alloc[key].value / totalMarketValue) * 100 : 0,
        incomePct: totalAnnualDividend > 0 ? (alloc[key].income / totalAnnualDividend) * 100 : 0
     })).sort((a,b) => b.value - a.value);
  }, [holdings, totalMarketValue, totalAnnualDividend, allocationView]);

  // --- Forecast Simulation (The Snowball) ---
  const forecastData = useMemo(() => {
    const years = 20;
    const iterations = 100; // Monte Carlo iterations per year
    const results: any[] = [];
    const currentYear = new Date().getFullYear();

    // Volatility Profiles (Std Dev) based on Asset Class
    const VOLATILITY_PROFILE: Record<string, { div: number, price: number }> = {
       'Stock': { div: 0.065, price: 0.16 },     // Stocks: ~6.5% div vol, ~16% price vol
       'REIT': { div: 0.10, price: 0.20 },       // REITs: Higher sensitivity
       'Bond/ETF': { div: 0.04, price: 0.08 },   // Bonds: More stable
       'T-Bill': { div: 0.005, price: 0.01 }     // Cash: Very stable
    };

    for (let y = 0; y <= years; y++) {
        const yearIncomeSamples: number[] = [];

        for (let i = 0; i < iterations; i++) {
            let iterationTotalIncome = 0;

            holdings.forEach(h => {
                const vol = VOLATILITY_PROFILE[h.type] || VOLATILITY_PROFILE['Stock'];

                let currentDivRate = h.annualDividendPerShare;
                let currentShares = h.shares;
                let currentPrice = h.currentPrice;

                for (let step = 0; step < y; step++) {
                    // 1. Stochastic Dividend Growth
                    const divGrowthShock = normalRandom(h.dividendGrowthRate, vol.div);

                    let realizedDivGrowth = divGrowthShock;
                    if (realizedDivGrowth < 0 && realizedDivGrowth > -0.05) {
                        realizedDivGrowth = 0;
                    }
                    realizedDivGrowth = Math.max(-0.50, realizedDivGrowth);

                    currentDivRate *= (1 + realizedDivGrowth);
                    if (currentDivRate < 0) currentDivRate = 0;

                    if (reinvestDividends) {
                        const income = currentShares * currentDivRate;

                        // 2. Price Movement for Reinvestment
                        const priceShock = normalRandom(h.dividendGrowthRate, vol.price);
                        currentPrice *= (1 + priceShock);

                        if (currentPrice > 0.01) {
                            const newShares = income / currentPrice;
                            currentShares += newShares;
                        }
                    }
                }
                iterationTotalIncome += currentShares * currentDivRate;
            });
            yearIncomeSamples.push(iterationTotalIncome);
        }

        yearIncomeSamples.sort((a, b) => a - b);
        results.push({
            year: currentYear + y,
            p10: yearIncomeSamples[Math.floor(iterations * 0.1)],
            p50: yearIncomeSamples[Math.floor(iterations * 0.5)],
            p90: yearIncomeSamples[Math.floor(iterations * 0.9)],
        });
    }
    return results;
  }, [holdings, reinvestDividends]);


  // --- Helpers ---

  const getHoldingConfig = (type: string) => {
    switch (type) {
      case 'REIT':
        return {
          labels: { amount: 'Shares', cost: 'Avg Cost', price: 'Mkt Price', income: 'Div/Share' },
          icon: <Building size={18} className="text-nordic-sage" />
        };
      case 'Bond/ETF':
        return {
          labels: { amount: 'Units', cost: 'Avg Cost', price: 'NAV/Price', income: 'Ann Payout' },
          icon: <Landmark size={18} className="text-nordic-blue" />
        };
      case 'T-Bill':
        return {
          labels: { amount: 'Face Val', cost: 'Cost', price: 'Mkt Price', income: 'Implied Yield' },
          icon: <Shield size={18} className="text-nordic-terra" />
        };
      default: // Stock
        return {
          labels: { amount: 'Shares', cost: 'Avg Cost', price: 'Mkt Price', income: 'Div/Share' },
          icon: <TrendingUp size={18} className="text-nordic-blue" />
        };
    }
  };

  const getSafetyBadge = (h: DividendHolding) => {
    if (h.type === 'Bond/ETF' || h.type === 'T-Bill') {
      return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 uppercase">N/A</span>;
    }

    // Safety Logic
    const ratio = h.payoutRatio || 0;
    const isReit = h.type === 'REIT';

    let status = 'Safe';
    let color = 'bg-nordic-sage text-white';

    if (isReit) {
       if (ratio > 1.2) { status = 'Risk'; color = 'bg-nordic-terra text-white'; }
       else if (ratio > 0.95) { status = 'Tight'; color = 'bg-yellow-400 text-yellow-900'; }
    } else {
       if (ratio > 0.9) { status = 'Danger'; color = 'bg-nordic-terra text-white'; }
       else if (ratio > 0.70) { status = 'High'; color = 'bg-yellow-400 text-yellow-900'; }
    }

    if (!ratio) return null;

    return (
       <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${color} shadow-sm`}>
         {status} ({(ratio*100).toFixed(0)}%)
       </div>
    );
  };

  // --- Handlers ---

  const addHolding = () => {
    const newH: DividendHolding = {
      id: Date.now().toString(),
      ticker: 'Ticker',
      shares: 0,
      costBasis: 0,
      currentPrice: 0,
      annualDividendPerShare: 0,
      dividendGrowthRate: 0.05,
      payoutPattern: 'Q-Jan/Apr/Jul/Oct',
      type: 'Stock',
      sector: 'Unclassified'
    };
    setHoldings([newH, ...holdings]); // Add to top
    setIsHoldingsExpanded(true);
  };

  const updateHolding = (id: string, field: keyof DividendHolding, val: any) => {
    setHoldings(holdings.map(h => h.id === id ? { ...h, [field]: val } : h));
  };

  const removeHolding = (id: string) => {
    setHoldings(holdings.filter(h => h.id !== id));
  };

  const handleFetchData = async (id: string, ticker: string) => {
      if (!ticker || ticker === 'Ticker') return;
      setFetchingTickerId(id);

      const data = await fetchTickerData(ticker);

      if (data) {
          setHoldings(prev => prev.map(h => {
              if (h.id !== id) return h;

              let mappedPattern: PayoutPattern = 'Q-Jan/Apr/Jul/Oct';
              const freq = data.frequency.toLowerCase();
              const months = data.paymentMonths.join(' ').toLowerCase();

              // Intelligent Mapping based on sourced data
              if (freq.includes('month') || months.split(',').length >= 10) {
                  mappedPattern = 'Monthly';
              } else if (freq.includes('semi') || months.split(',').length === 2) {
                  mappedPattern = 'Semi-Annual';
              } else if (freq.includes('annual') && !freq.includes('semi')) {
                  mappedPattern = 'Annual';
              } else {
                  // Quarterly detection logic
                  if (months.includes('jan') || months.includes('apr') || months.includes('jul')) mappedPattern = 'Q-Jan/Apr/Jul/Oct';
                  else if (months.includes('feb') || months.includes('may') || months.includes('aug')) mappedPattern = 'Q-Feb/May/Aug/Nov';
                  else if (months.includes('mar') || months.includes('jun') || months.includes('sep')) mappedPattern = 'Q-Mar/Jun/Sep/Dec';
              }

              return {
                  ...h,
                  currentPrice: data.price,
                  annualDividendPerShare: data.dividend,
                  dividendGrowthRate: data.growth,
                  payoutPattern: mappedPattern,
                  sector: data.sector,
                  payoutRatio: data.payoutRatio
              };
          }));
      } else {
          alert(`Could not fetch data for ${ticker}. Check symbol.`);
      }
      setFetchingTickerId(null);
  };

  const handleRunAnalysis = async () => {
    setLoadingAnalysis(true);
    const result = await analyzeDividendLadder(holdings, targetMonthlyIncome);
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  const aiSections = analysis.split('|||').map(s => s.trim());

  // Pie Chart Colors
  const PIE_COLORS = [COLORS.slate, COLORS.sage, COLORS.blue, COLORS.terra, '#F59E0B', '#6366F1', '#8B5CF6'];

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-nordic-oatmeal dark:bg-slate-950 relative">

      {/* Mobile View Toggle */}
      <div className="md:hidden flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 shrink-0">
         <button
            onClick={() => setMobileView('holdings')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileView === 'holdings' ? 'text-nordic-blue border-b-2 border-nordic-blue bg-blue-50/50 dark:bg-slate-800' : 'text-gray-400 dark:text-gray-500'}`}
         >
            <Layers size={14} /> Holdings
         </button>
         <button
            onClick={() => setMobileView('analysis')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileView === 'analysis' ? 'text-nordic-blue border-b-2 border-nordic-blue bg-blue-50/50 dark:bg-slate-800' : 'text-gray-400 dark:text-gray-500'}`}
         >
            <TrendingUp size={14} /> Ladder Analysis
         </button>
      </div>

      {/* LEFT SIDEBAR: Strategy & Holdings */}
      <aside className={`w-full md:w-[450px] bg-white dark:bg-slate-900 border-r border-nordic-muted dark:border-slate-800 flex flex-col h-full shadow-soft z-10 transition-transform md:translate-x-0 ${mobileView === 'holdings' ? 'translate-x-0 block' : '-translate-x-full hidden md:flex'}`}>

        {/* Fixed Header Area */}
        <div className="p-6 pb-4 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
           <div className="flex items-center gap-2 mb-4">
              <PieChart size={18} className="text-nordic-blue"/>
              <h3 className="text-base font-bold uppercase tracking-wider text-nordic-slate dark:text-white">Income Strategy</h3>
           </div>

           {/* Target Section */}
           <div className="bg-nordic-oatmeal dark:bg-slate-800 p-4 rounded-xl border border-nordic-muted dark:border-slate-700">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                   Monthly Target
                </h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${coverageRatio >= 100 ? 'bg-nordic-sage text-white' : 'bg-nordic-terraLight text-nordic-terra'}`}>
                   {coverageRatio.toFixed(0)}% Covered
                </span>
             </div>
             <div className="flex items-center gap-3">
                <ValidatedInput
                   value={targetMonthlyIncome}
                   onChange={setTargetMonthlyIncome}
                   min={0}
                   prefix="$"
                   step={100}
                   className="flex-1 bg-white dark:bg-slate-900 shadow-sm border-gray-200 dark:border-slate-600 dark:text-white"
                />
             </div>
           </div>
        </div>

        {/* Scrollable Holdings Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2">

            {/* Holdings Header/Toggle */}
            <div
              onClick={() => setIsHoldingsExpanded(!isHoldingsExpanded)}
              className="flex justify-between items-center mb-4 cursor-pointer group select-none sticky top-0 bg-white dark:bg-slate-900 z-10 py-2 border-b border-gray-100 dark:border-slate-800 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90"
            >
               <div className="flex items-center gap-2">
                  <Layers size={16} className="text-nordic-slate dark:text-white" />
                  <h3 className="text-xs font-black uppercase text-nordic-slate dark:text-white tracking-widest">Holdings</h3>
                  <span className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-1.5 rounded-md">{holdings.length}</span>
               </div>

               <div className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400">
                  {isHoldingsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
               </div>
            </div>

            {isHoldingsExpanded && (
             <div className="space-y-4 animate-fade-in pb-10">
                <button
                  onClick={addHolding}
                  className="w-full py-2.5 bg-nordic-slate dark:bg-slate-700 text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 text-xs font-bold shadow-md mb-2"
                >
                   <Plus size={14} /> Add Position manually
                </button>

                {holdings.map((h, idx) => {
                   const config = getHoldingConfig(h.type);
                   const totalHoldingsValue = h.shares * h.currentPrice;
                   const totalHoldingsCost = h.shares * h.costBasis;
                   const gain = totalHoldingsValue - totalHoldingsCost;
                   const gainPct = h.costBasis > 0 ? (gain / totalHoldingsCost) * 100 : 0;
                   const annualIncome = h.shares * h.annualDividendPerShare;
                   const yoc = h.costBasis > 0 ? (h.annualDividendPerShare / h.costBasis) * 100 : 0;
                   const currentYield = h.currentPrice > 0 ? (h.annualDividendPerShare / h.currentPrice) * 100 : 0;

                   return (
                   <div key={h.id} className="bg-nordic-oatmeal dark:bg-slate-800 p-4 rounded-xl border border-transparent hover:border-nordic-blue/30 transition-all group relative">
                      {/* Header: Icon, Ticker, Type */}
                      <div className="flex justify-between items-center mb-4">
                         <div className="flex items-center gap-2 flex-1">
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700 shadow-sm">
                              {config.icon}
                            </div>
                            <div className="flex flex-col">
                                <div className="relative flex items-center">
                                    <input
                                       value={h.ticker}
                                       onChange={(e) => updateHolding(h.id, 'ticker', e.target.value.toUpperCase())}
                                       onKeyDown={(e) => {
                                           if (e.key === 'Enter') handleFetchData(h.id, h.ticker);
                                       }}
                                       className="w-20 font-black text-sm text-nordic-slate dark:text-white uppercase bg-white dark:bg-slate-900 rounded px-1.5 py-0.5 border border-gray-200 dark:border-slate-700 focus:ring-1 focus:ring-nordic-blue outline-none transition-all placeholder-gray-300"
                                       placeholder="SYM"
                                    />
                                    <button
                                        onClick={() => handleFetchData(h.id, h.ticker)}
                                        disabled={fetchingTickerId === h.id}
                                        className="ml-1 p-1 text-nordic-blue hover:bg-blue-50 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                                        title="Fetch Real-Time Data (Price & Divs)"
                                    >
                                        {fetchingTickerId === h.id ? <Loader2 size={14} className="animate-spin"/> : <Search size={14} />}
                                    </button>
                                </div>
                                {/* Sector Tag */}
                                {h.sector && h.sector !== 'Unclassified' && (
                                  <span className="text-[9px] text-gray-400 font-medium ml-1 truncate max-w-[80px]">{h.sector}</span>
                                )}
                            </div>
                         </div>

                         <div className="flex flex-col items-end gap-1">
                             <div className="flex items-center gap-2">
                                 <select
                                    value={h.type}
                                    onChange={(e) => updateHolding(h.id, 'type', e.target.value)}
                                    className="text-[10px] font-bold text-gray-400 bg-white dark:bg-slate-900 rounded px-1.5 py-1 border border-gray-200 dark:border-slate-700 shadow-sm outline-none cursor-pointer hover:text-nordic-blue uppercase tracking-wide"
                                 >
                                    <option>Stock</option>
                                    <option>REIT</option>
                                    <option>Bond/ETF</option>
                                    <option>T-Bill</option>
                                 </select>
                                 <button onClick={() => removeHolding(h.id)} className="text-gray-300 hover:text-nordic-terra p-1">
                                    <Trash2 size={14} />
                                 </button>
                             </div>
                             {/* Safety Badge */}
                             {getSafetyBadge(h)}
                         </div>
                      </div>

                      {/* Main Data Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                         <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase">{config.labels.amount}</label>
                            <ValidatedInput className="w-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 dark:text-white" value={h.shares} onChange={(v) => updateHolding(h.id, 'shares', v)} min={0} />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase">{config.labels.cost}</label>
                            <ValidatedInput className="w-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 dark:text-white" value={h.costBasis} onChange={(v) => updateHolding(h.id, 'costBasis', v)} min={0} prefix="$" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase">{config.labels.price}</label>
                            <ValidatedInput className="w-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 dark:text-white" value={h.currentPrice} onChange={(v) => updateHolding(h.id, 'currentPrice', v)} min={0} prefix="$" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase">{config.labels.income}</label>
                            <ValidatedInput className="w-full bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 dark:text-white" value={h.annualDividendPerShare} onChange={(v) => updateHolding(h.id, 'annualDividendPerShare', v)} min={0} prefix="$" />
                         </div>
                      </div>

                      {/* Yield Comparisons */}
                      <div className="mb-4 bg-white dark:bg-slate-900 rounded-lg p-2 border border-gray-100 dark:border-slate-700 flex justify-between items-center">
                          <div>
                              <div className="text-[9px] font-bold text-gray-400 uppercase">Yield on Cost</div>
                              <div className="text-xs font-black text-nordic-slate dark:text-white">{yoc.toFixed(2)}%</div>
                          </div>
                          <div className="h-4 w-px bg-gray-200 dark:bg-slate-700"></div>
                          <div className="text-right">
                              <div className="text-[9px] font-bold text-gray-400 uppercase">Current Yield</div>
                              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">{currentYield.toFixed(2)}%</div>
                          </div>
                      </div>

                      {/* Footer: Summary & Payout */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-700 flex justify-between items-center shadow-sm">
                         <div>
                            <select
                                value={h.payoutPattern}
                                onChange={(e) => updateHolding(h.id, 'payoutPattern', e.target.value)}
                                className="text-[10px] font-bold text-gray-500 bg-transparent border-none outline-none cursor-pointer hover:text-nordic-slate dark:hover:text-white w-28"
                            >
                                {PAYOUT_PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <div className="text-[10px] font-medium text-gray-400 mt-0.5">Frequency</div>
                         </div>

                         <div className="text-right">
                             <div className="text-sm font-black text-nordic-slate dark:text-white flex items-center justify-end gap-1">
                                {formatCurrency(annualIncome)}
                                <span className="text-[9px] text-gray-400 font-normal uppercase">/ yr</span>
                             </div>
                             <div className={`text-[10px] font-bold flex items-center justify-end gap-1 ${gain >= 0 ? 'text-nordic-sage' : 'text-nordic-terra'}`}>
                                {gain >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {gainPct.toFixed(1)}% Gain
                             </div>
                         </div>
                      </div>
                   </div>
                )})}
             </div>
            )}
        </div>

        {/* Added Footer to Sidebar */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 flex-shrink-0 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1 mb-1">
               <Shield size={10} /> Portfolio Sim
            </p>
            <p className="text-[9px] text-gray-300 dark:text-gray-600">
               © 2026 T. Cooney | Financial Simulation Tool | Not Financial Advice
            </p>
        </div>
      </aside>

      {/* RIGHT MAIN PANEL: Visualization & Analysis */}
      <main className={`flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar transition-transform ${mobileView === 'analysis' ? 'block' : 'hidden md:block'}`}>
         {/* ... (rest of main content is unchanged) */}
         <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-4xl font-light text-nordic-slate dark:text-white mb-3 tracking-tight">Dividend Engine</h2>
                <p className="text-nordic-charcoal dark:text-gray-400 max-w-xl text-base leading-relaxed">
                  Design your passive income stream. Analyze monthly gaps, optimize yield efficiency, and build a ladder that pays you year-round.
                </p>
              </div>
         </div>

         <div className="space-y-8 pb-12">

            {/* Top Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-slate-700 hover:-translate-y-1 transition-transform duration-300">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Annual Income</p>
                  <p className="text-3xl font-black text-nordic-slate dark:text-white tracking-tighter">${Math.round(totalAnnualDividend).toLocaleString()}</p>
               </div>

               <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-slate-700 hover:-translate-y-1 transition-transform duration-300">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unrealized Gain</p>
                  <div className={`flex items-baseline gap-2 ${totalUnrealizedGain >= 0 ? 'text-nordic-sage' : 'text-nordic-terra'}`}>
                      <p className="text-3xl font-black tracking-tighter">
                        {totalUnrealizedGain >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedGain)}
                      </p>
                      <span className="text-xs font-bold">({totalUnrealizedGainPct.toFixed(1)}%)</span>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-slate-700 hover:-translate-y-1 transition-transform duration-300">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Income Gap (Avg)</p>
                  <p className={`text-3xl font-black tracking-tighter ${totalAnnualDividend/12 < targetMonthlyIncome ? 'text-nordic-terra' : 'text-nordic-sage'}`}>
                     ${Math.round((totalAnnualDividend/12) - targetMonthlyIncome).toLocaleString()}
                  </p>
               </div>

               <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-soft border border-gray-100 dark:border-slate-700 hover:-translate-y-1 transition-transform duration-300">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Portfolio YOC</p>
                  <div className="flex items-center gap-4 mt-2">
                      <div>
                          <span className="text-[9px] text-gray-400 uppercase block font-bold">On Cost</span>
                          <span className="text-xl font-black text-nordic-sage">{portfolioYieldOnCost.toFixed(2)}%</span>
                      </div>
                      <div className="h-8 w-px bg-gray-200 dark:bg-slate-600"></div>
                      <div>
                          <span className="text-[9px] text-gray-400 uppercase block font-bold">Current</span>
                          <span className="text-xl font-bold text-gray-400">{portfolioCurrentYield.toFixed(2)}%</span>
                      </div>
                  </div>
               </div>
            </div>

            {/* Cash Flow Map (Stacked Bar) */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card border border-transparent relative">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                  <div>
                     <h3 className="text-xl font-black text-nordic-slate dark:text-white">Monthly Cash Flow Map</h3>
                     <p className="text-sm text-gray-400 font-medium mt-1">Projected Dividends by Sector vs. Income Target</p>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-bold bg-nordic-oatmeal dark:bg-slate-700 px-4 py-2 rounded-lg">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-0 border-t-2 border-dashed border-nordic-terra"></div> <span className="text-nordic-terra">Target Line</span>
                     </div>
                  </div>
               </div>

               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={monthlyData} margin={{top: 20, right: 10, left: 0, bottom: 0}} stackOffset="sign">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 700}}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `$${v}`}
                            tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 700}}
                        />
                        <Tooltip content={<CustomBarTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                        <ReferenceLine y={targetMonthlyIncome} stroke={COLORS.terra} strokeWidth={2} strokeDasharray="4 4" />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                        {uniqueSectors.map((sector, idx) => (
                           <Bar
                             key={sector}
                             dataKey={sector}
                             stackId="a"
                             fill={PALETTE[idx % PALETTE.length]}
                             radius={idx === uniqueSectors.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                           />
                        ))}
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Portfolio X-Ray Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-transparent overflow-hidden">
                <div className="p-8 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="bg-nordic-oatmeal dark:bg-slate-700 p-2 rounded text-nordic-slate dark:text-white">
                         <List size={20} />
                      </div>
                      <div>
                         <h3 className="text-lg font-bold text-nordic-slate dark:text-white">Portfolio X-Ray</h3>
                         <p className="text-xs text-gray-400">Holdings Performance & Risk Audit</p>
                      </div>
                   </div>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-xs text-left">
                      <thead className="bg-nordic-oatmeal dark:bg-slate-700 text-gray-500 dark:text-gray-300 font-bold uppercase tracking-wider">
                         <tr>
                            <th className="px-6 py-4">Asset</th>
                            <th className="px-6 py-4 text-right">Market Value</th>
                            <th className="px-6 py-4 text-right">Gain/Loss</th>
                            <th className="px-6 py-4 text-center">Income Weight</th>
                            <th className="px-6 py-4 text-right">Yield Spread (YOC vs Curr)</th>
                            <th className="px-6 py-4 text-right">Annual Income</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                         {holdings.map((h) => {
                             const mv = h.shares * h.currentPrice;
                             const gain = mv - (h.shares * h.costBasis);
                             const gainPct = h.costBasis > 0 ? (gain / (h.shares * h.costBasis)) * 100 : 0;
                             const income = h.shares * h.annualDividendPerShare;
                             const incomeWeight = totalAnnualDividend > 0 ? (income / totalAnnualDividend) * 100 : 0;
                             const yoc = h.costBasis > 0 ? (h.annualDividendPerShare / h.costBasis) * 100 : 0;
                             const cy = h.currentPrice > 0 ? (h.annualDividendPerShare / h.currentPrice) * 100 : 0;
                             const yieldDiff = yoc - cy;

                             return (
                                <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                   <td className="px-6 py-4 font-bold text-nordic-slate dark:text-white">
                                      <div className="flex items-center gap-2">
                                        <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">{h.ticker}</span>
                                        <span className="text-[10px] text-gray-400 font-normal">{h.type}</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-right text-nordic-slate dark:text-white font-mono">
                                      {formatCurrency(mv)}
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <div className={`font-bold ${gain >= 0 ? 'text-nordic-sage' : 'text-nordic-terra'}`}>
                                         {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                                      </div>
                                      <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                         <div
                                           className={`h-full ${gain >= 0 ? 'bg-nordic-sage' : 'bg-nordic-terra'}`}
                                           style={{ width: `${Math.min(Math.abs(gainPct), 100)}%` }}
                                         />
                                      </div>
                                   </td>
                                   <td className="px-6 py-4">
                                      <div className="flex flex-col items-center gap-1">
                                         <span className="font-bold text-gray-600 dark:text-gray-400">{incomeWeight.toFixed(0)}%</span>
                                         <div className="w-16 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-nordic-blue" style={{ width: `${Math.min(incomeWeight, 100)}%` }}></div>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                         <span className="font-black text-nordic-slate dark:text-white text-sm">{yoc.toFixed(2)}%</span>
                                         {yieldDiff > 0 ? (
                                            <div className="flex items-center text-[10px] text-nordic-sage font-bold bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                                                <ArrowUpRight size={10} /> +{yieldDiff.toFixed(1)}%
                                            </div>
                                         ) : (
                                            <div className="flex items-center text-[10px] text-gray-400 font-medium">
                                                <span className="text-[8px] mr-1">MKT</span> {cy.toFixed(2)}%
                                            </div>
                                         )}
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-right font-bold text-nordic-sage font-mono">
                                      {formatCurrency(income)}
                                   </td>
                                </tr>
                             );
                         })}
                      </tbody>
                      {/* X-Ray Footer Totals */}
                      <tfoot className="bg-nordic-oatmeal dark:bg-slate-700 border-t-2 border-gray-200 dark:border-slate-600">
                          <tr>
                              <td className="px-6 py-4 font-black text-nordic-slate dark:text-white text-sm">TOTALS</td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-nordic-slate dark:text-white text-sm">
                                  {formatCurrency(totalMarketValue)}
                                  <div className="text-[10px] text-gray-400 font-normal">Cost: {formatCurrency(totalCostBasis)}</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className={`font-bold text-sm ${totalUnrealizedGain >= 0 ? 'text-nordic-sage' : 'text-nordic-terra'}`}>
                                      {totalUnrealizedGain >= 0 ? '+' : ''}{totalUnrealizedGainPct.toFixed(1)}%
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-normal">{formatCurrency(totalUnrealizedGain)}</div>
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-gray-400 text-[10px]">
                                  100%
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                     <span className="font-black text-nordic-slate dark:text-white text-sm">{portfolioYieldOnCost.toFixed(2)}%</span>
                                     <span className="text-xs text-gray-400">vs {portfolioCurrentYield.toFixed(2)}%</span>
                                  </div>
                                  <div className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Weighted Avg</div>
                              </td>
                              <td className="px-6 py-4 text-right font-black text-nordic-sage font-mono text-sm">
                                  {formatCurrency(totalAnnualDividend)}
                                  <div className="text-[10px] text-gray-400 font-normal">~{formatCurrency(totalAnnualDividend/12)}/mo</div>
                              </td>
                          </tr>
                      </tfoot>
                   </table>
                </div>
            </div>

            {/* NEW: Composition & Forecast Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Allocation Matrix */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card border border-transparent">
                   <div className="flex items-center justify-between gap-3 mb-6">
                      <div className="flex items-center gap-3">
                         <div className="bg-nordic-oatmeal dark:bg-slate-700 p-2 rounded text-nordic-slate dark:text-white">
                            <PieChart size={20} />
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-nordic-slate dark:text-white">Allocation Matrix</h3>
                            <p className="text-xs text-gray-400">Capital Invested vs. Income Contribution</p>
                         </div>
                      </div>

                      {/* View Toggle */}
                      <div className="flex bg-nordic-oatmeal dark:bg-slate-700 p-0.5 rounded-lg border border-nordic-muted dark:border-slate-600">
                        <button
                          onClick={() => setAllocationView('Type')}
                          className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${allocationView === 'Type' ? 'bg-white dark:bg-slate-600 shadow-sm text-nordic-slate dark:text-white' : 'text-gray-400'}`}
                        >
                          Type
                        </button>
                        <button
                          onClick={() => setAllocationView('Sector')}
                          className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${allocationView === 'Sector' ? 'bg-white dark:bg-slate-600 shadow-sm text-nordic-slate dark:text-white' : 'text-gray-400'}`}
                        >
                          Sector
                        </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 h-[250px]">
                      {/* Value Allocation */}
                      <div className="relative flex flex-col items-center">
                         <div className="absolute top-0 left-0 text-[10px] font-bold uppercase text-gray-400">Capital</div>
                         <ResponsiveContainer width="100%" height="80%">
                            <RePieChart>
                               <Pie data={typeAllocation} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={5}>
                                  {typeAllocation.map((entry, index) => (
                                     <PieCell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                  ))}
                               </Pie>
                               <Tooltip content={<CustomPieTooltip />} />
                            </RePieChart>
                         </ResponsiveContainer>
                         <div className="flex flex-wrap gap-2 justify-center mt-2 overflow-y-auto max-h-[60px] custom-scrollbar">
                            {typeAllocation.map((t, i) => (
                               <div key={t.name} className="flex items-center gap-1 text-[10px]">
                                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                                  <span className="font-bold text-nordic-slate dark:text-white truncate max-w-[60px]">{t.name}</span>
                                  <span className="text-gray-400">({t.valuePct.toFixed(0)}%)</span>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* Income Allocation */}
                      <div className="relative flex flex-col items-center">
                         <div className="absolute top-0 left-0 text-[10px] font-bold uppercase text-gray-400">Income</div>
                         <ResponsiveContainer width="100%" height="80%">
                            <RePieChart>
                               <Pie data={typeAllocation} dataKey="income" innerRadius={40} outerRadius={60} paddingAngle={5}>
                                  {typeAllocation.map((entry, index) => (
                                     <PieCell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                  ))}
                               </Pie>
                               <Tooltip content={<CustomPieTooltip />} />
                            </RePieChart>
                         </ResponsiveContainer>
                         <div className="flex flex-wrap gap-2 justify-center mt-2 overflow-y-auto max-h-[60px] custom-scrollbar">
                            {typeAllocation.map((t, i) => (
                               <div key={t.name} className="flex items-center gap-1 text-[10px]">
                                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                                  <span className="font-bold text-nordic-slate dark:text-white truncate max-w-[60px]">{t.name}</span>
                                  <span className="text-gray-400">({t.incomePct.toFixed(0)}%)</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   {/* Insight Box */}
                   <div className="mt-4 bg-nordic-oatmeal dark:bg-slate-700/50 p-3 rounded-lg border border-nordic-muted dark:border-slate-600">
                      {typeAllocation.some(t => t.incomePct > t.valuePct * 1.5) ? (
                         <div className="flex items-start gap-2">
                            <AlertTriangle size={14} className="text-nordic-terra mt-0.5" />
                            <p className="text-[10px] text-nordic-charcoal dark:text-gray-300 leading-tight">
                               <strong>Concentration Risk:</strong> Some {allocationView.toLowerCase()}s contribute disproportionately to income compared to capital. Potential Yield Trap.
                            </p>
                         </div>
                      ) : (
                         <div className="flex items-start gap-2">
                            <Shield size={14} className="text-nordic-sage mt-0.5" />
                            <p className="text-[10px] text-nordic-charcoal dark:text-gray-300 leading-tight">
                               <strong>Balanced Profile:</strong> Income sources are distributed well relative to capital allocation.
                            </p>
                         </div>
                      )}
                   </div>
                </div>

                {/* The Dividend Snowball Forecast */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card border border-transparent">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                          <div className="bg-nordic-oatmeal dark:bg-slate-700 p-2 rounded text-nordic-slate dark:text-white">
                             <Snowflake size={20} />
                          </div>
                          <div>
                             <h3 className="text-lg font-bold text-nordic-slate dark:text-white">The Snowball Effect</h3>
                             <p className="text-xs text-gray-400">Projected Passive Income (Monte Carlo)</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={reinvestDividends}
                            onChange={(e) => setReinvestDividends(e.target.checked)}
                            className="rounded text-nordic-blue focus:ring-nordic-blue"
                          />
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400">DRIP (Reinvest)</label>
                      </div>
                   </div>

                   <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={forecastData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                               <linearGradient id="colorSnowball" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.4} />
                                  <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0.05} />
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                            <YAxis tickFormatter={(v) => `$${v/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                            <Tooltip content={<CustomSnowballTooltip />} cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '3 3' }} />

                            <Area type="monotone" dataKey="p90" stroke="none" fill="url(#colorSnowball)" fillOpacity={0.5} name="Optimistic" />
                            <Area type="monotone" dataKey="p10" stroke="none" fill="#1e293b" fillOpacity={1} name="Conservative" />
                            <Area
                                type="monotone"
                                dataKey="p50"
                                stroke={COLORS.blue}
                                strokeWidth={3}
                                fill="none"
                                name="Median Forecast"
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                dot={{ r: 2, fill: COLORS.blue, strokeWidth: 0 }}
                            />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>

                   <div className="mt-4 flex justify-between items-center text-xs border-t border-gray-100 dark:border-slate-700 pt-3">
                      <div className="text-gray-400">
                         Current: <strong className="text-nordic-slate dark:text-white">{formatCurrency(totalAnnualDividend)}</strong>/yr
                      </div>
                      <div className="text-gray-400">
                         In 20 Years: <strong className="text-nordic-blue">{formatCurrency(forecastData[forecastData.length-1].p50)}</strong>/yr
                      </div>
                   </div>
                </div>
            </div>

            {/* AI Action List */}
            <div className="bg-nordic-slate dark:bg-slate-900 text-white rounded-2xl p-8 shadow-card relative overflow-hidden border border-gray-700">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Activity size={150} />
               </div>

               <div className="relative z-10">
                  <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-6">
                     <div className="flex items-center gap-4">
                        <div className="bg-white bg-opacity-10 p-3 rounded-xl">
                           <Activity size={24} className="text-nordic-sage" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-white">Ladder Logic</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">AI-Powered Strategy Analysis</p>
                        </div>
                     </div>
                     {!analysis && (
                        <button
                           onClick={handleRunAnalysis}
                           disabled={loadingAnalysis}
                           className="bg-nordic-sage text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105 transform duration-200"
                        >
                           {loadingAnalysis ? <Sparkles size={16} className="animate-spin"/> : <Sparkles size={16} />}
                           {loadingAnalysis ? 'Thinking...' : 'Run Simulation'}
                        </button>
                     )}
                  </div>

                  {!analysis ? (
                     <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl gap-2">
                        <p className="text-white/40 font-bold text-sm uppercase tracking-widest">Awaiting Simulation...</p>
                        <p className="text-[10px] text-white/20">Click 'Run Simulation' to analyze your monthly gaps</p>
                     </div>
                  ) : (
                     <div className="grid md:grid-cols-3 gap-8 animate-fade-in divide-y md:divide-y-0 md:divide-x divide-gray-700">
                        <div className="space-y-4">
                           <p className="text-[10px] font-black text-nordic-terra uppercase tracking-widest flex items-center gap-2">
                              <ArrowDownRight size={14}/> Income Gaps
                           </p>
                           <div className="text-sm font-light leading-relaxed opacity-90 text-gray-200" dangerouslySetInnerHTML={{ __html: aiSections[0] }} />
                        </div>
                        <div className="space-y-4 md:pl-8">
                           <p className="text-[10px] font-black text-nordic-sage uppercase tracking-widest flex items-center gap-2">
                              <TrendingUp size={14}/> Ladder Strategy
                           </p>
                           <div className="text-sm font-light leading-relaxed opacity-90 text-gray-200" dangerouslySetInnerHTML={{ __html: aiSections[1] }} />
                        </div>
                         <div className="space-y-4 md:pl-8">
                           <p className="text-[10px] font-black text-nordic-blue uppercase tracking-widest flex items-center gap-2">
                              <Activity size={14}/> Efficiency Audit
                           </p>
                           <div className="bg-white/5 p-4 rounded-xl text-sm font-medium italic border border-white/10 text-gray-300" dangerouslySetInnerHTML={{ __html: aiSections[2] }} />
                           <button
                             onClick={() => setAnalysis("")}
                             className="mt-4 text-[10px] text-white/50 hover:text-white flex items-center gap-1 uppercase font-bold"
                           >
                              <RefreshCw size={10} /> Reset Analysis
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-slate-800">
              <details className="text-sm text-gray-400 cursor-pointer group">
                <summary className="hover:text-nordic-slate dark:hover:text-white transition-colors font-bold list-none flex items-center gap-2">
                  <div className="bg-gray-200 dark:bg-slate-700 p-1 rounded group-hover:bg-nordic-slate dark:group-hover:bg-slate-600 group-hover:text-white transition-colors">
                      <Info size={12} />
                  </div>
                  Methodology & Logic
                </summary>
                <div className="mt-4 pl-8 border-l-2 border-nordic-blue space-y-3 text-xs leading-relaxed">
                  <p>
                    <strong>Yield on Cost (YOC):</strong> Calculated as <code>(Annual Dividend Per Share / Average Cost Basis) * 100</code>. This metric measures the return on your original investment, ignoring current market price fluctuations. It rewards long-term holding as companies raise dividends.
                  </p>
                  <p>
                    <strong>Snowball Forecast (Monte Carlo):</strong> The forecast chart runs 100 stochastic simulations. It assumes you <em>reinvest all dividends (DRIP)</em> back into the same holding. The growth rate combines the asset's Dividend Growth Rate (CAGR) with a volatility factor.
                  </p>
                  <p>
                    <strong>Allocation Matrix:</strong> "Income Contribution" refers to the percentage of your total annual dividend check that comes from a specific sector or asset type. A high income contribution with low capital allocation often indicates a "High Yield, High Risk" concentration.
                  </p>
                  <p>
                    <strong>Safety Badges:</strong> Derived from Payout Ratios. For Stocks, a ratio &gt;70% is marked as High Risk. For REITs (which must distribute 90% of taxable income), we check against Funds From Operations (FFO) estimates, flagging risks above 95% or 120%.
                  </p>
                </div>
              </details>
            </div>

         </div>
      </main>
    </div>
  );
};


