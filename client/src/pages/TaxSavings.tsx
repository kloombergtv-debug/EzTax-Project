import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useTaxContext } from '@/context/TaxContext';
import { calculateTaxes } from '@/lib/taxCalculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  TrendingUp, 
  PiggyBank, 
  FileText, 
  Calculator,
  ArrowLeft,
  Lightbulb,
  Target,
  Calendar
} from 'lucide-react';

interface TaxSavingsSuggestion {
  category: string;
  title: string;
  description: string;
  potentialSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeframe: string;
  action: string;
}

export default function TaxSavings() {
  const [, navigate] = useLocation();
  const { taxData } = useTaxContext();
  const [suggestions, setSuggestions] = useState<TaxSavingsSuggestion[]>([]);

  useEffect(() => {
    if (taxData) {
      generateTaxSavingsSuggestions();
    }
  }, [taxData]);

  const generateTaxSavingsSuggestions = () => {
    const suggestions: TaxSavingsSuggestion[] = [];
    const income = taxData.income;
    const personalInfo = taxData.personalInfo;
    const deductions = taxData.deductions;
    
    // 현재 세금 계산
    const currentTaxResult = calculateTaxes({
      personalInfo: taxData.personalInfo,
      income: taxData.income,
      deductions: taxData.deductions,
      taxCredits: taxData.taxCredits,
      additionalTax: taxData.additionalTax
    });
    
    const currentTaxLiability = currentTaxResult.taxDue || 0;
    const currentAGI = income?.adjustedGrossIncome || 0;
    
    // 현재 세금이 0이면 절세 여지가 제한적임을 안내
    if (currentTaxLiability <= 0) {
      suggestions.push({
        category: '현재 상황',
        title: '현재 세금 부담이 없는 상태입니다',
        description: '현재 조정총소득($' + currentAGI.toLocaleString() + ')과 공제/크레딧으로 인해 세금 부담이 없습니다. 미래를 위한 투자 전략을 고려해보세요.',
        potentialSavings: 0,
        difficulty: 'easy',
        timeframe: '현재',
        action: '세금 신고서 검토 페이지에서 계산 확인'
      });
      
      // 미래를 위한 은퇴 계획 제안
      if (!taxData.retirementContributions || 
          (taxData.retirementContributions.traditionalIRA || 0) + 
          (taxData.retirementContributions.plan401k || 0) < 7000) {
        suggestions.push({
          category: '미래 준비',
          title: 'Roth IRA 기여금 고려',
          description: '현재 세금이 낮으므로 Roth IRA 기여를 통해 미래 세금 없는 성장을 고려해보세요. 2025년 한도: $7,000 (50세 이상 $8,000)',
          potentialSavings: 0,
          difficulty: 'easy',
          timeframe: '연말까지',
          action: '은퇴 계획 페이지에서 Roth IRA 기여금 입력'
        });
      }
      
      // 529 교육 저축 계획
      if (personalInfo?.dependents && personalInfo.dependents.length > 0) {
        suggestions.push({
          category: '교육 저축',
          title: '529 교육 저축 계획',
          description: '자녀의 미래 교육비를 위한 529 계획은 주별 세금 혜택을 제공할 수 있습니다.',
          potentialSavings: 0,
          difficulty: 'medium',
          timeframe: '언제든지',
          action: '금융 기관에서 529 계획 상담'
        });
      }
      
      setSuggestions(suggestions);
      return;
    }
    
    // 세금이 있는 경우의 절세 제안
    const marginalTaxRate = currentAGI > 89450 ? 0.22 : (currentAGI > 22000 ? 0.12 : 0.10);
    
    // 은퇴 계획 기여금 제안
    if (!taxData.retirementContributions || 
        (taxData.retirementContributions.traditionalIRA || 0) + 
        (taxData.retirementContributions.plan401k || 0) < 7000) {
      const potentialContribution = Math.min(7000, currentTaxLiability / marginalTaxRate);
      const potentialSavings = potentialContribution * marginalTaxRate;
      
      if (potentialSavings > 0) {
        suggestions.push({
          category: '은퇴 계획',
          title: 'Traditional IRA 또는 401(k) 기여금',
          description: '2025년 IRA 한도는 $7,000 (50세 이상 $8,000), 401(k) 한도는 $23,500입니다. 세전 기여로 현재 세금을 줄일 수 있습니다.',
          potentialSavings: Math.round(potentialSavings),
          difficulty: 'easy',
          timeframe: '연말까지',
          action: '은퇴 계획 페이지에서 기여금 입력'
        });
      }
    }

    // HSA 제안 (세금이 있는 경우에만)
    if (personalInfo?.filingStatus && 
        (!taxData.income?.adjustments?.retirementContributions || 
         taxData.income.adjustments.retirementContributions < 4150)) {
      const hsaContribution = Math.min(4150, currentTaxLiability / marginalTaxRate);
      const hsaSavings = hsaContribution * marginalTaxRate;
      
      if (hsaSavings > 0) {
        suggestions.push({
          category: '건강 저축 계좌',
          title: 'HSA 기여금',
          description: '2025년 HSA 한도: 개인 $4,150, 가족 $8,300. 삼중 세금 혜택을 제공합니다.',
          potentialSavings: Math.round(hsaSavings),
          difficulty: 'easy',
          timeframe: '연말까지',
          action: '소득 페이지에서 HSA 기여금 입력'
        });
      }
    }

    // 자선 기부 제안 (표준공제 사용자에게는 현금 기부보다 Bunching 전략 제안)
    if (deductions?.useStandardDeduction) {
      suggestions.push({
        category: '자선 기부',
        title: '기부 Bunching 전략',
        description: '여러 해의 기부를 한 해에 집중하여 항목별 공제를 활용하거나, Donor-Advised Fund를 통한 전략적 기부를 고려해보세요.',
        potentialSavings: Math.round(Math.min(currentTaxLiability * 0.1, 500)),
        difficulty: 'hard',
        timeframe: '내년 계획',
        action: '전문 세무사와 상담'
      });
    }

    // 학자금 대출 이자 공제
    if (!income?.adjustments?.studentLoanInterest || 
        income.adjustments.studentLoanInterest === 0) {
      const studentLoanSavings = Math.min(2500 * marginalTaxRate, currentTaxLiability * 0.1);
      
      if (studentLoanSavings > 0) {
        suggestions.push({
          category: '교육 비용',
          title: '학자금 대출 이자 공제',
          description: '연간 최대 $2,500까지 학자금 대출 이자를 공제할 수 있습니다.',
          potentialSavings: Math.round(studentLoanSavings),
          difficulty: 'easy',
          timeframe: '즉시',
          action: '소득 페이지에서 학자금 대출 이자 입력'
        });
      }
    }

    setSuggestions(suggestions);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPotentialSavings = suggestions.reduce((sum, suggestion) => sum + suggestion.potentialSavings, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        {/* 절세방안 제안 영역 (전체 너비) */}
        <div>
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/review')}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              검토 페이지로 돌아가기
            </Button>
            
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-6 w-6 text-yellow-500" />
              <h1 className="text-2xl font-bold">맞춤형 절세방안 제안</h1>
            </div>
            <p className="text-gray-600">
              현재 세무 상황을 분석하여 세금을 절약할 수 있는 방법들을 제안드립니다.
            </p>
          </div>

          {/* 총 절약 가능 금액 요약 */}
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                총 절약 가능 금액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                ${totalPotentialSavings.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">
                아래 제안사항들을 모두 적용할 경우 예상 절약 금액입니다.
              </p>
            </CardContent>
          </Card>

          {/* 절세방안 제안 목록 */}
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <Alert>
                <AlertDescription>
                  현재 입력된 정보를 바탕으로 추가적인 절세 방안을 찾지 못했습니다. 
                  모든 정보를 정확히 입력했는지 확인해보세요.
                </AlertDescription>
              </Alert>
            ) : (
              suggestions.map((suggestion, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {suggestion.category}
                        </Badge>
                        <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          ${suggestion.potentialSavings.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">절약 예상</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{suggestion.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <Badge className={getDifficultyColor(suggestion.difficulty)}>
                          {suggestion.difficulty === 'easy' ? '쉬움' : 
                           suggestion.difficulty === 'medium' ? '보통' : '어려움'}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {suggestion.timeframe}
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Calculator className="h-4 w-4" />
                      <span className="font-medium">추천 액션:</span> {suggestion.action}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* 추가 정보 */}
          <Alert className="mt-6">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>참고사항:</strong> 이 제안들은 일반적인 가이드라인입니다. 
              복잡한 세무 상황의 경우 전문 세무사와 상담하시기 바랍니다. 
              실제 적용 전에 해당 연도의 최신 세법을 확인하세요.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}