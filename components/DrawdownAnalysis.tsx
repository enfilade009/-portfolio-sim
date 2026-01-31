import React from 'react';
import { TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { RiskPathPoint } from '../types';
import { COLORS } from '../constants';

interface Props {
  maxDrawdown: number; // percentage 0-100
  worstYear: number;   // decimal (e.g., -0.20 for -20%)
  pathData: RiskPathPoint[];
}

const formatCurrency = (val: number) => {
  const absVal = Math.abs(val);
  let formatted = '';

  if (absVal >= 1000000) {
    formatted = `$${(absVal / 1000000).toFixed(1)}M`;
  } else if (absVal >= 1000) {
    formatted = `$${(absVal / 1000).toFixed(0)}k`;
  } else {
    formatted = `$${Math.round(absVal).toLocaleString()}`;
  }

  return val < 0 ? `(${formatted})` : formatted;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as RiskPathPoint;
    return (
      <div className="bg-nordic-slate dark:bg-slate-800 text-nordic-oatmeal dark:text-slate-100 p-3 rounded shadow-lg text-sm border border-nordic-terra dark:border-terra-900">
        <p className="font-bold mb-2">Year {label}</p>
        <div className="space-y-1">
          <p className="text-white">Value: {formatCurrency(data.value)}</p>
          <p className="text-nordic-terra">Drop from Peak: ({Math.abs(data.drawdown * 100).toFixed(1)}%)</p>
        </div>
      </div>
    );
  }
  return null;
};

export const DrawdownAnalysis: React.FC<Props> = ({ maxDrawdown, worstYear, pathData }) => {
  // Normalize for display
  const worstYearPct = worstYear * 100;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mt-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-nordic-terra bg-opacity-10 dark:bg-opacity-20 p-2 rounded text-nordic-terraDark dark:text-nordic-terra">
           <TrendingDown size={20} />
        </div>
        <div>
           <h3 className="text-lg font-light text-nordic-slate dark:text-white">Risk Analysis: What could go wrong?</h3>
           <p className="text-xs text-gray-400">Based on a "Bad Luck" Scenario (Bottom 10% Outcome)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Metric 1: Max Drawdown */}
        <div className="relative">
           <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Biggest Drop</h4>
           <div className="flex items-baseline gap-2 mb-2">
             <span className="text-3xl font-bold text-nordic-terra">({maxDrawdown.toFixed(1)}%)</span>
             <span className="text-xs text-gray-400">from Peak to Bottom</span>
           </div>
           <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
             The scariest decline your portfolio faced in this simulation. This is the difference between your highest account balance and the lowest point that followed.
           </p>
           {/* Visual Bar */}
           <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
             <div className="bg-nordic-terra h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(maxDrawdown, 100)}%` }}></div>
           </div>
        </div>

        {/* Metric 2: Worst 12-Month Period */}
        <div className="relative">
           <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Worst 1-Year Return</h4>
           <div className="flex items-baseline gap-2 mb-2">
             <span className="text-3xl font-bold text-nordic-slate dark:text-white">
               {worstYearPct < 0 ? `(${Math.abs(worstYearPct).toFixed(1)}%)` : `${worstYearPct.toFixed(1)}%`}
             </span>
             <span className="text-xs text-gray-400">in a single year</span>
           </div>
           <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
             The worst performance you experienced over any 12-month period. Think of this as your "bad year" where the market works against you.
           </p>
           {/* Visual Bar */}
           <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
             <div className="bg-nordic-slate dark:bg-slate-400 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(Math.abs(worstYearPct), 100)}%` }}></div>
           </div>
        </div>

        {/* Visualization: Worst Path Chart */}
        <div className="lg:col-span-3 border-t border-gray-100 dark:border-slate-700 pt-6">
           <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">How a "Bad Luck" Scenario looks over time</h4>
           <div className="h-[200px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart
                  data={pathData}
                  margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
               >
                 <defs>
                   <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor={COLORS.terra} stopOpacity={0.2}/>
                     <stop offset="95%" stopColor={COLORS.terra} stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                 <XAxis
                   dataKey="year"
                   axisLine={false}
                   tickLine={false}
                   tick={{ fill: '#94A3B8', fontSize: 10 }}
                 />
                 <YAxis
                   tickFormatter={formatCurrency}
                   axisLine={false}
                   tickLine={false}
                   tick={{ fill: '#94A3B8', fontSize: 10 }}
                   width={40}
                 />
                 <Tooltip content={<CustomTooltip />} />

                 {/* Wealth Path */}
                 <Area
                   type="monotone"
                   dataKey="value"
                   stroke={COLORS.terra}
                   fill="url(#colorRisk)"
                   strokeWidth={2}
                 />

                 {/* Zero line */}
                 <ReferenceLine y={0} stroke="#94A3B8" strokeOpacity={0.2} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
           <p className="text-[10px] text-gray-400 mt-2 text-center">
             This chart tracks your money in an unlucky scenario (bottom 10% of possibilities). It helps you visualize if you can handle a rough market ride.
           </p>
        </div>

      </div>
    </div>
  );
};

