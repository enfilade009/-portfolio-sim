
import { AssetCategory, AssetParams } from './types';

export const DEFAULT_ASSETS: AssetParams[] = [
  {
    category: AssetCategory.US_EQUITY,
    weight: 75,
    expectedReturn: 0.08,
    volatility: 0.15,
    jumpIntensity: 0.1, // Once every 10 years
    jumpMean: -0.20,    // -20% drop
    jumpSd: 0.10
  },
  {
    category: AssetCategory.INTL_EQUITY,
    weight: 0,
    expectedReturn: 0.07,
    volatility: 0.18,
    jumpIntensity: 0.15,
    jumpMean: -0.25,
    jumpSd: 0.12
  },
  {
    category: AssetCategory.FIXED_INCOME,
    weight: 25,
    expectedReturn: 0.04,
    volatility: 0.05,
    jumpIntensity: 0.05,
    jumpMean: -0.05,
    jumpSd: 0.02
  },
  {
    category: AssetCategory.REAL_ESTATE,
    weight: 0,
    expectedReturn: 0.09,
    volatility: 0.12, // Leveraged
    jumpIntensity: 0.08,
    jumpMean: -0.30,
    jumpSd: 0.15
  },
  {
    category: AssetCategory.PRIVATE_EQUITY,
    weight: 0,
    expectedReturn: 0.11,
    volatility: 0.22,
    jumpIntensity: 0.1,
    jumpMean: -0.15,
    jumpSd: 0.20
  },
  {
    category: AssetCategory.CRYPTO,
    weight: 0,
    expectedReturn: 0.15,
    volatility: 0.80, // Very high vol
    jumpIntensity: 0.5, // Frequent jumps
    jumpMean: -0.40,
    jumpSd: 0.40
  }
];

export const COLORS = {
  // Nordic theme
  slate: '#2D3748',
  oatmeal: '#F7F5F2',
  sage: '#6B8E7A',
  sageLight: '#A8C5B5',
  sageDark: '#4A6B5A',
  terra: '#C75D5D',
  terraLight: '#F5D0D0',
  terraDark: '#9B4444',
  blue: '#4A90A4',
  white: '#FFFFFF',
  charcoal: '#4A5568',
  muted: '#E2E8F0',
  
  // Chart percentile colors
  primary: '#4A90A4',
  accent: '#6B8E7A',
  p90: '#93C5FD',
  p75: '#60A5FA',
  p50: '#FFFFFF',
  p25: '#F59E0B',
  p10: '#EF4444',
  worst: '#991B1B',
};

export const SIMULATION_ITERATIONS = 500; // Client-side limit for responsiveness