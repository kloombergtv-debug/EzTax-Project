import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { ChatBot } from '@/components/ChatBot';

interface FormData {
  currentAge: number;
  retirementAge: number;
  annualEarnings: number;
  expectedRetirementAge: number;
}

interface CalculationResult {
  monthlyBenefit: number;
  earningsYears: number;
  avgEarnings: number;
  aime: number;
  pia: number;
}

const SocialSecurityCalculator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    currentAge: 25,
    retirementAge: 65,
    annualEarnings: 80000,
    expectedRetirementAge: 67,
  });
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateSocialSecurity = (data: FormData): CalculationResult => {
    // 기본 계산 로직 (간소화된 버전)
    const workingYears = Math.max(35, data.retirementAge - 22); // 최소 35년
    const earningsYears = Math.min(35, workingYears);
    
    // AIME (Average Indexed Monthly Earnings) 계산
    const totalEarnings = data.annualEarnings * earningsYears;
    const avgAnnualEarnings = totalEarnings / earningsYears;
    const aime = Math.round(avgAnnualEarnings / 12);
    
    // PIA (Primary Insurance Amount) 계산 - 2024년 기준 공식
    let pia = 0;
    if (aime <= 1174) {
      pia = aime * 0.9;
    } else if (aime <= 7078) {
      pia = 1174 * 0.9 + (aime - 1174) * 0.32;
    } else {
      pia = 1174 * 0.9 + (7078 - 1174) * 0.32 + (aime - 7078) * 0.15;
    }
    
    // 조기/연기 은퇴 조정
    let adjustedBenefit = pia;
    const fullRetirementAge = 67; // 1960년 이후 출생자 기준
    
    if (data.expectedRetirementAge < fullRetirementAge) {
      // 조기 은퇴 - 월 0.5% 또는 0.55% 감액
      const monthsEarly = (fullRetirementAge - data.expectedRetirementAge) * 12;
      const reductionRate = monthsEarly <= 36 ? 0.005 : 0.0055;
      adjustedBenefit = pia * (1 - (monthsEarly * reductionRate));
    } else if (data.expectedRetirementAge > fullRetirementAge) {
      // 연기 은퇴 - 월 0.67% 증액
      const monthsDelay = (data.expectedRetirementAge - fullRetirementAge) * 12;
      adjustedBenefit = pia * (1 + (monthsDelay * 0.0067));
    }

    return {
      monthlyBenefit: Math.round(adjustedBenefit),
      earningsYears,
      avgEarnings: Math.round(avgAnnualEarnings),
      aime: Math.round(aime),
      pia: Math.round(pia),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculationResult = calculateSocialSecurity(formData);
    setResult(calculationResult);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <DollarSign className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Social Security 예상액</h1>
            <p className="text-gray-600 mt-2">
              근무기간과 평균소득을 기반으로 예상 Social Security 연금을 계산합니다
            </p>
          </div>
        </div>

        {/* 경고 메시지 */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>안내:</strong> 이 계산기는 대략적인 예상 금액을 제공합니다. 정확한 혜택 금액은{' '}
            <a 
              href="https://www.ssa.gov/myaccount/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 underline hover:text-blue-800"
            >
              ssa.gov/myaccount
            </a>
            에서 확인하시기 바랍니다.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 입력 폼 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                정보 입력
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Calendar className="h-4 w-4" />
                      현재 나이
                    </label>
                    <Input
                      type="number"
                      placeholder="25"
                      min="18"
                      max="70"
                      value={formData.currentAge}
                      onChange={(e) => handleInputChange('currentAge', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Calendar className="h-4 w-4" />
                      은퇴 연령
                    </label>
                    <Input
                      type="number"
                      placeholder="65"
                      min="62"
                      max="70"
                      value={formData.retirementAge}
                      onChange={(e) => handleInputChange('retirementAge', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <DollarSign className="h-4 w-4" />
                      연평균 연봉 ($)
                    </label>
                    <Input
                      type="number"
                      placeholder="80000"
                      min="0"
                      max="200000"
                      value={formData.annualEarnings}
                      onChange={(e) => handleInputChange('annualEarnings', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Calendar className="h-4 w-4" />
                      수령 시작 연령
                    </label>
                    <Input
                      type="number"
                      placeholder="67"
                      min="62"
                      max="70"
                      value={formData.expectedRetirementAge}
                      onChange={(e) => handleInputChange('expectedRetirementAge', e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Social Security 혜택 계산하기
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 계산 결과 */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  계산 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* 예상 월 수령액 */}
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-900 mb-2">
                      예상 월 수령액: ${Math.round(result.monthlyBenefit).toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>• 근무년수: {result.earningsYears}년 / 35년</div>
                      <div>• 평균 소득: ${Math.round(result.avgEarnings).toLocaleString()}</div>
                      <div>• AIME (35년 평균 월소득): ${Math.round(result.aime).toLocaleString()}</div>
                      <div>• 수령 조건: 정액(FRA)</div>
                    </div>
                  </div>

                  {/* 상세 계산 내역 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">상세 계산 내역</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-medium text-gray-900">
                          근무 기간: {result.earningsYears}년
                        </div>
                        <div className="text-sm text-gray-600">
                          Social Security는 최고 35년간의 소득을 기준으로 계산합니다
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-medium text-gray-900">
                          평균 연간 소득: ${Math.round(result.avgEarnings).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          35년간의 평균 연간 소득입니다
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-medium text-gray-900">
                          AIME: ${Math.round(result.aime).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Average Indexed Monthly Earnings (35년 평균 월소득)
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-medium text-gray-900">
                          PIA: ${Math.round(result.pia).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Primary Insurance Amount (기본 보험료액)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 추가 정보 */}
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-2">주의사항</h4>
                    <div className="text-sm text-amber-800 space-y-1">
                      <div>• 이 계산은 현재 급여율 기준 추정치입니다</div>
                      <div>• 실제 혜택은 인플레이션 조정 및 법률 변경에 따라 달라질 수 있습니다</div>
                      <div>• 정확한 혜택 계산을 위해서는 SSA 공식 계산기를 사용하세요</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ChatBot 컴포넌트 */}
        <ChatBot context="소셜시큐리티계산기" />
      </div>
    </div>
  );
};

export default SocialSecurityCalculator;