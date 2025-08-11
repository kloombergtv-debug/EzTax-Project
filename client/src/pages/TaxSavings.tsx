import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useTaxContext } from '@/context/TaxContext';
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
    
    // 은퇴 계획 기여금 제안
    if (!taxData.retirementContributions || 
        (taxData.retirementContributions.traditionalIRA || 0) + 
        (taxData.retirementContributions.plan401k || 0) < 10000) {
      suggestions.push({
        category: '은퇴 계획',
        title: 'IRA 또는 401(k) 기여금 최대화',
        description: '2025년 IRA 한도는 $7,000 (50세 이상 $8,000), 401(k) 한도는 $23,500 (50세 이상 $31,000)입니다.',
        potentialSavings: Math.min(7000, (income?.adjustedGrossIncome || 0) * 0.22),
        difficulty: 'easy',
        timeframe: '연말까지',
        action: '은퇴 계획 페이지에서 기여금 입력'
      });
    }

    // HSA 제안
    if (personalInfo?.filingStatus && 
        (!taxData.income?.adjustments?.retirementContributions || 
         taxData.income.adjustments.retirementContributions < 4150)) {
      suggestions.push({
        category: '건강 저축 계좌',
        title: 'HSA 기여금 최대화',
        description: '2025년 HSA 한도: 개인 $4,150, 가족 $8,300. 세금 공제와 투자 성장 모두 가능합니다.',
        potentialSavings: 4150 * 0.22,
        difficulty: 'easy',
        timeframe: '연말까지',
        action: '소득 페이지에서 HSA 기여금 입력'
      });
    }

    // 자선 기부 제안
    if (!deductions?.itemizedDeductions?.charitableCash || 
        deductions.itemizedDeductions.charitableCash < 1000) {
      suggestions.push({
        category: '자선 기부',
        title: '자선 기부를 통한 세금 공제',
        description: '현금 기부는 AGI의 60%까지 공제 가능합니다. 주식 기부 시 양도소득세도 절약할 수 있습니다.',
        potentialSavings: 1000 * 0.22,
        difficulty: 'medium',
        timeframe: '연말까지',
        action: '공제 페이지에서 자선 기부 입력'
      });
    }

    // 사업 소득이 있는 경우 QBI 공제 제안
    if ((income?.businessIncome || 0) > 0) {
      suggestions.push({
        category: '사업 공제',
        title: '적격 사업 소득 공제 (QBI) 최적화',
        description: '적격 사업 소득의 20%까지 공제 가능합니다. 사업 장비 구매나 홈오피스 공제도 고려해보세요.',
        potentialSavings: Math.min((income.businessIncome * 0.2) * 0.22, 2000),
        difficulty: 'hard',
        timeframe: '연말까지',
        action: '사업 비용 페이지에서 추가 공제 확인'
      });
    }

    // 학자금 대출 이자 공제
    if (!income?.adjustments?.studentLoanInterest || 
        income.adjustments.studentLoanInterest === 0) {
      suggestions.push({
        category: '교육 비용',
        title: '학자금 대출 이자 공제',
        description: '연간 최대 $2,500까지 학자금 대출 이자를 공제할 수 있습니다.',
        potentialSavings: 2500 * 0.22,
        difficulty: 'easy',
        timeframe: '즉시',
        action: '소득 페이지에서 학자금 대출 이자 입력'
      });
    }

    // 자본 이득세 최적화
    if ((income?.capitalGains || 0) > 0) {
      suggestions.push({
        category: '투자 전략',
        title: '자본 이득세 최적화',
        description: '손실 실현을 통한 세금 절약이나 장기 투자를 통한 우대 세율 활용을 고려해보세요.',
        potentialSavings: Math.min((income.capitalGains * 0.15), 3000),
        difficulty: 'hard',
        timeframe: '내년 계획',
        action: '자본 이득 계산기에서 전략 확인'
      });
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 절세방안 제안 영역 (1/2 너비) */}
        <div className="lg:col-span-1">
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
        
        {/* 동영상 영역 (1/2 너비) */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">절세 전략 가이드</h3>
                <p className="text-sm text-gray-600">효과적인 세금 절약 방법과 전략을 확인하세요</p>
              </div>
              <div className="w-full">
                <div className="relative pb-[75%] h-0 overflow-hidden rounded-lg shadow-md">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/kce8i5gAG1k"
                    title="절세 전략 가이드"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500 text-center">
                세금 절약을 위한 실전 전략과 팁을 동영상으로 확인하세요
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}