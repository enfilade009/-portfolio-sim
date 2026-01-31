import React from 'react';

interface Props {
  label: string;
  value: string | number;
  subtext?: string;
  color?: 'default' | 'success' | 'danger';
}

export const MetricsCard: React.FC<Props> = ({ label, value, subtext, color = 'default' }) => {
  const valueColor = {
    default: 'text-nordic-slate dark:text-white',
    success: 'text-nordic-sage', // Emerald
    danger: 'text-nordic-terra'  // Rose
  }[color];

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-soft border border-nordic-muted dark:border-slate-700 hover:border-nordic-blue dark:hover:border-slate-500 transition-colors">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</h4>
      <div className={`text-2xl font-bold ${valueColor} tracking-tight`}>{value}</div>
      {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">{subtext}</p>}
    </div>
  );
};

