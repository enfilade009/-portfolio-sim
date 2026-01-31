import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart, Cell, PieChart, Pie
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Activity, TrendingUp, AlertTriangle, Zap,
  Calendar, CheckCircle, AlertOctagon, MinusCircle, MoveRight,
  Droplets, Signal, Scale, Plane
} from 'lucide-react';
import { getMarketIndicators } from '../services/marketDataService';
import { COLORS } from '../constants';
import { MarketScenario, MarketIndicator, SignalType } from '../types';

// --- Helper Functions ---

const formatKPI = (val: number, format: 'currency' | 'percent' | 'number') => {
  const isNeg = val < 0;
  const abs = Math.abs(val);
  let str = '';

  if (format === 'currency') {
    if (abs >= 1000) str = `$${(abs / 1000).toFixed(1)}T`;
    else if (abs >= 1) str = `$${abs.toFixed(1)}B`;
    else str = `$${abs.toFixed(2)}`;
  } else if (format === 'percent') {
    str = `${abs.toFixed(2)}%`;
  } else {
    if (abs >= 1000) str = `${(abs / 1000).toFixed(0)}k`;
    else str = abs.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  return isNeg ? `(${str})` : str;
};

const getSignalBadge = (signal: SignalType) => {
    switch (signal) {
        case 'Bullish':
        case 'Strong Buy':
            return <span className="bg-nordic-sageLight text-nordic-sageDark px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><ArrowUpRight size={12} /> {signal}</span>;
        case 'Bearish':
            return <span className="bg-nordic-terraLight text-nordic-terra px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><ArrowDownRight size={12} /> {signal}</span>;
        case 'Caution':
            return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><AlertOctagon size={12} /> {signal}</span>;
        default:
            return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><MinusCircle size={12} /> {signal}</span>;
    }
}

// --- Custom Components ---

const SmartTooltip = ({ active, payload, label, indicator }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const val2 = payload[0].payload.value2; // SMA or secondary

    return (
      <div className="bg-nordic-slate dark:bg-slate-800 text-nordic-oatmeal dark:text-white p-4 rounded-xl shadow-xl text-xs border border-nordic-charcoal dark:border-slate-700 z-[1000] min-w-[240px]">
        <div className="flex justify-between items-center mb-3 border-b border-gray-600 pb-2">
           <span className="font-bold text-white text-sm">{indicator.title}</span>
           <span className="font-mono text-nordic-sageLight font-bold">{formatKPI(val, indicator.format)}</span>
        </div>

        {val2 !== undefined && indicator.id === 'fed_liquidity' && (
           <div className="flex justify-between items-center mb-3 text-xs">
              <span className="text-gray-400">30d SMA:</span>
              <span className="font-mono text-nordic-blue font-bold">{formatKPI(val2, indicator.format)}</span>
           </div>
        )}

        <div className="space-y-3">
           <div>
             <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest block mb-1">Context</span>
             <p className="text-gray-200 leading-snug">{indicator.description}</p>
           </div>

           <div className="bg-white/10 p-2 rounded border border-white/5">
              <div className="flex items-center gap-1 mb-1 text-nordic-sageLight">
                  <Activity size={10} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Implication</span>
              </div>
              <p className="text-[10px] text-gray-200 italic leading-relaxed">"{indicator.implication}"</p>
           </div>

           <div className="flex justify-between text-[10px] text-gray-400 pt-1">
              <span>Date: {label}</span>
              <span>Source: {indicator.source.split(':')[0]}</span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

const VixGauge = ({ value }: { value: number }) => {
  const data = [
    { name: 'Low', value: 15, color: COLORS.sage },
    { name: 'Normal', value: 10, color: '#F59E0B' }, // Amber
    { name: 'Fear', value: 25, color: COLORS.terra },
  ];
  const clampedVal = Math.min(Math.max(value, 0), 50);
  const rotation = 180 - (clampedVal / 50) * 180;

  return (
    <div className="relative h-[120px] w-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={50}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute bottom-0 left-[50%] h-[55px] w-1 bg-nordic-slate dark:bg-white origin-bottom rounded-full transition-transform duration-1000 ease-out z-10"
        style={{ transform: `translateX(-50%) rotate(${rotation - 90}deg)` }}
      ></div>
      <div className="absolute bottom-0 left-[50%] w-3 h-3 bg-nordic-slate dark:bg-white rounded-full -translate-x-1/2 translate-y-1/2 z-20"></div>

      <div className="absolute bottom-4 text-center">
         <div className="text-xl font-black text-nordic-slate dark:text-white">{value.toFixed(1)}</div>
      </div>
    </div>
  );
};

const SpSparkline = ({ data, current, scenario }: { data: any[], current: number, scenario: string }) => (
    <div className="h-[100px] w-full flex items-center justify-between gap-4">
        <div className="flex-1 h-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                     <XAxis
                        dataKey="date"
                        interval={11}
                        tick={{fontSize: 9, fill: '#94A3B8'}}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="value2"
                      stroke={scenario === 'Housing Crisis' || scenario === 'Tech Bubble' ? COLORS.terra : COLORS.blue}
                      strokeWidth={2}
                      dot={false}
                      animationDuration={1500}
                    />
                    <Tooltip content={() => null} />
                </LineChart>
            </ResponsiveContainer>
        </div>
        <div className="flex flex-col items-end min-w-[80px]">
            <span className="text-2xl font-black text-nordic-slate dark:text-white">{current.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            <div className={`flex items-center gap-1 font-bold text-xs ${scenario === 'Current' ? 'text-nordic-sage' : 'text-nordic-terra'}`}>
                {scenario === 'Current' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {scenario === 'Current' ? '+0.45%' : '(12.4%)'}
            </div>
        </div>
    </div>
);

// --- Main Dashboard Component ---

export const MarketDashboard: React.FC = () => {
  const [scenario, setScenario] = useState<MarketScenario>('Current');
  const indicators = useMemo(() => getMarketIndicators(scenario), [scenario]);

  const groups = {
    Macro: indicators.filter(i => i.category === 'Macro'),
    Consumer: indicators.filter(i => i.category === 'Consumer'),
    Risk: indicators.filter(i => i.category === 'Risk'),
    Liquidity: indicators.filter(i => i.category === 'Liquidity'),
    Technical: indicators.filter(i => i.category === 'Technical'),
    Valuation: indicators.filter(i => i.category === 'Valuation'),
    Sector: indicators.filter(i => i.category === 'Sector')
  };

  // Helper to detect Breadth Divergence: Price Up, Breadth Down over last 14 periods
  const breadthIndicator = groups.Technical.find(i => i.id === 'breadth');
  const hasBreadthDivergence = useMemo(() => {
      if (!breadthIndicator) return false;
      const len = breadthIndicator.data.length;
      if (len < 14) return false;
      const recent = breadthIndicator.data.slice(len - 14);
      // Simple logic: Start vs End
      const adChange = recent[13].value - recent[0].value;
      const priceChange = (recent[13].value2 || 0) - (recent[0].value2 || 0); // value2 holds SP500 ref
      return priceChange > 0 && adChange < 0;
  }, [breadthIndicator]);

  const renderCard = (indicator: MarketIndicator, type: 'area' | 'bar' | 'line' | 'composed' = 'area', height = 120) => (
    <div key={indicator.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-card border border-gray-100 dark:border-slate-700 transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-slate-600 relative group z-0 hover:z-20">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
            <div>
                <h4 className="font-bold text-nordic-slate dark:text-white text-sm flex items-center gap-2">{indicator.title}</h4>
                <p className="text-[10px] text-gray-400 font-medium">{indicator.source}</p>
            </div>
            {getSignalBadge(indicator.signal)}
        </div>

        {/* Main Value Row */}
        <div className="flex items-baseline gap-2 mb-4">
            <span className={`text-2xl font-black tracking-tight text-nordic-slate dark:text-white`}>
                {formatKPI(indicator.currentValue, indicator.format)}
            </span>
             {/* Simple visual of range position */}
            <div className="hidden md:flex flex-col justify-center gap-0.5 ml-2">
                <div className="w-16 h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                    <div
                        className="h-full bg-nordic-blue opacity-50 absolute"
                        style={{
                            left: `${((Math.min(indicator.currentValue, indicator.stats.low5y) - indicator.stats.low5y) / (indicator.stats.high5y - indicator.stats.low5y)) * 100}%`,
                            width: '4px'
                        }}
                    />
                    <div
                        className="h-full bg-nordic-slate dark:bg-white rounded-full absolute"
                        style={{
                            left: `${Math.min(Math.max((indicator.currentValue - indicator.stats.low5y) / (indicator.stats.high5y - indicator.stats.low5y), 0), 1) * 100}%`,
                            width: '4px'
                        }}
                    />
                </div>
                <div className="flex justify-between w-16 text-[8px] text-gray-400">
                    <span>L</span>
                    <span>H</span>
                </div>
            </div>
        </div>

        {/* Visualization */}
        <div style={{ height: `${height}px` }} className="w-full relative -ml-2">
            <ResponsiveContainer width="100%" height="100%">
                {type === 'bar' ? (
                     <BarChart data={indicator.data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="date" interval={11} tick={{fontSize: 9, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
                        <Bar dataKey="value" fill={indicator.id === 'aviation_corr' ? COLORS.terra : COLORS.blue} radius={[4, 4, 0, 0]} animationDuration={1000} />
                        <Tooltip content={<SmartTooltip indicator={indicator} />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                    </BarChart>
                ) : type === 'composed' ? (
                    <ComposedChart data={indicator.data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="date" interval={11} tick={{fontSize: 9, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
                        <Area type="monotone" dataKey="value" stroke="none" fill={COLORS.sage} fillOpacity={0.2} />
                        <Line type="monotone" dataKey="value" stroke={COLORS.sage} strokeWidth={2} dot={false} />
                        {indicator.data[0].value2 !== undefined && (
                            <Line type="monotone" dataKey="value2" stroke={COLORS.blue} strokeWidth={2} dot={false} strokeDasharray="4 4" />
                        )}
                        <Tooltip content={<SmartTooltip indicator={indicator} />} />
                    </ComposedChart>
                ) : type === 'line' ? (
                    <LineChart data={indicator.data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="date" interval={11} tick={{fontSize: 9, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
                        <Line type="monotone" dataKey="value" stroke={indicator.id === 'sentiment' ? COLORS.sage : COLORS.blue} strokeWidth={2} dot={false} animationDuration={1000} />
                        <Tooltip content={<SmartTooltip indicator={indicator} />} />
                    </LineChart>
                ) : (
                    <AreaChart data={indicator.data}>
                        <defs>
                            <linearGradient id={`grad-${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.slate} stopOpacity={0.1}/>
                                <stop offset="95%" stopColor={COLORS.slate} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="date" interval={11} tick={{fontSize: 9, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
                        {(indicator.id === 'yield_curve' || indicator.id === 'm2' || indicator.id === 'trade_balance') && <ReferenceLine y={0} stroke={COLORS.terra} strokeDasharray="3 3"/>}
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={COLORS.slate}
                            strokeWidth={2}
                            fill={`url(#grad-${indicator.id})`}
                            animationDuration={1000}
                        />
                        <Tooltip content={<SmartTooltip indicator={indicator} />} cursor={{stroke: COLORS.blue, strokeWidth: 1}} />
                    </AreaChart>
                )}
            </ResponsiveContainer>
        </div>

        {/* Footer / Action */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-start gap-2">
            <div className="bg-nordic-blue bg-opacity-10 p-1.5 rounded-full text-nordic-blue mt-0.5">
               <Zap size={10} fill="currentColor" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Recommended Action</p>
                <p className="text-xs font-medium text-nordic-charcoal dark:text-gray-300">{indicator.action}</p>
            </div>
        </div>
    </div>
  );

  return (
    <div className="p-6 md:p-12 overflow-y-auto h-full bg-nordic-oatmeal dark:bg-slate-950">

      {/* Header & Simulator Control */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-light text-nordic-slate dark:text-white mb-3 tracking-tight flex items-center gap-3">
            Market Dashboard
            {scenario !== 'Current' && (
               <span className="bg-nordic-terra text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                 <AlertTriangle size={12} /> Simulation Active
               </span>
            )}
          </h2>
          <div className="flex items-center gap-2 mt-1 mb-2 text-xs font-bold uppercase tracking-widest text-nordic-blue">
             <Calendar size={14} />
             {scenario === 'Current' ? '5-Year Historical View' : '5-Year Forecast Simulation'}
          </div>
          <p className="text-nordic-charcoal dark:text-gray-400 max-w-xl text-sm leading-relaxed">
            {scenario === 'Current'
              ? "Monitoring real-time economic indicators over the past cycle. Baseline for recession analysis."
              : "Simulating projected economic impact over the next 5 years based on historical correlation models."
            }
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-soft flex items-center gap-4">
             <div className="px-4 py-2 bg-nordic-oatmeal dark:bg-slate-700 rounded-lg border border-nordic-muted dark:border-slate-600">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Simulator Mode</span>
                <div className="flex items-center gap-2 text-nordic-slate dark:text-white font-bold text-sm">
                   <Zap size={14} className={scenario !== 'Current' ? "text-nordic-terra" : "text-gray-400"} />
                   {scenario}
                </div>
             </div>

             <div className="h-8 w-px bg-gray-200 dark:bg-slate-600"></div>

             <div className="flex gap-2">
                {(['Current', 'Housing Crisis', 'Tech Bubble', 'Inflation Shock'] as MarketScenario[]).map(s => (
                   <button
                     key={s}
                     onClick={() => setScenario(s)}
                     className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${scenario === s ? 'bg-nordic-slate dark:bg-slate-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                   >
                     {s === 'Current' ? 'Live' : s}
                   </button>
                ))}
             </div>
        </div>
      </div>

      <div className="space-y-12 pb-20">

        {/* NEW SECTION: LIQUIDITY & TECHNICALS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Fed Liquidity */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-card border border-gray-100 dark:border-slate-700">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Droplets size={16} className="text-nordic-blue" /> Fed Net Liquidity
                </h3>
                {groups.Liquidity.map(i => renderCard(i, 'composed', 200))}
            </div>

            {/* Market Breadth with Alert */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-card border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                {hasBreadthDivergence && (
                    <div className="absolute top-0 right-0 bg-nordic-terra text-white px-4 py-2 rounded-bl-xl text-xs font-bold flex items-center gap-2 z-30 animate-pulse">
                        <AlertTriangle size={14} /> Weak Breadth Warning
                    </div>
                )}
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Signal size={16} className="text-nordic-sage" /> Market Internals
                </h3>
                {groups.Technical.map(i => renderCard(i, 'line', 200))}
            </div>
        </section>

        {/* NEW SECTION: VALUATION & SECTOR HEALTH */}
        <section>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Scale size={16} /> Valuation & Sector Alpha
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Real Rates (Valuation Risk Meter) */}
                {groups.Valuation.map(indicator => (
                    <div key={indicator.id} className="relative">
                        {indicator.currentValue > 2.0 && (
                            <div className="absolute -top-3 -right-2 bg-nordic-slate text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md z-30 border border-nordic-charcoal">
                                ⚠️ Multiple Compression Risk
                            </div>
                        )}
                        {renderCard(indicator, 'area')}
                    </div>
                ))}

                {/* Aviation Sector */}
                {groups.Sector.map(indicator => (
                    <div key={indicator.id}>
                       {renderCard(indicator, 'bar')}
                    </div>
                ))}

                {/* Copper (Existing) */}
                {renderCard(indicators.find(i => i.id === 'copper')!, 'line')}
            </div>
        </section>

        {/* SECTION 1: MACROECONOMIC HEALTH (Existing) */}
        <section>
           <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={16} /> Macroeconomic Health
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.Macro.filter(i => i.id !== 'copper').map(indicator => renderCard(indicator, 'area'))}
           </div>
        </section>

        {/* SECTION 2: CONSUMER & LABOR */}
        <section>
           <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={16} /> Consumer & Labor
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {groups.Consumer.map(indicator => {
                  const type = indicator.id === 'building_permits' ? 'bar' : 'line';
                  return renderCard(indicator, type);
              })}
           </div>
        </section>

        {/* SECTION 3: MARKET RISK & SENTIMENT */}
        <section>
           <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle size={16} /> Market Risk
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

              {/* S&P 500 (Wide) */}
              <div className="md:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-card border border-gray-100 dark:border-slate-700 relative group z-0 hover:z-20 transition-all hover:shadow-lg">
                  {groups.Risk.filter(i => i.id === 'sp500').map(i => (
                      <div key={i.id} className="h-full flex flex-col justify-between">
                         <div className="flex justify-between items-start mb-4">
                             <div>
                                <h4 className="font-bold text-nordic-slate dark:text-white text-sm">S&P 500 Benchmark</h4>
                                <p className="text-xs text-gray-400 mt-1">Leading indicator for US Equities wealth effect.</p>
                             </div>
                             {getSignalBadge(i.signal)}
                         </div>
                         <SpSparkline data={i.data} current={i.currentValue} scenario={scenario} />
                         <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                             <MoveRight size={14} className="text-nordic-blue" />
                             Action: <span className="font-bold text-nordic-slate dark:text-white">{i.action}</span>
                         </div>
                      </div>
                  ))}
              </div>

              {/* VIX Gauge */}
              <div className="md:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-card border border-gray-100 dark:border-slate-700 relative group z-0 hover:z-20 transition-all hover:shadow-lg">
                  {groups.Risk.filter(i => i.id === 'vix').map(i => (
                      <div key={i.id}>
                         <div className="flex justify-between mb-4">
                            <div>
                                <h4 className="font-bold text-nordic-slate dark:text-white text-sm">Fear Gauge (VIX)</h4>
                                <p className="text-[10px] text-gray-400 font-medium">CBOE Volatility Index</p>
                            </div>
                            {getSignalBadge(i.signal)}
                         </div>
                         <VixGauge value={i.currentValue} />
                         <div className="mt-4 text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Recommended Action</p>
                            <p className="text-xs font-medium text-nordic-charcoal dark:text-gray-300">{i.action}</p>
                         </div>
                      </div>
                  ))}
              </div>

              {/* Remaining Risk Indicators */}
              {groups.Risk.filter(i => i.id !== 'sp500' && i.id !== 'vix').map(indicator => (
                 <div key={indicator.id} className="md:col-span-6">
                    {renderCard(indicator, 'area')}
                 </div>
              ))}
           </div>
        </section>

      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 text-center flex flex-col items-center gap-2">
        <p className="text-xs text-gray-400 italic">
          Disclaimer: Data in this dashboard is simulated. The "Scenario Simulator" approximates historical correlation behaviors of these indicators during past economic events for educational purposes.
        </p>
      </div>
    </div>
  );
};

