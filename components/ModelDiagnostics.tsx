import React from 'react';
import { Info, Gauge, Zap, Activity, Calculator, TrendingUp, TrendingDown, Sigma } from 'lucide-react';
import { ModelValidation } from '../types';

interface Props {
  validation: ModelValidation;
}

const FormulaTooltip: React.FC<{ title: string; formula: string; desc: string }> = ({ title, formula, desc }) => (
  <div className="group relative flex items-center">
    <Info size={14} className="text-nordic-blue cursor-help ml-2 hover:scale-110 transition-transform" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-nordic-slate dark:bg-slate-900 text-white p-4 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform translate-y-2 group-hover:translate-y-0">
      <p className="font-bold text-xs uppercase text-nordic-sageLight mb-2">{title}</p>
      <div className="bg-black bg-opacity-30 p-2 rounded mb-2 font-mono text-[10px] text-center border border-gray-600">
        {formula}
      </div>
      <p className="text-xs text-gray-300 leading-relaxed">{desc}</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-nordic-slate dark:border-t-slate-900"></div>
    </div>
  </div>
);

export const ModelDiagnostics: React.FC<Props> = ({ validation }) => {
  const netFlow = validation.startNetFlowMonthly;
  const isDrawdown = netFlow < 0;
  const formattedFlow = `$${Math.abs(Math.round(netFlow)).toLocaleString()}`;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mt-6">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
         <div className="bg-nordic-oatmeal dark:bg-slate-700 p-2 rounded text-nordic-slate dark:text-white">
           <Calculator size={20} />
         </div>
         <div>
            <h3 className="text-sm font-bold text-nordic-slate dark:text-white uppercase tracking-wide">Model Audit</h3>
            <p className="text-xs text-gray-400">Parameter Verification</p>
         </div>
         <span className="ml-auto text-[10px] bg-nordic-blue bg-opacity-10 text-nordic-blue px-2 py-1 rounded font-bold uppercase">
           Merton Jump-Diffusion
         </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Effective Return */}
        <div className="bg-nordic-oatmeal dark:bg-slate-700/50 p-4 rounded-xl border border-transparent hover:border-nordic-muted dark:hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Drift (μ)</span>
             <FormulaTooltip
               title="Geometric Drift"
               formula="μ = Σ(w_i * r_i)"
               desc="The weighted sum of expected returns. In the simulation, we adjust this by 0.5*σ² (Ito's Lemma) to account for volatility drag."
             />
          </div>
          <div className="flex items-center gap-2">
             <Gauge size={20} className="text-nordic-sage" />
             <span className="text-2xl font-bold text-nordic-slate dark:text-white tracking-tight">{(validation.effectiveReturn * 100).toFixed(2)}%</span>
          </div>
        </div>

        {/* Effective Volatility */}
        <div className="bg-nordic-oatmeal dark:bg-slate-700/50 p-4 rounded-xl border border-transparent hover:border-nordic-muted dark:hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Sigma (σ)</span>
             <FormulaTooltip
               title="Portfolio Variance"
               formula="σ² = wᵀ * Σ * w"
               desc={`Calculated using the covariance matrix with a base correlation of ${validation.assumedCorrelation.toFixed(2)}. Represents the continuous diffusion risk component.`}
             />
          </div>
          <div className="flex items-center gap-2">
             <Activity size={20} className="text-nordic-slate dark:text-gray-300" />
             <span className="text-2xl font-bold text-nordic-slate dark:text-white tracking-tight">{(validation.effectiveVolatility * 100).toFixed(2)}%</span>
          </div>
        </div>

        {/* Crash Frequency */}
        <div className="bg-nordic-oatmeal dark:bg-slate-700/50 p-4 rounded-xl border border-transparent hover:border-nordic-muted dark:hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Jump Freq (λ)</span>
             <FormulaTooltip
               title="Poisson Process"
               formula="P(N(t) = n) = (λt)ⁿ * e^(-λt) / n!"
               desc="The expected number of 'Black Swan' shock events per year. Modeled as a Poisson arrival process added to the standard diffusion."
             />
          </div>
          <div className="flex items-center gap-2">
             <Zap size={20} className="text-nordic-terra" />
             <span className="text-2xl font-bold text-nordic-slate dark:text-white tracking-tight">{validation.jumpFrequency.toFixed(2)}</span>
          </div>
        </div>

         {/* Net Flow / Drawdown Status */}
        <div className={`p-4 rounded-xl border ${isDrawdown ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800' : 'bg-nordic-sageLight dark:bg-teal-900/20 bg-opacity-20 border-nordic-sageLight dark:border-teal-800 border-opacity-40'}`}>
          <div className="flex items-center justify-between mb-2">
             <span className={`text-[10px] uppercase font-bold ${isDrawdown ? 'text-nordic-terra' : 'text-nordic-sageDark dark:text-nordic-sage'}`}>
                {isDrawdown ? 'Net Drawdown' : 'Net Accumulation'}
             </span>
             <FormulaTooltip
                title="Cash Flow"
                formula="Flow = (Income * Savings%) - Withdrawals"
                desc="The monthly net cash impact on the portfolio balance at the start of the simulation."
             />
          </div>
          <div className="flex items-center gap-2">
             {isDrawdown ? <TrendingDown size={20} className="text-nordic-terra" /> : <TrendingUp size={20} className="text-nordic-sage" />}
             <span className={`text-2xl font-bold tracking-tight ${!isDrawdown ? 'text-nordic-sageDark dark:text-nordic-sage' : 'text-nordic-terra'}`}>
                {isDrawdown ? `-${formattedFlow}` : `+${formattedFlow}`}
             </span>
          </div>
        </div>

      </div>
    </div>
  );
};

