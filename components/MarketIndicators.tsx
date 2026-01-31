import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getMarketIndicators } from '../services/marketDataService';
import { MarketIndicator, MarketScenario, SignalType } from '../types';

const SIGNAL_CONFIG: Record<SignalType, { icon: typeof TrendingUp; color: string; bg: string }> = {
  'Bullish': { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  'Strong Buy': { icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-200' },
  'Bearish': { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
  'Caution': { icon: Minus, color: 'text-amber-600', bg: 'bg-amber-100' },
  'Neutral': { icon: Minus, color: 'text-slate-600', bg: 'bg-slate-100' },
};

export const MarketIndicators: React.FC = () => {
  const [scenario, setScenario] = useState<MarketScenario>('Current');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const indicators = getMarketIndicators(scenario);

  const formatValue = (value: number, format: string): string => {
    if (format === 'percent') return `${(value * 100).toFixed(2)}%`;
    if (format === 'number' && value > 10000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(2);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-800">Market Indicators</h3>
        </div>
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value as MarketScenario)}
          className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="Current">Current</option>
          <option value="Housing Crisis">Housing Crisis</option>
          <option value="Inflation Shock">Inflation Shock</option>
          <option value="Tech Bubble">Tech Bubble</option>
        </select>
      </div>

      <div className="space-y-3">
        {indicators.map((indicator) => {
          const signalCfg = SIGNAL_CONFIG[indicator.signal];
          const SignalIcon = signalCfg.icon;
          const isExpanded = expandedId === indicator.id;

          return (
            <div
              key={indicator.id}
              className="border border-slate-100 rounded-lg overflow-hidden cursor-pointer hover:border-slate-200 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : indicator.id)}
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${signalCfg.bg}`}>
                    <SignalIcon className={`w-4 h-4 ${signalCfg.color}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-800">{indicator.title}</h4>
                    <p className="text-xs text-slate-500">{indicator.source}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-800">
                    {formatValue(indicator.currentValue, indicator.format)}
                  </div>
                  <span className={`text-xs font-medium ${signalCfg.color}`}>{indicator.signal}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-600 mb-2">{indicator.description}</p>
                  <p className="text-xs text-slate-500 mb-3"><strong>Action:</strong> {indicator.action}</p>
                  {indicator.data.length > 0 && (
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={indicator.data}>
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 9 }} width={40} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

