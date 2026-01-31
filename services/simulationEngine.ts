
import { AssetParams, SimulationConfig, SimulationYearResult, StressScenario, RiskPathPoint, IncomeSource, SimulationResult, GoalResult } from '../types';

// Box-Muller transform for standard normal distribution
function normalRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Poisson process for jumps
function poissonRandom(lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function calculateAnnualIncome(
  sources: IncomeSource[], 
  yearOffset: number, 
  startYear: number, 
  isRetired: boolean
): number {
  const currentCalendarYear = startYear + yearOffset;
  
  return sources.reduce((total, source) => {
    if (isRetired && source.stopsAtRetirement) return total;
    if (source.startYear && currentCalendarYear < source.startYear) return total;
    if (source.endYear && currentCalendarYear > source.endYear) return total;

    const baseAnnual = source.frequency === 'Monthly' ? source.amount * 12 : source.amount;
    const grownAmount = baseAnnual * Math.pow(1 + source.growthRate, yearOffset);
    return total + grownAmount;
  }, 0);
}

interface PortfolioParams {
  mu: number;
  sigma: number;
  lambda: number;
  jumpMean: number;
  jumpSd: number; 
  variance: number;
}

function calculatePortfolioParams(assets: AssetParams[], correlation: number): PortfolioParams {
  let portfolioMu = 0;
  let portfolioVariance = 0;
  let portfolioLambda = 0;
  let portfolioJumpMean = 0;
  let portfolioJumpSd = 0;

  assets.forEach(a => {
    const w = a.weight / 100;
    portfolioMu += w * a.expectedReturn;
    portfolioLambda += w * a.jumpIntensity;
    portfolioJumpMean += w * a.jumpMean;
    portfolioJumpSd += w * a.jumpSd;
  });

  for (let i = 0; i < assets.length; i++) {
    for (let j = 0; j < assets.length; j++) {
      const assetI = assets[i];
      const assetJ = assets[j];
      const wI = assetI.weight / 100;
      const wJ = assetJ.weight / 100;
      const sigmaI = assetI.volatility;
      const sigmaJ = assetJ.volatility;
      const rho = (i === j) ? 1.0 : correlation;
      portfolioVariance += wI * wJ * sigmaI * sigmaJ * rho;
    }
  }

  return {
    mu: portfolioMu,
    sigma: Math.sqrt(portfolioVariance),
    lambda: portfolioLambda,
    jumpMean: portfolioJumpMean,
    jumpSd: portfolioJumpSd,
    variance: portfolioVariance
  };
}

export function runSimulation(
  assets: AssetParams[],
  config: SimulationConfig,
  scenario: StressScenario,
  iterations: number
): SimulationResult {

  const results: number[][] = []; 
  const withdrawalResults: number[][] = []; // [iteration][step]
  const savingsResults: number[][] = [];    // [iteration][step]
  
  const years = config.timeHorizonYears;
  const dt = 1 / 12; 
  const steps = years * 12;
  const inflationRate = config.inflationRate || 0.025;
  const retirementStartMonth = (config.retirementDelayYears || 0) * 12;
  
  const crisisStartMonth = (config.crisisStartYear || 0) * 12;
  const crisisEndMonth = crisisStartMonth + ((config.crisisDuration || 3) * 12);

  const baseCorrelation = 0.3;
  const baseParams = calculatePortfolioParams(assets, baseCorrelation);

  let crisisCorrelation = 0.3;
  if (scenario === StressScenario.GFC_2008) crisisCorrelation = 0.8;
  if (scenario === StressScenario.INFLATION_SHOCK) crisisCorrelation = 0.6;
  if (scenario === StressScenario.TECH_BUBBLE) crisisCorrelation = 0.4;

  const stressAssets = assets.map(a => {
    let mod = { ...a };
    if (scenario === StressScenario.GFC_2008) {
      mod.volatility *= 1.5;
      mod.jumpIntensity *= 3;
      mod.expectedReturn -= 0.05;
    } else if (scenario === StressScenario.INFLATION_SHOCK) {
      if (mod.category.includes('Fixed')) {
        mod.expectedReturn -= 0.06;
        mod.volatility *= 2;
      }
      mod.expectedReturn -= 0.03; 
    } else if (scenario === StressScenario.TECH_BUBBLE) {
       if (mod.category.includes('Equity') || mod.category.includes('Crypto')) {
           mod.volatility *= 2;
           mod.jumpMean = -0.5;
       }
    }
    return mod;
  });

  const stressParams = calculatePortfolioParams(stressAssets, crisisCorrelation);

  const isImmediatelyRetired = config.retirementDelayYears === 0;
  const initialAnnualIncome = calculateAnnualIncome(config.incomeSources, 0, config.startYear, isImmediatelyRetired);
  const initialMonthlyContribution = (initialAnnualIncome * (config.savingsRate / 100)) / 12;
  const initialMonthlyWithdrawal = (config.initialWealth * config.withdrawalRate) / 12;
  
  const validationStats = {
    effectiveReturn: baseParams.mu,
    effectiveVolatility: baseParams.sigma,
    assumedCorrelation: baseCorrelation,
    jumpFrequency: baseParams.lambda,
    startNetFlowMonthly: isImmediatelyRetired ? -initialMonthlyWithdrawal : initialMonthlyContribution
  };

  for (let i = 0; i < iterations; i++) {
    const runPath: number[] = [config.initialWealth];
    const runWithdrawals: number[] = [0];
    const runSavings: number[] = [0];
    
    let currentWealth = config.initialWealth;
    let fixedRealWithdrawalBaseline = 0; 

    for (let s = 1; s <= steps; s++) {
      const isCrisisActive = scenario !== StressScenario.NONE && s >= crisisStartMonth && s < crisisEndMonth;
      const currentParams = isCrisisActive ? stressParams : baseParams;

      const jumpCompensatorK = Math.exp(currentParams.jumpMean + 0.5 * Math.pow(currentParams.jumpSd, 2)) - 1;
      const driftCompensator = currentParams.lambda * jumpCompensatorK;
      const numberOfJumps = poissonRandom(currentParams.lambda * dt);
      let jumpImpact = 0;
      if (numberOfJumps > 0) {
        for(let j=0; j<numberOfJumps; j++) {
             jumpImpact += normalRandom() * currentParams.jumpSd + currentParams.jumpMean;
        }
      }
      const diffusion = currentParams.sigma * Math.sqrt(dt) * normalRandom();
      const drift = (currentParams.mu - driftCompensator - 0.5 * currentParams.variance) * dt;
      const stepReturn = drift + diffusion + jumpImpact;
      
      currentWealth = currentWealth * Math.exp(stepReturn);
      
      let stepWithdrawal = 0;
      let stepSavings = 0;

      if (currentWealth > 0) {
          const currentYearIndex = Math.floor((s - 1) / 12);
          const isRetired = s > retirementStartMonth;
          
          if (!isRetired) {
              const annualIncome = calculateAnnualIncome(config.incomeSources, currentYearIndex, config.startYear, false);
              stepSavings = (annualIncome * (config.savingsRate / 100)) / 12;
              currentWealth += stepSavings;
          } else {
              const retirementIncome = calculateAnnualIncome(config.incomeSources, currentYearIndex, config.startYear, true);
              currentWealth += (retirementIncome / 12);

              if (config.withdrawalStrategy === 'PERCENT_PORTFOLIO') {
                  // Variable: scales with CURRENT path wealth
                  stepWithdrawal = currentWealth * (config.withdrawalRate / 12);
              } else {
                  if (s === retirementStartMonth + 1 || (s === 1 && isImmediatelyRetired)) {
                      fixedRealWithdrawalBaseline = (s === 1 ? config.initialWealth : currentWealth) * config.withdrawalRate;
                  }
                  const yearsSinceRetirement = Math.floor((s - (retirementStartMonth + 1)) / 12);
                  const inflationAdjustment = Math.pow(1 + inflationRate, Math.max(0, yearsSinceRetirement));
                  stepWithdrawal = (fixedRealWithdrawalBaseline * inflationAdjustment) / 12;
              }
              currentWealth -= stepWithdrawal;
          }
      }
      
      if (currentWealth < 0) currentWealth = 0;
      runPath.push(currentWealth);
      runWithdrawals.push(stepWithdrawal);
      runSavings.push(stepSavings);
    }
    results.push(runPath);
    withdrawalResults.push(runWithdrawals);
    savingsResults.push(runSavings);
  }

  const summaryData: SimulationYearResult[] = [];
  for (let y = 0; y <= years; y++) {
    const monthIndex = y * 12;
    const yearValues = results.map(r => r[monthIndex]).sort((a, b) => a - b);
    
    // Aggregating cashflows for the year leading up to this point
    let yearlyMedianWithdrawal = 0;
    let yearlyMedianSavings = 0;
    
    if (y > 0) {
      const yearWithdrawals = [];
      const yearSavings = [];
      for (let i = 0; i < iterations; i++) {
        let sumW = 0;
        let sumS = 0;
        for (let m = 1; m <= 12; m++) {
          const idx = (y - 1) * 12 + m;
          sumW += withdrawalResults[i][idx] || 0;
          sumS += savingsResults[i][idx] || 0;
        }
        yearWithdrawals.push(sumW);
        yearSavings.push(sumS);
      }
      yearWithdrawals.sort((a, b) => a - b);
      yearSavings.sort((a, b) => a - b);
      yearlyMedianWithdrawal = yearWithdrawals[Math.floor(iterations * 0.5)];
      yearlyMedianSavings = yearSavings[Math.floor(iterations * 0.5)];
    }

const deflator = Math.pow(1 + inflationRate, y);
    const p10Idx = Math.floor(iterations * 0.10);
    const p25Idx = Math.floor(iterations * 0.25);
    const p50Idx = Math.floor(iterations * 0.50);
    const p75Idx = Math.floor(iterations * 0.75);
    const p90Idx = Math.floor(iterations * 0.90);

    summaryData.push({
      year: config.startYear + y,
      worstCase: yearValues[0],
      p10: yearValues[p10Idx],
      p25: yearValues[p25Idx],
      p50: yearValues[p50Idx],
      p75: yearValues[p75Idx],
      p90: yearValues[p90Idx],
      p10Real: yearValues[p10Idx] / deflator,
      p25Real: yearValues[p25Idx] / deflator,
      p50Real: yearValues[p50Idx] / deflator,
      p75Real: yearValues[p75Idx] / deflator,
      p90Real: yearValues[p90Idx] / deflator,
      medianWithdrawal: yearlyMedianWithdrawal,
      medianSavings: yearlyMedianSavings
    });
  }

  const goalResults: GoalResult[] = (config.goals || []).map(goal => {
    const yearDiff = goal.targetYear - config.startYear;
    if (yearDiff < 0) return { goalId: goal.id, probability: 0, expectedAmount: 0, shortfall: 0 };
    const stepIndex = Math.min(yearDiff * 12, steps);
    const deflator = Math.pow(1 + inflationRate, yearDiff);
    const wealthAtGoal = results.map(r => r[stepIndex]);
    const successCount = wealthAtGoal.filter(w => (w / deflator) >= goal.targetAmount).length;
    wealthAtGoal.sort((a, b) => a - b);
    return {
      goalId: goal.id,
      probability: (successCount / iterations) * 100,
      expectedAmount: wealthAtGoal[Math.floor(iterations * 0.5)] / deflator,
      shortfall: Math.max(0, goal.targetAmount - (wealthAtGoal[Math.floor(iterations * 0.1)] / deflator))
    };
  });

  const finalValues = results.map(r => r[steps]);
  const successCount = finalValues.filter(v => v > 0).length;
  const terminalDeflator = Math.pow(1 + inflationRate, years);
  const p10Index = Math.floor(iterations * 0.1);
  const indices = Array.from({ length: iterations }, (_, i) => i).sort((a, b) => results[a][steps] - results[b][steps]);
  const worstPath = results[indices[p10Index]];

  let maxDrawdown = 0;
  let peak = worstPath[0];
  for(let val of worstPath) {
      if (val > peak) peak = val;
      const dd = (peak - val) / peak;
      if (dd > maxDrawdown) maxDrawdown = dd;
  }
  
  let worstYearReturn = 0;
  for(let t=12; t < worstPath.length; t++) {
      const prev = worstPath[t-12];
      if (prev > 0) {
        const ret = (worstPath[t] - prev) / prev;
        if (ret < worstYearReturn) worstYearReturn = ret;
      }
  }

  const riskPath: RiskPathPoint[] = [];
  let currentPathPeak = worstPath[0];
  for (let y = 0; y <= years; y++) {
    const val = worstPath[y * 12];
    if (val > currentPathPeak) currentPathPeak = val;
    riskPath.push({ year: config.startYear + y, value: val, peak: currentPathPeak, drawdown: (currentPathPeak - val) / currentPathPeak });
  }

  const failingPaths = results.filter(path => path[steps] <= 0).slice(0, 50);

  return {
    data: summaryData,
    summary: {
      probabilityOfSuccess: (successCount / iterations) * 100,
      medianTerminalWealth: summaryData[years].p50,
      medianTerminalWealthReal: summaryData[years].p50 / terminalDeflator,
      worstDrawdown: maxDrawdown * 100,
      worstYearReturn: worstYearReturn,
      safeWithdrawalRate: config.withdrawalRate * 100
    },
    riskPath,
    failingPaths,
    goals: goalResults,
    validation: validationStats
  };
}

