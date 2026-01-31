import React from 'react';
import { SimulationSummary } from '../types';
import { TrendingUp, TrendingDown, Shield, AlertTriangle } from 'lucide-react';

interface SummaryCardsProps {
  summary: SimulationSummary;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const cards = [
    {
      title: 'Success Probability',
      value: formatPercent(summary.probabilityOfSuccess),
      icon: summary.probabilityOfSuccess >= 0.8 ? TrendingUp : AlertTriangle,
      color: summary.probabilityOfSuccess >= 0.8 ? 'text-emerald-600' : summary.probabilityOfSuccess >= 0.6 ? 'text-amber-600' : 'text-red-600',
      bg: summary.probabilityOfSuccess >= 0.8 ? 'bg-emerald-50' : summary.probabilityOfSuccess >= 0.6 ? 'bg-amber-50' : 'bg-red-50',
      subtitle: 'Paths avoiding ruin'
    },
    {
      title: 'Median Terminal Wealth',
      value: formatCurrency(summary.medianTerminalWealth),
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      subtitle: `${formatCurrency(summary.medianTerminalWealthReal)} real`
    },
    {
      title: 'Worst Drawdown',
      value: formatPercent(summary.worstDrawdown),
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50',
      subtitle: 'Peak-to-trough loss'
    },
    {
      title: 'Safe Withdrawal',
      value: formatPercent(summary.safeWithdrawalRate),
      icon: Shield,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      subtitle: '95% success rate'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className={`${card.bg} rounded-xl p-4 border border-slate-200/50`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.title}</span>
            <card.icon className={`w-4 h-4 ${card.color}`} />
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          <div className="text-xs text-slate-500 mt-1">{card.subtitle}</div>
        </div>
      ))}
    </div>
  );
};

