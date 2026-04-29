// utils/childSupport2026.ts

const CSSA_PERCENTAGES: Record<number, number> = {
  1: 0.17, // 17%
  2: 0.25, // 25%
  3: 0.29, // 29%
  4: 0.31, // 31%
  5: 0.35, // 35% (minimum)
};

const INCOME_CAP_2026 = 193000;
const FICA_RATE = 0.0765;

export interface ChildSupportCalculation {
  annual: number;
  monthly: number;
  shareRatio: string;
  isAboveCap: boolean;
}

export const calculateNYChildSupport = (
  custodialIncome: number,
  nonCustodialIncome: number,
  numChildren: number
): ChildSupportCalculation => {
  // 1. Calculate Adjusted Gross Income (Income - FICA)
  const adjCustodial = custodialIncome * (1 - FICA_RATE);
  const adjNonCustodial = nonCustodialIncome * (1 - FICA_RATE);
  const combinedIncome = adjCustodial + adjNonCustodial;

  // 2. Determine the Pro-Rata Share (Percentage of total income)
  const nonCustodialShareRatio = adjNonCustodial / combinedIncome;

  // 3. Apply the 2026 Cap to the Combined Income
  const cappedCombinedIncome = Math.min(combinedIncome, INCOME_CAP_2026);

  // 4. Calculate the Total Child Support Obligation
  const childPercentage = CSSA_PERCENTAGES[numChildren] || 0.35;
  const totalObligation = cappedCombinedIncome * childPercentage;

  // 5. Determine the Non-Custodial Parent's Annual Payment
  const annualPayment = totalObligation * nonCustodialShareRatio;

  return {
    annual: annualPayment,
    monthly: annualPayment / 12,
    shareRatio: (nonCustodialShareRatio * 100).toFixed(1),
    isAboveCap: combinedIncome > INCOME_CAP_2026
  };
};