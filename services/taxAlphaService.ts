import { TaxLot, HarvestOpportunity, WashSaleRisk } from '../types';

export const identifyHarvestOpportunities = (lots: TaxLot[], taxRate: number = 0.24): HarvestOpportunity[] => {
  const opportunities: HarvestOpportunity[] = [];

  for (const lot of lots) {
    const gainLoss = (lot.currentPrice - lot.costBasis) * lot.shares;
    if (gainLoss < 0) {
      const taxSavings = Math.abs(gainLoss) * taxRate;
      const isLongTerm = lot.holdingPeriodDays > 365;

      opportunities.push({
        lotId: lot.id,
        ticker: lot.ticker,
        shares: lot.shares,
        costBasis: lot.costBasis,
        currentPrice: lot.currentPrice,
        unrealizedLoss: Math.abs(gainLoss),
        taxSavings,
        holdingPeriod: isLongTerm ? 'Long-Term' : 'Short-Term',
        recommendation: taxSavings > 100 ? 'Harvest' : 'Hold',
        replacementTickers: getReplacements(lot.ticker)
      });
    }
  }

  return opportunities.sort((a, b) => b.taxSavings - a.taxSavings);
};

const getReplacements = (ticker: string): string[] => {
  const replacements: Record<string, string[]> = {
    'VTI': ['ITOT', 'SCHB', 'SPTM'],
    'VOO': ['IVV', 'SPY', 'SPLG'],
    'VEA': ['IEFA', 'SCHF', 'EFA'],
    'VWO': ['IEMG', 'SCHE', 'EEM'],
    'BND': ['AGG', 'SCHZ', 'IUSB'],
    'VNQ': ['IYR', 'SCHH', 'XLRE'],
    'QQQ': ['QQQM', 'VGT', 'XLK'],
    'AAPL': ['XLK', 'VGT', 'QQQ'],
    'MSFT': ['XLK', 'VGT', 'IGV'],
    'GOOGL': ['XLC', 'VOX', 'FCOM'],
  };
  return replacements[ticker] || ['Similar ETF in sector'];
};

export const checkWashSaleRisk = (
  ticker: string,
  proposedSaleDate: Date,
  recentTransactions: { ticker: string, date: Date, type: 'buy' | 'sell' }[]
): WashSaleRisk => {
  const windowStart = new Date(proposedSaleDate);
  windowStart.setDate(windowStart.getDate() - 30);
  const windowEnd = new Date(proposedSaleDate);
  windowEnd.setDate(windowEnd.getDate() + 30);

  const riskyTransactions = recentTransactions.filter(t =>
    t.ticker === ticker &&
    t.type === 'buy' &&
    t.date >= windowStart &&
    t.date <= windowEnd
  );

  return {
    ticker,
    hasRisk: riskyTransactions.length > 0,
    conflictingDates: riskyTransactions.map(t => t.date),
    safeSellDate: windowEnd,
    explanation: riskyTransactions.length > 0
      ? `Wash sale triggered by purchase on ${riskyTransactions[0].date.toLocaleDateString()}`
      : 'No wash sale risk detected'
  };
};

export const calculateAnnualHarvestSummary = (
  opportunities: HarvestOpportunity[],
  ytdHarvestedLosses: number,
  ytdRealizedGains: number
): {
  totalAvailableLosses: number,
  netTaxPosition: number,
  remainingCarryforward: number,
  recommendation: string
} => {
  const totalAvailable = opportunities.reduce((sum, o) => sum + o.unrealizedLoss, 0);
  const netPosition = ytdRealizedGains - ytdHarvestedLosses - totalAvailable;
  const carryforward = netPosition < -3000 ? Math.abs(netPosition) - 3000 : 0;

  let recommendation = '';
  if (netPosition > 0) {
    recommendation = `Harvest $${totalAvailable.toLocaleString()} to offset gains`;
  } else if (carryforward > 0) {
    recommendation = `$${carryforward.toLocaleString()} loss carryforward available`;
  } else {
    recommendation = 'Tax position optimized for current year';
  }

  return {
    totalAvailableLosses: totalAvailable,
    netTaxPosition: netPosition,
    remainingCarryforward: carryforward,
    recommendation
  };
};

