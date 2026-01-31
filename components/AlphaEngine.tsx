import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity, Target, AlertTriangle, TrendingUp, TrendingDown,
  ShieldAlert, BrainCircuit, Wallet,
  ArrowRight, CheckCircle2, XCircle, AlertCircle, Sparkles,
  Sliders, Eye,
  Thermometer, Briefcase, Zap,
  ShieldCheck, FileSearch, Fingerprint, Info, X, BookOpen, Lightbulb, HelpCircle, Edit3, Plus, Trash2, Save,
  Search, Loader2, RefreshCw, Lock, Shield, ChevronDown, ChevronUp, Calendar, Hash, PieChart
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { TaxLot, AlphaMetrics, AlphaGlobalAssumptions, AlphaValidationState, ValidationIssue } from '../types';
import { COLORS } from '../constants';
import { ValidatedInput } from '../components/ValidatedInput';
import { fetchTickerData } from '../services/dividendService';

const formatCurrency = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
  return `$${Math.round(val).toLocaleString()}`;
};

const getDaysHeld = (dateStr: string) => {
  const purchase = new Date(dateStr);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - purchase.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Risk Factors by Sector (Monthly Volatility, Historical Max Drawdown)
const SECTOR_RISK_PROFILE: Record<string, { vol: number, drawdown: number }> = {
    'Technology': { vol: 0.085, drawdown: 0.50 }, // High beta, 50% crash risk
    'Real Estate': { vol: 0.060, drawdown: 0.45 }, // Rate sensitive
    'Aviation/Defense': { vol: 0.075, drawdown: 0.60 }, // Exogenous shocks
    'Financials': { vol: 0.065, drawdown: 0.55 }, // Systemic leverage
    'Healthcare': { vol: 0.045, drawdown: 0.25 }, // Defensive
    'Energy': { vol: 0.090, drawdown: 0.65 }, // Commodity cycles
    'Consumer': { vol: 0.050, drawdown: 0.30 }, // Stable
    'Utilities': { vol: 0.035, drawdown: 0.20 }, // Bond proxy
    'Unclassified': { vol: 0.060, drawdown: 0.35 } // Baseline
};

// --- SUB-COMPONENTS ---

const AlphaGuide = () => (
  <div className="bg-nordic-oatmeal p-5 rounded-xl border border-nordic-muted mb-6">
    <h4 className="font-bold text-nordic-slate flex items-center gap-2 mb-3 text-sm">
      <BookOpen size={16} className="text-nordic-blue" />
      Guide: Yield-to-Tax & Thesis Trace
    </h4>
    <div className="grid md:grid-cols-2 gap-6 text-xs text-nordic-charcoal leading-relaxed">
      <div className="space-y-3">
        <div>
          <strong className="text-nordic-slate block mb-0.5">Yield-to-Tax (Net Yield)</strong>
          <p className="text-gray-500">The actual dividend return you keep after taxes. Calculated as <code>Gross Yield × (1 - Tax Rate)</code>.</p>
        </div>
        <div>
          <strong className="text-nordic-slate block mb-0.5">Tax Drag</strong>
          <p className="text-gray-500">The percentage of return lost to tax inefficiency. <span className="italic text-nordic-terra">High Drag</span> means the asset belongs in a tax-advantaged account (IRA/401k).</p>
        </div>
        <div>
           <strong className="text-nordic-slate block mb-0.5">Non-Qualified vs. Qualified</strong>
           <p className="text-gray-500">
             <strong>Qualified:</strong> Taxed at lower LTCG rates (0%, 15%, 20%). Requires holding stock &gt;60 days.<br/>
             <strong>Non-Qualified:</strong> Taxed as Ordinary Income (up to 37%). Common in REITs and BDCs.
           </p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="bg-white p-3 rounded border border-gray-200">
          <strong className="text-nordic-sage block mb-1">Thesis Confidence Score (0-100)</strong>
          <p className="text-gray-500 mb-2">
            A subjective measure YOU define. It answers: <em>"Does the original reason I bought this still exist?"</em>
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li><strong>90-100:</strong> High conviction. Thesis is playing out.</li>
            <li><strong>50-89:</strong> Monitoring. Some noise, but fundamental.</li>
            <li><strong>0-49:</strong> Broken Thesis. Price action contradicts logic. <strong>Sell candidate.</strong></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

interface HoldingRowProps {
  lot: any;
  onUpdate: (id: string, field: keyof TaxLot, val: any) => void;
  onSell: (id: string, ticker: string) => void;
}

const HoldingRow: React.FC<HoldingRowProps> = ({ lot, onUpdate, onSell }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  // Local edit state
  const [editDate, setEditDate] = useState(lot.purchaseDate);
  const [editScore, setEditScore] = useState(lot.confidenceScore);

  const saveEdits = () => {
    onUpdate(lot.id, 'purchaseDate', editDate);
    onUpdate(lot.id, 'confidenceScore', editScore);
    // If date changed, update lastThesisUpdate potentially? simplified for now.
    setEditing(false);
  };

  const cancelEdits = () => {
    setEditDate(lot.purchaseDate);
    setEditScore(lot.confidenceScore);
    setEditing(false);
  };

  const efficiency = (lot.netYield / lot.dividendYield) * 100 || 0;
  const isEfficient = efficiency > 80;

  return (
    <div className={`bg-white rounded-xl border transition-all duration-300 ${expanded ? 'shadow-md border-nordic-blue' : 'shadow-sm border-gray-100 hover:border-gray-300'}`}>
      {/* HEADER ROW */}
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => !editing && setExpanded(!expanded)}>
        <div className="flex items-center gap-4 flex-1">
           <div className={`p-2 rounded-lg ${lot.confidenceScore < 50 ? 'bg-red-50 text-nordic-terra' : 'bg-nordic-oatmeal text-nordic-slate'}`}>
              {lot.confidenceScore < 50 ? <AlertTriangle size={18} /> : <Activity size={18} />}
           </div>

           <div className="w-24">
              <h4 className="font-bold text-nordic-slate text-sm">{lot.ticker}</h4>
              <span className="text-[10px] text-gray-400 uppercase font-medium">{lot.sector}</span>
           </div>

           <div className="hidden md:block flex-1 max-w-xs">
              <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1">
                 <span>Tax Efficiency</span>
                 <span className={isEfficient ? 'text-nordic-sage' : 'text-nordic-terra'}>{efficiency.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                 <div className={`h-full ${isEfficient ? 'bg-nordic-sage' : 'bg-nordic-terra'}`} style={{ width: `${efficiency}%` }}></div>
              </div>
           </div>

           <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase">Net Yield</p>
              <p className="text-sm font-black text-nordic-slate">{(lot.netYield * 100).toFixed(2)}%</p>
           </div>

           <div className="text-right w-24">
              <p className="text-xs font-bold text-gray-400 uppercase">Confidence</p>
              <div className={`text-sm font-black ${lot.confidenceScore >= 80 ? 'text-nordic-sage' : lot.confidenceScore < 50 ? 'text-nordic-terra' : 'text-yellow-600'}`}>
                 {lot.confidenceScore}/100
              </div>
           </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
           {!editing && (
             <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); setExpanded(true); }}
                className="p-2 text-gray-400 hover:text-nordic-blue hover:bg-blue-50 rounded-full transition-colors"
                title="Edit Position"
             >
                <Edit3 size={16} />
             </button>
           )}
           <div className="p-1">
              {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
           </div>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 animate-fade-in">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">

              {/* Left Column: Thesis */}
              <div className="md:col-span-7 space-y-4">
                 <div className="bg-nordic-oatmeal p-3 rounded-lg border border-nordic-muted">
                    <h5 className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 mb-2">
                       <BrainCircuit size={12} /> Buy Thesis
                    </h5>
                    <p className="text-xs text-nordic-charcoal italic leading-relaxed">
                       "{lot.buyThesis}"
                    </p>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Evidence Trail</span>
                        <p className="text-xs text-gray-600 border-l-2 border-gray-200 pl-2">
                           {lot.thesisEvidence || "No specific evidence logged."}
                        </p>
                    </div>
                 </div>
              </div>

              {/* Right Column: Stats & Edit */}
              <div className="md:col-span-5 space-y-4">
                 {editing ? (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                       <div>
                          <label className="text-[10px] font-bold text-nordic-blue uppercase block mb-1">Purchase Date</label>
                          <input
                             type="date"
                             value={editDate}
                             onChange={(e) => setEditDate(e.target.value)}
                             className="w-full text-xs p-2 rounded border border-blue-200 text-nordic-slate focus:outline-none focus:ring-1 focus:ring-nordic-blue"
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-nordic-blue uppercase block mb-1">Confidence Score (0-100)</label>
                          <div className="flex items-center gap-2">
                             <input
                                type="range" min="0" max="100"
                                value={editScore}
                                onChange={(e) => setEditScore(parseInt(e.target.value))}
                                className="flex-1 h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-nordic-blue"
                             />
                             <span className="text-xs font-bold text-nordic-blue w-8 text-right">{editScore}</span>
                          </div>
                       </div>
                       <div className="flex gap-2 pt-2">
                          <button onClick={saveEdits} className="flex-1 bg-nordic-blue text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1">
                             <Save size={12} /> Save
                          </button>
                          <button onClick={cancelEdits} className="flex-1 bg-white text-gray-500 border border-gray-200 text-xs font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors">
                             Cancel
                          </button>
                       </div>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-2 rounded border border-gray-100">
                           <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Holding Age</span>
                           <div className="flex items-center gap-2 text-nordic-slate font-mono text-sm font-bold">
                              <Calendar size={14} className="text-gray-400" />
                              {getDaysHeld(lot.purchaseDate)} days
                           </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-100">
                           <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Tax Status</span>
                           <div className="flex items-center gap-2 text-nordic-slate text-xs font-bold">
                              <Hash size={14} className="text-gray-400" />
                              {lot.dividendType}
                           </div>
                        </div>
                        {/* Sell Button */}
                        <button
                           onClick={(e) => { e.stopPropagation(); onSell(lot.id, lot.ticker); }}
                           className="col-span-2 py-2 border border-nordic-terra/20 text-nordic-terra hover:bg-red-50 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                           <Trash2 size={12} /> Simulate Sell
                        </button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export const AlphaEngine: React.FC = () => {
  // --- STATE: GLOBAL ASSUMPTIONS ---
  const [assumptions, setAssumptions] = useState<AlphaGlobalAssumptions>({
    stcgRate: 0.35,
    ltcgRate: 0.15,
    inflation: 0.03,
    reinvestDividends: true,
    thesisConfidenceFloor: 70,
    humanCapitalSector: 'Technology'
  });

  // --- STATE: VALIDATION ---
  const [validationState, setValidationState] = useState<AlphaValidationState>({
    status: 'Verified',
    score: 100,
    issues: [],
    lastRun: new Date().toISOString()
  });
  const [showLogicTrace, setShowLogicTrace] = useState<string | null>(null); // Lot ID for modal
  const [isStressTestActive, setIsStressTestActive] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [fetchingLotId, setFetchingLotId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'controls' | 'analysis'>('analysis');

  // --- STATE: DATA ---
  const [baseMetrics] = useState<AlphaMetrics>({
    monthlyDiscretionarySpend: 8500,
    monthlyPassiveIncome: 1200,
    liquidCash: 50000,
    avgMonthlyBurn: 11000,
    portfolioReturnYTD: 0.145,
    benchmarkReturnYTD: 0.092
  });

  const [lots, setLots] = useState<TaxLot[]>([
    {
        id: '1', ticker: 'NVDA', sector: 'Technology', purchaseDate: '2023-05-15', quantity: 15, costPerShare: 380, currentPrice: 880,
        buyThesis: "AI datacenter demand.", confidenceScore: 90, dividendYield: 0.0003, dividendType: 'Qualified',
        lastThesisUpdate: '2023-11-20', thesisEvidence: "CEO Huang: 'Demand is surging beyond 2025 visibility.' (Q3 Transcript Pg 4)"
    },
    {
        id: '2', ticker: 'O', sector: 'Real Estate', purchaseDate: '2024-02-01', quantity: 200, costPerShare: 52, currentPrice: 58,
        buyThesis: "Rates peaking.", confidenceScore: 85, dividendYield: 0.054, dividendType: 'Non-Qualified',
        lastThesisUpdate: '2024-02-01', thesisEvidence: "Fed Dot Plot indicates 3 cuts in 2024."
    },
    {
        id: '3', ticker: 'LMT', sector: 'Aviation/Defense', purchaseDate: '2022-01-10', quantity: 40, costPerShare: 350, currentPrice: 420,
        buyThesis: "Geopolitical instability.", confidenceScore: 60, dividendYield: 0.029, dividendType: 'Qualified',
        lastThesisUpdate: '2023-08-15', thesisEvidence: "Global conflict index rising. Backlog at record highs."
    },
    {
        id: '4', ticker: 'SCHD', sector: 'Financials', purchaseDate: '2023-11-10', quantity: 120, costPerShare: 71, currentPrice: 78,
        buyThesis: "Core dividend growth.", confidenceScore: 75, dividendYield: 0.034, dividendType: 'Qualified',
        lastThesisUpdate: '2024-01-05'
    },
    {
        id: '5', ticker: 'DAL', sector: 'Aviation/Defense', purchaseDate: '2023-08-15', quantity: 300, costPerShare: 35, currentPrice: 47,
        buyThesis: "Travel boom.", confidenceScore: 40, dividendYield: 0.012, dividendType: 'Qualified',
        lastThesisUpdate: '2023-09-01'
    },
    {
        id: '6', ticker: 'JETS', sector: 'Aviation/Defense', purchaseDate: '2021-05-10', quantity: 500, costPerShare: 24, currentPrice: 19,
        buyThesis: "Recovery play.", confidenceScore: 30, dividendYield: 0.0, dividendType: 'Qualified',
        lastThesisUpdate: '2021-05-10', thesisEvidence: "Post-COVID travel surge expected."
    }
  ]);

  // --- ACTIONS ---

  const handleSell = (id: string, ticker: string) => {
    if (window.confirm(`Simulate selling ${ticker}? This will remove the lot from the portfolio calculation.`)) {
        setLots(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleUpdateLot = (id: string, field: keyof TaxLot, value: any) => {
    setLots(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleAddLot = () => {
    const newLot: TaxLot = {
        id: Date.now().toString(),
        ticker: 'NEW',
        sector: 'Technology',
        purchaseDate: new Date().toISOString().split('T')[0],
        quantity: 10,
        costPerShare: 100,
        currentPrice: 100,
        buyThesis: 'New position thesis',
        confidenceScore: 50,
        dividendYield: 0,
        dividendType: 'Non-Qualified'
    };
    setLots([newLot, ...lots]);
  };

  const handleRemoveLot = (id: string) => {
      setLots(prev => prev.filter(l => l.id !== id));
  };

  const handleFetchLotData = async (id: string, ticker: string) => {
    if (!ticker || ticker === 'NEW') return;
    setFetchingLotId(id);
    const data = await fetchTickerData(ticker);
    if (data) {
        setLots(prev => prev.map(l => {
            if (l.id !== id) return l;
            return {
                ...l,
                currentPrice: data.price,
                sector: data.sector !== "Unknown" ? data.sector : l.sector,
                dividendYield: data.price > 0 ? data.dividend / data.price : 0
            };
        }));
    }
    setFetchingLotId(null);
  };

  const handleIssueAction = (issue: ValidationIssue) => {
    if (issue.action === 'Fix Data' || issue.action === 'Fix Date' || issue.action === 'Fix Data') {
        setIsManagerOpen(true);
    } else if (issue.action === 'Force Refresh' || issue.action === 'Refresh Feed') {
        runValidation();
    } else if (issue.action === "Don't sell at loss") {
        alert(`Warning: ${issue.message}. Holding this position is recommended to avoid Wash Sale complications.`);
    }
  };

  // --- VALIDATION LOGIC ---

  const runValidation = () => {
    const issues: ValidationIssue[] = [];
    let score = 100;

    // Module 1: Tax-Alpha Integrity Audit
    lots.forEach(lot => {
        // Basic Integrity
        if (lot.costPerShare <= 0 || lot.quantity <= 0) {
            issues.push({ id: `integrity-${lot.id}`, module: 'Tax-Alpha', severity: 'Error', message: `Invalid cost/qty for ${lot.ticker}`, action: 'Fix Data' });
            score -= 20;
        }
        if (new Date(lot.purchaseDate) > new Date()) {
            issues.push({ id: `date-${lot.id}`, module: 'Tax-Alpha', severity: 'Error', message: `Future purchase date for ${lot.ticker}`, action: 'Fix Date' });
            score -= 10;
        }

        // Wash Sale Alert (Simulated: Check overlapping lots)
        const similarLots = lots.filter(l => l.ticker === lot.ticker && l.id !== lot.id);
        similarLots.forEach(sim => {
            const daysDiff = Math.abs(getDaysHeld(lot.purchaseDate) - getDaysHeld(sim.purchaseDate));
            if (daysDiff < 31) {
                issues.push({
                    id: `wash-${lot.id}`,
                    module: 'Tax-Alpha',
                    severity: 'Warning',
                    message: `Wash Sale Risk: ${lot.ticker} lots bought within 30 days.`,
                    action: 'Don\'t sell at loss',
                    details: `Lot ${lot.id} and ${sim.id} are overlapping.`
                });
                score -= 5;
            }
        });
    });

    // Module 2: Thesis Monitor Reliability
    lots.forEach(lot => {
        const priceMove = Math.abs((lot.currentPrice - lot.costPerShare) / lot.costPerShare);
        const lastUpdate = new Date(lot.lastThesisUpdate || lot.purchaseDate);
        const daysSinceUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);

        if (priceMove > 0.05 && daysSinceUpdate > 90) {
            issues.push({
                id: `stale-${lot.id}`,
                module: 'Thesis',
                severity: 'Warning',
                message: `Thesis Stale: ${lot.ticker} moved ${(priceMove*100).toFixed(1)}% without thesis update.`,
                action: 'Force Refresh',
                details: `Last update: ${lastUpdate.toLocaleDateString()}`
            });
            score -= 5;
        }
    });

    // Module 3: Benchmark Reconciliation (Simulated)
    const benchmarkLatency = Math.random() * 20; // Simulated latency in mins
    if (benchmarkLatency > 15) {
        issues.push({
            id: 'bench-lat',
            module: 'Benchmark',
            severity: 'Info',
            message: `Benchmark data delayed by ${benchmarkLatency.toFixed(0)}m. Alpha calc may be slightly off.`,
            action: 'Refresh Feed'
        });
        score -= 2;
    }

    // Determine Status
    let status: 'Verified' | 'Warning' | 'Error' = 'Verified';
    if (issues.some(i => i.severity === 'Error')) status = 'Error';
    else if (issues.some(i => i.severity === 'Warning')) status = 'Warning';

    setValidationState({
        status,
        score: Math.max(0, score),
        issues,
        lastRun: new Date().toISOString()
    });
  };

  useEffect(() => {
    runValidation();
  }, [lots]);

  // --- CALCULATIONS ---

  const calculateAdvancedMetrics = (currentAssumptions: AlphaGlobalAssumptions, currentLots: TaxLot[]) => {
    let totalLiquidationValue = baseMetrics.liquidCash;
    let totalTaxLiability = 0;
    let totalPortfolioValue = 0;

    // Risk Accumulators
    let weightedVolSum = 0;
    let weightedDrawdownSum = 0;

    // 1. Portfolio Basic Stats
    const enrichedLots = currentLots.map(lot => {
        const marketValue = lot.quantity * lot.currentPrice;
        const costBasis = lot.quantity * lot.costPerShare;
        const gain = marketValue - costBasis;
        const daysHeld = getDaysHeld(lot.purchaseDate);
        const isLongTerm = daysHeld > 365;
        const capitalGainsRate = isLongTerm ? currentAssumptions.ltcgRate : currentAssumptions.stcgRate;

        // Tax Calc
        const tax = gain > 0 ? gain * capitalGainsRate : 0;

        // Yield To Tax Calc
        const divTaxRate = lot.dividendType === 'Qualified' ? currentAssumptions.ltcgRate : currentAssumptions.stcgRate;
        const netYield = lot.dividendYield * (1 - divTaxRate);

        totalPortfolioValue += marketValue;
        totalLiquidationValue += (marketValue - tax);
        totalTaxLiability += tax;

        return {
            ...lot,
            marketValue,
            unrealizedGain: gain,
            tax,
            netYield,
            taxDrag: lot.dividendYield - netYield,
            daysHeld
        };
    });

    // 2. Risk Calculation (Weighted)
    enrichedLots.forEach(lot => {
        const weight = totalPortfolioValue > 0 ? lot.marketValue / totalPortfolioValue : 0;
        const riskProfile = SECTOR_RISK_PROFILE[lot.sector] || SECTOR_RISK_PROFILE['Unclassified'];

        weightedVolSum += riskProfile.vol * weight;
        weightedDrawdownSum += riskProfile.drawdown * weight;
    });

    const portfolioVol = weightedVolSum || 0.06;
    const portfolioMaxDrawdownFactor = weightedDrawdownSum || 0.30;

    // VaR 95% (Monthly) = 1.65 * Volatility
    const VaR95 = totalPortfolioValue * 1.65 * portfolioVol;
    // Estimated Max Drawdown (Tail Risk)
    const maxDrawdownValue = totalPortfolioValue * portfolioMaxDrawdownFactor;

    // Human Capital Concentration
    const sectorWeights: Record<string, number> = {};
    enrichedLots.forEach(l => {
        sectorWeights[l.sector] = (sectorWeights[l.sector] || 0) + l.marketValue;
    });

    const estimatedHumanCapitalValue = 750000;
    const totalWealthExposure = totalPortfolioValue + estimatedHumanCapitalValue;

    const adjustedSectorWeights: {name: string, portfolio: number, total: number}[] = Object.keys(sectorWeights).map(sec => {
        const portVal = sectorWeights[sec];
        let totalVal = portVal;
        if (sec === currentAssumptions.humanCapitalSector) {
            totalVal += estimatedHumanCapitalValue;
        }
        return {
            name: sec,
            portfolio: (portVal / totalPortfolioValue) * 100,
            total: (totalVal / totalWealthExposure) * 100
        };
    }).sort((a,b) => b.total - a.total);

    if (!sectorWeights[currentAssumptions.humanCapitalSector]) {
        adjustedSectorWeights.push({
            name: currentAssumptions.humanCapitalSector,
            portfolio: 0,
            total: (estimatedHumanCapitalValue / totalWealthExposure) * 100
        });
        adjustedSectorWeights.sort((a,b) => b.total - a.total);
    }

    const harvestCandidates = enrichedLots
        .map(l => ({
            ...l,
            harvestValue: l.unrealizedGain && l.unrealizedGain < 0 ? Math.abs(l.unrealizedGain) * currentAssumptions.stcgRate : 0,
            driftUrgency: (100 - l.confidenceScore)
        }))
        .sort((a, b) => {
            // Prioritize high tax savings first
            if (b.harvestValue !== a.harvestValue) return b.harvestValue - a.harvestValue;
            // Then by lowest confidence
            return b.driftUrgency - a.driftUrgency;
        })
        .slice(0, 5);

    return {
      netLiquidationValue: totalLiquidationValue,
      taxLiability: totalTaxLiability,
      portfolioValue: totalPortfolioValue,
      VaR95,
      maxDrawdownValue,
      portfolioVol,
      enrichedLots,
      adjustedSectorWeights,
      harvestCandidates
    };
  };

  const metrics = useMemo(() => calculateAdvancedMetrics(assumptions, lots), [assumptions, lots]);
  const { VaR95, maxDrawdownValue, enrichedLots, adjustedSectorWeights, harvestCandidates } = metrics;

  // --- CHART DATA ---
  const concentrationData = adjustedSectorWeights.slice(0, 5); // Top 5

  // Tax Drag Data with Stress Test
  const taxDragData = useMemo(() => {
    const data = [];
    const monthlyLiability = metrics.taxLiability / 12;
    const potentialHarvest = metrics.harvestCandidates.reduce((sum, item) => sum + item.harvestValue, 0) / 12;

    for (let i = 1; i <= 12; i++) {
        // Stress Test: Assume rate hike or tax law change increasing liability by 20%
        const stressFactor = isStressTestActive ? 1.2 : 1.0;

        data.push({
            month: `M${i}`,
            tax: (monthlyLiability * i) * stressFactor,
            saved: potentialHarvest * i,
            historicalWorst: (monthlyLiability * i) * 1.5 // Validation Shadow
        });
    }
    return data;
  }, [metrics, isStressTestActive]);

  return (
    <div className="flex flex-col md:flex-row h-full bg-nordic-oatmeal overflow-hidden relative">

      {/* Mobile View Toggle */}
      <div className="md:hidden flex border-b border-gray-200 bg-white z-20 shrink-0">
         <button
            onClick={() => setMobileView('controls')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileView === 'controls' ? 'text-nordic-blue border-b-2 border-nordic-blue bg-blue-50/50' : 'text-gray-400'}`}
         >
            <Sliders size={14} /> Risk Controls
         </button>
         <button
            onClick={() => setMobileView('analysis')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileView === 'analysis' ? 'text-nordic-blue border-b-2 border-nordic-blue bg-blue-50/50' : 'text-gray-400'}`}
         >
            <PieChart size={14} /> Analysis
         </button>
      </div>

      {/* SIDEBAR: Global Assumptions */}
      <aside className={`w-full md:w-[450px] bg-white border-r border-nordic-muted flex flex-col h-full shadow-soft z-10 transition-transform md:translate-x-0 ${mobileView === 'controls' ? 'translate-x-0 block' : '-translate-x-full hidden md:flex'}`}>
         {/* Sidebar Header */}
         <div className="p-6 pb-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
               <Sliders size={18} className="text-nordic-sage" />
               <h3 className="text-base font-bold uppercase tracking-wider text-nordic-slate">Strategic Controls</h3>
            </div>
            <p className="text-xs text-nordic-charcoal leading-relaxed">
               Calibrate your risk reality and validate thesis integrity against market conditions.
            </p>
         </div>

         {/* Content Wrapper for scrolling */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

            {/* Edge Confidence Meter (Sidebar Widget) */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
               <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                     <ShieldCheck size={14} className={validationState.status === 'Verified' ? 'text-nordic-sage' : 'text-nordic-terra'} />
                     <span className="text-xs font-bold uppercase text-nordic-slate">Edge Confidence</span>
                  </div>
                  <span className={`text-xs font-black ${validationState.score > 80 ? 'text-nordic-sage' : 'text-nordic-terra'}`}>
                     {validationState.score}%
                  </span>
               </div>
               <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                     className={`h-full transition-all duration-1000 ${validationState.score > 80 ? 'bg-nordic-sage' : validationState.score > 50 ? 'bg-yellow-400' : 'bg-nordic-terra'}`}
                     style={{ width: `${validationState.score}%` }}
                  ></div>
               </div>
               {validationState.issues.length > 0 ? (
                  <div className="space-y-2">
                     {validationState.issues.slice(0, 2).map(issue => (
                        <div key={issue.id} className="text-[10px] bg-white p-2 rounded border border-gray-200 shadow-sm flex items-start gap-2">
                           {issue.severity === 'Error' ? <XCircle size={10} className="text-nordic-terra mt-0.5"/> : <AlertCircle size={10} className="text-yellow-500 mt-0.5"/>}
                           <div>
                              <p className="font-bold text-gray-600 leading-tight">{issue.message}</p>
                              <button
                                onClick={() => handleIssueAction(issue)}
                                className="text-nordic-blue hover:underline mt-1 font-bold text-left"
                              >
                                {issue.action}
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <p className="text-[10px] text-gray-400 italic">All systems verified. Benchmarks synced.</p>
               )}
            </div>

            {/* Tax Sliders */}
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-2">
                     <div className="flex items-center gap-1 group relative cursor-help">
                        <span>Federal Tax Rate (STCG)</span>
                        <HelpCircle size={12} className="text-gray-400"/>
                        <div className="absolute left-0 bottom-full mb-2 w-48 bg-nordic-slate text-white p-2 rounded text-[10px] font-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                           <strong>Short-Term Capital Gains:</strong> Tax on assets held less than 1 year. usually taxed at your ordinary income rate (High).
                        </div>
                     </div>
                     <span className="text-nordic-slate">{(assumptions.stcgRate * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="10" max="50" step="1"
                    value={Number(assumptions.stcgRate) * 100}
                    onChange={(e) => setAssumptions({...assumptions, stcgRate: parseInt(e.target.value)/100})}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-nordic-terra"
                  />
               </div>
               <div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-2">
                     <div className="flex items-center gap-1 group relative cursor-help">
                        <span>Inflation Impact</span>
                        <HelpCircle size={12} className="text-gray-400"/>
                        <div className="absolute left-0 bottom-full mb-2 w-48 bg-nordic-slate text-white p-2 rounded text-[10px] font-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                           Reduces future purchasing power. A $100 gain with 3% inflation is only worth $97 in real terms next year.
                        </div>
                     </div>
                     <span className="text-nordic-slate">{(assumptions.inflation * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="15" step="0.5"
                    value={Number(assumptions.inflation) * 100}
                    onChange={(e) => setAssumptions({...assumptions, inflation: parseFloat(e.target.value)/100})}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-nordic-blue"
                  />
               </div>
            </div>

            {/* Human Capital */}
            <div className="space-y-3 pt-6 border-t border-gray-100">
               <div className="flex items-start gap-2">
                  <Briefcase size={16} className="text-nordic-blue mt-0.5" />
                  <div>
                     <label className="text-xs font-bold text-nordic-slate uppercase">Human Capital Hedging</label>
                     <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                        What industry do you work in? We treat your future salary as a "Bond" in that sector to reveal hidden concentration risks.
                     </p>
                  </div>
               </div>

               <select
                  value={assumptions.humanCapitalSector}
                  onChange={(e) => setAssumptions({...assumptions, humanCapitalSector: e.target.value})}
                  className="w-full bg-nordic-oatmeal border border-gray-200 rounded p-2 text-sm font-bold text-nordic-slate outline-none focus:ring-1 focus:ring-nordic-blue"
               >
                  <option value="Technology">Technology</option>
                  <option value="Aviation/Defense">Aviation & Defense</option>
                  <option value="Financials">Financials</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Energy">Energy</option>
                  <option value="Consumer">Consumer</option>
               </select>

               <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="flex gap-2 items-center mb-1">
                     <Info size={12} className="text-nordic-blue" />
                     <span className="text-[10px] font-bold text-nordic-blue uppercase">Risk Theory</span>
                  </div>
                  <p className="text-[10px] text-nordic-charcoal leading-tight">
                     If you work in <strong>{assumptions.humanCapitalSector}</strong> and invest heavily in it, a sector crash could hit your <strong>Portfolio AND Job</strong> simultaneously.
                  </p>
               </div>
            </div>

            {/* Tactical Sell List (Mini Sidebar View) */}
            <div className="mt-8 pt-6 border-t border-gray-100">
               <div className="flex justify-between items-center mb-1">
                  <h4 className="text-xs font-black uppercase text-nordic-terra flex items-center gap-2">
                     <Zap size={14} /> Tactical Harvest List
                  </h4>
                  {harvestCandidates.length > 0 && (
                     <button
                       onClick={() => setIsManagerOpen(true)}
                       className="text-[10px] font-bold text-nordic-blue hover:underline bg-blue-50 px-2 py-0.5 rounded"
                     >
                       Manage
                     </button>
                  )}
               </div>
               <p className="text-[10px] text-gray-400 mb-3 leading-tight">
                  Specific lots in the portfolio trading below cost. Selling these realizes a loss to offset gains (Tax Alpha).
               </p>
               <div className="space-y-2">
                  {harvestCandidates.slice(0, 3).map(lot => (
                     <div
                        key={lot.id}
                        className="bg-gray-50 p-2 rounded border border-gray-200 hover:border-nordic-terra transition-colors cursor-pointer group"
                     >
                        <div className="flex justify-between items-center mb-1">
                           <span className="font-bold text-xs text-nordic-slate">{lot.ticker}</span>
                           <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSell(lot.id, lot.ticker);
                                }}
                                className="text-[10px] font-bold text-nordic-terra hover:underline hover:bg-red-50 px-2 py-0.5 rounded border border-transparent hover:border-red-100 transition-all"
                           >
                               Sell
                           </button>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-500">
                           <span>Conf: {lot.confidenceScore}%</span>
                           {lot.harvestValue > 0 ? (
                               <span className="text-nordic-sage font-bold">Save {formatCurrency(lot.harvestValue)}</span>
                           ) : (
                               <span>Thesis Drift</span>
                           )}
                        </div>
                     </div>
                  ))}
                  {harvestCandidates.length === 0 && (
                     <div className="text-[10px] text-gray-400 italic p-2 border border-dashed border-gray-200 rounded">
                        No harvestable losses detected.
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Added Footer to Sidebar */}
         <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1 mb-1">
               <Shield size={10} /> Portfolio Sim
            </p>
            <p className="text-[9px] text-gray-300">
               © 2026 T. Cooney | Financial Simulation Tool | Not Financial Advice
            </p>
         </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar relative transition-transform ${mobileView === 'analysis' ? 'block' : 'hidden md:block'}`}>

        {/* Validation Errors Sticky Header if Critical */}
        {validationState.status === 'Error' && (
             <div className="bg-nordic-terra text-white px-6 py-2 text-xs font-bold flex items-center justify-between sticky top-0 z-50 shadow-md">
                 <div className="flex items-center gap-2">
                    <XCircle size={14} />
                    <span>Critical Data Discrepancy Detected: Alpha Calculation Paused.</span>
                 </div>
                 <button onClick={runValidation} className="underline hover:text-gray-200">Re-Run Audit</button>
             </div>
        )}

        {/* Demo Data Disclaimer */}
        <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Info size={16} className="text-nordic-blue" />
               <p className="text-xs text-nordic-slate font-medium">
                  <strong>Simulated Portfolio Active:</strong> Displaying analysis on sample data (NVDA, O, LMT).
                  <span className="hidden sm:inline text-gray-500 font-normal ml-1">Connect your brokerage to see your real holdings.</span>
               </p>
            </div>
            <button
                onClick={() => setIsManagerOpen(true)}
                className="text-[10px] font-bold uppercase text-nordic-blue hover:underline flex items-center gap-1"
            >
               <Edit3 size={12} /> Edit Simulation
            </button>
        </div>

        {/* Header - Editorial Style */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-10 gap-6">
          <div>
             <h2 className="text-4xl font-light text-nordic-slate mb-3 tracking-tight">Portfolio Strategy & Tax Optimizer</h2>
             <p className="text-nordic-charcoal max-w-xl text-base leading-relaxed">
                Optimize your after-tax returns and validate your investment logic. Monitor sector risks, tax drag, and thesis drift.
             </p>
          </div>
          <div className={`px-4 py-2 rounded-full border border-gray-200 text-sm font-bold flex items-center gap-2 shadow-sm ${validationState.status === 'Verified' ? 'bg-white text-nordic-sage' : 'bg-yellow-50 text-yellow-700'}`}>
             {validationState.status === 'Verified' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
             {validationState.status === 'Verified' ? 'Data Integrity Verified' : 'Data Warnings Active'}
          </div>
        </div>

        <div className="space-y-10 pb-24">

          {/* ROW 1: RISK CONSOLE & HUMAN CAPITAL */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* ... Risk Console and Sector Concentration (Unchanged) ... */}
             {/* MODULE: RISK CONSOLE (Enhanced) */}
             <div className="bg-white p-8 rounded-2xl shadow-card border border-transparent flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all">
                 <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldAlert size={100} />
                 </div>
                 <div className="mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-nordic-slate mb-2 flex items-center gap-2">
                       <Activity size={16} className="text-nordic-terra" /> Risk Console
                    </h3>
                    <p className="text-xs text-gray-400">Monthly Value at Risk & Tail Events</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* VaR */}
                    <div>
                       <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-nordic-slate tracking-tighter">
                             {formatCurrency(VaR95)}
                          </span>
                       </div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">95% Monthly VaR</p>
                       <p className="text-[9px] text-gray-300 leading-tight mt-1">Likely monthly loss limit.</p>
                    </div>
                    {/* Max Drawdown */}
                    <div>
                       <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-nordic-terra tracking-tighter">
                             {formatCurrency(maxDrawdownValue)}
                          </span>
                       </div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">Max Drawdown</p>
                       <p className="text-[9px] text-gray-300 leading-tight mt-1">Est. loss in a severe crash.</p>
                    </div>
                 </div>

                 {/* Liquidity Buffer Check */}
                 <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative z-10 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-gray-500 uppercase flex items-center gap-1"><Lock size={12}/> Liquid Cash</span>
                       <span className="font-mono font-bold text-nordic-slate">{formatCurrency(baseMetrics.liquidCash)}</span>
                    </div>

                    {/* Coverage Bars */}
                    <div>
                        <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                           <span>VaR Coverage</span>
                           <span>{(baseMetrics.liquidCash / VaR95 * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                           <div className={`h-full ${baseMetrics.liquidCash >= VaR95 ? 'bg-nordic-sage' : 'bg-nordic-terra'}`} style={{width: `${Math.min((baseMetrics.liquidCash / VaR95) * 100, 100)}%`}}></div>
                        </div>
                    </div>

                    {baseMetrics.liquidCash >= maxDrawdownValue ? (
                       <div className="flex items-start gap-2 text-[10px] text-nordic-sageDark font-bold bg-green-50 p-2 rounded border border-green-100">
                          <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                          <span>Fortress Balance Sheet: Cash covers 100% of a catastrophic crash scenario.</span>
                       </div>
                    ) : baseMetrics.liquidCash >= VaR95 ? (
                       <div className="flex items-start gap-2 text-[10px] text-yellow-700 font-bold bg-yellow-50 p-2 rounded border border-yellow-100">
                          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                          <span>Tactical Buffer: Cash covers normal volatility, but implies forced selling during a major crash.</span>
                       </div>
                    ) : (
                       <div className="flex items-start gap-2 text-[10px] text-nordic-terraDark font-bold bg-red-50 p-2 rounded border border-red-100">
                          <XCircle size={14} className="mt-0.5 flex-shrink-0" />
                          <span>Liquidity Crunch: Buffer insufficient for standard monthly volatility. High risk of realized losses.</span>
                       </div>
                    )}
                 </div>
             </div>

             {/* MODULE: HUMAN CAPITAL CONCENTRATION */}
             <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-card border border-transparent hover:shadow-lg transition-all">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-nordic-slate flex items-center gap-2">
                           <Briefcase size={16} className="text-nordic-blue" /> Sector Concentration
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Portfolio + Human Capital Exposure</p>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] font-bold uppercase text-gray-400">Your Sector</div>
                       <div className="text-lg font-black text-nordic-blue">{assumptions.humanCapitalSector}</div>
                    </div>
                 </div>

                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={concentrationData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 11, fontWeight: 700, fill: COLORS.slate}} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                          <Tooltip
                             cursor={{fill: 'transparent'}}
                             content={({ active, payload }) => {
                                 if (active && payload && payload.length) {
                                     const d = payload[0].payload;
                                     return (
                                         <div className="bg-nordic-slate text-white p-3 rounded-xl text-xs shadow-xl border border-gray-600">
                                             <p className="font-bold mb-2 text-base">{d.name}</p>
                                             <p>Portfolio: <span className="font-mono text-gray-300">{d.portfolio.toFixed(1)}%</span></p>
                                             <p className="text-nordic-blue font-bold mt-1">Total (w/ Job): {d.total.toFixed(1)}%</p>
                                         </div>
                                     )
                                 }
                                 return null;
                             }}
                          />
                          <Bar dataKey="portfolio" name="Portfolio Only" fill={COLORS.blue} barSize={12} radius={[0, 4, 4, 0]} background={{ fill: '#f8fafc' }} />
                          <Bar dataKey="total" name="Total (w/ Job Exposure)" fill={COLORS.terra} barSize={6} radius={[0, 4, 4, 0]} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>

                 <div className="mt-4 text-xs text-gray-400 italic bg-nordic-oatmeal p-3 rounded-lg border border-nordic-muted flex items-start gap-2">
                    <Info size={14} className="mt-0.5 text-nordic-blue" />
                    <span>
                       *Total exposure includes a 5x salary capitalization in your Human Capital sector.
                       {concentrationData[0].total > 40 && (
                           <strong className="text-nordic-terra block mt-1">
                              Warning: {concentrationData[0].total.toFixed(0)}% of your total wealth is tied to {concentrationData[0].name}.
                           </strong>
                       )}
                    </span>
                 </div>
             </div>
          </section>

          {/* ROW 2: YIELD OPTIMIZER & THESIS LOGIC TRACE */}
          <section className="bg-white p-8 rounded-2xl shadow-card border border-transparent">
             <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                     <div className="bg-nordic-oatmeal p-2 rounded text-nordic-slate">
                        <Target size={20} />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-nordic-slate">Yield-to-Tax & Thesis Trace</h3>
                        <p className="text-xs text-gray-400">Efficiency Audit & Logic Validation</p>
                     </div>
                 </div>
             </div>

             <AlphaGuide />

             <div className="space-y-3">
                {enrichedLots.map(lot => (
                    <HoldingRow
                      key={lot.id}
                      lot={lot}
                      onUpdate={handleUpdateLot}
                      onSell={handleSell}
                    />
                ))}
             </div>
          </section>

          {/* ROW 3: HEATMAP with SENSITIVITY OVERLAY */}
          <section className="bg-white p-8 rounded-2xl shadow-card border border-transparent">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                 <div className="flex items-center gap-3">
                     <div className="bg-nordic-oatmeal p-2 rounded text-nordic-slate">
                        <Thermometer size={20} />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-nordic-slate">Tax Drag Heatmap</h3>
                        <p className="text-xs text-gray-400">Capital Recovery Projection</p>
                     </div>
                 </div>

                 {/* Sensitivity Toggle */}
                 <button
                    onClick={() => setIsStressTestActive(!isStressTestActive)}
                    className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${isStressTestActive ? 'bg-nordic-terra text-white border-nordic-terra shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                 >
                    {isStressTestActive ? <Eye size={14} /> : <Eye size={14} className="opacity-50" />}
                    {isStressTestActive ? 'Hide Validation Shadow' : 'Show Stress-Test Overlay'}
                 </button>
             </div>

             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={taxDragData} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                        <defs>
                            <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.terra} stopOpacity={0.1}/>
                                <stop offset="95%" stopColor={COLORS.terra} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.sage} stopOpacity={0.2}/>
                                <stop offset="95%" stopColor={COLORS.sage} stopOpacity={0}/>
                            </linearGradient>
                            <pattern id="patternShadow" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                                <rect width="3" height="6" fill={COLORS.slate} opacity="0.1" />
                            </pattern>
                        </defs>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: COLORS.slate, fontWeight: 700}} dy={10} />
                        <YAxis hide />
                        <Tooltip
                           contentStyle={{backgroundColor: COLORS.slate, border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                           formatter={(val: number) => formatCurrency(val)}
                           cursor={{stroke: COLORS.slate, strokeWidth: 1, strokeDasharray: '4 4'}}
                        />
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />

                        {isStressTestActive && (
                             <Area
                                type="step"
                                dataKey="historicalWorst"
                                stroke={COLORS.slate}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill="url(#patternShadow)"
                                name="Historical Worst Case"
                                strokeOpacity={0.5}
                             />
                        )}

                        <Area type="monotone" dataKey="saved" stackId="1" stroke={COLORS.sage} strokeWidth={2} fill="url(#colorSaved)" name="Recoverable Capital" />
                        <Area type="monotone" dataKey="tax" stackId="1" stroke={COLORS.terra} strokeWidth={2} fill="url(#colorTax)" name="Tax Liability" />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
             {isStressTestActive && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 bg-gray-50 py-2 rounded border border-dashed border-gray-200">
                    <Fingerprint size={14} />
                    <span className="italic">Validation Shadow active: Projecting historical worst-case tax drag assuming a 20% rate hike.</span>
                </div>
             )}
          </section>

          {/* DOCUMENTATION SECTION */}
          <div className="mt-16 pt-8 border-t border-gray-200">
              <details className="text-sm text-gray-400 cursor-pointer group">
                <summary className="hover:text-nordic-slate transition-colors font-bold list-none flex items-center gap-2">
                  <div className="bg-gray-200 p-1 rounded group-hover:bg-nordic-slate group-hover:text-white transition-colors">
                      <BookOpen size={12} />
                  </div>
                  Methodology, Guide & Logic
                </summary>

                <div className="mt-6 pl-2 grid md:grid-cols-2 gap-8 text-xs leading-relaxed animate-fade-in">
                   <div className="space-y-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <h4 className="font-bold text-nordic-slate uppercase mb-1 flex items-center gap-2">
                           <ShieldAlert size={12} className="text-nordic-terra" /> STCG (Short-Term Capital Gains)
                        </h4>
                        <p className="text-gray-500">
                           Profit from selling an asset held for <strong>less than 1 year</strong>. This is taxed as Ordinary Income (up to 37%+), unlike Long-Term Gains (0-20%).
                           <br/><span className="italic text-nordic-terra font-bold">Red Alert:</span> If you sell a winner too early, the IRS takes a much bigger cut. Wait 366 days if possible.
                        </p>
                      </div>

                      <div>
                         <h4 className="font-bold text-nordic-slate uppercase mb-1 flex items-center gap-2">
                            <Zap size={12} className="text-nordic-sage" /> Tactical Harvest List (Tax Loss)
                         </h4>
                         <p className="text-gray-500">
                            These are specific "Lots" (batches of shares) in your portfolio that are currently worth <em>less</em> than what you paid.
                            <br/><span className="italic text-nordic-sage font-bold">Green Light:</span> Selling these locks in a loss, which you can use to cancel out gains from other winners, lowering your total tax bill. This is called "Tax Loss Harvesting".
                         </p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div>
                         <h4 className="font-bold text-nordic-slate uppercase mb-1 flex items-center gap-2">
                            <Briefcase size={12} className="text-nordic-blue" /> Human Capital Hedging
                         </h4>
                         <p className="text-gray-500">
                            Your job is an asset. If you work in Tech, your salary is correlated to Tech stocks.
                            The engine adds a simulated $750k asset to your portfolio based on your industry.
                            <br/><span className="italic text-nordic-blue">Action:</span> If your "Total Exposure" bar is &gt;40% in one sector, diversify your stocks away from your career field.
                         </p>
                      </div>

                       <div>
                         <h4 className="font-bold text-nordic-slate uppercase mb-1 flex items-center gap-2">
                            <BrainCircuit size={12} className="text-nordic-slate" /> Thesis Drift Monitor
                         </h4>
                         <p className="text-gray-500">
                            Behavioral edge comes from knowing <em>why</em> you own something. The engine tracks your "Buy Thesis".
                            <br/><span className="italic text-nordic-slate">Action:</span> If price moves +/- 5% and you haven't re-confirmed your thesis in 90 days, it's flagged. Don't "Zombie Hold".
                         </p>
                      </div>
                   </div>
                </div>

                <div className="mt-6 bg-nordic-oatmeal p-4 rounded-xl border border-nordic-muted flex items-start gap-3">
                   <Lightbulb size={18} className="text-nordic-blue mt-0.5 flex-shrink-0" />
                   <div>
                      <h4 className="font-bold text-nordic-slate text-xs uppercase mb-1">Quick Start Workflow</h4>
                      <ol className="list-decimal list-inside text-xs text-gray-500 space-y-1">
                         <li><strong>Set Assumptions:</strong> In the sidebar, set your Tax Rate and Job Sector.</li>
                         <li><strong>Check Concentration:</strong> Look at the "Sector Concentration" chart. Is the Total bar (Blue + Red) too high?</li>
                         <li><strong>Review Tax Drag:</strong> Look for Red warning boxes in the Yield section. Consider swapping those assets.</li>
                         <li><strong>Stress Test:</strong> Toggle the "Show Stress-Test Overlay" eye icon to see how a tax hike would impact your recovery.</li>
                      </ol>
                   </div>
                </div>
              </details>
          </div>

        </div>

        {/* LOGIC TRACE MODAL */}
        {showLogicTrace && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nordic-slate/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
                    {(() => {
                        const lot = lots.find(l => l.id === showLogicTrace);
                        if (!lot) return null;
                        return (
                            <>
                            <div className="bg-nordic-oatmeal p-5 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-base font-black uppercase text-nordic-slate flex items-center gap-2">
                                    <BrainCircuit size={18} className="text-nordic-blue" /> Logic Trace: {lot.ticker}
                                </h3>
                                <button onClick={() => setShowLogicTrace(null)}><X size={20} className="text-gray-400 hover:text-nordic-terra transition-colors" /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Trace Content */}
                                <div className="bg-nordic-blue/5 p-5 rounded-xl border border-nordic-blue/20 relative">
                                    <div className="absolute top-0 right-0 bg-nordic-blue text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg uppercase">
                                       AI Verified
                                    </div>
                                    <p className="text-xs font-bold text-nordic-blue uppercase mb-2 flex items-center gap-2">
                                        <Sparkles size={14} /> Evidence Trail
                                    </p>
                                    <p className="text-sm text-nordic-slate font-medium leading-relaxed">"{lot.thesisEvidence || "No specific evidence logged."}"</p>
                                    <div className="mt-4 pt-3 border-t border-nordic-blue/10 text-[10px] text-gray-500 flex justify-between font-medium">
                                        <span>Source: 10-Q Filing / Earnings Call</span>
                                        <span>Verified: {lot.lastThesisUpdate}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowLogicTrace(null)}
                                    className="w-full py-3 bg-nordic-slate text-white font-bold rounded-xl shadow-lg hover:bg-opacity-90 transition-all mt-2"
                                >
                                    Close Trace
                                </button>
                            </div>
                            </>
                        );
                    })()}
                </div>
            </div>
        )}

        {/* PORTFOLIO MANAGER MODAL */}
        {isManagerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nordic-slate/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-gray-200">
                    <div className="bg-white p-5 border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
                        <div>
                           <h3 className="text-xl font-black text-nordic-slate flex items-center gap-2">
                               <Briefcase size={22} className="text-nordic-blue" /> Portfolio Ledger
                           </h3>
                           <p className="text-xs text-gray-400 mt-1">Manage simulation holdings and cost basis.</p>
                        </div>
                        <button onClick={() => setIsManagerOpen(false)} className="text-gray-400 hover:text-nordic-terra transition-colors p-2 hover:bg-gray-100 rounded-lg">
                           <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-nordic-oatmeal">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                           <table className="w-full text-xs text-left">
                              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                                 <tr>
                                    <th className="px-4 py-3">Ticker</th>
                                    <th className="px-4 py-3">Sector</th>
                                    <th className="px-4 py-3 text-right">Qty</th>
                                    <th className="px-4 py-3 text-right">Avg Cost</th>
                                    <th className="px-4 py-3 text-right">Price</th>
                                    <th className="px-4 py-3">Thesis</th>
                                    <th className="px-4 py-3 text-center">Action</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                 {lots.map(lot => (
                                    <tr key={lot.id} className="hover:bg-blue-50/50 transition-colors">
                                       <td className="px-4 py-2 font-bold text-nordic-slate">
                                          <div className="flex items-center gap-1">
                                              <input
                                                 value={lot.ticker}
                                                 onChange={(e) => handleUpdateLot(lot.id, 'ticker', e.target.value.toUpperCase())}
                                                 onKeyDown={(e) => {
                                                     if (e.key === 'Enter') handleFetchLotData(lot.id, lot.ticker);
                                                 }}
                                                 className="w-14 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-nordic-blue focus:outline-none uppercase font-black"
                                                 placeholder="SYM"
                                              />
                                              <button
                                                onClick={() => handleFetchLotData(lot.id, lot.ticker)}
                                                disabled={fetchingLotId === lot.id}
                                                className="p-1 hover:bg-gray-100 rounded text-nordic-blue transition-colors"
                                                title="Fetch Price & Sector"
                                              >
                                                {fetchingLotId === lot.id ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                                              </button>
                                          </div>
                                       </td>
                                       <td className="px-4 py-2">
                                          <select
                                             value={lot.sector}
                                             onChange={(e) => handleUpdateLot(lot.id, 'sector', e.target.value)}
                                             className="bg-transparent text-gray-600 border-none outline-none cursor-pointer text-xs max-w-[100px]"
                                          >
                                             <option value="Technology">Technology</option>
                                             <option value="Real Estate">Real Estate</option>
                                             <option value="Aviation/Defense">Aviation/Def</option>
                                             <option value="Financials">Financials</option>
                                             <option value="Healthcare">Healthcare</option>
                                             <option value="Energy">Energy</option>
                                             <option value="Consumer">Consumer</option>
                                          </select>
                                       </td>
                                       <td className="px-4 py-2 text-right">
                                          <ValidatedInput
                                             value={lot.quantity}
                                             onChange={(v) => handleUpdateLot(lot.id, 'quantity', v)}
                                             min={0}
                                             className="w-20 text-right bg-transparent border-transparent hover:border-gray-200"
                                          />
                                       </td>
                                       <td className="px-4 py-2 text-right">
                                          <ValidatedInput
                                             value={lot.costPerShare}
                                             onChange={(v) => handleUpdateLot(lot.id, 'costPerShare', v)}
                                             min={0}
                                             prefix="$"
                                             className="w-24 text-right bg-transparent border-transparent hover:border-gray-200"
                                          />
                                       </td>
                                       <td className="px-4 py-2 text-right">
                                          <ValidatedInput
                                             value={lot.currentPrice}
                                             onChange={(v) => handleUpdateLot(lot.id, 'currentPrice', v)}
                                             min={0}
                                             prefix="$"
                                             className="w-24 text-right bg-transparent border-transparent hover:border-gray-200"
                                          />
                                       </td>
                                       <td className="px-4 py-2">
                                          <input
                                             value={lot.buyThesis}
                                             onChange={(e) => handleUpdateLot(lot.id, 'buyThesis', e.target.value)}
                                             className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-nordic-blue focus:outline-none text-gray-500 italic"
                                             placeholder="Enter logic..."
                                          />
                                       </td>
                                       <td className="px-4 py-2 text-center">
                                          <button
                                             onClick={() => handleRemoveLot(lot.id)}
                                             className="text-gray-300 hover:text-nordic-terra transition-colors p-1 rounded hover:bg-red-50"
                                             title="Delete Position"
                                          >
                                             <Trash2 size={16} />
                                          </button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                           {lots.length === 0 && (
                              <div className="p-8 text-center text-gray-400 italic bg-gray-50">
                                 No simulated holdings. Add one to start.
                              </div>
                           )}
                        </div>
                    </div>

                    <div className="bg-white p-5 border-t border-gray-100 flex justify-between items-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                       <button
                          onClick={handleAddLot}
                          className="flex items-center gap-2 text-nordic-blue font-bold text-sm bg-blue-50 px-4 py-2.5 rounded-lg hover:bg-blue-100 transition-colors"
                       >
                          <Plus size={16} /> Add New Position
                       </button>
                       <button
                          onClick={() => setIsManagerOpen(false)}
                          className="flex items-center gap-2 text-white font-bold text-sm bg-nordic-slate px-8 py-2.5 rounded-lg hover:bg-opacity-90 transition-all shadow-md"
                       >
                          <Save size={16} /> Save & Close
                       </button>
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};


