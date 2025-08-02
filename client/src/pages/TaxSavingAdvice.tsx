import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowLeft, Mail, TrendingUp, DollarSign, PiggyBank, Calculator } from 'lucide-react';
import { useTaxContext } from '@/context/TaxContext';
import { calculateTaxes } from '@/lib/taxCalculations';

interface TaxSavingTip {
  title: string;
  description: string;
  potentialSavings: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

const TaxSavingAdvice: React.FC = () => {
  const { taxData } = useTaxContext();
  const [savingTips, setSavingTips] = useState<TaxSavingTip[]>([]);
  const [calculatedResults, setCalculatedResults] = useState<any>(null);

  useEffect(() => {
    if (taxData) {
      const results = calculateTaxes(taxData);
      setCalculatedResults(results);
      generateTaxSavingTips(taxData, results);
    }
  }, [taxData]);

  const generateTaxSavingTips = (data: any, results: any) => {
    const tips: TaxSavingTip[] = [];

    // 은퇴계좌 기여금 증액 제안
    const currentRetirementContrib = data.income?.adjustments?.retirementContributions || 0;
    const maxRetirement401k = 23000; // 2024 limit
    const maxRetirementIRA = 7000; // 2024 limit
    
    if (currentRetirementContrib < maxRetirement401k) {
      const additionalContrib = Math.min(maxRetirement401k - currentRetirementContrib, 5000);
      const taxSavings = additionalContrib * 0.22; // Assuming 22% tax bracket
      tips.push({
        title: "401(k) 기여금 증액",
        description: `현재 은퇴계좌 기여금을 $${additionalContrib.toLocaleString()} 더 늘리면 세금을 절약할 수 있습니다.`,
        potentialSavings: taxSavings,
        priority: 'high',
        category: '은퇴계획'
      });
    }

    // HSA 기여 제안 (건강저축계좌)
    if (data.personalInfo?.filingStatus === 'single') {
      tips.push({
        title: "건강저축계좌(HSA) 활용",
        description: "HSA에 최대 $4,300 기여하면 세금 공제와 의료비 면세 혜택을 받을 수 있습니다.",
        potentialSavings: 4300 * 0.22,
        priority: 'high',
        category: '건강관리'
      });
    }

    // 자선기부 제안
    const currentCharitable = data.deductions?.itemizedDeductions?.charitableCash || 0;
    if (currentCharitable < 1000 && results.adjustedGrossIncome > 50000) {
      tips.push({
        title: "자선기부 세액공제",
        description: "연간 $1,000 자선기부를 통해 세액공제 혜택을 받을 수 있습니다.",
        potentialSavings: 1000 * 0.22,
        priority: 'medium',
        category: '기부공제'
      });
    }

    // 자영업자 추가 공제 제안
    if (data.additionalTax?.selfEmploymentIncome > 0) {
      tips.push({
        title: "자영업자 SEP-IRA 개설",
        description: "자영업 소득의 25%까지 SEP-IRA에 기여하여 세금을 절약할 수 있습니다.",
        potentialSavings: Math.min(data.additionalTax.selfEmploymentIncome * 0.25, 69000) * 0.22,
        priority: 'high',
        category: '자영업'
      });

      tips.push({
        title: "홈오피스 공제",
        description: "집에서 일하는 공간에 대해 홈오피스 공제를 신청할 수 있습니다.",
        potentialSavings: 1500,
        priority: 'medium',
        category: '자영업'
      });
    }

    // 교육비 공제 제안
    if (data.personalInfo?.dependents?.length > 0) {
      const collegeAgeDependents = data.personalInfo.dependents.filter((dep: any) => {
        const birthDate = new Date(dep.dateOfBirth);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        return age >= 17 && age <= 24;
      });

      if (collegeAgeDependents.length > 0) {
        tips.push({
          title: "교육세액공제 (Education Credits)",
          description: `대학생 자녀가 있으시면 American Opportunity Credit으로 최대 $2,500까지 세액공제를 받을 수 있습니다.`,
          potentialSavings: 2500 * collegeAgeDependents.length,
          priority: 'high',
          category: '교육'
        });
      }
    }

    // 세무관련 비용 공제
    tips.push({
      title: "세무 준비비용 공제",
      description: "세무사 수수료, 세무 소프트웨어 비용 등을 사업 비용으로 공제할 수 있습니다.",
      potentialSavings: 500,
      priority: 'low',
      category: '기타공제'
    });

    setSavingTips(tips.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <TrendingUp className="h-4 w-4" />;
      case 'medium': return <DollarSign className="h-4 w-4" />;
      case 'low': return <PiggyBank className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  const totalPotentialSavings = savingTips.reduce((sum, tip) => sum + tip.potentialSavings, 0);
  return (
    <div className="max-w-4xl mx-auto pt-8 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">세금 절세 제안(Tax-Saving Advice)</h1>
        <p className="text-gray-dark">개인 맞춤형 절세 방안을 확인하세요. 복잡한 세무 상황에서는 전문가 상담을 받으시기 바랍니다.</p>
      </div>

      {/* 절세 요약 */}
      {savingTips.length > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-2xl font-heading text-green-800 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2" />
              총 절세 잠재력
            </CardTitle>
            <CardDescription className="text-green-700">
              아래 제안사항들을 모두 실행하면 최대 {formatCurrency(totalPotentialSavings)}까지 절약 가능합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              {formatCurrency(totalPotentialSavings)}
            </div>
            <p className="text-sm text-green-600 mt-1">
              연간 예상 세금 절약액
            </p>
          </CardContent>
        </Card>
      )}

      {/* 개인화된 절세 제안 */}
      {savingTips.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-heading text-primary-dark flex items-center">
              <Calculator className="h-6 w-6 mr-2" />
              맞춤형 절세 제안
            </CardTitle>
            <CardDescription>
              귀하의 세무 상황을 분석한 개인화된 절세 방안입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {savingTips.map((tip, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${getPriorityColor(tip.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {getPriorityIcon(tip.priority)}
                    <h4 className="font-semibold ml-2">{tip.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatCurrency(tip.potentialSavings)}
                    </div>
                    <div className="text-xs opacity-75">절약 가능</div>
                  </div>
                </div>
                <p className="text-sm mb-2">{tip.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium px-2 py-1 rounded bg-white bg-opacity-50">
                    {tip.category}
                  </span>
                  <span className="text-xs font-medium capitalize">
                    {tip.priority === 'high' ? '높은 우선순위' : 
                     tip.priority === 'medium' ? '중간 우선순위' : '낮은 우선순위'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 데이터가 없는 경우 */}
      {savingTips.length === 0 && (
        <Card className="mb-8">
          <CardContent className="text-center py-12">
            <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              세금 데이터가 필요합니다
            </h3>
            <p className="text-gray-500 mb-4">
              개인화된 절세 제안을 받으려면 먼저 세금 신고서를 작성해주세요.
            </p>
            <Link href="/personal-info">
              <Button className="bg-primary text-white">
                세금 신고서 작성하기
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center">
            <Mail className="h-8 w-8 mr-3 text-blue-600" />
            <div>
              <CardTitle className="text-2xl font-heading text-primary-dark">전문가 상담</CardTitle>
              <CardDescription className="text-blue-700">
                절세방안을 실현하시길 원하시면 전문가와 상담하세요
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4 text-lg">전문가 상담이 도움이 되는 경우:</h4>
            <ul className="text-gray-600 space-y-2">
              <li>• 복잡한 사업 소득이나 투자 소득이 있는 경우</li>
              <li>• 여러 주에서 소득이 발생한 경우</li>
              <li>• 국제 소득이나 해외 자산이 있는 경우</li>
              <li>• 대규모 자선 기부나 특별 공제가 필요한 경우</li>
              <li>• IRS 감사나 세무 문제가 발생한 경우</li>
              <li>• 은퇴 계획이나 부동산 거래와 관련된 세무 문제</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
            <div className="flex items-center justify-center mb-3">
              <Mail className="h-6 w-6 mr-2 text-blue-600" />
              <h3 className="font-semibold text-blue-800 text-lg">전문가 상담 문의</h3>
            </div>
            <p className="text-blue-700 mb-4">
              위와 같은 복잡한 세무 상황이 있으시면 전문가에게 문의하세요
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              onClick={() => window.open('mailto:eztax88@gmail.com?subject=세무상담 문의 (Tax Consultation Inquiry)&body=안녕하세요,%0A%0A세무 상담을 요청드립니다.%0A%0A문의 내용:%0A%0A연락처:%0A%0A감사합니다.', '_blank')}
            >
              <Mail className="h-5 w-5 mr-2" />
              eztax88@gmail.com으로 문의하기
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-10 text-center">
        <Link href="/review">
          <Button className="bg-primary text-white font-semibold rounded hover:bg-primary-dark transition duration-200 w-[240px] justify-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            검토 페이지로 돌아가기(Back to Review)
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TaxSavingAdvice;