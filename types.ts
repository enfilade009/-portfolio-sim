
export enum AssetCategory {
  US_EQUITY = 'US Equity',
  INTL_EQUITY = 'Intl Equity',
  FIXED_INCOME = 'Fixed Income',
  REAL_ESTATE = 'Real Estate',
  PRIVATE_EQUITY = 'Private Equity',
  CRYPTO = 'Crypto/Alts'
}

export interface AssetParams {
  category: AssetCategory;
  weight: number;
  expectedReturn: number; // Annual drift (mu)
  volatility: number;     // Annual volatility (sigma)
  jumpIntensity: number;  // Lambda: events per year
  jumpMean: number;       // k: avg size of jump
  jumpSd: number;         // Delta: sd of jump size
}

export type IncomeFrequency = 'Yearly' | 'Monthly';

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  growthRate: number; // 0.03 for 3%
  startYear?: number; // Calendar year to start
  endYear?: number;   // Calendar year to stop
  stopsAtRetirement?: boolean; 
}

export interface InvestmentGoal {
  id: string;
  name: string;
  targetAmount: number; 
  targetYear: number;
}

export interface GoalResult {
  goalId: string;
  probability: number; 
  expectedAmount: number; 
  shortfall: number; 
}

export type WithdrawalStrategy = 'FIXED_REAL' | 'PERCENT_PORTFOLIO';

export interface SimulationConfig {
  initialWealth: number;
  incomeSources: IncomeSource[]; 
  goals: InvestmentGoal[]; 
  savingsRate: number;    
  retirementDelayYears: number; 
  timeHorizonYears: number;
  withdrawalRate: number; 
  withdrawalStrategy: WithdrawalStrategy; 
  taxRate: number;        
  inflationRate: number;  
  startYear: number;
  currentAge?: number;    
  crisisStartYear: number; 
  crisisDuration: number;
  stressSeverity: number;
}

export interface SavedScenario {
  id: string;
  name: string;
  date: string;
  config: SimulationConfig;
  assets: AssetParams[];
}

export interface SimulationYearResult {
  year: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  worstCase: number;
  p10Real: number;
  p25Real: number;
  p50Real: number;
  p75Real: number;
  p90Real: number;
  medianWithdrawal: number;
  medianSavings: number;
}

export interface RiskPathPoint {
  year: number;
  value: number;
  peak: number;
  drawdown: number;
}

export interface ModelValidation {
  effectiveReturn: number;
  effectiveVolatility: number;
  assumedCorrelation: number;
  jumpFrequency: number;
  startNetFlowMonthly: number; 
}

export interface SimulationSummary {
  probabilityOfSuccess: number; 
  medianTerminalWealth: number;
  medianTerminalWealthReal: number; 
  worstDrawdown: number;
  worstYearReturn: number; 
  safeWithdrawalRate: number; 
}

export interface SimulationResult {
  data: SimulationYearResult[]; 
  summary: SimulationSummary; 
  riskPath: RiskPathPoint[];
  failingPaths: number[][]; 
  goals: GoalResult[]; 
  validation: ModelValidation;
}

export enum StressScenario {
  NONE = 'None',
  GFC_2008 = '2008 Financial Crisis',
  INFLATION_SHOCK = 'Hyperinflation Shock',
  TECH_BUBBLE = 'Tech Bubble Burst'
}

// --- DIVIDEND ENGINE TYPES ---

export type PayoutPattern = 'Monthly' | 'Q-Jan/Apr/Jul/Oct' | 'Q-Feb/May/Aug/Nov' | 'Q-Mar/Jun/Sep/Dec' | 'Semi-Annual' | 'Annual';

export interface DividendHolding {
  id: string;
  ticker: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  annualDividendPerShare: number;
  dividendGrowthRate: number;
  payoutPattern: PayoutPattern;
  type: 'Stock' | 'Bond/ETF' | 'REIT' | 'T-Bill';
  sector?: string;
  payoutRatio?: number;
  paymentMonths?: number[];
}

export interface DividendAnalysisSummary {
  totalAnnualIncome: number;
  averageYOC: number;
  monthlyAverage: number;
  incomeCoverageRatio: number; // vs Target
}

// --- MARKET DASHBOARD TYPES ---

export type MarketScenario = 'Current' | 'Housing Crisis' | 'Tech Bubble' | 'Inflation Shock';

export interface EconomicPoint {
  date: string;
  value: number;
  value2?: number; // Optional secondary value (e.g. S&P overlay or SMA)
}

export type SignalType = 'Bullish' | 'Bearish' | 'Neutral' | 'Caution' | 'Strong Buy';

export interface MarketIndicator {
  id: string;
  title: string;
  category: 'Macro' | 'Consumer' | 'Risk' | 'Liquidity' | 'Technical' | 'Valuation' | 'Sector';
  source: string;
  description: string;
  implication: string; 
  action: string; // "Actionable move"
  signal: SignalType;
  currentValue: number;
  stats: {
    high5y: number;
    low5y: number;
    avg5y: number;
  };
  trend?: 'up' | 'down' | 'neutral';
  status?: 'success' | 'warning' | 'danger';
  data: EconomicPoint[];
  format: 'currency' | 'percent' | 'number';
}

// --- ALPHA EDGE & WELL-BEING TYPES ---

export interface AlphaGlobalAssumptions {
  stcgRate: number; // 0.35
  ltcgRate: number; // 0.15
  inflation: number; // 0.03
  reinvestDividends: boolean;
  thesisConfidenceFloor: number; // 0-100 filter
  humanCapitalSector: string; // e.g., 'Aviation', 'Technology'
}

export interface TaxLot {
  id: string;
  ticker: string;
  sector: string;
  purchaseDate: string;
  quantity: number;
  shares?: number;
  costBasis?: number;
  costPerShare: number;
  currentPrice: number;
  buyThesis: string;
  confidenceScore: number;
  targetSellDate?: string;
  calculatedAlpha?: number;
  unrealizedGain?: number;
  dividendYield: number;
  dividendType: 'Qualified' | 'Non-Qualified';
  lastThesisUpdate?: string;
  thesisEvidence?: string;
  holdingPeriodDays?: number;
}

export interface AlphaMetrics {
  monthlyDiscretionarySpend: number;
  monthlyPassiveIncome: number;
  liquidCash: number;
  avgMonthlyBurn: number;
  portfolioReturnYTD: number;
  benchmarkReturnYTD: number;
  netLiquidationValue?: number; // Post-tax
  taxDrag?: number; // Amount lost to taxes if sold today
}

export interface ThesisAnalysis {
  lotId: string;
  ticker: string;
  status: 'Intact' | 'Drifting' | 'Broken';
  reasoning: string;
  action: string;
}

// --- VALIDATION TYPES ---
export type ValidationSeverity = 'Info' | 'Warning' | 'Error';

export interface ValidationIssue {
  id: string;
  module: 'Tax-Alpha' | 'Thesis' | 'Benchmark';
  severity: ValidationSeverity;
  message: string;
  action?: string;
  details?: string;
}

export interface AlphaValidationState {
  status: 'Verified' | 'Warning' | 'Error';
  score: number; // 0-100 Edge Confidence
  issues: ValidationIssue[];
  lastRun: string;
}

export interface HarvestOpportunity {
  lotId: string;
  ticker: string;
  shares?: number;
  costBasis?: number;
  currentPrice: number;
  loss?: number;
  unrealizedLoss: number;
  taxSavings: number;
  isLongTerm?: boolean;
  holdingPeriod?: string;
  recommendation?: string;
  replacementTickers?: string[];
}

export interface WashSaleRisk {
  lotId?: string;
  ticker: string;
  purchaseDate?: string;
  daysUntilSafe?: number;
  hasRisk?: boolean;
  conflictingDates?: (string | Date)[];
  safeSellDate?: Date;
  explanation?: string;
}