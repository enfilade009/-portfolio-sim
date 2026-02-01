import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, AlertTriangle, Cpu, Wallet, TrendingUp, Percent, Plus, Trash2, Save, PlayCircle,
  FolderOpen, PiggyBank, Target, Coins, Banknote, Briefcase, Users, Building, Laptop,
  Landmark, Zap, Heart, GraduationCap, BadgeDollarSign, Gem, BriefcaseBusiness, Shield,
  Globe, ChevronRight, Hourglass, Calendar, Sparkles, HelpCircle, X, Clock,
  BarChart2, Layers, Globe2, BrainCircuit, Settings2, Moon, Sun
} from 'lucide-react';
import { AssetParams, SimulationConfig, StressScenario, SimulationYearResult, SimulationSummary, RiskPathPoint, IncomeSource, IncomeFrequency, SimulationResult, SavedScenario, AssetCategory, InvestmentGoal, WithdrawalStrategy } from './types';
import { DEFAULT_ASSETS, SIMULATION_ITERATIONS } from './constants';
import { runSimulation } from './services/simulationEngine';
import { getWealthInsights } from './services/geminiService';
import { SimulationChart } from './components/SimulationChart';
import { AssetAllocation } from './components/AssetAllocation';
import { MetricsCard } from './components/MetricsCard';
import { DrawdownAnalysis } from './components/DrawdownAnalysis';
import { ModelDiagnostics } from './components/ModelDiagnostics';
import { CorrelationMatrix } from './components/CorrelationMatrix';
import { WealthBreakdown } from './components/WealthBreakdown';
import { ValidatedInput } from './components/ValidatedInput';
import { DetailedTable } from './components/DetailedTable';
import { GoalAnalysis } from './components/GoalAnalysis';
import { DividendEngine } from './components/DividendEngine';
import { MarketDashboard } from './components/MarketDashboard';
import { AlphaEngine } from './components/AlphaEngine';

// Rich Income Templates for Family & Career
const INCOME_CATEGORIES = [
  {
    title: "Employment & Career",
    items: [
      { name: 'Primary Salary', icon: <Briefcase size={14} />, growth: 0.03, freq: 'Yearly' as IncomeFrequency, desc: 'Base annual pay', stopsAtRetirement: true },
      { name: 'Partner Salary', icon: <Users size={14} />, growth: 0.03, freq: 'Yearly' as IncomeFrequency, desc: 'Spouse/Partner income', stopsAtRetirement: true },
      { name: 'Annual Bonus', icon: <BadgeDollarSign size={14} />, growth: 0.02, freq: 'Yearly' as IncomeFrequency, desc: 'Performance bonus', stopsAtRetirement: true },
      { name: 'RSU Vesting', icon: <Gem size={14} />, growth: 0.05, freq: 'Yearly' as IncomeFrequency, desc: 'Stock comp vesting', stopsAtRetirement: true },
    ]
  },
  {
    title: "Benefits & Social Security",
    items: [
      { name: 'Social Security', icon: <Shield size={14} />, growth: 0.025, freq: 'Monthly' as IncomeFrequency, desc: 'Starts at retirement age (e.g. 67)', stopsAtRetirement: false },
      { name: 'Pension', icon: <Landmark size={14} />, growth: 0.00, freq: 'Monthly' as IncomeFrequency, desc: 'Defined benefit plan', stopsAtRetirement: false },
      { name: 'Child Benefit', icon: <Heart size={14} />, growth: 0.00, freq: 'Monthly' as IncomeFrequency, desc: 'Tax credits/Support', stopsAtRetirement: true },
    ]
  },
  {
    title: "Passive & Business",
    items: [
      { name: 'Rental Income', icon: <Building size={14} />, growth: 0.03, freq: 'Monthly' as IncomeFrequency, desc: 'Real estate cashflow', stopsAtRetirement: false },
      { name: 'Side Business', icon: <Laptop size={14} />, growth: 0.05, freq: 'Monthly' as IncomeFrequency, desc: 'Online/Service biz', stopsAtRetirement: false },
      { name: 'Dividends', icon: <TrendingUp size={14} />, growth: 0.05, freq: 'Yearly' as IncomeFrequency, desc: 'Portfolio yields', stopsAtRetirement: false },
    ]
  }
];

const getSourceIcon = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes('salary') || normalized.includes('job') || normalized.includes('employment') || normalized.includes('career')) return <Briefcase size={18} />;
  if (normalized.includes('partner') || normalized.includes('spouse') || normalized.includes('wife') || normalized.includes('husband')) return <Users size={18} />;
  if (normalized.includes('bonus') || normalized.includes('commission')) return <BadgeDollarSign size={18} />;
  if (normalized.includes('stock') || normalized.includes('rsu') || normalized.includes('equity') || normalized.includes('vesting')) return <Gem size={18} />;
  if (normalized.includes('social') || normalized.includes('security') || normalized.includes('govt')) return <Shield size={18} />;
  if (normalized.includes('pension') || normalized.includes('annuity')) return <Landmark size={18} />;
  if (normalized.includes('child') || normalized.includes('family') || normalized.includes('support')) return <Heart size={18} />;
  if (normalized.includes('rent') || normalized.includes('property') || normalized.includes('estate')) return <Building size={18} />;
  if (normalized.includes('business') || normalized.includes('freelance') || normalized.includes('side') || normalized.includes('consulting')) return <Laptop size={18} />;
  if (normalized.includes('dividend') || normalized.includes('interest') || normalized.includes('portfolio')) return <TrendingUp size={18} />;
  return <Banknote size={18} />;
};

const DisclaimerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nordic-slate/80 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-slate-700">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-nordic-slate dark:text-white flex items-center gap-2">
          <Activity size={24} className="text-nordic-blue" />
          The Stochastic Reality
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-nordic-terra">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4 text-sm text-nordic-charcoal dark:text-slate-300 leading-relaxed">
        <p>
          <strong>Why did the numbers change?</strong><br/>
          Unlike simple calculators that assume a fixed 7% return every year, this engine runs <strong>{SIMULATION_ITERATIONS} separate lifetimes</strong>. Every time you change a setting (or even just re-run), we simulate a new set of market conditions, crashes, and recoveries.
        </p>

        <div className="bg-nordic-oatmeal dark:bg-slate-700/50 p-4 rounded-lg border border-nordic-muted dark:border-slate-600">
          <h4 className="font-bold text-xs uppercase text-gray-500 dark:text-slate-400 mb-2">Best Practices</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-slate-300">
            <li>Focus on the <strong>Median (White Line)</strong> for planning.</li>
            <li>Use the <strong>10th Percentile (Red Line)</strong> for safety. If you can survive this path, you are robust.</li>
            <li>Don't obsess over exact dollar amounts; look at the <strong>probability trends</strong>.</li>
          </ul>
        </div>

        <p className="text-xs text-gray-400 italic">
          Disclaimer: This tool is for educational simulation purposes only. It uses mathematical models (Geometric Brownian Motion with Jump Diffusion) to approximate risk, but cannot predict the future.
        </p>
      </div>

      <button
        onClick={onClose}
        className="mt-6 w-full py-3 bg-nordic-slate dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-opacity-90 transition-all"
      >
        Understood
      </button>
    </div>
  </div>
);

type ActiveTab = 'forecast' | 'ladder' | 'market' | 'alpha';

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('forecast');

  // Mobile View Toggle State
  const [mobileView, setMobileView] = useState<'inputs' | 'results'>('results');

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Wealth Forecast State
  const [assets, setAssets] = useState<AssetParams[]>(DEFAULT_ASSETS);
  const [isIncomeDropdownOpen, setIsIncomeDropdownOpen] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [showReal, setShowReal] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const [config, setConfig] = useState<SimulationConfig>({
    initialWealth: 150000,
    incomeSources: [
      { id: '1', name: 'Salary', amount: 120000, frequency: 'Yearly', growthRate: 0.03, startYear: new Date().getFullYear(), stopsAtRetirement: true },
    ],
    goals: [],
    savingsRate: 20,
    retirementDelayYears: 0,
    timeHorizonYears: 30,
    withdrawalRate: 0.04,
    withdrawalStrategy: 'FIXED_REAL',
    taxRate: 0.25,
    inflationRate: 0.025,
    startYear: new Date().getFullYear(),
    currentAge: 35,
    crisisStartYear: 0,
    crisisDuration: 3,
    stressSeverity: 10
  });

  const [scenario, setScenario] = useState<StressScenario>(StressScenario.NONE);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [insights, setInsights] = useState<string>("");
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    try {
      const saved = localStorage.getItem('nordic_saved_scenarios');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load scenarios", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('nordic_saved_scenarios', JSON.stringify(savedScenarios));
  }, [savedScenarios]);

  useEffect(() => {
    if (savedScenarios.length === 0) {
      setShowDisclaimer(true);
    }
  }, []);

  const addIncomeSource = (template?: typeof INCOME_CATEGORIES[0]['items'][0]) => {
    let defaultStartYear = config.startYear;
    if (template?.name === 'Social Security') {
       const age = config.currentAge || 35;
       defaultStartYear = config.startYear + Math.max(0, 67 - age);
    }

    const newSource: IncomeSource = {
      id: Date.now().toString(),
      name: template ? template.name : 'New Income',
      amount: 0,
      frequency: template ? template.freq : 'Yearly',
      growthRate: template ? template.growth : 0.03,
      startYear: defaultStartYear,
      stopsAtRetirement: template ? (template as any).stopsAtRetirement : false
    };
    setConfig(prev => ({ ...prev, incomeSources: [...prev.incomeSources, newSource] }));
    setIsIncomeDropdownOpen(false);
  };

  const removeIncomeSource = (id: string) => {
    setConfig(prev => ({ ...prev, incomeSources: prev.incomeSources.filter(s => s.id !== id) }));
  };

  const updateIncomeSource = (id: string, field: keyof IncomeSource, value: any) => {
    setConfig(prev => ({
      ...prev,
      incomeSources: prev.incomeSources.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const addGoal = () => {
    const newGoal: InvestmentGoal = {
      id: Date.now().toString(),
      name: 'New Goal',
      targetAmount: 100000,
      targetYear: config.startYear + 10
    };
    setConfig(prev => ({ ...prev, goals: [...(prev.goals || []), newGoal] }));
    setIsAddingGoal(true);
  };

  const removeGoal = (id: string) => {
    setConfig(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  };

  const updateGoal = (id: string, field: keyof InvestmentGoal, value: any) => {
    setConfig(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, [field]: value } : g)
    }));
  };

  const calculateTotalAnnualIncome = () => {
    return config.incomeSources.reduce((acc, s) => {
      return acc + (s.frequency === 'Monthly' ? s.amount * 12 : s.amount);
    }, 0);
  };

  const totalAnnualIncome = calculateTotalAnnualIncome();
  const estimatedAnnualSavings = totalAnnualIncome * (config.savingsRate / 100);

  const weightedGrowthRate = totalAnnualIncome > 0
    ? config.incomeSources.reduce((acc, s) => {
        const annual = s.frequency === 'Monthly' ? s.amount * 12 : s.amount;
        return acc + (annual * s.growthRate);
      }, 0) / totalAnnualIncome
    : 0.03;

  const updateGlobalGrowthRate = (newTargetRate: number) => {
    setConfig(prev => {
      if (weightedGrowthRate < 0.001) {
        return {
          ...prev,
          incomeSources: prev.incomeSources.map(s => ({
            ...s,
            growthRate: newTargetRate
          }))
        };
      }
      const ratio = newTargetRate / weightedGrowthRate;
      return {
        ...prev,
        incomeSources: prev.incomeSources.map(s => ({
          ...s,
          growthRate: s.growthRate * ratio
        }))
      };
    });
  };

  const saveCurrentScenario = () => {
    const name = prompt("Name this scenario (e.g., 'Aggressive Growth' or 'Early Retirement'):", `Scenario ${savedScenarios.length + 1}`);
    if (name) {
      const newSaved: SavedScenario = {
        id: Date.now().toString(),
        name,
        date: new Date().toLocaleDateString(),
        config: JSON.parse(JSON.stringify(config)),
        assets: JSON.parse(JSON.stringify(assets))
      };
      setSavedScenarios([...savedScenarios, newSaved]);
      alert(`Saved "${name}" successfully.`);
    }
  };

  const loadScenario = (s: SavedScenario) => {
    if (confirm(`Load scenario "${s.name}"? Unsaved changes will be lost.`)) {
      setConfig({ ...s.config, goals: s.config.goals || [] });
      setAssets(s.assets);
    }
  };

  const deleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Permanently delete this saved scenario?')) {
      setSavedScenarios(prev => prev.filter(s => s.id !== id));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const res = runSimulation(assets, config, scenario, SIMULATION_ITERATIONS);
      setResults(res);
      setInsights("");
    }, 100);
    return () => clearTimeout(timer);
  }, [assets, config, scenario]);

  const handleGenerateInsights = async () => {
    if (!results) return;
    setLoadingInsights(true);
    const text = await getWealthInsights(results.summary, assets, results.data[results.data.length - 1]);
    setInsights(text);
    setLoadingInsights(false);
  };

  const formattedPoS = results ? `${results.summary.probabilityOfSuccess.toFixed(1)}%` : '-';
  const posColor = results && results.summary.probabilityOfSuccess > 85 ? 'success' : 'danger';

  const medianValue = results
    ? (showReal ? results.summary.medianTerminalWealthReal : results.summary.medianTerminalWealth)
    : 0;

  const p10Value = results && results.data.length > 0
    ? (showReal ? results.data[results.data.length-1].p10Real : results.data[results.data.length-1].p10)
    : 0;

  const formatCurrency = (val: number) => {
    const absVal = Math.abs(val);
    let formatted = '';
    if (absVal >= 1000000) formatted = `$${(absVal / 1000000).toFixed(2)}M`;
    else if (absVal >= 1000) formatted = `$${(absVal / 1000).toFixed(0)}k`;
    else formatted = `$${Math.round(absVal).toLocaleString()}`;
    return val < 0 ? `(${formatted})` : formatted;
  };

  const aiSections = insights.split('|||').map(s => s.trim()).filter(s => s.length > 0);

  return (
    <div className={`${isDarkMode ? 'dark' : ''} flex flex-col h-screen`}>
    <div className="min-h-screen font-sans bg-nordic-oatmeal dark:bg-slate-950 text-nordic-slate dark:text-slate-100 flex flex-col h-screen overflow-hidden">
      {showDisclaimer && <DisclaimerModal onClose={() => setShowDisclaimer(false)} />}

      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-nordic-muted dark:border-slate-800 px-4 py-3 flex-shrink-0 z-20 flex justify-between items-center shadow-sm overflow-x-auto">
         <div className="flex items-center gap-3">
            <div className="bg-nordic-slate dark:bg-slate-700 text-white p-2 rounded-lg shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-nordic-slate dark:text-white leading-none whitespace-nowrap">Portfolio Sim</h1>
            </div>
         </div>

         <div className="flex bg-nordic-oatmeal dark:bg-slate-800 p-1 rounded-lg border border-nordic-muted dark:border-slate-700 ml-4 overflow-x-auto">
            <button
               onClick={() => setActiveTab('forecast')}
               className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'forecast' ? 'bg-white dark:bg-slate-700 text-nordic-slate dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
               <BarChart2 size={16} /> <span className="hidden md:inline">Wealth</span> Forecast
            </button>
            <button
               onClick={() => setActiveTab('ladder')}
               className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'ladder' ? 'bg-white dark:bg-slate-700 text-nordic-slate dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
               <Layers size={16} /> <span className="hidden md:inline">Dividend</span> Ladder
            </button>
             <button
               onClick={() => setActiveTab('market')}
               className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'market' ? 'bg-white dark:bg-slate-700 text-nordic-slate dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
               <Globe2 size={16} /> Market <span className="hidden md:inline">Dashboard</span>
            </button>
            <button
               onClick={() => setActiveTab('alpha')}
               className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'alpha' ? 'bg-white dark:bg-slate-700 text-nordic-slate dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
               <BrainCircuit size={16} /> Strategy <span className="hidden md:inline">& Tax</span>
            </button>
         </div>
          <div className="ml-4 flex items-center gap-2"> <a
            
              href="https://buymeacoffee.com/enfilade009"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all hover:scale-105"
            >
              <Heart size={14} fill="currentColor" />
              <span>Support</span>
            </a>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
         </div>
      </header>

      {/* Conditional Rendering of Views */}
      {activeTab === 'forecast' ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

          {/* Mobile View Toggle */}
          <div className="md:hidden flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 shrink-0">
             <button
                onClick={() => setMobileView('inputs')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileView === 'inputs' ? 'text-nordic-blue border-b-2 border-nordic-blue bg-blue-50/50 dark:bg-slate-800' : 'text-gray-400 dark:text-gray-500'}`}
             >
                <Settings2 size={14} /> Profile & Inputs
             </button>
             <button
                onClick={() => setMobileView('results')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileView === 'results' ? 'text-nordic-blue border-b-2 border-nordic-blue bg-blue-50/50 dark:bg-slate-800' : 'text-gray-400 dark:text-gray-500'}`}
             >
                <BarChart2 size={14} /> Forecast Results
             </button>
          </div>

          {/* Sidebar - Controls */}
          <aside className={`w-full md:w-[450px] bg-white dark:bg-slate-900 border-r border-nordic-muted dark:border-slate-800 flex flex-col h-full shadow-soft z-10 transition-transform md:translate-x-0 ${mobileView === 'inputs' ? 'translate-x-0 block' : '-translate-x-full hidden md:flex'}`}>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="space-y-12">
                  <section className="space-y-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                          <Users size={18} className="text-nordic-blue" />
                          <h3 className="text-base font-bold uppercase tracking-wider text-nordic-slate dark:text-white">Your Profile</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Current Age</label>
                        <ValidatedInput
                            value={config.currentAge || 35}
                            onChange={(v) => setConfig({...config, currentAge: v})}
                            min={18}
                            max={100}
                            className="w-full bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        />
                      </div>
                        <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Initial Wealth</label>
                        <ValidatedInput
                            value={config.initialWealth}
                            onChange={(v) => setConfig({...config, initialWealth: v})}
                            min={0}
                            prefix="$"
                            step={1000}
                            className="w-full bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                          />
                      </div>
                    </div>
                  </section>

                  {/* ... Rest of Sidebar Sections ... */}
                  <section className="space-y-5 pt-5 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                          <Wallet size={18} className="text-nordic-blue" />
                          <h3 className="text-base font-bold uppercase tracking-wider text-nordic-slate dark:text-white">Income & Cashflow</h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {config.incomeSources.map((source) => {
                        const startAge = (config.currentAge || 35) + ((source.startYear || config.startYear) - config.startYear);
                        return (
                        <div key={source.id} className="bg-nordic-oatmeal dark:bg-slate-800/50 p-4 rounded-xl border border-transparent hover:border-nordic-muted dark:hover:border-slate-700 transition-all">
                            <div className="flex items-start mb-3 gap-3">
                              {/* Icon Container */}
                              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-nordic-blue flex-shrink-0 border border-gray-100 dark:border-slate-700">
                                {getSourceIcon(source.name)}
                              </div>

                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={source.name}
                                  onChange={(e) => updateIncomeSource(source.id, 'name', e.target.value)}
                                  className="bg-white dark:bg-slate-800 shadow-sm font-semibold text-sm text-nordic-slate dark:text-white w-full focus:outline-none border border-nordic-muted dark:border-slate-700 rounded px-2 py-1.5 focus:border-nordic-blue focus:ring-1 focus:ring-nordic-blue transition-all"
                                />
                                <button onClick={() => removeIncomeSource(source.id)} className="text-gray-400 hover:text-nordic-terra mt-1.5">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="relative">
                                <ValidatedInput
                                    value={source.amount}
                                    onChange={(val) => updateIncomeSource(source.id, 'amount', val)}
                                    min={0}
                                    prefix="$"
                                    className="w-full bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                />
                              </div>
                              <select
                                value={source.frequency}
                                onChange={(e) => updateIncomeSource(source.id, 'frequency', e.target.value)}
                                className="text-sm rounded border border-nordic-muted dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm py-1.5 px-2 focus:ring-1 focus:ring-nordic-blue outline-none text-nordic-slate dark:text-white font-medium"
                              >
                                <option value="Yearly">Yearly</option>
                                <option value="Monthly">Monthly</option>
                              </select>
                            </div>

                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                  <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Start Year:</label>
                                  <div className="w-20">
                                    <ValidatedInput
                                        value={source.startYear || config.startYear}
                                        onChange={(val) => updateIncomeSource(source.id, 'startYear', val)}
                                        min={config.startYear}
                                        max={config.startYear + 60}
                                        className="w-full bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    />
                                  </div>
                                  <span className="text-[10px] text-gray-400 italic whitespace-nowrap">
                                    (Age {startAge})
                                  </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                                <input
                                  type="checkbox"
                                  checked={source.stopsAtRetirement !== false}
                                  onChange={(e) => updateIncomeSource(source.id, 'stopsAtRetirement', e.target.checked)}
                                  className="rounded text-nordic-blue focus:ring-nordic-blue cursor-pointer w-4 h-4 bg-white dark:bg-slate-800"
                                />
                                <label className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
                                  Stops when retirement begins?
                                </label>
                            </div>
                        </div>
                      )})}

                      <div className="relative">
                        <button
                          onClick={() => setIsIncomeDropdownOpen(!isIncomeDropdownOpen)}
                          className="w-full py-3 border border-dashed border-nordic-muted dark:border-slate-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-nordic-blue hover:border-nordic-blue hover:bg-blue-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 font-bold bg-white dark:bg-slate-900"
                        >
                          <Plus size={16} /> Add Income Source
                        </button>

                        {isIncomeDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsIncomeDropdownOpen(false)}></div>
                            <div className="absolute top-full left-0 w-[300px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-xl z-50 mt-2 animate-fade-in overflow-hidden">
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                  {INCOME_CATEGORIES.map((category, idx) => (
                                    <div key={idx} className="border-b border-gray-100 dark:border-slate-700 last:border-0">
                                      <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 text-xs font-bold uppercase text-gray-400 tracking-wider">
                                        {category.title}
                                      </div>
                                      <div>
                                        {category.items.map((item) => (
                                          <button
                                            key={item.name}
                                            onClick={() => addIncomeSource(item)}
                                            className="w-full text-left px-5 py-3 hover:bg-nordic-oatmeal dark:hover:bg-slate-700 group transition-colors flex items-start gap-3 bg-white dark:bg-slate-800"
                                          >
                                              <div className="mt-1 text-gray-400 group-hover:text-nordic-blue transition-colors">
                                                {item.icon}
                                              </div>
                                              <div>
                                                <p className="text-sm font-semibold text-nordic-slate dark:text-white">{item.name}</p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                  {item.desc}
                                                </p>
                                              </div>
                                              <div className="ml-auto opacity-0 group-hover:opacity-100 text-gray-300">
                                                <ChevronRight size={16} />
                                              </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                  <button
                                      onClick={() => addIncomeSource()}
                                      className="w-full text-left px-5 py-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-nordic-slate dark:text-white font-semibold flex items-center gap-2 border-t border-gray-200 dark:border-slate-700"
                                  >
                                      <Plus size={14} /> Create Custom Source...
                                  </button>
                                </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400 font-bold">Avg. Income Growth</span>
                        <div className="w-20">
                            <ValidatedInput
                              value={parseFloat((weightedGrowthRate * 100).toFixed(1))}
                              onChange={(v) => updateGlobalGrowthRate(v / 100)}
                              min={-5}
                              max={20}
                              suffix="%"
                              className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            />
                        </div>
                      </div>
                      <input
                          type="range" min="0" max="10" step="0.1"
                          value={weightedGrowthRate * 100}
                          onChange={(e) => updateGlobalGrowthRate(parseFloat(e.target.value) / 100)}
                          className="w-full h-1.5 bg-nordic-muted dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-nordic-slate dark:accent-slate-400"
                      />
                    </div>

                    <div className="pt-3">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-bold text-gray-600 dark:text-gray-400">% of Income Saved</span>
                        <div className="w-24">
                            <ValidatedInput
                              value={config.savingsRate}
                              onChange={(v) => setConfig({...config, savingsRate: v})}
                              min={0}
                              max={90}
                              suffix="%"
                              label="Savings"
                              className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            />
                        </div>
                      </div>
                      <input
                          type="range" min="0" max="80" step="1"
                          value={config.savingsRate}
                          onChange={(e) => setConfig({...config, savingsRate: parseInt(e.target.value)})}
                          className="w-full h-1.5 bg-nordic-muted dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-nordic-slate dark:accent-slate-400"
                      />

                      <div className="mt-3 p-3 bg-nordic-sageLight dark:bg-slate-800 bg-opacity-30 rounded-lg border border-nordic-sageLight dark:border-slate-700 border-opacity-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PiggyBank size={18} className="text-nordic-sageDark dark:text-nordic-sage" />
                          <span className="text-sm font-bold text-nordic-sageDark dark:text-nordic-sage">Annual Savings</span>
                        </div>
                        <span className="text-base font-bold text-nordic-slate dark:text-white font-mono">${Math.round(estimatedAnnualSavings).toLocaleString()}</span>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5 border-t border-gray-100 dark:border-slate-800 pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                          <Target size={18} className="text-nordic-blue" />
                          <h3 className="text-base font-bold uppercase tracking-wider text-nordic-slate dark:text-white">Financial Goals</h3>
                      </div>
                    </div>

                    {config.goals && config.goals.map((goal) => (
                        <div key={goal.id} className="bg-nordic-oatmeal dark:bg-slate-800/50 p-4 rounded-xl border border-transparent hover:border-nordic-muted dark:hover:border-slate-700 transition-all">
                          <div className="flex justify-between items-start mb-3 gap-3">
                              <input
                                type="text"
                                value={goal.name}
                                onChange={(e) => updateGoal(goal.id, 'name', e.target.value)}
                                className="bg-white dark:bg-slate-800 shadow-sm font-semibold text-sm text-nordic-slate dark:text-white w-full focus:outline-none border border-gray-200 dark:border-slate-700 rounded px-2 py-1.5 focus:border-nordic-blue focus:ring-1 focus:ring-nordic-blue transition-all"
                              />
                              <button onClick={() => removeGoal(goal.id)} className="text-gray-400 hover:text-nordic-terra">
                                <Trash2 size={16} />
                              </button>
                          </div>

                          <div className="space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase">Amount (Today's $)</span>
                                <div className="w-28">
                                  <ValidatedInput
                                      value={goal.targetAmount}
                                      onChange={(v) => updateGoal(goal.id, 'targetAmount', v)}
                                      min={0}
                                      prefix="$"
                                      className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase">Target Year</span>
                                <div className="w-28">
                                  <ValidatedInput
                                      value={goal.targetYear}
                                      onChange={(v) => updateGoal(goal.id, 'targetYear', v)}
                                      min={config.startYear}
                                      max={config.startYear + 80}
                                      step={1}
                                      className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                  />
                                </div>
                              </div>
                          </div>
                        </div>
                    ))}

                    <button
                        onClick={addGoal}
                        className="w-full py-3 border border-dashed border-nordic-muted dark:border-slate-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-nordic-blue hover:border-nordic-blue hover:bg-blue-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 font-bold bg-white dark:bg-slate-900"
                    >
                        <Plus size={16} /> Add Specific Goal
                    </button>
                  </section>

                  <section className="pt-5 border-t border-gray-100 dark:border-slate-800">
                    <AssetAllocation assets={assets} onUpdate={setAssets} />
                  </section>

                  <section className="space-y-5 pt-5 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={18} className="text-nordic-blue" />
                        <h3 className="text-base font-bold uppercase tracking-wider text-nordic-slate dark:text-white">Timeline & Rules</h3>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-bold text-gray-600 dark:text-gray-400">Total Simulation Years</span>
                        <div className="w-28">
                          <ValidatedInput
                              value={config.timeHorizonYears}
                              onChange={(v) => setConfig({...config, timeHorizonYears: v})}
                              min={5}
                              max={80}
                              suffix="Yrs"
                              className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <input
                          type="range" min="5" max="60" step="1"
                          value={config.timeHorizonYears}
                          onChange={(e) => setConfig({...config, timeHorizonYears: parseInt(e.target.value)})}
                          className="w-full h-1.5 bg-nordic-muted dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-nordic-slate dark:accent-slate-400"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <div className="flex items-center gap-2">
                          <Hourglass size={16} className="text-nordic-slate dark:text-white" />
                          <span className="font-bold text-gray-600 dark:text-gray-400">Years Accumulating</span>
                        </div>
                        <div className="w-28">
                          <ValidatedInput
                              value={config.retirementDelayYears}
                              onChange={(v) => setConfig({...config, retirementDelayYears: v})}
                              min={0}
                              max={config.timeHorizonYears}
                              suffix="Yrs"
                              className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <input
                          type="range" min="0" max="40" step="1"
                          value={config.retirementDelayYears}
                          onChange={(e) => setConfig({...config, retirementDelayYears: parseInt(e.target.value)})}
                          className="w-full h-1.5 bg-nordic-muted dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-nordic-slate dark:accent-slate-400"
                      />

                      <div className="mt-3 bg-nordic-oatmeal dark:bg-slate-800 border border-nordic-muted dark:border-slate-700 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
                          <Calendar size={14} className="mt-0.5 text-nordic-blue" />
                          <div>
                            {config.retirementDelayYears === 0 ? (
                              <span><strong>Immediate Drawdown:</strong> Withdrawals start Month 1 ({config.startYear}). Income/Savings are still added if any (Hybrid Mode).</span>
                            ) : (
                              <span>
                                <strong>Work Phase (0-{config.retirementDelayYears}y):</strong> Savings added, No withdrawals.<br/>
                                <strong>Retirement ({config.startYear + config.retirementDelayYears}):</strong> Income stops. Withdrawals commence.
                              </span>
                            )}
                          </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-bold text-gray-600 dark:text-gray-400">Annual Withdrawal Rate</span>
                        <div className="w-24">
                          <ValidatedInput
                              value={parseFloat((config.withdrawalRate * 100).toFixed(1))}
                              onChange={(v) => setConfig({...config, withdrawalRate: v / 100})}
                              min={0}
                              max={20}
                              step={0.1}
                              suffix="%"
                              className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 mb-3">
                        % of portfolio value withdrawn annually during retirement phase.
                      </p>

                      <div className="bg-nordic-oatmeal dark:bg-slate-800 p-3 rounded-lg border border-nordic-muted dark:border-slate-700">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-2">Withdrawal Strategy</label>
                        <select
                          value={config.withdrawalStrategy}
                          onChange={(e) => setConfig({...config, withdrawalStrategy: e.target.value as WithdrawalStrategy})}
                          className="w-full bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-600 rounded p-2 text-sm text-nordic-slate dark:text-white focus:ring-1 focus:ring-nordic-blue outline-none"
                        >
                          <option value="FIXED_REAL">Fixed Dollar (Inflation Adjusted)</option>
                          <option value="PERCENT_PORTFOLIO">% of Current Portfolio (Variable)</option>
                        </select>
                        <div className="mt-2 text-[10px] text-gray-400 leading-tight">
                          {config.withdrawalStrategy === 'FIXED_REAL'
                            ? "Standard 4% Rule. Withdrawal amount is locked at retirement and rises with inflation, regardless of market performance."
                            : "Flexible spending. You withdraw a fixed % of whatever is in the account that year. Income fluctuates, but portfolio survival is higher."}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-50 dark:border-slate-800">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-bold text-gray-600 dark:text-gray-400">Expected Inflation</span>
                        <div className="w-24">
                          <ValidatedInput
                              value={parseFloat((config.inflationRate * 100).toFixed(1))}
                              onChange={(v) => setConfig({...config, inflationRate: v / 100})}
                              min={0}
                              max={20}
                              step={0.1}
                              suffix="%"
                              className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-gray-50 dark:border-slate-800">
                      <label className="text-sm font-bold text-nordic-slate dark:text-white flex items-center gap-2">
                        <AlertTriangle size={16} className="text-nordic-terra" />
                        Simulate a Crisis
                      </label>

                      <div className="bg-nordic-oatmeal dark:bg-slate-800 p-3 rounded-lg space-y-3 border border-nordic-muted dark:border-slate-700">
                        <select
                          value={scenario}
                          onChange={(e) => setScenario(e.target.value as StressScenario)}
                          className="w-full bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-600 rounded-lg p-3 text-sm text-nordic-slate dark:text-white focus:ring-1 focus:ring-nordic-blue outline-none font-medium"
                        >
                          {Object.values(StressScenario).map(s => (
                            <option key={s} value={s}>{s === StressScenario.NONE ? "None (Normal Market)" : s}</option>
                          ))}
                        </select>

                        {scenario !== StressScenario.NONE && (
                          <div className="grid grid-cols-2 gap-3 animate-fade-in">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Start Year</label>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-400">Y</span>
                                <ValidatedInput
                                  value={config.crisisStartYear || 0}
                                  onChange={(v) => setConfig({...config, crisisStartYear: v})}
                                  min={0}
                                  max={config.timeHorizonYears - 1}
                                  className="w-full bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Duration (Yrs)</label>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-400">D</span>
                                <ValidatedInput
                                  value={config.crisisDuration || 3}
                                  onChange={(v) => setConfig({...config, crisisDuration: v})}
                                  min={1}
                                  max={10}
                                  className="w-full bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 italic">
                        {scenario !== StressScenario.NONE
                          ? `Crisis applied from Year ${config.crisisStartYear} to ${config.crisisStartYear + config.crisisDuration}. Correlations tighten to 1.0.`
                          : "Applies standard volatility and drift."}
                      </p>
                    </div>
                  </section>

                  <section className="pt-5 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-nordic-slate dark:text-white">Saved Scenarios</h3>
                    </div>

                    <button
                      onClick={saveCurrentScenario}
                      className="w-full mb-4 py-2.5 bg-white dark:bg-slate-800 border border-nordic-blue text-nordic-blue hover:bg-nordic-blue hover:text-white transition-colors rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Save size={16} /> Save Current Setup
                    </button>

                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                      {savedScenarios.length === 0 && <p className="text-sm text-gray-300 italic text-center py-2">No saved runs yet.</p>}
                      {savedScenarios.map(s => (
                        <div key={s.id} onClick={() => loadScenario(s)} className="cursor-pointer group flex justify-between items-center bg-gray-50 dark:bg-slate-800 hover:bg-nordic-oatmeal dark:hover:bg-slate-700 p-3 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all">
                            <div className="overflow-hidden">
                              <p className="text-sm font-semibold text-nordic-slate dark:text-white truncate">{s.name}</p>
                              <p className="text-xs text-gray-400">{s.date}</p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => deleteScenario(s.id, e)} className="p-1 hover:text-nordic-terra text-gray-400">
                                    <Trash2 size={16} />
                                </button>
                                <PlayCircle size={18} className="text-gray-300 hover:text-nordic-blue" />
                            </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
            </div>
            {/* Added Footer to Sidebar */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 flex-shrink-0 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1 mb-1">
                   <Shield size={10} /> Portfolio Sim
                </p>
                <p className="text-[9px] text-gray-300 dark:text-gray-600">
                   © 2026 Timmy C. | Financial Simulation Tool | Not Financial Advice
                </p>
            </div>
          </aside>

          {/* Main Content - Forecast View */}
          <main className={`flex-1 p-6 md:p-12 overflow-y-auto transition-transform ${mobileView === 'results' ? 'block' : 'hidden md:block'}`}>

            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-4xl font-light text-nordic-slate dark:text-white mb-3 tracking-tight">Wealth Forecast</h2>
                <p className="text-nordic-charcoal dark:text-gray-400 max-w-xl text-base leading-relaxed">
                  Stop guessing. We simulate thousands of possible futures—including crashes, inflation, and market chaos—to reveal what your money is <i>actually</i> worth.
                </p>
              </div>

              <div className="flex flex-col items-end gap-4">
                <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full flex items-center text-sm font-medium border border-gray-200 dark:border-slate-700 shadow-soft relative">
                    <button
                      onClick={() => setShowReal(false)}
                      className={`relative z-10 px-5 py-2 rounded-full flex items-center gap-2 transition-all duration-300 ${!showReal ? 'text-nordic-white font-bold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                      <Banknote size={16} className={!showReal ? "text-white" : ""} />
                      Future $
                    </button>
                    <button
                      onClick={() => setShowReal(true)}
                      className={`relative z-10 px-5 py-2 rounded-full flex items-center gap-2 transition-all duration-300 ${showReal ? 'text-nordic-white font-bold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                      <Coins size={16} className={showReal ? "text-white" : ""} />
                      Today's $
                    </button>

                    <div
                        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-nordic-slate dark:bg-slate-600 rounded-full shadow-md transition-all duration-300 ease-out border border-transparent ${showReal ? 'left-[calc(50%)]' : 'left-1.5'}`}
                    ></div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDisclaimer(true)}
                    className="hidden md:flex items-center gap-2 bg-nordic-oatmeal dark:bg-slate-800 text-nordic-slate dark:text-white px-4 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-sm font-bold shadow-sm border border-gray-200 dark:border-slate-700"
                  >
                    <HelpCircle size={18} />
                  </button>

                  <button
                    onClick={handleGenerateInsights}
                    disabled={loadingInsights}
                    className="hidden md:flex items-center gap-2 bg-nordic-slate dark:bg-slate-700 text-white px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all text-base font-bold disabled:opacity-50 shadow-soft border border-transparent hover:scale-105 transform duration-200"
                  >
                    {loadingInsights ? <Sparkles size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {loadingInsights ? 'Coach Thinking...' : 'Ask Wealth Coach'}
                  </button>
                </div>
              </div>
            </div>

            {/* ... Rest of Main Content ... */}
            {aiSections.length > 0 && (
              <div className="mb-10 bg-nordic-slate dark:bg-slate-800 text-nordic-oatmeal dark:text-white rounded-2xl shadow-card animate-fade-in overflow-hidden border border-gray-700 dark:border-slate-600">
                <div className="bg-gray-800 dark:bg-slate-900 bg-opacity-50 p-5 flex items-center gap-3 border-b border-gray-700 dark:border-slate-700">
                  <Cpu size={20} className="text-nordic-sage" />
                  <h3 className="font-bold uppercase tracking-wide text-base">Strategic Analysis</h3>
                </div>
                <div className="p-8 grid md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-700 dark:divide-slate-700">
                    <div>
                      <h4 className="text-nordic-sage font-bold text-sm uppercase mb-3">The Verdict</h4>
                      <p className="text-xl font-light leading-relaxed text-white">{aiSections[0]}</p>
                    </div>
                    <div className="pt-6 md:pt-0 md:pl-8">
                      <h4 className="text-nordic-sage font-bold text-sm uppercase mb-3">Drivers & Risks</h4>
                      <div className="text-base space-y-2 text-gray-300 dark:text-gray-400">
                          {aiSections[1]?.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                      </div>
                    </div>
                    <div className="pt-6 md:pt-0 md:pl-8">
                      <h4 className="text-nordic-sage font-bold text-sm uppercase mb-3">Recommended Action</h4>
                      <div className="bg-white bg-opacity-5 p-5 rounded-lg border border-gray-600 dark:border-slate-600">
                        <p className="text-base font-medium text-white italic">"{aiSections[2]}"</p>
                      </div>
                    </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <MetricsCard
                label="Success Chance"
                value={formattedPoS}
                color={posColor}
                subtext={`> $0 after ${config.timeHorizonYears} years`}
              />
              <MetricsCard
                label="Median Result"
                value={formatCurrency(medianValue)}
                subtext={showReal ? "In Today's Purchasing Power" : "In Future Inflated Dollars"}
              />
              <MetricsCard
                label="Safety Net (Low Case)"
                value={formatCurrency(p10Value)}
                subtext="If markets perform poorly (10%)"
                color="success"
              />
              <MetricsCard
                label="Risk of Loss"
                value={results ? `(${results.summary.worstDrawdown.toFixed(1)}%)` : '-'}
                color="danger"
                subtext="Worst Case Drop"
              />
            </div>

            <div className="mb-10 space-y-10">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card border border-transparent relative">
                  {results && <SimulationChart
                    data={results.data}
                    startYear={config.startYear}
                    goals={config.goals}
                    inflationRate={config.inflationRate}
                    showReal={showReal}
                    hasCrisis={scenario !== StressScenario.NONE}
                    crisisStart={config.crisisStartYear}
                    crisisDuration={config.crisisDuration}
                    isDarkMode={isDarkMode}
                  />}
                  {scenario !== StressScenario.NONE && (
                    <div className="absolute top-5 left-5 bg-nordic-terraLight text-nordic-terraDark px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border border-red-200">
                      <AlertTriangle size={16} />
                      Crisis Mode: {scenario} (Year {config.crisisStartYear}-{config.crisisStartYear + config.crisisDuration})
                    </div>
                  )}
              </div>

              {results && config.goals && config.goals.length > 0 && (
                <GoalAnalysis goals={config.goals} results={results.goals || []} />
              )}

              {results && <WealthBreakdown assets={assets} initialWealth={config.initialWealth} summary={results.summary} />}

              {results && <DetailedTable data={results.data} startYear={config.startYear} showReal={showReal} assets={assets} config={config} />}

              <CorrelationMatrix assets={assets} scenario={scenario} />

              {results && (
                <DrawdownAnalysis
                  maxDrawdown={results.summary.worstDrawdown}
                  worstYear={results.summary.worstYearReturn}
                  pathData={results.riskPath}
                />
              )}

              {results && <ModelDiagnostics validation={results.validation} />}

            </div>

            <div className="mt-8 md:hidden">
              <button
                onClick={handleGenerateInsights}
                disabled={loadingInsights}
                className="w-full flex justify-center items-center gap-3 bg-nordic-slate dark:bg-slate-700 text-white px-5 py-4 rounded-xl text-base font-bold disabled:opacity-50 shadow-soft"
              >
                <Cpu size={20} />
                {loadingInsights ? 'Analyzing...' : 'Get AI Insights'}
              </button>
            </div>

            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-slate-800">
              <details className="text-sm text-gray-400 cursor-pointer group">
                <summary className="hover:text-nordic-slate dark:hover:text-white transition-colors font-bold list-none flex items-center gap-2">
                  <div className="bg-gray-200 dark:bg-slate-800 p-1 rounded group-hover:bg-nordic-slate dark:group-hover:bg-slate-700 group-hover:text-white transition-colors">
                      <Plus size={12} />
                  </div>
                  How does this work?
                </summary>
                <div className="mt-4 pl-8 border-l-2 border-nordic-blue space-y-3">
                  <p>We use a <strong>Monte Carlo Jump-Diffusion</strong> model.</p>
                  <p>This means we run {SIMULATION_ITERATIONS} different possible futures for your money.</p>
                  <p>We include "Jumps" (market crashes) to be realistic, not just smooth growth curves.</p>
                  <p>We adjust for inflation at {(config.inflationRate * 100).toFixed(1)}% annually so you see real value.</p>
                  <p>
                    <strong>Mathematical Note:</strong> We use Geometric Brownian Motion for diffusion, where Drift = (μ - 0.5σ²).
                    This accounts for volatility drag, ensuring high-risk assets don't simply compound at their arithmetic mean indefinitely.
                  </p>
                </div>
              </details>
            </div>

          </main>
        </div>
      ) : activeTab === 'market' ? (
        <div className="flex-1 overflow-hidden animate-fade-in">
           <MarketDashboard />
        </div>
      ) : activeTab === 'alpha' ? (
        <div className="flex-1 overflow-hidden animate-fade-in">
          <AlphaEngine />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden animate-fade-in">
           <DividendEngine />
        </div>
      )}
    </div>
    </div>
  );
}

export default App;

