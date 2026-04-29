// utils/nyCalculations2026.ts

const CAPS = {
  MAINTENANCE: 241000,
  CHILD_SUPPORT: 193000,
  SELF_SUPPORT_RESERVE: 21546 // 2026 Update
};

export interface MaintenanceCalculation {
  annual: number;
  monthly: number;
  formatted: string;
  isLowIncomeAdjustment: boolean;
}

export const calculateMaintenance = (payorIncome: number, payeeIncome: number): MaintenanceCalculation => {
  const cappedPayorIncome = Math.min(payorIncome, CAPS.MAINTENANCE);
  
  // Formula A: 20% of payor up to cap - 25% of payee
  const resultA = (cappedPayorIncome * 0.20) - (payeeIncome * 0.25);
  
  // Formula B: 40% of combined income - payee income
  const resultB = ((cappedPayorIncome + payeeIncome) * 0.40) - payeeIncome;

  let annualGuideline = Math.max(0, Math.min(resultA, resultB));

  // Self-Support Reserve Check: Ensure payor isn't pushed below poverty line
  const isLowIncomeAdjustment = (payorIncome - annualGuideline) < CAPS.SELF_SUPPORT_RESERVE;
  if (isLowIncomeAdjustment) {
    annualGuideline = Math.max(0, payorIncome - CAPS.SELF_SUPPORT_RESERVE);
  }

  return {
    annual: annualGuideline,
    monthly: annualGuideline / 12,
    formatted: annualGuideline.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    isLowIncomeAdjustment
  };
};