import { TaxData, CalculatedResults } from '../../../shared/schema';

// 2024 Tax Brackets
const TAX_BRACKETS_2024 = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 }
  ],
  married_joint: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 }
  ],
  married_separate: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 }
  ],
  head_of_household: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 }
  ],
  qualifying_widow: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 }
  ]
};

// 2024 Standard Deduction amounts
const STANDARD_DEDUCTION_2024 = {
  single: 14600,
  married_joint: 29200,
  married_separate: 14600,
  head_of_household: 21900,
  qualifying_widow: 29200
};

function calculateFederalTax(taxableIncome: number, filingStatus: string): number {
  const brackets = TAX_BRACKETS_2024[filingStatus as keyof typeof TAX_BRACKETS_2024] || TAX_BRACKETS_2024.single;
  let tax = 0;
  let previousMax = 0;

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    
    const taxableAtThisBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableAtThisBracket * bracket.rate;
    previousMax = bracket.max;
    
    if (taxableIncome <= bracket.max) break;
  }

  return Math.round(tax * 100) / 100; // Round to 2 decimal places
}

function calculateChildTaxCredit(taxData: TaxData): number {
  if (!taxData.personalInfo?.dependents || !taxData.income) return 0;
  
  const agi = taxData.income.adjustedGrossIncome || 0;
  const filingStatus = taxData.personalInfo.filingStatus || 'single';
  
  // Phase-out thresholds for 2024
  const phaseOutStart = filingStatus === 'married_joint' ? 400000 : 200000;
  
  // Count qualifying children (under 17)
  const qualifyingChildren = taxData.personalInfo.dependents.filter(dep => {
    if (!dep.dateOfBirth) return false;
    const birthDate = new Date(dep.dateOfBirth);
    const endOfYear = new Date('2024-12-31');
    const age = endOfYear.getFullYear() - birthDate.getFullYear();
    const monthDiff = endOfYear.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && endOfYear.getDate() < birthDate.getDate())) {
      return age - 1 < 17;
    }
    return age < 17;
  }).length;

  let credit = qualifyingChildren * 2000; // $2,000 per qualifying child
  
  // Apply phase-out
  if (agi > phaseOutStart) {
    const phaseOutAmount = Math.ceil((agi - phaseOutStart) / 1000) * 50;
    credit = Math.max(0, credit - phaseOutAmount);
  }
  
  return credit;
}

function calculateCreditForOtherDependents(taxData: TaxData): number {
  if (!taxData.personalInfo?.dependents || !taxData.income) return 0;
  
  const agi = taxData.income.adjustedGrossIncome || 0;
  const filingStatus = taxData.personalInfo.filingStatus || 'single';
  
  // Phase-out thresholds for 2024
  const phaseOutStart = filingStatus === 'married_joint' ? 400000 : 200000;
  
  // Count other dependents (17 and older)
  const otherDependents = taxData.personalInfo.dependents.filter(dep => {
    if (!dep.dateOfBirth) return false;
    const birthDate = new Date(dep.dateOfBirth);
    const endOfYear = new Date('2024-12-31');
    const age = endOfYear.getFullYear() - birthDate.getFullYear();
    const monthDiff = endOfYear.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && endOfYear.getDate() < birthDate.getDate())) {
      return age - 1 >= 17;
    }
    return age >= 17;
  }).length;

  let credit = otherDependents * 500; // $500 per other dependent
  
  // Apply phase-out
  if (agi > phaseOutStart) {
    const phaseOutAmount = Math.ceil((agi - phaseOutStart) / 1000) * 50;
    credit = Math.max(0, credit - phaseOutAmount);
  }
  
  return credit;
}

function calculateEarnedIncomeCredit(taxData: TaxData): number {
  if (!taxData.income || !taxData.personalInfo) return 0;
  
  const agi = taxData.income.adjustedGrossIncome || 0;
  const earnedIncome = (taxData.income.wages || 0) + (taxData.income.otherEarnedIncome || 0);
  const filingStatus = taxData.personalInfo.filingStatus || 'single';
  
  // Investment income limit for 2024
  const investmentIncome = (taxData.income.interestIncome || 0) + 
                          (taxData.income.dividends || 0) + 
                          (taxData.income.capitalGains || 0);
  
  if (investmentIncome > 11600) return 0; // No EIC if investment income > $11,600
  
  // Count qualifying children (under 19, or under 24 if student, or any age if disabled)
  const qualifyingChildren = taxData.personalInfo.dependents?.filter(dep => {
    if (!dep.dateOfBirth) return false;
    const birthDate = new Date(dep.dateOfBirth);
    const endOfYear = new Date('2024-12-31');
    const age = endOfYear.getFullYear() - birthDate.getFullYear();
    const monthDiff = endOfYear.getMonth() - birthDate.getMonth();
    
    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && endOfYear.getDate() < birthDate.getDate())) {
      actualAge = age - 1;
    }
    
    return actualAge < 17; // Simplified - using under 17 for qualifying child
  }).length || 0;

  // 2024 EIC limits and calculations
  const eicData = {
    0: { maxEarned: filingStatus.includes('married') ? 22610 : 16510, maxCredit: 632, phaseInRate: 0.0765, phaseOutRate: 0.0765 },
    1: { maxEarned: filingStatus.includes('married') ? 46560 : 40320, maxCredit: 4213, phaseInRate: 0.34, phaseOutRate: 0.1598 },
    2: { maxEarned: filingStatus.includes('married') ? 51567 : 45320, maxCredit: 6935, phaseInRate: 0.40, phaseOutRate: 0.2106 },
    3: { maxEarned: filingStatus.includes('married') ? 55529 : 49320, maxCredit: 7830, phaseInRate: 0.45, phaseOutRate: 0.2106 }
  };
  
  const childrenCount = Math.min(qualifyingChildren, 3);
  const eic = eicData[childrenCount as keyof typeof eicData];
  
  if (agi > eic.maxEarned) return 0;
  
  // Calculate EIC based on earned income and AGI (use lower of the two)
  const incomeForEic = Math.min(earnedIncome, agi);
  
  // Simplified EIC calculation - in real implementation, would use IRS tables
  const phaseInLimit = childrenCount === 0 ? 8260 : (childrenCount === 1 ? 12350 : 17640);
  
  let credit = 0;
  if (incomeForEic <= phaseInLimit) {
    credit = incomeForEic * eic.phaseInRate;
  } else {
    credit = eic.maxCredit - ((incomeForEic - phaseInLimit) * eic.phaseOutRate);
  }
  
  return Math.max(0, Math.round(credit));
}

export function calculateTaxes(taxData: TaxData): CalculatedResults {
  console.log('세금 계산 시작:', taxData);
  
  // Income calculations
  const totalIncome = taxData.income?.totalIncome || 0;
  
  // Adjustments calculations
  const adjustments = {
    studentLoanInterest: taxData.income?.adjustments?.studentLoanInterest || 0,
    retirementContributions: taxData.income?.adjustments?.retirementContributions || 0,
    otherAdjustments: taxData.income?.adjustments?.otherAdjustments || 0
  };
  
  const totalAdjustments = Object.values(adjustments).reduce((sum, adj) => sum + adj, 0);
  const adjustedGrossIncome = Math.max(0, totalIncome - totalAdjustments);
  
  // Deductions
  const filingStatus = taxData.personalInfo?.filingStatus || 'single';
  const standardDeduction = STANDARD_DEDUCTION_2024[filingStatus as keyof typeof STANDARD_DEDUCTION_2024] || STANDARD_DEDUCTION_2024.single;
  
  let totalDeductions = standardDeduction;
  if (taxData.deductions?.useStandardDeduction === false && taxData.deductions?.totalDeductions) {
    totalDeductions = taxData.deductions.totalDeductions;
  }
  
  // QBI Deduction
  const qbiDeduction = taxData.income?.qbi?.qbiDeduction || 0;
  
  // Taxable Income
  const taxableIncome = Math.max(0, adjustedGrossIncome - totalDeductions - qbiDeduction);
  
  // Federal Tax
  const federalTax = calculateFederalTax(taxableIncome, filingStatus);
  
  // Credits
  const childTaxCredit = calculateChildTaxCredit(taxData);
  const creditForOtherDependents = calculateCreditForOtherDependents(taxData);
  const earnedIncomeCredit = calculateEarnedIncomeCredit(taxData);
  const retirementSavingsCredit = taxData.taxCredits?.retirementSavingsCredit || 0;
  const childDependentCareCredit = taxData.taxCredits?.childDependentCareCredit || 0;
  
  const totalCredits = childTaxCredit + creditForOtherDependents + earnedIncomeCredit + 
                      retirementSavingsCredit + childDependentCareCredit;
  
  // Additional Child Tax Credit (refundable portion)
  const earnedIncome = (taxData.income?.wages || 0) + (taxData.income?.otherEarnedIncome || 0);
  const additionalChildTaxCredit = Math.min(
    childTaxCredit,
    Math.max(0, (earnedIncome - 2500) * 0.15)
  );
  
  // Additional Taxes
  const additionalTaxAmount = taxData.additionalTax?.selfEmploymentTax || 0;
  
  // Tax Due calculation
  const taxDue = Math.max(0, federalTax + additionalTaxAmount - totalCredits);
  
  // Payments (withholding, estimated payments)
  const payments = taxData.additionalTax?.estimatedTaxPayments || 0;
  
  // Refund or Amount Owed
  const netTax = taxDue - payments;
  const refundAmount = Math.max(0, -netTax + additionalChildTaxCredit);
  const amountOwed = Math.max(0, netTax);
  
  const results: CalculatedResults = {
    totalIncome: Math.round(totalIncome * 100) / 100,
    adjustments: Math.round(totalAdjustments * 100) / 100,
    adjustedGrossIncome: Math.round(adjustedGrossIncome * 100) / 100,
    deductions: Math.round(totalDeductions * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    federalTax: Math.round(federalTax * 100) / 100,
    credits: Math.round(totalCredits * 100) / 100,
    taxDue: Math.round(taxDue * 100) / 100,
    payments: Math.round(payments * 100) / 100,
    refundAmount: Math.round(refundAmount * 100) / 100,
    amountOwed: Math.round(amountOwed * 100) / 100,
    childTaxCredit: Math.round(childTaxCredit * 100) / 100,
    childDependentCareCredit: Math.round(childDependentCareCredit * 100) / 100,
    retirementSavingsCredit: Math.round(retirementSavingsCredit * 100) / 100,
    creditForOtherDependents: Math.round(creditForOtherDependents * 100) / 100,
    earnedIncomeCredit: Math.round(earnedIncomeCredit * 100) / 100,
    additionalChildTaxCredit: Math.round(additionalChildTaxCredit * 100) / 100
  };
  
  console.log('세금 계산 결과:', results);
  return results;
}