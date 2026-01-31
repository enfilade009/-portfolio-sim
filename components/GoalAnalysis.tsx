import React from 'react';
import { Target, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { InvestmentGoal, GoalResult } from '../types';

interface Props {
  goals: InvestmentGoal[];
  results: GoalResult[];
}

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

export const GoalAnalysis: React.FC<Props> = ({ goals, results }) => {
  if (goals.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mt-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-nordic-sageLight dark:bg-nordic-sageLight/20 bg-opacity-30 p-2 rounded text-nordic-sageDark dark:text-nordic-sageLight">
           <Target size={20} />
        </div>
        <div>
           <h3 className="text-lg font-light text-nordic-slate dark:text-white">Goal Probability</h3>
           <p className="text-xs text-gray-400">Can you afford what matters?</p>
        </div>
      </div>

      <div className="space-y-6">
        {goals.map(goal => {
          const result = results.find(r => r.goalId === goal.id);
          if (!result) return null;

          const prob = result.probability;
          let statusColor = 'bg-gray-200 dark:bg-slate-600';
          let textColor = 'text-gray-500 dark:text-gray-400';
          let icon = <AlertCircle size={16} />;

          if (prob >= 90) {
            statusColor = 'bg-nordic-sage';
            textColor = 'text-nordic-sage';
            icon = <CheckCircle2 size={16} />;
          } else if (prob >= 70) {
            statusColor = 'bg-yellow-400';
            textColor = 'text-yellow-600 dark:text-yellow-400';
            icon = <TrendingUp size={16} />;
          } else {
            statusColor = 'bg-nordic-terra';
            textColor = 'text-nordic-terra';
            icon = <AlertCircle size={16} />;
          }

          return (
            <div key={goal.id} className="group">
              <div className="flex justify-between items-end mb-2">
                 <div>
                    <h4 className="font-bold text-nordic-slate dark:text-white text-sm flex items-center gap-2">
                      {goal.name} <span className="text-gray-400 font-normal text-xs">({goal.targetYear})</span>
                    </h4>
                    <p className="text-xs text-gray-500">Target: {formatCurrency(goal.targetAmount)} (Real)</p>
                 </div>
                 <div className="text-right">
                    <div className={`flex items-center justify-end gap-1 font-bold ${textColor}`}>
                       {icon}
                       {prob.toFixed(0)}% Likely
                    </div>
                    {prob < 95 && result.shortfall > 0 && (
                      <p className="text-[10px] text-gray-400">
                        Risk Shortfall: -{formatCurrency(result.shortfall)}
                      </p>
                    )}
                 </div>
              </div>

              {/* Progress Bar Container */}
              <div className="h-3 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                 {/* Success Zone */}
                 <div
                   className={`h-full rounded-full transition-all duration-1000 ${statusColor}`}
                   style={{ width: `${prob}%` }}
                 />
                 {/* Marker lines for 50%, 75%, 90% */}
                 <div className="absolute top-0 bottom-0 left-[50%] w-px bg-white dark:bg-slate-800 opacity-50"></div>
                 <div className="absolute top-0 bottom-0 left-[75%] w-px bg-white dark:bg-slate-800 opacity-50"></div>
                 <div className="absolute top-0 bottom-0 left-[90%] w-px bg-white dark:bg-slate-800 opacity-50"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

