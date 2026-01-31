import React from 'react';
import { InvestmentGoal } from '../types';
import { Target, Plus, Trash2 } from 'lucide-react';

interface GoalsPanelProps {
  goals: InvestmentGoal[];
  onUpdate: (goals: InvestmentGoal[]) => void;
  goalProbabilities?: Record<string, number>;
}

export const GoalsPanel: React.FC<GoalsPanelProps> = ({ goals, onUpdate, goalProbabilities }) => {
  const addGoal = () => {
    const newGoal: InvestmentGoal = {
      id: `goal_${Date.now()}`,
      name: 'New Goal',
      targetAmount: 500000,
      targetYear: new Date().getFullYear() + 10,
    };
    onUpdate([...goals, newGoal]);
  };

  const updateGoal = (id: string, field: keyof InvestmentGoal, value: string | number) => {
    const updated = goals.map(g => (g.id === id ? { ...g, [field]: value } : g));
    onUpdate(updated);
  };

  const removeGoal = (id: string) => {
    onUpdate(goals.filter(g => g.id !== id));
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-slate-800">Investment Goals</h3>
        </div>
        <button
          onClick={addGoal}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No goals defined. Add a goal to track progress.</p>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const probability = goalProbabilities?.[goal.id];
            return (
              <div key={goal.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={goal.name}
                    onChange={(e) => updateGoal(goal.id, 'name', e.target.value)}
                    className="px-2 py-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-amber-500"
                    placeholder="Goal name"
                  />
                  <input
                    type="number"
                    value={goal.targetAmount}
                    onChange={(e) => updateGoal(goal.id, 'targetAmount', parseInt(e.target.value) || 0)}
                    className="px-2 py-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-amber-500"
                    placeholder="Amount"
                  />
                  <input
                    type="number"
                    value={goal.targetYear}
                    onChange={(e) => updateGoal(goal.id, 'targetYear', parseInt(e.target.value) || 2030)}
                    className="px-2 py-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-amber-500"
                    placeholder="Year"
                  />
                </div>
                {probability !== undefined && (
                  <div className={`text-sm font-medium px-2 py-1 rounded ${probability >= 0.7 ? 'text-emerald-700 bg-emerald-100' : probability >= 0.4 ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100'}`}>
                    {(probability * 100).toFixed(0)}%
                  </div>
                )}
                <button onClick={() => removeGoal(goal.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

