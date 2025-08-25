import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import ProgressTracker from '@/components/ProgressTracker';
import { ChatBot } from '@/components/ChatBot';
import { useTaxContext } from '@/context/TaxContext';

import StepNavigation from '@/components/StepNavigation';
import { File, Check, FileEdit, Loader2 } from 'lucide-react';
import { downloadForm1040PDF } from '@/lib/form1040Generator';
import { formatCurrency } from '@/lib/taxCalculations';
import { PersonalInformation, Deductions, TaxCredits, AdditionalTax, CalculatedResults, Income } from '@shared/schema';
import { Link, useLocation } from 'wouter';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SectionSummaryProps {
  title: string;
  editLink: string;
  children: React.ReactNode;
}

const SectionSummary: React.FC<SectionSummaryProps> = ({ title, editLink, children }) => {
  return (
    <div className="mb-6 border border-gray-light rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-heading font-semibold">{title}</h3>
        <Link href={editLink}>
          <Button variant="ghost" size="sm" className="flex items-center text-gray-dark hover:text-primary">
            <FileEdit className="mr-1 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
};

// Helper component to format field data
const Field: React.FC<{ label: string; value: string | number | undefined | null; className?: string }> = ({ label, value, className }) => (
  <div className={`flex justify-between py-1 border-b border-gray-light last:border-0 ${className || ''}`}>
    <span className="text-gray-dark">{label}:</span>
    <span className="font-semibold">
      {value !== undefined && value !== null && value !== "" ? value : 'N/A'}
    </span>
  </div>
);

const Review: React.FC = () => {
  // 모든 Hook을 최상단에 선언 (조건부 호출 금지)
  let taxData, saveTaxReturn, isLoading;
  try {
    const context = useTaxContext();
    taxData = context.taxData;
    saveTaxReturn = context.updateTaxData;
    isLoading = context.isLoading || false;
  } catch (error) {
    // 로그인하지 않은 상태에서는 기본값 사용
    console.log('TaxContext 사용 불가, 기본값 사용');
    taxData = {
      personalInfo: { filingStatus: 'single', firstName: '', lastName: '', ssn: '', dateOfBirth: '', numberOfChildren: 0, numberOfOtherDependents: 0, email: '', phone: '' },
      income: { wages: 0, businessIncome: 0, interestIncome: 0, dividends: 0, capitalGains: 0, otherIncome: 0, adjustedGrossIncome: 0 },
      deductions: { useStandardDeduction: true, standardDeductionAmount: 0, totalDeductions: 0 },
      taxCredits: { childTaxCredit: 0, retirementSavingsCredit: 0, foreignTaxCredit: 0, earnedIncomeCredit: 0, totalCredits: 0 },
      additionalTax: { selfEmploymentIncome: 0, selfEmploymentTax: 0, estimatedTaxPayments: 0, otherTaxes: 0 }
    };
    saveTaxReturn = () => {};
    isLoading = false;
  }
  
  const { toast } = useToast();
  const [, navigate] = useLocation();

  
  // Map filing status enum to readable text
  const formatFilingStatus = (status: string | undefined): string => {
    if (!status) return 'Not selected';
    
    const statusMap: Record<string, string> = {
      single: 'Single',
      married_joint: 'Married Filing Jointly',
      married_separate: 'Married Filing Separately',
      head_of_household: 'Head of Household',
      qualifying_widow: 'Qualifying Widow(er)'
    };
    
    return statusMap[status] || status;
  };
  
  // taxData에서 각 섹션 데이터 추출
  const personalInfo = taxData.personalInfo || {} as PersonalInformation;
  const income = taxData.income || {} as Income;
  const deductions = taxData.deductions || {} as Deductions;
  const taxCredits = taxData.taxCredits || {} as TaxCredits;
  const additionalTax = taxData.additionalTax || {} as AdditionalTax;
  
  // dependents 배열에서 실제 자녀 수와 기타 부양가족 수 계산
  const dependents = personalInfo.dependents || [];
  const numberOfChildren = dependents.filter(dep => dep.relationship === 'child').length;
  const numberOfOtherDependents = dependents.filter(dep => dep.relationship !== 'child').length;
  
  // 기본 계산 결과 (실제 TaxContext에서 사용될 때 업데이트됨)
  const calculatedResults = taxData.calculatedResults || {
    totalIncome: (income.wages || 0) + (income.businessIncome || 0) + (income.interestIncome || 0) + (income.dividends || 0) + (income.capitalGains || 0) + (income.otherIncome || 0),
    adjustments: 0,
    adjustedGrossIncome: income.adjustedGrossIncome || 0,
    deductions: deductions.totalDeductions || 0,
    taxableIncome: Math.max(0, (income.adjustedGrossIncome || 0) - (deductions.totalDeductions || 0)),
    federalTax: 0,
    credits: taxCredits.totalCredits || 0,
    taxDue: 0,
    payments: additionalTax.estimatedTaxPayments || 0,
    refundAmount: 0,
    amountOwed: 0
  };
  
  const handleGeneratePdf = () => {
    try {
      // Prepare data for authentic Form 1040 PDF
      const form1040Data = {
        id: taxData.id,
        taxYear: 2025,
        status: taxData.status || 'in_progress',
        personalInfo: personalInfo,
        income: income,
        deductions: deductions,
        taxCredits: taxCredits,
        additionalTax: additionalTax,
        calculatedResults: calculatedResults
      };
      
      downloadForm1040PDF(form1040Data);
      toast({
        title: "실제 Form 1040 PDF 생성 완료",
        description: "IRS 공식 Form 1040 형식의 PDF가 다운로드되었습니다.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "오류",
        description: "PDF 생성 중 문제가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };
  

  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">2025년 세금 신고</h1>
        <p className="text-gray-dark">정보를 검토하고 세금 신고서를 제출하세요.</p>
      </div>

      <ProgressTracker currentStep={6} />

      {/* 메인 컨텐츠 - 전체 너비 */}
      <div className="grid grid-cols-1 gap-6">
        {/* 검토 내용 영역 (전체 너비) */}
        <div className="col-span-1">
          {/* Tax Calculation Summary - Moved to top */}
          <div className="border border-primary rounded-lg p-6 bg-primary/5 mb-6">
            <h3 className="text-lg font-heading font-semibold text-primary-dark mb-4">세금 계산 요약</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Field label="총 소득 (Total Income)" value={formatCurrency(calculatedResults.totalIncome)} />
                <Field label="조정 총소득 (Adjusted Gross Income)" value={formatCurrency(calculatedResults.adjustedGrossIncome)} />
                <Field label="공제액 (Deductions)" value={formatCurrency(calculatedResults.deductions)} />
                <Field label="과세 소득 (Taxable Income)" value={formatCurrency(calculatedResults.taxableIncome)} />
              </div>
              <div>
                <Field label="연방 소득세 (Federal Income Tax)" value={formatCurrency(calculatedResults.federalTax)} />
                <Field label="세액공제 (Tax Credits)" value={formatCurrency(calculatedResults.credits)} />
                <Field label="자영업세 (Self-Employment Tax)" value={formatCurrency(additionalTax.selfEmploymentTax)} />
                <Field label="기타 세금 (Other Taxes)" value={formatCurrency(additionalTax.otherTaxes)} />
                <div className="border-t pt-2 mt-2">
                  <Field label="총 납부할 세금 (Total Tax Due)" value={formatCurrency(calculatedResults.taxDue)} className="font-bold bg-warning/10 px-2 py-1 rounded" />
                  <div className="text-xs text-gray-600 mt-1 px-2">
                    = 연방소득세({formatCurrency(calculatedResults.federalTax)}) - 세액공제({formatCurrency(calculatedResults.credits)}) + 자영업세({formatCurrency(additionalTax.selfEmploymentTax)}) + 기타세금({formatCurrency(additionalTax.otherTaxes)})
                  </div>
                </div>
                {calculatedResults.refundAmount > 0 ? (
                  <div className="flex justify-between py-2 font-bold bg-success/10 rounded px-2 text-success mt-2">
                    <span>환급 금액 (Refund Amount):</span>
                    <span>{formatCurrency(calculatedResults.refundAmount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between py-2 font-bold bg-destructive/10 rounded px-2 text-destructive mt-2">
                    <span>납부할 금액 (Amount Owed):</span>
                    <span>{formatCurrency(calculatedResults.amountOwed)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-heading font-semibold text-primary-dark mb-6">검토 및 계산</h2>
              
              {/* Personal Information Summary */}
              <SectionSummary title="개인 정보 (Personal Information)" editLink="/personal-info">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="이름 (Name)" value={`${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()} />
                    <Field label="납세자 구분 (Filing Status)" value={formatFilingStatus(personalInfo.filingStatus)} />
                  </div>
                  <div>
                    <Field label="자녀 수 (Number of Children)" value={numberOfChildren} />
                    <Field label="기타 부양가족 수 (Other Dependents)" value={numberOfOtherDependents} />
                  </div>
                </div>
              </SectionSummary>
              
              {/* Income Summary */}
              <SectionSummary title="소득 (Income)" editLink="/income">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="급여 (Wages)" value={formatCurrency(income.wages)} />
                    <Field label="사업 소득 (Business Income)" value={formatCurrency(income.businessIncome)} />
                    <Field label="이자 소득 (Interest Income)" value={formatCurrency(income.interestIncome)} />
                    <Field label="배당금 (Dividends)" value={formatCurrency(income.dividends)} />
                  </div>
                  <div>
                    <Field label="자본 이득 (Capital Gains)" value={formatCurrency(income.capitalGains)} />
                    <Field label="기타 소득 (Other Income)" value={formatCurrency(income.otherIncome)} />
                    <Field label="총 소득 (Total Income)" value={formatCurrency(calculatedResults.totalIncome)} className="font-bold bg-primary/5 px-2 py-1 rounded" />
                    <Field label="조정 총소득 (AGI)" value={formatCurrency(calculatedResults.adjustedGrossIncome)} className="font-bold bg-success/5 px-2 py-1 rounded" />
                  </div>
                </div>
              </SectionSummary>
              
              {/* Deductions Summary */}
              <SectionSummary title="공제 (Deductions)" editLink="/deductions">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Field label="공제 유형 (Deduction Type)" value={deductions.useStandardDeduction ? '표준 공제 (Standard)' : '항목별 공제 (Itemized)'} />
                      {deductions.useStandardDeduction && (
                        <Field label="표준 공제 금액 (Standard Deduction)" value={formatCurrency(deductions.standardDeductionAmount)} />
                      )}
                    </div>
                    <div>
                      <Field label="총 공제액 (Total Deductions)" value={formatCurrency(deductions.totalDeductions)} className="font-bold bg-primary/5 px-2 py-1 rounded" />
                    </div>
                  </div>
                  
                  {/* Show itemized deduction details when itemized is selected */}
                  {!deductions.useStandardDeduction && deductions.itemizedDeductions && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">항목별 공제 상세 (Itemized Deduction Details)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Field label="의료비 (Medical Expenses)" value={formatCurrency(deductions.itemizedDeductions.medicalExpenses || 0)} />
                          <Field label="주/지방 소득세 (State/Local Income Tax)" value={formatCurrency(deductions.itemizedDeductions.stateLocalIncomeTax || 0)} />
                          <Field label="부동산세 (Real Estate Taxes)" value={formatCurrency(deductions.itemizedDeductions.realEstateTaxes || 0)} />
                          <Field label="개인 재산세 (Personal Property Tax)" value={formatCurrency(deductions.itemizedDeductions.personalPropertyTax || 0)} />
                        </div>
                        <div>
                          <Field label="주택담보대출 이자 (Mortgage Interest)" value={formatCurrency(deductions.itemizedDeductions.mortgageInterest || 0)} />
                          <Field label="현금 기부 (Charitable Cash)" value={formatCurrency(deductions.itemizedDeductions.charitableCash || 0)} />
                          <Field label="비현금 기부 (Charitable Non-Cash)" value={formatCurrency(deductions.itemizedDeductions.charitableNonCash || 0)} />
                        </div>
                      </div>
                      
                      {/* Show other deduction items if any */}
                      {deductions.otherDeductionItems && deductions.otherDeductionItems.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-900 mb-2">기타 공제 항목 (Other Deductions)</h5>
                          <div className="space-y-1">
                            {deductions.otherDeductionItems.map((item, index) => (
                              <Field key={index} label={`${item.type} ${item.description ? `(${item.description})` : ''}`} value={formatCurrency(item.amount)} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SectionSummary>
              
              {/* Tax Credits Summary */}
              <SectionSummary title="세액공제 (Tax Credits)" editLink="/tax-credits">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="자녀 세액공제 (Child Tax Credit)" value={formatCurrency(taxCredits.childTaxCredit || 0)} />
                    <Field label="은퇴 저축 공제 (Retirement Savings Credit)" value={formatCurrency(taxCredits.retirementSavingsCredit || 0)} />
                  </div>
                  <div>
                    <Field label="외국납부세액공제 (Foreign Tax Credit)" value={formatCurrency(taxCredits.foreignTaxCredit || 0)} />
                    <Field label="총 세액공제 (Total Tax Credits)" value={formatCurrency(taxCredits.totalCredits || 0)} />
                  </div>
                </div>
              </SectionSummary>
              
              {/* Additional Tax Summary */}
              <SectionSummary title="추가 세금 (Additional Tax)" editLink="/additional-tax">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="자영업 소득 (Self-Employment Income)" value={formatCurrency(additionalTax.selfEmploymentIncome)} />
                    <Field label="자영업 세금 (Self-Employment Tax)" value={formatCurrency(additionalTax.selfEmploymentTax)} />
                  </div>
                  <div>
                    <Field label="예상 세금 납부 (Estimated Tax Payments)" value={formatCurrency(additionalTax.estimatedTaxPayments)} />
                    <Field label="기타 세금 (Other Taxes)" value={formatCurrency(additionalTax.otherTaxes)} />
                  </div>
                </div>
              </SectionSummary>
              
              <div className="flex flex-col sm:flex-row justify-between mt-10 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center w-[180px] justify-center"
                  onClick={handleGeneratePdf}
                >
                  <File className="mr-2 h-4 w-4" />
                  1040신고서
                </Button>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 font-semibold rounded hover:bg-blue-100 transition duration-200 w-[160px] justify-center"
                    onClick={() => navigate('/state-tax')}
                  >
                    주정부 세금
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 font-semibold rounded hover:bg-green-100 transition duration-200 w-[160px] justify-center"
                    onClick={() => {
                      const personalInfo = JSON.parse(localStorage.getItem('personalInfo') || '{}');
                      const state = personalInfo.state || 'NY';
                      navigate(`/expert-consultation/${state}`);
                    }}
                  >
                    전문가상담하기
                  </Button>
                  
                  <Button
                    className="bg-primary text-white font-semibold rounded hover:bg-primary-dark transition duration-200 w-[160px] justify-center"
                    onClick={() => navigate('/tax-savings')}
                  >
                    절세방안 제안
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
      <ChatBot context="검토 및 제출" />
    </div>
  );
};

export default Review;