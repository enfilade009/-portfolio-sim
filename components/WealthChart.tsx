import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, ReferenceLine } from 'recharts';
import { SimulationYearResult, InvestmentGoal } from '../types';
import { COLORS } from '../constants';

interface WealthChartProps {
  data: SimulationYearResult[];
  goals: InvestmentGoal[];
  showReal: boolean;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export const WealthChart: React.FC<WealthChartProps> = ({ data, goals, showReal }) => {
  const chartData = data.map(d => ({
    year: d.year,
    p90: showReal ? d.p90Real : d.p90,
    p75: showReal ? d.p75Real : d.p75,
    p50: showReal ? d.p50Real : d.p50,
    p25: showReal ? d.p25Real : d.p25,
    p10: showReal ? d.p10Real : d.p10,
    worst: d.worstCase,
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          Wealth Projection {showReal ? '(Real $)' : '(Nominal $)'}
        </h3>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.p90 }}></span> 90th
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.p50 }}></span> Median
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.p10 }}></span> 10th
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} stroke="#94a3b8" width={60} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
          />

          <Area type="monotone" dataKey="p90" stroke="none" fill="url(#colorBand)" />
          <Line type="monotone" dataKey="p90" stroke={COLORS.p90} strokeWidth={1} dot={false} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="p75" stroke={COLORS.p75} strokeWidth={1} dot={false} strokeDasharray="2 2" />
          <Line type="monotone" dataKey="p50" stroke={COLORS.p50} strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="p25" stroke={COLORS.p25} strokeWidth={1} dot={false} strokeDasharray="2 2" />
          <Line type="monotone" dataKey="p10" stroke={COLORS.p10} strokeWidth={1} dot={false} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="worst" stroke={COLORS.worst} strokeWidth={1} dot={false} opacity={0.5} />

          {goals.map((goal, idx) => (
            <ReferenceLine
              key={idx}
              y={goal.targetAmount}
              stroke={COLORS.accent}
              strokeDasharray="6 3"
              label={{ value: goal.name, position: 'right', fontSize: 10, fill: COLORS.accent }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

