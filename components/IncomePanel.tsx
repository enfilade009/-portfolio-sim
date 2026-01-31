import React from 'react';
import { IncomeSource } from '../types';
import { Wallet, Plus, Trash2 } from 'lucide-react';

interface IncomePanelProps {
  incomeSources: IncomeSource[];
  onUpdate: (sources: IncomeSource[]) => void;
}

export const IncomePanel: React.FC<IncomePanelProps> = ({ incomeSources, onUpdate }) => {
  const addSource = () => {
    const newSource: IncomeSource = {
      id: `income_${Date.now()}`,
      name: 'New Income',
      amount: 100000,
      frequency: 'Yearly',
      growthRate: 0.03,
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 20,
      stopsAtRetirement: true,
    };
    onUpdate([...incomeSources, newSource]);
  };

  const updateSource = (id: string, field: keyof IncomeSource, value: string | number | boolean) => {
    const updated = incomeSources.map(s => (s.id === id ? { ...s, [field]: value } : s));
    onUpdate(updated);
  };

  const removeSource = (id: string) => {
    onUpdate(incomeSources.filter(s => s.id !== id));
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const totalAnnual = incomeSources.reduce((sum, s) => {
    return sum + (s.frequency === 'Monthly' ? s.amount * 12 : s.amount);
  }, 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-slate-800">Income Sources</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Total: {formatCurrency(totalAnnual)}/yr</span>
          <button
            onClick={addSource}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>

      {incomeSources.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No income sources. Add one to include in simulation.</p>
      ) : (
        <div className="space-y-3">
          {incomeSources.map((source) => (
            <div key={source.id} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="text"
                  value={source.name}
                  onChange={(e) => updateSource(source.id, 'name', e.target.value)}
                  className="flex-1 px-2 py-1 text-sm font-medium border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500"
                />
                <button onClick={() => removeSource(source.id)} className="p-1 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="text-slate-500">Amount</label>
                  <input
                    type="number"
                    value={source.amount}
                    onChange={(e) => updateSource(source.id, 'amount', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="text-slate-500">Frequency</label>
                  <select
                    value={source.frequency}
                    onChange={(e) => updateSource(source.id, 'frequency', e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded"
                  >
                    <option value="Yearly">Yearly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500">Growth %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={(source.growthRate * 100).toFixed(1)}
                    onChange={(e) => updateSource(source.id, 'growthRate', (parseFloat(e.target.value) || 0) / 100)}
                    className="w-full px-2 py-1 border border-slate-200 rounded"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-1 text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={source.stopsAtRetirement}
                      onChange={(e) => updateSource(source.id, 'stopsAtRetirement', e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Stops at retirement
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

