import { 
  PersonalInformation, 
  Income,
  Deductions, 
  TaxCredits, 
  AdditionalTax, 
  CalculatedResults,
  FilingStatus,
  Dependent
} from '@shared/schema';
import { calculateStateTax } from '@shared/stateTaxCalculator';
import type { StateTaxCalculationInput } from '@shared/stateTaxCalculator';
import { formatInputNumber } from '@/utils/formatNumber';

interface TaxData {
  personalInfo?: PersonalInformation;
  income?: Income;
  deductions?: Deductions;
  taxCredits?: TaxCredits;
  additionalTax?: AdditionalTax;
  calculatedResults?: CalculatedResults;
}

// 2023 tax brackets (approximate for example)
const TAX_BRACKETS_2023 = {
  single: [
    { rate: 0.10, upTo: 11000 },
    { rate: 0.12, upTo: 44725 },
    { rate: 0.22, upTo: 95375 },
    { rate: 0.24, upTo: 182100 },
    { rate: 0.32, upTo: 231250 },
    { rate: 0.35, upTo: 578125 },
    { rate: 0.37, upTo: Infinity }
  ],
  married_joint: [
    { rate: 0.10, upTo: 22000 },
    { rate: 0.12, upTo: 89450 },
    { rate: 0.22, upTo: 190750 },
    { rate: 0.24, upTo: 364200 },
    { rate: 0.32, upTo: 462500 },
    { rate: 0.35, upTo: 693750 },
    { rate: 0.37, upTo: Infinity }
  ],
  married_separate: [
    { rate: 0.10, upTo: 11000 },
    { rate: 0.12, upTo: 44725 },
    { rate: 0.22, upTo: 95375 },
    { rate: 0.24, upTo: 182100 },
    { rate: 0.32, upTo: 231250 },
    { rate: 0.35, upTo: 346875 },
    { rate: 0.37, upTo: Infinity }
  ],
  head_of_household: [
    { rate: 0.10, upTo: 15700 },
    { rate: 0.12, upTo: 59850 },
    { rate: 0.22, upTo: 95350 },
    { rate: 0.24, upTo: 182100 },
    { rate: 0.32, upTo: 231250 },
    { rate: 0.35, upTo: 578100 },
    { rate: 0.37, upTo: Infinity }
  ],
  qualifying_widow: [
    { rate: 0.10, upTo: 22000 },
    { rate: 0.12, upTo: 89450 },
    { rate: 0.22, upTo: 190750 },
    { rate: 0.24, upTo: 364200 },
    { rate: 0.32, upTo: 462500 },
    { rate: 0.35, upTo: 693750 },
    { rate: 0.37, upTo: Infinity }
  ]
};

// 2023 standard deduction amounts
const STANDARD_DEDUCTION_2023 = {
  single: 13850,
  married_joint: 27700,
  married_separate: 13850,
  head_of_household: 20800,
  qualifying_widow: 27700
};

// 2024/2025 Capital Gains Tax Rates (장기 자본 이득 - 1년 초과 보유)
const CAPITAL_GAINS_RATES_2024 = {
  single: [
    { rate: 0.00, upTo: 47025 },    // 0% for income up to $47,025
    { rate: 0.15, upTo: 518900 },   // 15% for income $47,026 to $518,900
    { rate: 0.20, upTo: Infinity }  // 20% for income over $518,900
  ],
  married_joint: [
    { rate: 0.00, upTo: 94050 },    // 0% for income up to $94,050
    { rate: 0.15, upTo: 583750 },   // 15% for income $94,051 to $583,750
    { rate: 0.20, upTo: Infinity }  // 20% for income over $583,750
  ],
  married_separate: [
    { rate: 0.00, upTo: 47025 },    // 0% for income up to $47,025
    { rate: 0.15, upTo: 291875 },   // 15% for income $47,026 to $291,875
    { rate: 0.20, upTo: Infinity }  // 20% for income over $291,875
  ],
  head_of_household: [
    { rate: 0.00, upTo: 63000 },    // 0% for income up to $63,000
    { rate: 0.15, upTo: 551350 },   // 15% for income $63,001 to $551,350
    { rate: 0.20, upTo: Infinity }  // 20% for income over $551,350
  ],
  qualifying_widow: [
    { rate: 0.00, upTo: 94050 },    // 0% for income up to $94,050
    { rate: 0.15, upTo: 583750 },   // 15% for income $94,051 to $583,750
    { rate: 0.20, upTo: Infinity }  // 20% for income over $583,750
  ]
};

// Calculate standard deduction based on filing status
export function calculateStandardDeduction(filingStatus: FilingStatus): number {
  return STANDARD_DEDUCTION_2023[filingStatus] || STANDARD_DEDUCTION_2023.single;
}

// Calculate long-term capital gains tax based on total taxable income
export function calculateCapitalGainsTax(
  capitalGains: number,
  totalTaxableIncome: number,
  filingStatus: FilingStatus
): { taxOwed: number, effectiveRate: number } {
  if (capitalGains <= 0) {
    return { taxOwed: 0, effectiveRate: 0 };
  }

  const brackets = CAPITAL_GAINS_RATES_2024[filingStatus] || CAPITAL_GAINS_RATES_2024.single;
  let taxOwed = 0;
  let remainingGains = capitalGains;
  
  // 자본 이득세는 총 과세 소득(일반 소득 + 자본 이득)을 기준으로 구간을 결정
  let currentIncomeLevel = totalTaxableIncome - capitalGains; // 일반 소득 부분
  
  for (const bracket of brackets) {
    if (remainingGains <= 0) break;
    
    // 현재 구간에서 적용 가능한 소득 범위
    const bracketStart = Math.max(0, currentIncomeLevel);
    const bracketEnd = bracket.upTo;
    const availableInBracket = Math.max(0, bracketEnd - bracketStart);
    
    if (availableInBracket > 0) {
      // 이 구간에서 과세될 자본 이득 금액
      const gainsInBracket = Math.min(remainingGains, availableInBracket);
      
      // 세금 계산
      taxOwed += gainsInBracket * bracket.rate;
      remainingGains -= gainsInBracket;
      currentIncomeLevel += gainsInBracket;
    } else {
      currentIncomeLevel = bracketEnd;
    }
  }
  
  const effectiveRate = capitalGains > 0 ? (taxOwed / capitalGains) : 0;
  
  return { taxOwed, effectiveRate };
}

// Child Tax Credit constants (2024 tax year)
const CHILD_TAX_CREDIT = {
  BASE_CREDIT_PER_CHILD: 2000,
  REFUNDABLE_LIMIT_PER_CHILD: 1600, // Updated for 2024: $1,600 per child
  MINIMUM_EARNED_INCOME: 2500,
  PHASE_OUT_THRESHOLD: {
    single: 200000,
    married_joint: 400000,
    married_separate: 200000,
    head_of_household: 200000,
    qualifying_widow: 400000
  },
  PHASE_OUT_RATE: 50, // $50 reduction per $1000 above threshold
  PHASE_OUT_INCREMENT: 1000
};

// Credit for Other Dependents constants
const CREDIT_FOR_OTHER_DEPENDENTS = {
  BASE_CREDIT_PER_DEPENDENT: 500,
  // Using same phase-out thresholds as the Child Tax Credit
  PHASE_OUT_THRESHOLD: {
    single: 200000,
    married_joint: 400000,
    married_separate: 200000,
    head_of_household: 200000,
    qualifying_widow: 400000
  },
  PHASE_OUT_RATE: 50, // $50 reduction per $1000 above threshold
  PHASE_OUT_INCREMENT: 1000
};

// Retirement Savings Credit constants (2023 tax year)
const RETIREMENT_SAVINGS_CREDIT = {
  // Income thresholds by filing status
  INCOME_THRESHOLDS: {
    single: [21750, 23750, 36500], // 50%, 20%, 10% thresholds
    head_of_household: [32625, 35625, 54750],
    married_joint: [43500, 47500, 73000],
    married_separate: [21750, 23750, 36500],
    qualifying_widow: [43500, 47500, 73000]
  },
  // Credit rates based on income (50%, 20%, 10%, 0%)
  CREDIT_RATES: [0.5, 0.2, 0.1, 0], 
  // Maximum eligible contribution
  MAX_CONTRIBUTION_PER_PERSON: 2000
};

// Child and Dependent Care Credit constants (2023 tax year)
const CHILD_DEPENDENT_CARE_CREDIT = {
  // Maximum eligible expenses
  MAX_EXPENSES: {
    ONE_DEPENDENT: 3000,
    MULTIPLE_DEPENDENTS: 6000
  },
  // Credit rate starts at 35% for AGI <= $15,000
  BASE_CREDIT_RATE: 0.35,
  // Credit rate decreases by 1% for each $2,000 AGI increment above $15,000
  AGI_BASE_THRESHOLD: 15000,
  AGI_PHASE_OUT_INCREMENT: 2000,
  RATE_DECREMENT: 0.01,
  // Minimum credit rate is 20%
  MIN_CREDIT_RATE: 0.20
};

// Check if a dependent is eligible for the Child Tax Credit
function isEligibleForChildTaxCredit(dependent: Dependent): boolean {
  // Must be under 17 at the end of the tax year (2024년 기준)
  const birthDate = new Date(dependent.dateOfBirth);
  const taxYearEnd = new Date('2024-12-31'); // 2024년 기준
  
  // 더 정확한 나이 계산
  let age = taxYearEnd.getFullYear() - birthDate.getFullYear();
  const monthDiff = taxYearEnd.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && taxYearEnd.getDate() < birthDate.getDate())) {
    age--;
  }
  
  console.log(`Child Tax Credit 자격 확인 - ${dependent.firstName}: 생년월일 ${dependent.dateOfBirth}, 2024년 말 나이: ${age}세`);
  
  // Basic age check - 17세 미만
  if (age >= 17) {
    console.log(`${dependent.firstName}: 17세 이상이므로 Child Tax Credit 부적격`);
    return false;
  }
  
  console.log(`${dependent.firstName}: ${age}세로 Child Tax Credit 적격`);
  return true;
}

// Check if a dependent is eligible for the Credit for Other Dependents
function isEligibleForCreditForOtherDependents(dependent: Dependent): boolean {
  // Must NOT be eligible for Child Tax Credit (17세 이상 또는 다른 사유로 부적격)
  if (isEligibleForChildTaxCredit(dependent)) {
    console.log(`${dependent.firstName}: Child Tax Credit 대상이므로 Credit for Other Dependents 부적격`);
    return false;
  }
  
  // 나이 확인 (2024년 기준)
  const birthDate = new Date(dependent.dateOfBirth);
  const taxYearEnd = new Date('2024-12-31');
  
  let age = taxYearEnd.getFullYear() - birthDate.getFullYear();
  const monthDiff = taxYearEnd.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && taxYearEnd.getDate() < birthDate.getDate())) {
    age--;
  }
  
  console.log(`Credit for Other Dependents 자격 확인 - ${dependent.firstName}: 생년월일 ${dependent.dateOfBirth}, 2024년 말 나이: ${age}세`);
  
  // 17세 이상의 부양가족이면 기타 부양가족 공제 대상
  if (age >= 17) {
    console.log(`${dependent.firstName}: ${age}세로 Credit for Other Dependents 적격`);
    return true;
  }
  
  console.log(`${dependent.firstName}: ${age}세로 Credit for Other Dependents 부적격`);
  return false;
}

// Calculate the Credit for Other Dependents based on dependents and income
export function calculateCreditForOtherDependents(
  dependents: Dependent[] = [], 
  adjustedGrossIncome: number, 
  filingStatus: FilingStatus
): number {
  // If no dependents, return 0 credit
  if (!dependents || dependents.length === 0) return 0;
  
  // Count eligible dependents
  const eligibleDependents = dependents.filter(isEligibleForCreditForOtherDependents);
  if (eligibleDependents.length === 0) return 0;
  
  // Calculate initial credit
  let creditAmount = eligibleDependents.length * CREDIT_FOR_OTHER_DEPENDENTS.BASE_CREDIT_PER_DEPENDENT;
  
  // Apply income phase-out
  const threshold = CREDIT_FOR_OTHER_DEPENDENTS.PHASE_OUT_THRESHOLD[filingStatus];
  if (adjustedGrossIncome > threshold) {
    // Calculate excess income
    const excessIncome = adjustedGrossIncome - threshold;
    
    // Calculate number of phase-out increments (round up)
    const phaseOutIncrements = Math.ceil(excessIncome / CREDIT_FOR_OTHER_DEPENDENTS.PHASE_OUT_INCREMENT);
    
    // Calculate phase-out amount
    const phaseOutAmount = phaseOutIncrements * CREDIT_FOR_OTHER_DEPENDENTS.PHASE_OUT_RATE;
    
    // Apply phase-out
    creditAmount = Math.max(0, creditAmount - phaseOutAmount);
  }
  
  // Round to nearest cent
  return Math.round(creditAmount * 100) / 100;
}

// Calculate the Child Tax Credit based on dependents and income
export function calculateChildTaxCredit(
  dependents: Dependent[] = [], 
  adjustedGrossIncome: number, 
  filingStatus: FilingStatus
): number {
  // If no dependents, return 0 credit
  if (!dependents || dependents.length === 0) return 0;
  
  // Count eligible children
  const eligibleChildren = dependents.filter(isEligibleForChildTaxCredit);
  if (eligibleChildren.length === 0) return 0;
  
  console.log(`=== Child Tax Credit 계산 상세 분석 ===`);
  console.log(`적격 자녀 수: ${eligibleChildren.length}명`);
  console.log(`조정총소득(AGI): $${adjustedGrossIncome}`);
  console.log(`신고유형: ${filingStatus}`);
  
  // Calculate initial credit
  let creditAmount = eligibleChildren.length * CHILD_TAX_CREDIT.BASE_CREDIT_PER_CHILD;
  console.log(`초기 크레딧: ${eligibleChildren.length} × $2,000 = $${creditAmount}`);
  
  // Apply income phase-out
  const threshold = CHILD_TAX_CREDIT.PHASE_OUT_THRESHOLD[filingStatus];
  console.log(`Phase-out 시작 소득: $${threshold}`);
  
  if (adjustedGrossIncome > threshold) {
    // Calculate excess income
    const excessIncome = adjustedGrossIncome - threshold;
    console.log(`초과 소득: $${adjustedGrossIncome} - $${threshold} = $${excessIncome}`);
    
    // Calculate number of phase-out increments (round up)
    const phaseOutIncrements = Math.ceil(excessIncome / CHILD_TAX_CREDIT.PHASE_OUT_INCREMENT);
    console.log(`Phase-out 단위 수: ${phaseOutIncrements} (각 $1,000당)`);
    
    // Calculate phase-out amount
    const phaseOutAmount = phaseOutIncrements * CHILD_TAX_CREDIT.PHASE_OUT_RATE;
    console.log(`Phase-out 감소액: ${phaseOutIncrements} × $50 = $${phaseOutAmount}`);
    
    // Apply phase-out
    creditAmount = Math.max(0, creditAmount - phaseOutAmount);
    console.log(`Phase-out 적용 후: $${creditAmount + phaseOutAmount} - $${phaseOutAmount} = $${creditAmount}`);
  } else {
    console.log(`소득이 phase-out 한도 이하이므로 감소 없음`);
  }
  
  console.log(`최종 Child Tax Credit: $${creditAmount}`);
  console.log(`=================================`);
  
  // Round to nearest cent
  return Math.round(creditAmount * 100) / 100;
}

// Calculate Additional Child Tax Credit (ACTC) - 환급 가능한 부분
export function calculateAdditionalChildTaxCredit(
  dependents: Dependent[] = [],
  earnedIncome: number,
  taxLiability: number,
  childTaxCredit: number
): number {
  // If no eligible children or no Child Tax Credit, return 0
  const eligibleChildren = dependents.filter(isEligibleForChildTaxCredit);
  if (eligibleChildren.length === 0 || childTaxCredit <= 0) return 0;
  
  // ACTC는 세금 부채로 상쇄되지 않은 Child Tax Credit 부분만 환급 가능
  const nonRefundableUsed = Math.min(childTaxCredit, taxLiability);
  const remainingCredit = childTaxCredit - nonRefundableUsed;
  
  console.log(`=== ACTC 계산 상세 분석 ===`);
  console.log(`전체 Child Tax Credit: $${childTaxCredit}`);
  console.log(`세금 부채(Tax Liability): $${taxLiability}`);
  console.log(`비환급성으로 사용된 금액: $${nonRefundableUsed}`);
  console.log(`남은 크레딧(환급 후보): $${remainingCredit}`);
  console.log(`근로소득: $${earnedIncome}`);
  
  if (remainingCredit <= 0) {
    console.log(`남은 크레딧이 0 이하이므로 ACTC = $0`);
    return 0;
  }
  
  // ACTC 계산: (근로소득 - $2,500) × 15%
  if (earnedIncome <= 2500) {
    console.log(`근로소득이 $2,500 이하이므로 ACTC = $0`);
    return 0;
  }
  
  const actcCalculation = (earnedIncome - 2500) * 0.15;
  
  // 자녀 1명당 최대 $1,600까지 환급 가능
  const maxRefundable = eligibleChildren.length * 1600;
  
  console.log(`ACTC 공식 계산: (${earnedIncome} - 2,500) × 15% = $${actcCalculation}`);
  console.log(`최대 환급 한도: ${eligibleChildren.length}명 × $1,600 = $${maxRefundable}`);
  
  // 환급 가능한 금액은 세 값 중 최소값
  const refundableAmount = Math.min(remainingCredit, actcCalculation, maxRefundable);
  
  console.log(`최종 ACTC = min($${remainingCredit}, $${actcCalculation}, $${maxRefundable}) = $${refundableAmount}`);
  console.log(`🔍 세무사 계산 $1,051과 비교: 차이 $${Math.abs(1051 - refundableAmount)}`);
  console.log(`📝 세무사가 사용한 다른 공식이나 특수 상황이 있을 수 있습니다`);
  console.log(`========================`);
  
  return Math.round(refundableAmount * 100) / 100;
}

// QBI Deduction Calculation (Section 199A)
export function calculateQBIDeduction(
  qbiIncome: number,
  adjustedGrossIncome: number,
  taxableIncome: number,
  filingStatus: FilingStatus,
  w2Wages: number = 0,
  qualifiedProperty: number = 0,
  isSST: boolean = false
): number {
  if (qbiIncome <= 0) return 0;

  // 2024년 QBI 소득 한도
  const thresholds = {
    single: 191950,
    married_joint: 383900,
    married_separate: 191950,
    head_of_household: 191950,
    qualifying_widow: 383900
  };

  // SSTB 완전 배제 한도 (2024년)
  const sstbExclusionThresholds = {
    single: 241950,
    married_joint: 483900,
    married_separate: 241950,
    head_of_household: 241950,
    qualifying_widow: 483900
  };

  const threshold = thresholds[filingStatus] || 191950;
  const exclusionThreshold = sstbExclusionThresholds[filingStatus] || 241950;

  // SSTB (전문서비스업) 제한 확인
  if (isSST) {
    if (adjustedGrossIncome >= exclusionThreshold) {
      // SSTB 완전 배제 구간: QBI 공제 완전히 불가
      console.log('SSTB 사업으로 완전 배제 구간 - QBI 공제 불가');
      return 0;
    } else if (adjustedGrossIncome > threshold) {
      // SSTB 축소 구간: 단계적 축소 적용
      const phaseOutRange = exclusionThreshold - threshold;
      const excessIncome = adjustedGrossIncome - threshold;
      const phaseOutRatio = excessIncome / phaseOutRange;
      
      console.log(`SSTB 사업 단계적 축소 적용: ${(phaseOutRatio * 100).toFixed(1)}% 축소`);
      
      // 기본 계산 후 단계적 축소 적용
      const basicDeduction = qbiIncome * 0.20;
      const taxableIncomeLimit = taxableIncome * 0.20;
      const baseQBIDeduction = Math.min(basicDeduction, taxableIncomeLimit);
      
      return Math.round(baseQBIDeduction * (1 - phaseOutRatio));
    }
  }

  // 기본 20% 공제
  const basicDeduction = qbiIncome * 0.20;
  
  // 과세소득의 20% 한도
  const taxableIncomeLimit = taxableIncome * 0.20;
  
  let qbiDeduction = 0;
  
  if (adjustedGrossIncome <= threshold) {
    // 소득 한도 이하: 20% 또는 과세소득의 20% 중 작은 값
    qbiDeduction = Math.min(basicDeduction, taxableIncomeLimit);
  } else {
    // 소득 한도 초과: W-2 임금/자산 기준 제한 적용
    // W-2 임금 제한: W-2 임금의 50% 또는 W-2 임금의 25% + 적격자산의 2.5% 중 큰 값
    const wageLimit = Math.max(
      w2Wages * 0.50,
      w2Wages * 0.25 + qualifiedProperty * 0.025
    );
    
    const limitedDeduction = Math.min(basicDeduction, wageLimit);
    qbiDeduction = Math.min(limitedDeduction, taxableIncomeLimit);
  }

  return Math.max(0, Math.round(qbiDeduction));
}

// Calculate the Retirement Savings Credit based on contributions and income
export function calculateRetirementSavingsCredit(
  retirementContributions: number,
  adjustedGrossIncome: number,
  filingStatus: FilingStatus,
  isMarried: boolean = filingStatus === 'married_joint' || filingStatus === 'qualifying_widow'
): number {
  // If no retirement contributions, return 0 credit
  if (!retirementContributions || retirementContributions <= 0) return 0;
  
  // Cap contributions at the maximum eligible amount
  // For married filing jointly, consider contributions from both spouses (up to $2,000 each)
  const maxEligibleContribution = isMarried 
    ? RETIREMENT_SAVINGS_CREDIT.MAX_CONTRIBUTION_PER_PERSON * 2
    : RETIREMENT_SAVINGS_CREDIT.MAX_CONTRIBUTION_PER_PERSON;
    
  const eligibleContribution = Math.min(retirementContributions, maxEligibleContribution);
  
  // Get income thresholds for the filing status
  const thresholds = RETIREMENT_SAVINGS_CREDIT.INCOME_THRESHOLDS[filingStatus];
  
  // Determine credit rate based on income
  let creditRate = RETIREMENT_SAVINGS_CREDIT.CREDIT_RATES[3]; // Default to 0%
  
  if (adjustedGrossIncome <= thresholds[0]) {
    // 50% credit rate
    creditRate = RETIREMENT_SAVINGS_CREDIT.CREDIT_RATES[0];
  } else if (adjustedGrossIncome <= thresholds[1]) {
    // 20% credit rate
    creditRate = RETIREMENT_SAVINGS_CREDIT.CREDIT_RATES[1];
  } else if (adjustedGrossIncome <= thresholds[2]) {
    // 10% credit rate
    creditRate = RETIREMENT_SAVINGS_CREDIT.CREDIT_RATES[2];
  }
  
  // Calculate credit amount
  const creditAmount = eligibleContribution * creditRate;
  
  // Round to nearest cent
  return Math.round(creditAmount * 100) / 100;
}

// Calculate the Child and Dependent Care Credit based on expenses and income
export function calculateChildDependentCareCredit(
  careExpenses: number,
  adjustedGrossIncome: number,
  numberOfQualifyingDependents: number
): number {
  // If no care expenses or no qualifying dependents, return 0 credit
  if (!careExpenses || careExpenses <= 0 || numberOfQualifyingDependents <= 0) return 0;
  
  // Determine maximum eligible expenses based on number of qualifying dependents
  const maxEligibleExpenses = numberOfQualifyingDependents > 1 
    ? CHILD_DEPENDENT_CARE_CREDIT.MAX_EXPENSES.MULTIPLE_DEPENDENTS 
    : CHILD_DEPENDENT_CARE_CREDIT.MAX_EXPENSES.ONE_DEPENDENT;
    
  // Cap expenses at the maximum eligible amount
  const eligibleExpenses = Math.min(careExpenses, maxEligibleExpenses);
  
  // Determine credit rate based on AGI
  // Start with base rate (35% for AGI <= $15,000)
  let creditRate = CHILD_DEPENDENT_CARE_CREDIT.BASE_CREDIT_RATE;
  
  // If AGI is above threshold, reduce credit rate by 1% for each $2,000 increment
  if (adjustedGrossIncome > CHILD_DEPENDENT_CARE_CREDIT.AGI_BASE_THRESHOLD) {
    // Calculate how many $2,000 increments above threshold
    const excessAGIIncrements = Math.floor(
      (adjustedGrossIncome - CHILD_DEPENDENT_CARE_CREDIT.AGI_BASE_THRESHOLD) / 
      CHILD_DEPENDENT_CARE_CREDIT.AGI_PHASE_OUT_INCREMENT
    );
    
    // Reduce credit rate by 1% for each increment (but not below minimum rate of 20%)
    creditRate = Math.max(
      CHILD_DEPENDENT_CARE_CREDIT.MIN_CREDIT_RATE,
      creditRate - (excessAGIIncrements * CHILD_DEPENDENT_CARE_CREDIT.RATE_DECREMENT)
    );
  }
  
  // Calculate credit amount
  const creditAmount = eligibleExpenses * creditRate;
  
  // Round to nearest cent
  return Math.round(creditAmount * 100) / 100;
}

// Calculate federal income tax based on taxable income and filing status
export function calculateFederalTax(taxableIncome: number, filingStatus: FilingStatus): number {
  // Default to single if filing status is not provided
  const brackets = TAX_BRACKETS_2023[filingStatus] || TAX_BRACKETS_2023.single;
  
  let tax = 0;
  let remainingIncome = taxableIncome;
  let previousBracketCap = 0;
  
  for (const bracket of brackets) {
    const incomeInThisBracket = Math.min(bracket.upTo - previousBracketCap, remainingIncome);
    
    if (incomeInThisBracket <= 0) break;
    
    tax += incomeInThisBracket * bracket.rate;
    remainingIncome -= incomeInThisBracket;
    previousBracketCap = bracket.upTo;
    
    if (remainingIncome <= 0) break;
  }
  
  return Math.round(tax * 100) / 100; // Round to nearest cent
}

// Main function to calculate taxes based on all data
export function calculateTaxes(taxData: TaxData): CalculatedResults {
  // Initialize result
  const result: CalculatedResults = {
    totalIncome: 0,
    adjustments: 0,
    adjustedGrossIncome: 0,
    deductions: 0,
    taxableIncome: 0,
    federalTax: 0,
    credits: 0,
    taxDue: 0,
    payments: 0,
    refundAmount: 0,
    amountOwed: 0
  };
  
  // Get filing status or default to single
  const filingStatus: FilingStatus = taxData.personalInfo?.filingStatus || 'single';
  
  // 추가 정보 미리 가져오기
  const additionalTax = taxData.additionalTax || {
    selfEmploymentIncome: 0,
    selfEmploymentTax: 0,
    estimatedTaxPayments: 0,
    otherIncome: 0,
    otherTaxes: 0
  };
  
  // 자영업 세금 정보
  const selfEmploymentTax = additionalTax.selfEmploymentTax;
  const halfSETax = Math.round((selfEmploymentTax / 2) * 100) / 100;
  
  // Calculate total income
  const income = taxData.income || {
    wages: 0,
    otherEarnedIncome: 0,
    interestIncome: 0,
    dividends: 0,
    businessIncome: 0,
    capitalGains: 0,
    rentalIncome: 0,
    retirementIncome: 0,
    unemploymentIncome: 0,
    otherIncome: 0,
    totalIncome: 0,
    adjustments: {
      studentLoanInterest: 0,
      retirementContributions: 0,
      healthSavingsAccount: 0,
      otherAdjustments: 0
    },
    adjustedGrossIncome: 0,
    additionalIncomeItems: [],
    additionalAdjustmentItems: []
  };
  
  // 이미 income.totalIncome이 설정되어 있다면 그 값을 사용
  if (income.totalIncome > 0) {
    result.totalIncome = income.totalIncome;
  } else {
    // 그렇지 않으면 개별 항목들을 합산
    const selfEmploymentIncome = additionalTax.selfEmploymentIncome;
    const additionalOtherIncome = additionalTax.otherIncome;
    
    // additionalIncomeItems 합계
    const additionalIncomeTotal = (income.additionalIncomeItems || [])
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Calculate total income from all sources
    result.totalIncome = (
      income.wages +
      income.otherEarnedIncome +
      income.interestIncome +
      income.dividends +
      income.businessIncome +
      income.capitalGains +
      income.rentalIncome + 
      income.retirementIncome +
      income.unemploymentIncome +
      income.otherIncome +
      selfEmploymentIncome +
      additionalOtherIncome +
      additionalIncomeTotal
    );
  }

  // 이미 income.adjustedGrossIncome이 설정되어 있고 income.totalIncome도 설정되어 있다면,
  // 역계산으로 조정액을 계산
  if (income.adjustedGrossIncome > 0 && income.totalIncome > 0) {
    result.adjustments = income.totalIncome - income.adjustedGrossIncome;
    // 역계산한 조정액으로 AGI 계산
    result.adjustedGrossIncome = income.adjustedGrossIncome;
  } else {
    // Get adjustments from income section if available
    const incomeAdjustments = income.adjustments || {
      studentLoanInterest: 0,
      retirementContributions: 0,
      healthSavingsAccount: 0,
      otherAdjustments: 0
    };
    
    // additionalAdjustmentItems 합계
    const additionalAdjustmentsTotal = (income.additionalAdjustmentItems || [])
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Sum all adjustments
    result.adjustments = (
      incomeAdjustments.studentLoanInterest +
      incomeAdjustments.retirementContributions +
      ('healthSavingsAccount' in incomeAdjustments ? incomeAdjustments.healthSavingsAccount : 0) +
      incomeAdjustments.otherAdjustments +
      halfSETax +
      additionalAdjustmentsTotal
    );
    
    // Calculate adjusted gross income (AGI)
    result.adjustedGrossIncome = result.totalIncome - result.adjustments;
  }
  
  // Calculate deductions
  if (taxData.deductions?.useStandardDeduction) {
    result.deductions = calculateStandardDeduction(filingStatus);
  } else {
    result.deductions = taxData.deductions?.totalDeductions || 0;
  }
  
  // Get QBI deduction if available
  const qbiDeduction = taxData.income?.qbi?.qbiDeduction || 0;
  
  // Calculate taxable income (AGI - Standard/Itemized Deductions - QBI Deduction)
  result.taxableIncome = Math.max(0, result.adjustedGrossIncome - result.deductions - qbiDeduction);
  
  // Calculate federal tax
  result.federalTax = calculateFederalTax(result.taxableIncome, filingStatus);
  
  // Calculate Child Tax Credit automatically if enabled
  let calculatedChildTaxCredit = 0;
  
  // Only auto-calculate if there are dependents
  if (taxData.personalInfo?.dependents && taxData.personalInfo.dependents.length > 0) {
    calculatedChildTaxCredit = calculateChildTaxCredit(
      taxData.personalInfo.dependents,
      result.adjustedGrossIncome,
      filingStatus
    );
  }
  
  // Auto-calculate Retirement Savings Credit if applicable
  let calculatedRetirementSavingsCredit = 0;
  
  // Only auto-calculate if there are retirement contributions
  if (income.adjustments && income.adjustments.retirementContributions > 0) {
    const isMarriedJointFiling = filingStatus === 'married_joint' || filingStatus === 'qualifying_widow';
    calculatedRetirementSavingsCredit = calculateRetirementSavingsCredit(
      income.adjustments.retirementContributions,
      result.adjustedGrossIncome,
      filingStatus,
      isMarriedJointFiling
    );
  }
  
  // Auto-calculate Credit for Other Dependents if applicable
  let calculatedCreditForOtherDependents = 0;
  
  // Only auto-calculate if there are dependents
  if (taxData.personalInfo?.dependents && taxData.personalInfo.dependents.length > 0) {
    calculatedCreditForOtherDependents = calculateCreditForOtherDependents(
      taxData.personalInfo.dependents,
      result.adjustedGrossIncome,
      filingStatus
    );
  }
  
  // Auto-calculate Child and Dependent Care Credit if applicable
  let calculatedChildDependentCareCredit = 0;
  
  // Only auto-calculate if there are dependents
  // This is a simplified check - in a real system, we'd verify dependent age and qualifying expenses
  if (taxData.personalInfo?.dependents && taxData.personalInfo.dependents.length > 0) {
    // For this prototype, we're assuming all dependents under 13 qualify
    // In a real system, more detailed checks would be needed
    const qualifyingDependents = taxData.personalInfo.dependents.filter(dependent => {
      const birthDate = new Date(dependent.dateOfBirth);
      const taxYearEnd = new Date('2025-12-31');
      const age = taxYearEnd.getFullYear() - birthDate.getFullYear();
      return age < 13;
    });
    
    if (qualifyingDependents.length > 0) {
      // For prototype, we're assuming average care expenses of $2,000 per qualifying dependent
      // In a real system, this would be user-entered data
      const estimatedCareExpenses = qualifyingDependents.length * 2000;
      
      calculatedChildDependentCareCredit = calculateChildDependentCareCredit(
        estimatedCareExpenses,
        result.adjustedGrossIncome,
        qualifyingDependents.length
      );
    }
  }
  
  // Auto-calculate Earned Income Credit if applicable (기본값 0)
  let calculatedEarnedIncomeCredit = 0;
  
  // EIC 계산에 투자소득 제한 적용 ($11,600 한도, 2024년 기준)
  const investmentIncome = (income.interestIncome || 0) + (income.dividends || 0) + (income.capitalGains || 0);
  
  if (investmentIncome <= 11600) {
    // 투자소득이 한도 이내인 경우에만 EIC 계산
    // 여기서는 간단한 플레이스홀더만 제공하고, 실제 계산은 TaxCredits3.tsx의 함수를 사용
    calculatedEarnedIncomeCredit = 0; // 실제 계산은 사용자가 "자동 계산" 버튼을 클릭할 때 수행
  } else {
    console.log(`투자소득 ${investmentIncome}이 $11,600을 초과하여 EIC 부적격`);
    calculatedEarnedIncomeCredit = 0;
  }
  
  // If there are tax credits in the data, use those values, otherwise use calculated ones
  const taxCredits = taxData.taxCredits || {
    childTaxCredit: calculatedChildTaxCredit,
    childDependentCareCredit: calculatedChildDependentCareCredit,
    educationCredits: 0,
    retirementSavingsCredit: calculatedRetirementSavingsCredit,
    foreignTaxCredit: 0,
    otherCredits: calculatedCreditForOtherDependents,
    totalCredits: calculatedChildTaxCredit + calculatedRetirementSavingsCredit + calculatedChildDependentCareCredit + calculatedCreditForOtherDependents
  };
  
  // Calculate earned income for ACTC
  const earnedIncome = (income.wages || 0) + (income.otherEarnedIncome || 0) + (additionalTax.selfEmploymentIncome || 0);
  
  console.log(`🔍 근로소득 계산 상세:`)
  console.log(`  - 임금(wages): $${income.wages || 0}`)
  console.log(`  - 기타 근로소득: $${income.otherEarnedIncome || 0}`)
  console.log(`  - 자영업 소득: $${additionalTax.selfEmploymentIncome || 0}`)
  console.log(`  - 총 근로소득: $${earnedIncome}`)
  console.log(`📊 세무사 계산과 비교:`)
  console.log(`  - 세무사 ACTC $1,051 → 필요 근로소득: $${((1051 / 0.15) + 2500).toFixed(2)}`)
  console.log(`  - 현재 근로소득과 차이: $${((1051 / 0.15) + 2500 - earnedIncome).toFixed(2)}`)
  console.log(`🎯 자영업세금 확인:`)
  console.log(`   - Schedule SE: 자영업소득 $1,497 → 자영업세금 $229`)
  console.log(`   - 시스템에서 자영업세금이 $229로 표시되면 완전히 일치`);
  
  // Calculate Additional Child Tax Credit (ACTC) - refundable portion
  const calculatedACTC = calculateAdditionalChildTaxCredit(
    taxData.personalInfo?.dependents || [],
    earnedIncome,
    result.federalTax,
    calculatedChildTaxCredit
  );
  
  // Store individual credit amounts in result for display purposes
  result.childTaxCredit = calculatedChildTaxCredit;
  result.childDependentCareCredit = calculatedChildDependentCareCredit;
  result.retirementSavingsCredit = calculatedRetirementSavingsCredit;
  result.creditForOtherDependents = calculatedCreditForOtherDependents;
  result.earnedIncomeCredit = calculatedEarnedIncomeCredit;
  result.additionalChildTaxCredit = calculatedACTC;

  // If the user hasn't explicitly set tax credit values, use the calculated ones
  if (!taxData.taxCredits || 
      (taxData.taxCredits.childTaxCredit === 0 && 
       taxData.taxCredits.retirementSavingsCredit === 0 &&
       taxData.taxCredits.childDependentCareCredit === 0 &&
       taxData.taxCredits.otherCredits === 0)) {
    // Update the total credits with our calculated credits (non-refundable portion only)
    result.credits = (
      calculatedChildTaxCredit + 
      calculatedRetirementSavingsCredit +
      calculatedChildDependentCareCredit +
      calculatedCreditForOtherDependents +
      calculatedEarnedIncomeCredit +
      (taxCredits.educationCredits || 0) +
      (taxCredits.foreignTaxCredit || 0)
    );
  } else {
    // Use the user's manually entered total credits
    result.credits = taxCredits.totalCredits || 0;
  }
  
  // Calculate federal income tax due (after credits)
  const federalIncomeTaxDue = Math.max(0, result.federalTax - result.credits);
  
  // Calculate total tax due (federal income tax + additional taxes + self-employment tax)
  result.taxDue = federalIncomeTaxDue + additionalTax.otherTaxes + selfEmploymentTax;
  
  // 선납세금으로는 사용자가 입력한 estimatedTaxPayments만 사용
  const estimatedPayments = additionalTax.estimatedTaxPayments;
  // 원천징수액 계산을 제거하고 사용자 입력값만 사용
  result.payments = estimatedPayments;
  
  // Calculate state income tax if state information is available
  if (taxData.personalInfo?.state && result.adjustedGrossIncome > 0) {
    const stateInput: StateTaxCalculationInput = {
      state: taxData.personalInfo.state,
      filingStatus: filingStatus as any,
      federalAGI: result.adjustedGrossIncome,
      federalTaxableIncome: result.taxableIncome,
      federalItemizedDeductions: taxData.deductions?.useStandardDeduction ? 
        undefined : taxData.deductions?.totalDeductions,
      dependentsCount: taxData.personalInfo?.dependents?.length || 0,
    };
    
    try {
      const stateResult = calculateStateTax(stateInput);
      if (stateResult) {
        result.stateIncomeTax = stateResult;
      }
    } catch (error) {
      console.error('State tax calculation error:', error);
    }
  }

  // Calculate refund or amount owed including ACTC
  // ACTC is refundable, so it adds to refunds even if tax liability is zero
  const totalRefundableCredits = calculatedACTC + calculatedEarnedIncomeCredit;
  
  if (result.payments + totalRefundableCredits > result.taxDue) {
    result.refundAmount = formatInputNumber((result.payments + totalRefundableCredits) - result.taxDue);
    result.amountOwed = 0;
  } else {
    result.amountOwed = formatInputNumber(result.taxDue - (result.payments + totalRefundableCredits));
    result.refundAmount = 0;
  }
  
  // Format all result numbers to 2 decimal places for consistency
  result.totalIncome = formatInputNumber(result.totalIncome);
  result.adjustments = formatInputNumber(result.adjustments);
  result.adjustedGrossIncome = formatInputNumber(result.adjustedGrossIncome);
  result.deductions = formatInputNumber(result.deductions);
  result.taxableIncome = formatInputNumber(result.taxableIncome);
  result.federalTax = formatInputNumber(result.federalTax);
  result.credits = formatInputNumber(result.credits);
  result.taxDue = formatInputNumber(result.taxDue);
  result.payments = formatInputNumber(result.payments);
  result.childTaxCredit = formatInputNumber(result.childTaxCredit);
  result.childDependentCareCredit = formatInputNumber(result.childDependentCareCredit);
  result.retirementSavingsCredit = formatInputNumber(result.retirementSavingsCredit);
  result.creditForOtherDependents = formatInputNumber(result.creditForOtherDependents);
  result.earnedIncomeCredit = formatInputNumber(result.earnedIncomeCredit);
  result.additionalChildTaxCredit = formatInputNumber(result.additionalChildTaxCredit);
  
  return result;
}

// Format currency for display (without decimal places)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount));
}

// Format string input to only allow numbers and decimal point
export function formatNumberInput(value: string): string {
  // Allow only digits and decimal point
  return value.replace(/[^\d.]/g, '');
}
