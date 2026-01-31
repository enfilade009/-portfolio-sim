import React from 'react';
import { ShieldCheck, ShieldAlert, Shield, Info } from 'lucide-react';
import { AssetParams, StressScenario, AssetCategory } from '../types';

interface Props {
  assets: AssetParams[];
  scenario: StressScenario;
}

export const CorrelationMatrix: React.FC<Props> = ({ assets, scenario }) => {
  let baseCorrelation = 0.3;
  if (scenario === StressScenario.GFC_2008) baseCorrelation = 0.8;
  if (scenario === StressScenario.INFLATION_SHOCK) baseCorrelation = 0.6;
  if (scenario === StressScenario.TECH_BUBBLE) baseCorrelation = 0.4;

  const activeAssets = assets.filter(a => a.weight > 0);

  const getStatus = (val: number) => {
    if (val >= 0.8) return { label: 'Danger', color: 'bg-nordic-terra text-white', opacity: 'bg-opacity-100' };
    if (val >= 0.5) return { label: 'Caution', color: 'bg-yellow-400 text-yellow-900', opacity: 'bg-opacity-80' };
    return { label: 'Safe', color: 'bg-nordic-sage text-white', opacity: 'bg-opacity-40' };
  };

  const getShortName = (category: AssetCategory) => {
    switch (category) {
      case AssetCategory.US_EQUITY: return 'US Eq';
      case AssetCategory.INTL_EQUITY: return 'Intl';
      case AssetCategory.FIXED_INCOME: return 'Bond';
      case AssetCategory.REAL_ESTATE: return 'RE';
      case AssetCategory.PRIVATE_EQUITY: return 'PE';
      case AssetCategory.CRYPTO: return 'Crpt';
      default: return 'Ast';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mt-6 transition-all duration-500">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
           <div className={`p-2.5 rounded-lg ${baseCorrelation > 0.6 ? 'bg-nordic-terraLight text-nordic-terra' : 'bg-nordic-oatmeal dark:bg-slate-700 text-nordic-slate dark:text-white'}`}>
              {baseCorrelation > 0.6 ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
           </div>
           <div>
              <h3 className="text-lg font-bold text-nordic-slate dark:text-white">Diversification Audit</h3>
              <p className="text-xs text-nordic-charcoal dark:text-gray-400">
                Risk Correlation Matrix
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Info Side */}
        <div className="space-y-6">
           <div className="bg-nordic-oatmeal dark:bg-slate-700/50 p-5 rounded-xl border border-nordic-muted dark:border-slate-600">
             <h4 className="text-sm font-bold text-nordic-slate dark:text-white mb-2 flex items-center gap-2">
               State: <span className={`${scenario === 'None' ? 'text-nordic-sage' : 'text-nordic-terra'}`}>{scenario === StressScenario.NONE ? 'Normal Market' : 'CRISIS'}</span>
             </h4>
             <p className="text-sm text-nordic-charcoal dark:text-gray-300 leading-relaxed mb-4">
               {scenario === StressScenario.NONE
                 ? "Low correlation allows assets to balance each other out. When one falls, others may hold steady."
                 : "During a crisis, correlations spike towards 1.0. Diversification benefits evaporate as panic selling hits all asset classes simultaneously."}
             </p>
             <div className="flex items-center gap-2 text-xs font-mono bg-white dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-600 dark:text-white">
               <Info size={14} className="text-nordic-blue" />
               Current Factor: <span className="font-bold">{baseCorrelation.toFixed(2)}</span>
             </div>
           </div>

           <div className="flex flex-col gap-2">
              <div className="text-xs font-bold uppercase text-gray-400 tracking-wider">Legend</div>
              <div className="flex items-center gap-3 text-xs font-medium dark:text-gray-300">
                 <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-nordic-sage bg-opacity-40"></div> Low (Safe)</div>
                 <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-yellow-400"></div> Med (Linked)</div>
                 <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-nordic-terra"></div> High (Danger)</div>
              </div>
           </div>
        </div>

        {/* The Matrix Visualization */}
        <div className="flex items-center justify-center bg-gray-50 dark:bg-slate-900 rounded-xl p-4 border border-dashed border-gray-200 dark:border-slate-700">
          <div className="overflow-visible">
             <div className="grid gap-1" style={{ gridTemplateColumns: `40px repeat(${activeAssets.length}, 40px)` }}>
                {/* Column Headers */}
                <div className="col-span-1"></div>
                {activeAssets.map(a => (
                  <div key={a.category} className="text-[10px] font-bold text-nordic-slate dark:text-white uppercase flex items-end justify-center pb-2 h-10 w-10">
                    <span className="-rotate-45 whitespace-nowrap origin-bottom-left translate-x-2">{getShortName(a.category)}</span>
                  </div>
                ))}

                {/* Matrix Body */}
                {activeAssets.map((rowAsset, i) => (
                   <React.Fragment key={rowAsset.category}>
                      {/* Row Header */}
                      <div className="flex items-center justify-end pr-2 h-10">
                        <span className="text-[10px] font-bold text-nordic-slate dark:text-white uppercase text-right leading-tight">{getShortName(rowAsset.category)}</span>
                      </div>

                      {/* Cells */}
                      {activeAssets.map((colAsset, j) => {
                         // Only show Lower Triangle + Diagonal
                         if (j > i) return <div key={`${rowAsset.category}-${colAsset.category}`} className="h-10 w-10" />;

                         const isDiag = i === j;
                         const val = isDiag ? 1.0 : baseCorrelation;
                         const status = getStatus(val);

                         return (
                           <div key={`${rowAsset.category}-${colAsset.category}`} className="h-10 w-10 p-0.5">
                             <div
                                className={`w-full h-full rounded-md flex items-center justify-center text-[10px] font-bold shadow-sm transition-all hover:scale-110 cursor-default ${status.color} ${isDiag ? 'bg-opacity-10 dark:bg-opacity-10 text-gray-400' : status.opacity}`}
                             >
                               {val.toFixed(1)}
                             </div>
                           </div>
                         );
                      })}
                   </React.Fragment>
                ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

