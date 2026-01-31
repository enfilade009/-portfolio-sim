import React, { useState } from 'react';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { AssetParams, AssetCategory } from '../types';
import { ValidatedInput } from './ValidatedInput';

interface Props {
  assets: AssetParams[];
  onUpdate: (assets: AssetParams[]) => void;
}

export const AssetAllocation: React.FC<Props> = ({ assets, onUpdate }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleWeightChange = (category: AssetCategory, newWeight: number) => {
    const updated = assets.map(a =>
      a.category === category ? { ...a, weight: newWeight } : a
    );
    onUpdate(updated);
  };

  const handleParamChange = (category: AssetCategory, field: keyof AssetParams, value: number) => {
    const updated = assets.map(a =>
      a.category === category ? { ...a, [field]: value } : a
    );
    onUpdate(updated);
  };

  const totalWeight = assets.reduce((sum, a) => sum + a.weight, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-nordic-slate dark:text-white">Investment Mix</h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${totalWeight === 100 ? 'bg-nordic-sage text-white' : 'bg-nordic-terra text-white'}`}>
          {totalWeight}% Total
        </span>
      </div>

      <div className="space-y-3">
        {assets.map((asset) => (
          <div key={asset.category} className="bg-nordic-oatmeal dark:bg-slate-800 p-3 rounded-lg border border-nordic-muted dark:border-slate-700 hover:border-nordic-blue dark:hover:border-slate-500 transition-all">
            {/* Header / Slider Row */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpandedId(expandedId === asset.category ? null : asset.category)}>
                  <span className="text-xs font-bold text-nordic-slate dark:text-white">{asset.category}</span>
                  {expandedId === asset.category ? <ChevronUp size={14} className="text-nordic-blue"/> : <ChevronDown size={14} className="text-gray-400"/>}
                </div>
                <span className="font-mono text-xs font-bold text-nordic-slate dark:text-gray-300">{asset.weight}%</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={asset.weight}
                onChange={(e) => handleWeightChange(asset.category, parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-nordic-slate dark:accent-slate-400 hover:accent-nordic-blue transition-all"
              />
            </div>

            {/* Expanded Details */}
            {expandedId === asset.category && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 grid grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold block mb-1">Avg Growth</label>
                  <ValidatedInput
                     value={parseFloat((asset.expectedReturn * 100).toFixed(1))}
                     onChange={(val) => handleParamChange(asset.category, 'expectedReturn', val / 100)}
                     min={-20}
                     max={100}
                     step={0.1}
                     suffix="%"
                     className="bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold block mb-1">Stability (Vol)</label>
                  <ValidatedInput
                     value={parseFloat((asset.volatility * 100).toFixed(1))}
                     onChange={(val) => handleParamChange(asset.category, 'volatility', val / 100)}
                     min={0}
                     max={200}
                     step={0.1}
                     suffix="%"
                     className="bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <p className="col-span-2 text-[10px] text-gray-500 dark:text-gray-400 italic leading-relaxed bg-white dark:bg-slate-900 p-2 rounded border border-gray-100 dark:border-slate-700">
                  Adjust how much you expect this asset to grow (Avg Growth) and how bumpy the ride will be (Stability/Volatility). Higher stability number means a bumpier ride.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

