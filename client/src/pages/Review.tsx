import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import ProgressTracker from '@/components/ProgressTracker';
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

      {/* 메인 컨텐츠 - 검토 내용과 동영상을 나란히 배치 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 검토 내용 영역 (1/2 너비) */}
        <div className="lg:col-span-1">
          {/* Tax Calculation Summary - Moved to top */}
          <div className="border border-primary rounded-lg p-6 bg-primary/5 mb-6">
            <h3 className="text-lg font-heading font-semibold text-primary-dark mb-4">세금 계산 요약</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Field label="총 소득" value={formatCurrency(calculatedResults.totalIncome)} />
                <Field label="조정 총소득" value={formatCurrency(calculatedResults.adjustedGrossIncome)} />
                <Field label="공제액" value={formatCurrency(calculatedResults.deductions)} />
                <Field label="과세 소득" value={formatCurrency(calculatedResults.taxableIncome)} />
              </div>
              <div>
                <Field label="연방 소득세" value={formatCurrency(calculatedResults.federalTax)} />
                <Field label="세액공제" value={formatCurrency(calculatedResults.credits)} />
                <Field label="총 납부할 세금" value={formatCurrency(calculatedResults.taxDue)} />
                {calculatedResults.refundAmount > 0 ? (
                  <div className="flex justify-between py-2 font-bold bg-success/10 rounded px-2 text-success">
                    <span>환급 금액:</span>
                    <span>{formatCurrency(calculatedResults.refundAmount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between py-2 font-bold bg-destructive/10 rounded px-2 text-destructive">
                    <span>납부할 금액:</span>
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
              <SectionSummary title="개인 정보" editLink="/personal-info">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="이름" value={`${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()} />
                    <Field label="SSN" value={personalInfo.ssn} />
                    <Field label="생년월일" value={personalInfo.dateOfBirth} />
                    <Field label="납세자 구분" value={formatFilingStatus(personalInfo.filingStatus)} />
                  </div>
                  <div>
                    <Field label="이메일" value={personalInfo.email} />
                    <Field label="전화번호" value={personalInfo.phone} />
                    <Field label="자녀 수" value={personalInfo.numberOfChildren} />
                    <Field label="기타 부양가족 수" value={personalInfo.numberOfOtherDependents} />
                  </div>
                </div>
              </SectionSummary>
              
              {/* Income Summary */}
              <SectionSummary title="소득" editLink="/income">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="급여" value={formatCurrency(income.wages)} />
                    <Field label="사업 소득" value={formatCurrency(income.businessIncome)} />
                    <Field label="이자 소득" value={formatCurrency(income.interestIncome)} />
                  </div>
                  <div>
                    <Field label="배당금" value={formatCurrency(income.dividends)} />
                    <Field label="자본 이득" value={formatCurrency(income.capitalGains)} />
                    <Field label="기타 소득" value={formatCurrency(income.otherIncome)} />
                  </div>
                </div>
              </SectionSummary>
              
              {/* Deductions Summary */}
              <SectionSummary title="공제" editLink="/deductions">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="공제 유형" value={deductions.useStandardDeduction ? '표준 공제' : '항목별 공제'} />
                    <Field label="표준 공제 금액" value={formatCurrency(deductions.standardDeductionAmount)} />
                  </div>
                  <div>
                    <Field label="총 공제액" value={formatCurrency(deductions.totalDeductions)} />
                  </div>
                </div>
              </SectionSummary>
              
              {/* Tax Credits Summary */}
              <SectionSummary title="세액공제" editLink="/tax-credits">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="자녀 세액공제" value={formatCurrency(taxCredits.childTaxCredit || 0)} />
                    <Field label="은퇴 저축 공제" value={formatCurrency(taxCredits.retirementSavingsCredit || 0)} />
                  </div>
                  <div>
                    <Field label="외국납부세액공제" value={formatCurrency(taxCredits.foreignTaxCredit || 0)} />
                    <Field label="총 세액공제" value={formatCurrency(taxCredits.totalCredits || 0)} />
                  </div>
                </div>
              </SectionSummary>
              
              {/* Additional Tax Summary */}
              <SectionSummary title="추가 세금" editLink="/additional-tax">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="자영업 소득" value={formatCurrency(additionalTax.selfEmploymentIncome)} />
                    <Field label="자영업 세금" value={formatCurrency(additionalTax.selfEmploymentTax)} />
                  </div>
                  <div>
                    <Field label="예상 세금 납부" value={formatCurrency(additionalTax.estimatedTaxPayments)} />
                    <Field label="기타 세금" value={formatCurrency(additionalTax.otherTaxes)} />
                  </div>
                </div>
              </SectionSummary>
              
              <div className="flex flex-col sm:flex-row justify-between mt-10 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center w-[240px] justify-center"
                  onClick={handleGeneratePdf}
                >
                  <File className="mr-2 h-4 w-4" />
                  1040신고서(참고용)
                </Button>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    className="border-primary text-primary font-semibold rounded hover:bg-primary-light hover:text-white transition duration-200 w-[240px] justify-center"
                    onClick={() => navigate('/additional-tax')}
                  >
                    이전페이지로 이동
                  </Button>
                  
                  <Button
                    className="bg-primary text-white font-semibold rounded hover:bg-primary-dark transition duration-200 w-[240px] justify-center"
                    onClick={() => navigate('/tax-savings')}
                  >
                    절세방안 제안
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 동영상 영역 (1/2 너비) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <Card className="h-fit">
              <CardContent className="p-0">
                <div className="p-6 pb-0">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">세금 신고서 검토 가이드</h3>
                    <p className="text-sm text-gray-600">세금 신고서 최종 검토 및 제출 과정을 확인하세요</p>
                  </div>
                </div>
                <div className="relative w-full pb-[75%] h-0">
                  <iframe
                    src="https://www.youtube.com/embed/kce8i5gAG1k"
                    title="세금 신고서 검토 가이드"
                    className="absolute top-0 left-0 w-full h-full rounded-b-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Review;