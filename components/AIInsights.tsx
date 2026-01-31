import React, { useState } from 'react';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getWealthInsights } from '../services/geminiService';
import { SimulationSummary, SimulationYearResult, AssetParams } from '../types';

interface AIInsightsProps {
  summary: SimulationSummary | null;
  assets: AssetParams[];
  endYearData: SimulationYearResult | null;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ summary, assets, endYearData }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fetchInsights = async () => {
    if (!summary || !endYearData) return;
    setLoading(true);
    try {
      const result = await getWealthInsights(summary, assets, endYearData);
      setInsights(result);
    } catch (error) {
      setInsights('Unable to generate insights. Please check your API key.');
    }
    setLoading(false);
  };

  const parseInsights = (text: string) => {
    const sections = text.split('|||').map(s => s.trim()).filter(Boolean);
    return {
      verdict: sections[0] || '',
      goodBad: sections[1] || '',
      boldMove: sections[2] || '',
    };
  };

  const parsed = insights ? parseInsights(insights) : null;

  return (
    <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-xl p-6 shadow-sm border border-violet-200/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-slate-800">AI Wealth Strategist</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchInsights}
            disabled={loading || !summary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-700 bg-white rounded-lg border border-violet-200 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Generate'}
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-slate-500 hover:text-slate-700">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4">
          {!insights && !loading && (
            <p className="text-sm text-slate-500 italic">
              Run a simulation, then click "Generate" for AI-powered portfolio insights.
            </p>
          )}

          {parsed && (
            <>
              <div className="bg-white/70 rounded-lg p-4 border border-violet-100">
                <h4 className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-2">The Verdict</h4>
                <p className="text-sm text-slate-700">{parsed.verdict}</p>
              </div>

              <div className="bg-white/70 rounded-lg p-4 border border-violet-100">
                <h4 className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-2">The Good & The Bad</h4>
                <div className="text-sm text-slate-700 whitespace-pre-line">{parsed.goodBad}</div>
              </div>

              <div className="bg-white/70 rounded-lg p-4 border border-violet-100">
                <h4 className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-2">One Bold Move</h4>
                <p className="text-sm text-slate-700">{parsed.boldMove}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

