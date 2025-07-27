import { jsPDF } from 'jspdf';
import { 
  PersonalInformation, 
  Deductions, 
  TaxCredits, 
  AdditionalTax, 
  CalculatedResults 
} from '@shared/schema';

interface TaxData {
  id?: number;
  taxYear: number;
  status: string;
  personalInfo?: PersonalInformation;
  deductions?: Deductions;
  taxCredits?: TaxCredits;
  additionalTax?: AdditionalTax;
  calculatedResults?: CalculatedResults;
  income?: any;
}

// Generate authentic Form 1040 PDF matching IRS format
export const generateForm1040PDF = (taxData: TaxData): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  // Form 1040 Header - exact IRS format
  addForm1040Header(doc, taxData.taxYear);
  
  let yPos = 60;
  
  // Personal Information Section
  yPos = addPersonalInfoSection(doc, taxData.personalInfo, yPos);
  
  // Filing Status Section
  yPos = addFilingStatusSection(doc, taxData.personalInfo, yPos);
  
  // Digital Assets Question
  yPos = addDigitalAssetsSection(doc, yPos);
  
  // Standard Deduction Section
  yPos = addStandardDeductionSection(doc, taxData.personalInfo, yPos);
  
  // Age/Blindness Section
  yPos = addAgeBlindnessSection(doc, taxData.personalInfo, yPos);
  
  // Dependents Section
  yPos = addDependentsSection(doc, taxData.personalInfo, yPos);
  
  // Start Income section on new page
  doc.addPage();
  yPos = 30;
  
  // Income Section (Lines 1-11)
  yPos = addIncomeSection(doc, taxData.income, taxData.calculatedResults, yPos);
  
  // Check if new page needed
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  // Tax and Credits Section (Lines 12-24)
  yPos = addTaxAndCreditsSection(doc, taxData.calculatedResults, taxData.deductions, yPos);
  
  // Payments Section (Lines 25-33)
  yPos = addPaymentsSection(doc, taxData.calculatedResults, yPos);
  
  // Refund/Amount Owed Section (Lines 34-37)
  yPos = addRefundOwedSection(doc, taxData.calculatedResults, yPos);
  
  // Add footer
  addForm1040Footer(doc);
  
  return doc;
};

// Form header matching IRS format exactly
const addForm1040Header = (doc: jsPDF, taxYear: number): void => {
  // Main title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1040', 15, 20);
  doc.text('U.S. Individual Income Tax Return', 40, 20);
  doc.text(`${taxYear}`, 180, 20);
  
  // Form label
  doc.setFontSize(10);
  doc.text('Form', 15, 25);
  
  // Department line
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Department of the Treasury—Internal Revenue Service', 90, 25);
  
  // Tax year line
  doc.setFontSize(8);
  doc.text(`For the year Jan. 1–Dec. 31, ${taxYear}, or other tax year beginning`, 15, 35);
  doc.text(`, ${taxYear}, ending`, 120, 35);
  doc.text(', 20____', 155, 35);
  doc.text('See separate instructions.', 15, 40);
};

// Personal information section
const addPersonalInfoSection = (doc: jsPDF, personalInfo: PersonalInformation | undefined, yPos: number): number => {
  if (!personalInfo) return yPos;
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  // Name and SSN fields
  doc.text('Your first name and middle initial', 15, yPos);
  doc.text('Last name', 85, yPos);
  doc.text('Your social security number', 140, yPos);
  yPos += 3;
  
  // Draw input lines
  doc.line(15, yPos + 2, 80, yPos + 2);
  doc.line(85, yPos + 2, 135, yPos + 2);
  doc.line(140, yPos + 2, 190, yPos + 2);
  
  // Fill data
  doc.setFontSize(8);
  if (personalInfo.firstName) {
    doc.text(`${personalInfo.firstName} ${personalInfo.middleInitial || ''}`.trim(), 16, yPos);
  }
  if (personalInfo.lastName) {
    doc.text(personalInfo.lastName, 86, yPos);
  }
  if (personalInfo.ssn) {
    doc.text(personalInfo.ssn, 141, yPos);
  }
  yPos += 8;
  
  // Spouse line if married filing jointly
  if (personalInfo.filingStatus === 'married_joint') {
    doc.setFontSize(7);
    doc.text('If joint return, spouse\'s first name and middle initial', 15, yPos);
    doc.text('Last name', 85, yPos);
    doc.text('Spouse\'s social security number', 140, yPos);
    yPos += 3;
    
    doc.line(15, yPos + 2, 80, yPos + 2);
    doc.line(85, yPos + 2, 135, yPos + 2);
    doc.line(140, yPos + 2, 190, yPos + 2);
    
    if (personalInfo.spouseInfo) {
      doc.setFontSize(8);
      if (personalInfo.spouseInfo.firstName) {
        doc.text(personalInfo.spouseInfo.firstName, 16, yPos);
      }
      if (personalInfo.spouseInfo.lastName) {
        doc.text(personalInfo.spouseInfo.lastName, 86, yPos);
      }
      if (personalInfo.spouseInfo.ssn) {
        doc.text(personalInfo.spouseInfo.ssn, 141, yPos);
      }
    }
    yPos += 8;
  }
  
  // Address section
  doc.setFontSize(7);
  doc.text('Home address (number and street). If you have a P.O. box, see instructions.', 15, yPos);
  doc.text('Apt. no.', 150, yPos);
  yPos += 3;
  
  doc.line(15, yPos + 2, 145, yPos + 2);
  doc.line(150, yPos + 2, 190, yPos + 2);
  
  doc.setFontSize(8);
  if (personalInfo.address1) {
    doc.text(`${personalInfo.address1} ${personalInfo.address2 || ''}`.trim(), 16, yPos);
  }
  yPos += 8;
  
  // City, State, ZIP
  doc.setFontSize(7);
  doc.text('City, town, or post office. If you have a foreign address, also complete spaces below.', 15, yPos);
  doc.text('State', 115, yPos);
  doc.text('ZIP code', 140, yPos);
  yPos += 3;
  
  doc.line(15, yPos + 2, 110, yPos + 2);
  doc.line(115, yPos + 2, 135, yPos + 2);
  doc.line(140, yPos + 2, 190, yPos + 2);
  
  doc.setFontSize(8);
  if (personalInfo.city) doc.text(personalInfo.city, 16, yPos);
  if (personalInfo.state) doc.text(personalInfo.state, 116, yPos);
  if (personalInfo.zipCode) doc.text(personalInfo.zipCode, 141, yPos);
  
  return yPos + 10;
};

// Filing Status section
const addFilingStatusSection = (doc: jsPDF, personalInfo: PersonalInformation | undefined, yPos: number): number => {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Filing Status', 15, yPos);
  yPos += 4;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Check only one box.', 15, yPos);
  yPos += 4;
  
  const filingStatuses = [
    { code: 'single', label: 'Single' },
    { code: 'married_joint', label: 'Married filing jointly (even if only one had income)' },
    { code: 'married_separate', label: 'Married filing separately (MFS)' },
    { code: 'head_of_household', label: 'Head of household (HOH)' },
    { code: 'qualifying_widow', label: 'Qualifying surviving spouse (QSS)' }
  ];
  
  filingStatuses.forEach(status => {
    const isChecked = personalInfo?.filingStatus === status.code;
    
    // Checkbox
    doc.rect(15, yPos - 2, 2.5, 2.5);
    if (isChecked) {
      doc.text('X', 15.5, yPos);
    }
    
    doc.text(status.label, 20, yPos);
    yPos += 4;
  });
  
  return yPos + 5;
};

// Digital Assets section
const addDigitalAssetsSection = (doc: jsPDF, yPos: number): number => {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Digital Assets', 15, yPos);
  yPos += 4;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('At any time during 2024, did you: (a) receive (as a reward, award, or payment for property or', 15, yPos);
  yPos += 3;
  doc.text('services); or (b) sell, exchange, or otherwise dispose of a digital asset (or a financial interest in a digital asset)?', 15, yPos);
  yPos += 3;
  doc.text('(See instructions.)', 15, yPos);
  
  // Yes/No checkboxes with improved alignment
  doc.text('Yes', 155, yPos);
  doc.text('No', 175, yPos);
  doc.rect(150, yPos - 2, 2.5, 2.5);
  doc.rect(170, yPos - 2, 2.5, 2.5);
  // Default to No with better positioning
  doc.text('X', 170.5, yPos);
  
  return yPos + 8;
};

// Standard Deduction section
const addStandardDeductionSection = (doc: jsPDF, personalInfo: PersonalInformation | undefined, yPos: number): number => {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Standard Deduction', 15, yPos);
  yPos += 4;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Someone can claim:', 15, yPos);
  yPos += 4;
  
  // First row of checkboxes with proper alignment
  doc.rect(15, yPos - 2, 2.5, 2.5);
  doc.text('You as a dependent', 20, yPos);
  
  doc.rect(90, yPos - 2, 2.5, 2.5);
  doc.text('Your spouse as a dependent', 95, yPos);
  yPos += 5;
  
  // Second row checkbox
  doc.rect(15, yPos - 2, 2.5, 2.5);
  doc.text('Spouse itemizes on a separate return or you were a dual-status alien', 20, yPos);
  
  return yPos + 8;
};

// Age/Blindness section
const addAgeBlindnessSection = (doc: jsPDF, personalInfo: PersonalInformation | undefined, yPos: number): number => {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Age/Blindness', 15, yPos);
  yPos += 4;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('You:', 15, yPos);
  yPos += 4;
  
  // First row - You
  doc.rect(15, yPos - 2, 2.5, 2.5);
  doc.text('Were born before January 2, 1960', 20, yPos);
  
  doc.rect(130, yPos - 2, 2.5, 2.5);
  doc.text('Are blind', 135, yPos);
  yPos += 5;
  
  if (personalInfo?.filingStatus === 'married_joint') {
    doc.text('Spouse:', 15, yPos);
    yPos += 4;
    
    // Second row - Spouse
    doc.rect(15, yPos - 2, 2.5, 2.5);
    doc.text('Was born before January 2, 1960', 20, yPos);
    
    doc.rect(130, yPos - 2, 2.5, 2.5);
    doc.text('Is blind', 135, yPos);
    yPos += 5;
  }
  
  return yPos + 8;
};

// Dependents section
const addDependentsSection = (doc: jsPDF, personalInfo: PersonalInformation | undefined, yPos: number): number => {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Dependents (see instructions):', 15, yPos);
  yPos += 4;
  
  // Table headers
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('(1) First name    Last name', 15, yPos);
  doc.text('(2) Social security number', 70, yPos);
  doc.text('(3) Relationship to you', 110, yPos);
  doc.text('(4) Check the box if qualifies for (see instructions):', 140, yPos);
  yPos += 3;
  doc.text('Child tax credit', 145, yPos);
  doc.text('Credit for other dependents', 170, yPos);
  yPos += 4;
  
  // List dependents (max 4 on form)
  if (personalInfo?.dependents) {
    personalInfo.dependents.slice(0, 4).forEach((dependent, index) => {
      const name = `${dependent.firstName || ''} ${dependent.lastName || ''}`.trim();
      doc.text(name, 15, yPos);
      if (dependent.ssn) doc.text(dependent.ssn, 70, yPos);
      doc.text(dependent.relationship || '', 110, yPos);
      
      // Checkboxes for credits with better alignment
      doc.rect(143, yPos - 1.5, 2.5, 2.5);
      doc.rect(168, yPos - 1.5, 2.5, 2.5);
      
      yPos += 5;
    });
  }
  
  return yPos + 8;
};

// Income section (Lines 1-11)
const addIncomeSection = (doc: jsPDF, income: any, calculatedResults: CalculatedResults | undefined, yPos: number): number => {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Income', 15, yPos);
  yPos += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const addLine = (lineNum: string, description: string, amount: number, isBold = false) => {
    if (isBold) doc.setFont('helvetica', 'bold');
    doc.text(lineNum, 15, yPos);
    doc.text(description, 30, yPos);
    const amountText = formatCurrency(amount);
    doc.text(amountText, 195 - doc.getTextWidth(amountText), yPos);
    if (isBold) doc.setFont('helvetica', 'normal');
    yPos += 5;
  };
  
  if (income) {
    addLine('1z', 'Total amount from Form(s) W-2, box 1 (see instructions)', income.wages || 0);
    
    doc.setFontSize(7);
    doc.text('Attach Sch. B if required.', 30, yPos);
    yPos += 4;
    doc.setFontSize(9);
    
    addLine('2b', 'Taxable interest', income.interestIncome || 0);
    addLine('3b', 'Ordinary dividends', income.dividends || 0);
    addLine('4b', 'IRA distributions - Taxable amount', income.retirementIncome || 0);
    addLine('5b', 'Pensions and annuities - Taxable amount', 0);
    addLine('6b', 'Social security benefits - Taxable amount', 0);
    addLine('7', 'Capital gain or (loss). Attach Schedule D if required', income.capitalGains || 0);
    addLine('8', 'Additional income from Schedule 1, line 10', income.businessIncome || 0);
    
    yPos += 3;
    const totalIncome = (income.wages || 0) + (income.interestIncome || 0) + (income.dividends || 0) + 
                       (income.retirementIncome || 0) + (income.capitalGains || 0) + (income.businessIncome || 0);
    addLine('9', 'Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7, and 8. This is your total income', totalIncome, true);
    
    // Use the total adjustments from calculatedResults, fallback to income calculation
    const totalAdjustments = calculatedResults?.adjustments || 
      (income.adjustments ? 
        (income.adjustments.studentLoanInterest || 0) + 
        (income.adjustments.retirementContributions || 0) + 
        (income.adjustments.otherAdjustments || 0) : 0);
    addLine('10', 'Adjustments to income from Schedule 1, line 26', totalAdjustments);
    
    addLine('11', 'Subtract line 10 from line 9. This is your adjusted gross income', calculatedResults?.adjustedGrossIncome || income.adjustedGrossIncome || (totalIncome - totalAdjustments), true);
  }
  
  return yPos + 2;
};

// Tax and Credits section (Lines 12-24)
const addTaxAndCreditsSection = (doc: jsPDF, calculatedResults: CalculatedResults | undefined, deductions: Deductions | undefined, yPos: number): number => {
  if (!calculatedResults) return yPos;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const addLine = (lineNum: string, description: string, amount: number, isBold = false) => {
    if (isBold) doc.setFont('helvetica', 'bold');
    doc.text(lineNum, 15, yPos);
    doc.text(description, 30, yPos);
    const amountText = formatCurrency(amount);
    doc.text(amountText, 195 - doc.getTextWidth(amountText), yPos);
    if (isBold) doc.setFont('helvetica', 'normal');
    yPos += 5;
  };
  
  const deductionType = deductions?.useStandardDeduction ? 'Standard deduction' : 'Itemized deductions from Schedule A';
  addLine('12', deductionType, calculatedResults.deductions || 0);
  addLine('13', 'Qualified business income deduction from Form 8995 or Form 8995-A', 0);
  addLine('14', 'Add lines 12 and 13', calculatedResults.deductions || 0);
  addLine('15', 'Subtract line 14 from line 11. If zero or less, enter -0-. This is your taxable income', calculatedResults.taxableIncome || 0, true);
  
  yPos += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Tax and Credits', 15, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  addLine('16', 'Tax (see instructions). Check if any from Form(s): 8814, 4972', calculatedResults.federalTax || 0);
  addLine('17', 'Amount from Schedule 2, line 3', 0);
  addLine('18', 'Add lines 16 and 17', calculatedResults.federalTax || 0);
  addLine('19', 'Child tax credit or credit for other dependents from Schedule 8812', calculatedResults.credits || 0);
  addLine('20', 'Amount from Schedule 3, line 8', 0);
  addLine('21', 'Add lines 19 and 20', calculatedResults.credits || 0);
  addLine('22', 'Subtract line 21 from line 18. If zero or less, enter -0-', Math.max(0, (calculatedResults.federalTax || 0) - (calculatedResults.credits || 0)));
  addLine('23', 'Other taxes, including self-employment tax, from Schedule 2, line 21', 0);
  addLine('24', 'Add lines 22 and 23. This is your total tax', calculatedResults.taxDue || 0, true);
  
  return yPos + 8;
};

// Payments section (Lines 25-33)
const addPaymentsSection = (doc: jsPDF, calculatedResults: CalculatedResults | undefined, yPos: number): number => {
  if (!calculatedResults) return yPos;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Payments', 15, yPos);
  yPos += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const addLine = (lineNum: string, description: string, amount: number, isBold = false) => {
    if (isBold) doc.setFont('helvetica', 'bold');
    doc.text(lineNum, 15, yPos);
    doc.text(description, 30, yPos);
    const amountText = formatCurrency(amount);
    doc.text(amountText, 195 - doc.getTextWidth(amountText), yPos);
    if (isBold) doc.setFont('helvetica', 'normal');
    yPos += 5;
  };
  
  addLine('25d', 'Federal income tax withheld from Forms W-2 and 1099', calculatedResults.payments || 0);
  addLine('26', '2024 estimated tax payments and amount applied from 2023 return', 0);
  addLine('27', 'Earned income credit (EIC)', calculatedResults.earnedIncomeCredit || 0);
  addLine('28', 'Additional child tax credit from Schedule 8812', calculatedResults.additionalChildTaxCredit || 0);
  addLine('29', 'American opportunity credit from Form 8863, line 8', 0);
  addLine('30', 'Reserved for future use', 0);
  addLine('31', 'Amount from Schedule 3, line 15', 0);
  addLine('32', 'Add lines 27, 28, 29, and 31. These are your total other payments and refundable credits', (calculatedResults.earnedIncomeCredit || 0) + (calculatedResults.additionalChildTaxCredit || 0));
  addLine('33', 'Add lines 25d, 26, and 32. These are your total payments', (calculatedResults.payments || 0) + (calculatedResults.earnedIncomeCredit || 0) + (calculatedResults.additionalChildTaxCredit || 0), true);
  
  return yPos + 8;
};

// Refund/Amount Owed section (Lines 34-37)
const addRefundOwedSection = (doc: jsPDF, calculatedResults: CalculatedResults | undefined, yPos: number): number => {
  if (!calculatedResults) return yPos;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Refund', 15, yPos);
  yPos += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const addLine = (lineNum: string, description: string, amount: number, isBold = false) => {
    if (isBold) doc.setFont('helvetica', 'bold');
    doc.text(lineNum, 15, yPos);
    doc.text(description, 30, yPos);
    const amountText = formatCurrency(amount);
    doc.text(amountText, 195 - doc.getTextWidth(amountText), yPos);
    if (isBold) doc.setFont('helvetica', 'normal');
    yPos += 5;
  };
  
  if (calculatedResults.refundAmount && calculatedResults.refundAmount > 0) {
    addLine('34', 'If line 33 is more than line 24, subtract line 24 from line 33. This is the amount you overpaid', calculatedResults.refundAmount, true);
    addLine('35a', 'Amount of line 34 you want refunded to you. If Form 8888 is attached, check here', calculatedResults.refundAmount);
  } else if (calculatedResults.amountOwed && calculatedResults.amountOwed > 0) {
    yPos += 3;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount You Owe', 15, yPos);
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    addLine('37', 'If line 24 is more than line 33, subtract line 33 from line 24. This is the amount you owe', calculatedResults.amountOwed, true);
  }
  
  return yPos + 15;
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount));
};

// Footer
const addForm1040Footer = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Form 1040 (2024)', 15, 270);
    doc.text(`Page ${i}`, 185, 270);
    
    doc.setFontSize(6);
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by EzTax - For informational purposes only', 15, 275);
  }
};

// Main export function
export const downloadForm1040PDF = (taxData: TaxData): void => {
  const doc = generateForm1040PDF(taxData);
  doc.save(`Form_1040_${taxData.taxYear}.pdf`);
};