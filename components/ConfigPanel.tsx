import React from 'react';
import { SimulationConfig, StressScenario } from '../types';
import { Settings, DollarSign, Calendar, Percent } from 'lucide-react';

interface ConfigPanelProps {
  config: SimulationConfig;
  onUpdate: (config: SimulationConfig) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onUpdate }) => {
  const updateField = <K extends keyof SimulationConfig>(field: K, value: SimulationConfig[K]) => {
    onUpdate({ ...config, [field]: value });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-800">Simulation Parameters</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            <DollarSign className="w-3 h-3 inline mr-1" />Initial Wealth
          </label>
          <input
            type="number"
            value={config.initialWealth}
            onChange={(e) => updateField('initialWealth', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-xs text-slate-400">{formatCurrency(config.initialWealth)}</span>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            <Calendar className="w-3 h-3 inline mr-1" />Time Horizon (Years)
          </label>
          <input
            type="number"
            min="5"
            max="50"
            value={config.timeHorizonYears}
            onChange={(e) => updateField('timeHorizonYears', parseInt(e.target.value) || 30)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            <Percent className="w-3 h-3 inline mr-1" />Savings Rate
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={(config.savingsRate * 100).toFixed(0)}
            onChange={(e) => updateField('savingsRate', (parseInt(e.target.value) || 0) / 100)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            <Percent className="w-3 h-3 inline mr-1" />Withdrawal Rate
          </label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={(config.withdrawalRate * 100).toFixed(1)}
            onChange={(e) => updateField('withdrawalRate', (parseFloat(e.target.value) || 0) / 100)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Current Age</label>
          <input
            type="number"
            min="18"
            max="80"
            value={config.currentAge}
            onChange={(e) => updateField('currentAge', parseInt(e.target.value) || 40)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Retirement Delay</label>
          <input
            type="number"
            min="0"
            max="30"
            value={config.retirementDelayYears}
            onChange={(e) => updateField('retirementDelayYears', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Stress Scenario</label>
          <select
            value={config.stressSeverity}
            onChange={(e) => updateField('stressSeverity', Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={StressScenario.NONE}>No Stress Test</option>
            <option value={StressScenario.GFC_2008}>2008 Financial Crisis</option>
            <option value={StressScenario.INFLATION_SHOCK}>Inflation Shock</option>
            <option value={StressScenario.TECH_BUBBLE}>Tech Bubble Burst</option>
          </select>
        </div>
      </div>
    </div>
  );
};

