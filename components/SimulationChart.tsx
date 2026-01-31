import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ReferenceDot,
  ReferenceArea
} from 'recharts';
import { SimulationYearResult, InvestmentGoal } from '../types';
import { COLORS } from '../constants';

interface Props {
  data: SimulationYearResult[];
  startYear: number;
  goals: InvestmentGoal[];
  inflationRate: number;
  showReal: boolean;
  hasCrisis?: boolean;
  crisisStart?: number; // Relative year offset
  crisisDuration?: number;
  isDarkMode?: boolean;
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

const CustomTooltip = ({ active, payload, label, isReal }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-nordic-slate dark:bg-slate-800 text-nordic-oatmeal dark:text-slate-100 p-4 rounded-xl shadow-card text-sm border border-nordic-charcoal dark:border-slate-700 z-50 min-w-[240px]">
        <p className="font-bold mb-3 text-base border-b border-gray-700 pb-2 flex justify-between items-center">
          <span>Year {label}</span>
          <span className="text-[10px] font-normal uppercase tracking-wider text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
            {isReal ? "Real $" : "Nominal $"}
          </span>
        </p>

        <div className="space-y-4">
          {/* 90th Percentile */}
          <div className="group">
            <div className="flex justify-between gap-4 mb-1">
               <span className="text-nordic-sageLight text-xs uppercase font-bold tracking-wide">90th Percentile</span>
               <span className="font-mono text-nordic-sageLight font-bold text-base">{formatCurrency(payload.find((p: any) => p.dataKey === (isReal ? 'p90Real' : 'p90'))?.value)}</span>
            </div>
            <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-nordic-sageLight w-[90%] opacity-50"></div>
            </div>
          </div>

          {/* Median */}
          <div>
            <div className="flex justify-between gap-4 mb-1">
               <span className="text-white text-xs uppercase font-bold tracking-wide">Median (Expected)</span>
               <span className="font-mono text-white font-bold text-base">{formatCurrency(payload.find((p: any) => p.dataKey === (isReal ? 'p50Real' : 'p50'))?.value)}</span>
            </div>
             <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[50%] opacity-80"></div>
            </div>
          </div>

          {/* 10th Percentile */}
          <div>
            <div className="flex justify-between gap-4 mb-1">
               <span className="text-nordic-terra text-xs uppercase font-bold tracking-wide">10th Percentile</span>
               <span className="font-mono text-nordic-terra font-bold text-base">{formatCurrency(payload.find((p: any) => p.dataKey === (isReal ? 'p10Real' : 'p10'))?.value)}</span>
            </div>
             <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-nordic-terra w-[10%] opacity-80"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const SimulationChart: React.FC<Props> = ({
  data, startYear, goals, inflationRate, showReal,
  hasCrisis, crisisStart = 0, crisisDuration = 3, isDarkMode = false
}) => {
  const k90 = showReal ? 'p90Real' : 'p90';
  const k50 = showReal ? 'p50Real' : 'p50';
  const k10 = showReal ? 'p10Real' : 'p10';

  const crisisStartX = startYear + crisisStart;
  const crisisEndX = crisisStartX + crisisDuration;

  const axisColor = isDarkMode ? '#94A3B8' : COLORS.slate;
  const gridColor = isDarkMode ? '#334155' : '#E2E8F0';
  const medianColor = isDarkMode ? '#E2E8F0' : COLORS.slate;

  return (
    <div className="h-[450px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorFan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.sage} stopOpacity={0.4} />
              <stop offset="95%" stopColor={COLORS.sage} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fill: axisColor, fontSize: 12, fontWeight: 700 }}
            dy={10}
          />
          <YAxis
            tickFormatter={formatCurrency}
            axisLine={false}
            tickLine={false}
            tick={{ fill: axisColor, fontSize: 12, fontWeight: 700 }}
          />
          <Tooltip content={<CustomTooltip isReal={showReal} />} />

          {/* Layer 1: The Full Fan (Upper Bound) */}
          <Area
            type="monotone"
            dataKey={k90}
            stroke="none"
            fill="url(#colorFan)"
            isAnimationActive={false}
          />

          {/* Layer 2: The Mask (Lower Bound) - Hides the bottom of the Fan */}
          <Area
            type="monotone"
            dataKey={k10}
            stroke="none"
            fill={isDarkMode ? '#1e293b' : '#FFFFFF'}
            fillOpacity={1}
            isAnimationActive={false}
          />

          {/* Layer 3: Crisis Zone Highlight (Transparent Overlay) */}
          {hasCrisis && (
            <ReferenceArea
              x1={crisisStartX}
              x2={crisisEndX}
              fill={COLORS.terra}
              fillOpacity={0.10}
              label={{
                position: 'insideTop',
                value: `CRISIS EVENT`,
                fill: COLORS.terraDark,
                fontSize: 10,
                fontWeight: 800,
                offset: 15
              }}
            />
          )}

          {/* Layer 4: The Median Line (Data) */}
          <Line
            type="monotone"
            dataKey={k50}
            stroke={medianColor}
            strokeWidth={3}
            dot={false}
            isAnimationActive={true}
          />

          {/* Layer 5: The Lower Bound Line (Data) */}
          <Line
            type="monotone"
            dataKey={k10}
            stroke={COLORS.terra}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={true}
          />

          <ReferenceLine y={0} stroke={axisColor} strokeWidth={1} />

          {/* Layer 6: Goals (Topmost) */}
          {goals.map(goal => {
            const yearDiff = goal.targetYear - startYear;
            const inflationMultiplier = Math.pow(1 + inflationRate, yearDiff);
            const yValue = showReal ? goal.targetAmount : goal.targetAmount * inflationMultiplier;

            if (yearDiff < 0) return null;

            return (
               <ReferenceDot
                 key={goal.id}
                 x={goal.targetYear}
                 y={yValue}
                 r={6}
                 fill={COLORS.blue}
                 stroke="white"
                 strokeWidth={2}
               />
            );
          })}

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

