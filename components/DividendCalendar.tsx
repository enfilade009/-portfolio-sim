import React from 'react';
import { DividendHolding } from '../types';
import { Calendar, DollarSign } from 'lucide-react';

interface DividendCalendarProps {
  holdings: DividendHolding[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const DividendCalendar: React.FC<DividendCalendarProps> = ({ holdings }) => {
  const monthlyIncome: Record<number, { total: number; tickers: string[] }> = {};

  for (let i = 0; i < 12; i++) {
    monthlyIncome[i] = { total: 0, tickers: [] };
  }

  holdings.forEach((holding) => {
    const annualDiv = holding.shares * holding.annualDividendPerShare;
    let paymentMonths: number[] = holding.paymentMonths || [];
    if (paymentMonths.length === 0) {
      if (holding.payoutPattern === 'Q-Jan/Apr/Jul/Oct') {
        paymentMonths = [0, 3, 6, 9];
      } else if (holding.payoutPattern === 'Q-Feb/May/Aug/Nov') {
        paymentMonths = [1, 4, 7, 10];
      } else if (holding.payoutPattern === 'Q-Mar/Jun/Sep/Dec') {
        paymentMonths = [2, 5, 8, 11];
      } else if (holding.payoutPattern === 'Semi-Annual') {
        paymentMonths = [5, 11];
      } else if (holding.payoutPattern === 'Annual') {
        paymentMonths = [11];
      }
    }

    if (holding.payoutPattern === 'Monthly') {
      for (let i = 0; i < 12; i++) {
        monthlyIncome[i].total += annualDiv / 12;
        monthlyIncome[i].tickers.push(holding.ticker);
      }
    } else if (holding.payoutPattern.startsWith('Q-') || holding.payoutPattern === 'Semi-Annual' || holding.payoutPattern === 'Annual') {
      const divisor = holding.payoutPattern.startsWith('Q-') ? 4 : (holding.payoutPattern === 'Semi-Annual' ? 2 : 1);
      paymentMonths.forEach((m) => {
        monthlyIncome[m].total += annualDiv / divisor;
        monthlyIncome[m].tickers.push(holding.ticker);
      });
    }
  });

  const maxMonthly = Math.max(...Object.values(monthlyIncome).map((m) => m.total), 1);
  const totalAnnual = Object.values(monthlyIncome).reduce((sum, m) => sum + m.total, 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-800">Dividend Calendar</h3>
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <DollarSign className="w-4 h-4" />
          <span className="font-medium">${totalAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1">
        {MONTHS.map((month, idx) => {
          const data = monthlyIncome[idx];
          const height = Math.max((data.total / maxMonthly) * 80, 4);
          const hasIncome = data.total > 0;

          return (
            <div key={month} className="flex flex-col items-center">
              <div className="h-20 w-full flex items-end justify-center">
                <div
                  className={`w-full rounded-t transition-all ${hasIncome ? 'bg-blue-500' : 'bg-slate-200'}`}
                  style={{ height: `${height}px` }}
                  title={`${month}: $${data.total.toFixed(0)} (${data.tickers.join(', ')})`}
                />
              </div>
              <span className="text-xs text-slate-500 mt-1">{month}</span>
              <span className="text-xs font-medium text-slate-700">
                ${data.total >= 1000 ? `${(data.total / 1000).toFixed(1)}k` : data.total.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>

      {holdings.length === 0 && (
        <p className="text-sm text-slate-500 italic text-center mt-4">Add holdings to see dividend distribution.</p>
      )}
    </div>
  );
};

