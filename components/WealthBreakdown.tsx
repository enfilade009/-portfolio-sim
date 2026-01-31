import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Layers, ArrowRight, TrendingUp, Info } from 'lucide-react';
import { AssetParams, SimulationSummary } from '../types';
import { COLORS } from '../constants';

interface Props {
  assets: AssetParams[];
  initialWealth: number;
  summary: SimulationSummary;
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
    const data = payload[0].payload;
    return (
      <div className="bg-nordic-slate dark:bg-slate-800 text-nordic-oatmeal dark:text-white p-3 rounded shadow-lg text-sm border border-nordic-sage dark:border-slate-600">
        <p className="font-bold mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-gray-300 text-xs">Today: <span className="text-white font-mono">{formatCurrency(payload[0].value)}</span></p>
          <p className="text-nordic-sageLight text-xs">Future (Median): <span className="text-nordic-sage font-bold font-mono">{formatCurrency(payload[1].value)}</span></p>
          <div className="mt-2 border-t border-gray-600 pt-2">
            <p className="text-[10px] text-gray-400">Exp. Growth: {((data.drift) * 100).toFixed(1)}%</p>
            <p className="text-[10px] text-gray-400">Vol Drag: -{((0.5 * Math.pow(data.vol, 2)) * 100).toFixed(2)}%</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const WealthBreakdown: React.FC<Props> = ({ assets, initialWealth, summary }) => {
  const activeAssets = assets.filter(a => a.weight > 0);

  // Calculate Standalone Projected Value for each asset
  // We use the Geometric Expected Return: exp(mu - 0.5*sigma^2)
  // This allows us to see how assets diverge in performance characteristic,
  // even though the main simulation assumes rebalancing.
  const timeHorizon = 30; // Standardize calc to 30 years or map from config if passed
  // We calculate a relative multiplier for each asset
  const projections = activeAssets.map(asset => {
     const variance = Math.pow(asset.volatility, 2);
     const geometricDrift = asset.expectedReturn - 0.5 * variance;
     // Note: We don't have the exact years from this component props, assuming linear scaling relative to total.
     // Better approach: Calculate the "Contribution Strength"
     return {
        ...asset,
        drift: asset.expectedReturn,
        vol: asset.volatility,
        geoReturn: geometricDrift
     };
  });

  const totalWeightedGeoReturn = projections.reduce((sum, p) => sum + (p.geoReturn * (p.weight/100)), 0);

  // Create display data
  const data = projections.map(proj => {
    const startValue = initialWealth * (proj.weight / 100);

    // We want the sum of endValues to equal summary.medianTerminalWealth
    // But we want their relative sizes to reflect their specific geometric returns.
    // So we calculate a raw projection first:
    // This is an approximation to show relative performance divergence.
    const relativePerformance = proj.geoReturn / totalWeightedGeoReturn;

    // Distribute the Total Terminal Wealth based on the weighted geometric performance
    // If we just used rebalancing, everyone gets the same %.
    // Here we show: "What if these assets grew based on their inherent characteristics within the portfolio?"
    // Actually, simply scaling by the expected drift is clearer for the user "Assumptions Check".

    const theoreticalMultiplier = Math.exp(proj.geoReturn * 1); // 1 year unit for rate check

    // To solve the user's issue "All holdings showing same gain rate":
    // We will show the theoretical annualized return for that asset slice.
    // End Value in the chart will be forced to match the rebalanced total for consistency,
    // BUT we will visualize the different rates.

    // Revert to standard allocation view for bar sizes to remain mathematically accurate to the Rebalancing Sim.
    // But we add specific metadata for the tooltip and table.
    const endValueRebalanced = summary.medianTerminalWealth * (proj.weight / 100);

    return {
      name: proj.category,
      shortName: proj.category.split(' ')[0],
      start: startValue,
      end: endValueRebalanced,
      drift: proj.expectedReturn,
      vol: proj.volatility,
      // Calculate a theoretical standalone CAGR for display
      theoreticalCAGR: (Math.exp(proj.geoReturn) - 1) * 100
    };
  }).sort((a, b) => b.end - a.end);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mt-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
           <div className="bg-nordic-oatmeal dark:bg-slate-700 p-2 rounded text-nordic-slate dark:text-white">
              <Layers size={20} />
           </div>
           <div>
              <h3 className="text-lg font-light text-nordic-slate dark:text-white">Portfolio Composition</h3>
              <p className="text-xs text-gray-400">
                Projected breakdown assuming annual rebalancing.
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis type="number" tickFormatter={formatCurrency} tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <YAxis dataKey="shortName" type="category" width={70} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

              <Bar dataKey="start" name="Current Value" fill={COLORS.slate} barSize={10} radius={[0, 4, 4, 0]} />
              <Bar dataKey="end" name="Future Value (Median)" fill={COLORS.sage} barSize={10} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-slate-700">
           <table className="w-full text-xs">
              <thead className="bg-nordic-oatmeal dark:bg-slate-700 text-gray-500 dark:text-gray-300 font-semibold uppercase">
                 <tr>
                    <th className="px-3 py-2 text-left">Asset</th>
                    <th className="px-3 py-2 text-right">Start</th>
                    <th className="px-3 py-2 text-right">Finish</th>
                    <th className="px-3 py-2 text-right flex items-center justify-end gap-1">
                      Exp. CAGR <Info size={10} />
                    </th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                 {data.map((row) => (
                    <tr key={row.name} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                       <td className="px-3 py-2 font-medium text-nordic-slate dark:text-white">{row.shortName}</td>
                       <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{formatCurrency(row.start)}</td>
                       <td className="px-3 py-2 text-right font-bold text-nordic-slate dark:text-white">{formatCurrency(row.end)}</td>
                       <td className="px-3 py-2 text-right">
                          <div className={`flex items-center justify-end gap-1 ${row.theoreticalCAGR > 5 ? 'text-nordic-sage' : 'text-nordic-slate dark:text-white'}`}>
                             {row.theoreticalCAGR > 0 && <TrendingUp size={12} />}
                             {row.theoreticalCAGR.toFixed(1)}%
                          </div>
                       </td>
                    </tr>
                 ))}
                 <tr className="bg-gray-50 dark:bg-slate-700/50 font-bold">
                    <td className="px-3 py-2 text-nordic-slate dark:text-white">TOTAL</td>
                    <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{formatCurrency(initialWealth)}</td>
                    <td className="px-3 py-2 text-right text-nordic-slate dark:text-white">{formatCurrency(summary.medianTerminalWealth)}</td>
                    <td className="px-3 py-2 text-right text-nordic-sage">
                       {/* Total Portfolio Gain Calc */}
                       {((summary.medianTerminalWealth - initialWealth) / initialWealth * 100).toFixed(0)}% Abs.
                    </td>
                 </tr>
              </tbody>
           </table>
           <div className="p-2 bg-gray-50 dark:bg-slate-700/30 text-[10px] text-gray-400 italic">
             *Exp. CAGR represents the theoretical annual growth of this asset class including volatility drag.
           </div>
        </div>

      </div>
    </div>
  );
};

