import React, { useState } from 'react';
import { Table, ChevronDown, ChevronUp, Info, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { SimulationYearResult, AssetParams, SimulationConfig } from '../types';

interface Props {
  data: SimulationYearResult[];
  startYear: number;
  showReal: boolean;
  assets: AssetParams[];
  config: SimulationConfig;
}

export const DetailedTable: React.FC<Props> = ({ data, startYear, showReal, assets, config }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Sample every 5 years + final year
  const sampledData = data.filter((d, i) => i % 5 === 0 || i === data.length - 1);
  const activeAssets = assets.filter(a => a.weight > 0);

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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mt-6 overflow-hidden">
      <div
        className="p-4 flex justify-between items-center cursor-pointer bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700"
        onClick={() => setIsOpen(!isOpen)}
      >
         <div className="flex items-center gap-3">
            <div className="bg-nordic-oatmeal dark:bg-slate-700 p-2 rounded-lg text-nordic-slate dark:text-white">
               <Table size={18} />
            </div>
            <div>
               <h3 className="text-sm font-bold text-nordic-slate dark:text-white uppercase tracking-wide">Financials Table</h3>
               <p className="text-xs text-gray-400">Detailed cashflow breakdown</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
             <span className="text-xs font-bold text-nordic-blue">
               {isOpen ? 'Collapse View' : 'Expand Details'}
             </span>
             {isOpen ? <ChevronUp size={16} className="text-nordic-blue"/> : <ChevronDown size={16} className="text-gray-400"/>}
         </div>
      </div>

      {isOpen && (
        <div className="p-0 animate-fade-in overflow-x-auto">
           {/* Info Bar */}
           <div className="bg-nordic-oatmeal dark:bg-slate-700/50 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-start gap-2 max-w-lg">
                <Info size={16} className="mt-0.5 text-nordic-blue flex-shrink-0" />
                <p className="text-xs text-nordic-charcoal dark:text-gray-300 leading-relaxed font-medium">
                   Showing the <strong>Median (p50)</strong> outcome across {config.timeHorizonYears} years.
                   Includes calculated rebalancing effects and cashflow timing.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Mode:</span>
                <span className="text-xs text-nordic-slate dark:text-white font-bold">
                  {showReal ? "Real Purchasing Power" : "Nominal Future Dollars"}
                </span>
              </div>
           </div>

           <table className="w-full text-xs text-right whitespace-nowrap">
             <thead className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
               <tr>
                 <th className="px-6 py-4 text-left sticky left-0 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 z-10 text-gray-400 font-bold uppercase tracking-wider">Year</th>
                 <th className="px-6 py-4 text-nordic-sage font-bold uppercase tracking-wider">Savings In</th>
                 <th className="px-6 py-4 text-nordic-terra font-bold uppercase tracking-wider">Drawdown Out</th>
                 <th className="px-6 py-4 bg-gray-50 dark:bg-slate-700/30 text-nordic-slate dark:text-white font-black uppercase tracking-wider border-l border-r border-gray-200 dark:border-slate-700">Portfolio Total</th>

                 {activeAssets.map(a => (
                   <th key={a.category} className="px-6 py-4 text-gray-500 font-bold uppercase tracking-wider">
                     {a.category.split(' ')[0]} <span className="text-[9px] font-normal bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded ml-1">{a.weight}%</span>
                   </th>
                 ))}
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
               {sampledData.map((row) => {
                 const yearsPassed = row.year - startYear;
                 const inflationFactor = Math.pow(1 + config.inflationRate, yearsPassed);

                 const displaySavings = showReal ? row.medianSavings / inflationFactor : row.medianSavings;
                 const displayWithdrawal = showReal ? row.medianWithdrawal / inflationFactor : row.medianWithdrawal;
                 const displayTotal = showReal ? row.p50Real : row.p50;

                 return (
                   <tr key={row.year} className="hover:bg-nordic-oatmeal/50 dark:hover:bg-slate-700/30 transition-colors group">
                     <td className="px-6 py-4 text-left font-mono font-bold text-nordic-slate dark:text-gray-300 sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-nordic-oatmeal/50 dark:group-hover:bg-slate-700/30 border-r border-gray-100 dark:border-slate-700 z-10">
                       {row.year} <span className="text-[10px] text-gray-300 font-normal ml-1">+{yearsPassed}y</span>
                     </td>
                     <td className="px-6 py-4 text-nordic-sage font-semibold">
                       {row.medianSavings > 0 ? (
                         <div className="flex items-center justify-end gap-1">
                           <ArrowUpRight size={12} />
                           {formatCurrency(displaySavings)}
                         </div>
                       ) : <span className="text-gray-200 dark:text-gray-600">-</span>}
                     </td>
                     <td className="px-6 py-4 text-nordic-terra font-semibold">
                       {row.medianWithdrawal > 0 ? (
                         <div className="flex items-center justify-end gap-1">
                           <ArrowDownLeft size={12} />
                           {formatCurrency(displayWithdrawal)}
                         </div>
                       ) : <span className="text-gray-200 dark:text-gray-600">-</span>}
                     </td>
                     <td className="px-6 py-4 font-bold text-nordic-slate dark:text-white bg-gray-50 dark:bg-slate-700/30 group-hover:bg-gray-100 dark:group-hover:bg-slate-700/50 border-l border-r border-gray-200 dark:border-slate-700">
                       {formatCurrency(displayTotal)}
                     </td>

                     {activeAssets.map(a => {
                       const assetValue = displayTotal * (a.weight / 100);
                       return (
                         <td key={a.category} className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono">
                           {formatCurrency(assetValue)}
                         </td>
                       );
                     })}
                   </tr>
                 );
               })}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

