import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, PiggyBankIcon, TrendingUpIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useTaxContext } from "@/context/TaxContext";

// 2025 IRS Contribution Limits
const CONTRIBUTION_LIMITS_2025 = {
  traditionalIRA: { under50: 7000, over50: 8000 },
  rothIRA: { under50: 7000, over50: 8000 },
  plan401k: { under50: 23500, over50: 31000 },
  plan403b: { under50: 23500, over50: 31000 },
  plan457: { under50: 23500, over50: 31000 },
  simpleIRA: { under50: 16000, over50: 19500 },
  sepIRA: { lesserOf: "25% of compensation or $70,000" },
  able: 15000,
  tsp: { under50: 23500, over50: 31000 }
};

const retirementSchema = z.object({
  traditionalIRA: z.number().min(0).max(8000),
  rothIRA: z.number().min(0).max(8000),
  plan401k: z.number().min(0).max(31000),
  plan403b: z.number().min(0).max(31000),
  plan457: z.number().min(0).max(31000),
  simpleIRA: z.number().min(0).max(19500),
  sepIRA: z.number().min(0).max(70000),
  able: z.number().min(0).max(15000),
  tsp: z.number().min(0).max(31000),
  otherRetirementPlans: z.number().min(0),
});

type RetirementFormData = z.infer<typeof retirementSchema>;

export default function RetirementContributions() {
  // 실제 TaxContext 사용
  const { taxData, updateTaxData, isDataReady } = useTaxContext();
  
  const [, navigate] = useLocation();
  const [userAge, setUserAge] = useState(25);
  const [estimatedCredit, setEstimatedCredit] = useState(0);

  // Calculate user age from date of birth
  useEffect(() => {
    if (taxData.personalInfo?.dateOfBirth) {
      const birthDate = new Date(taxData.personalInfo.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      setUserAge(age);
    }
  }, [taxData.personalInfo?.dateOfBirth]);

  const form = useForm<RetirementFormData>({
    resolver: zodResolver(retirementSchema),
    defaultValues: {
      traditionalIRA: taxData.retirementContributions?.traditionalIRA || 0,
      rothIRA: taxData.retirementContributions?.rothIRA || 0,
      plan401k: taxData.retirementContributions?.plan401k || 0,
      plan403b: taxData.retirementContributions?.plan403b || 0,
      plan457: taxData.retirementContributions?.plan457 || 0,
      simpleIRA: taxData.retirementContributions?.simpleIRA || 0,
      sepIRA: taxData.retirementContributions?.sepIRA || 0,
      able: taxData.retirementContributions?.able || 0,
      tsp: taxData.retirementContributions?.tsp || 0,
      otherRetirementPlans: taxData.retirementContributions?.otherRetirementPlans || 0,
    },
  });

  // Calculate estimated Saver's Credit
  useEffect(() => {
    const watchedValues = form.watch(['traditionalIRA', 'plan401k', 'plan403b', 'plan457', 'simpleIRA', 'sepIRA', 'tsp']);
    const totalDeductibleContributions = watchedValues.reduce((sum, value) => sum + value, 0);

    const agi = taxData.income?.adjustedGrossIncome || 0;
    let creditRate = 0;

    // 2025 Saver's Credit income thresholds
    if (taxData.personalInfo?.filingStatus === 'married_joint') {
      if (agi <= 46000) creditRate = 0.50;
      else if (agi <= 50000) creditRate = 0.20;
      else if (agi <= 77000) creditRate = 0.10;
    } else {
      if (agi <= 23000) creditRate = 0.50;
      else if (agi <= 25000) creditRate = 0.20;
      else if (agi <= 38500) creditRate = 0.10;
    }

    const maxCreditableAmount = Math.min(totalDeductibleContributions, 2000);
    setEstimatedCredit(maxCreditableAmount * creditRate);
  }, [form.watch, taxData.income?.adjustedGrossIncome, taxData.personalInfo?.filingStatus]);

  const onSubmit = async (data: RetirementFormData) => {
    const totalContributions = Object.values(data).reduce((sum, value) => sum + value, 0);
    
    const retirementContributions = {
      ...data,
      totalContributions,
    };

    // Update adjustments to include retirement contributions in AGI calculation
    const updatedAdjustments = {
      studentLoanInterest: taxData.income?.adjustments?.studentLoanInterest || 0,
      otherAdjustments: taxData.income?.adjustments?.otherAdjustments || 0,
      retirementContributions: data.traditionalIRA + data.plan401k + data.plan403b + 
                               data.plan457 + data.simpleIRA + data.sepIRA + data.tsp
    };

    // Recalculate AGI
    const totalIncome = taxData.income?.totalIncome || 0;
    const totalAdjustments = Object.values(updatedAdjustments).reduce((sum, value) => sum + value, 0);
    const adjustedGrossIncome = Math.max(0, totalIncome - totalAdjustments);

    await updateTaxData({
      retirementContributions,
      income: {
        wages: taxData.income?.wages || 0,
        otherEarnedIncome: taxData.income?.otherEarnedIncome || 0,
        interestIncome: taxData.income?.interestIncome || 0,
        dividends: taxData.income?.dividends || 0,
        businessIncome: taxData.income?.businessIncome || 0,
        capitalGains: taxData.income?.capitalGains || 0,
        rentalIncome: taxData.income?.rentalIncome || 0,
        retirementIncome: taxData.income?.retirementIncome || 0,
        unemploymentIncome: taxData.income?.unemploymentIncome || 0,
        otherIncome: taxData.income?.otherIncome || 0,
        totalIncome: taxData.income?.totalIncome || 0,
        additionalIncomeItems: taxData.income?.additionalIncomeItems || [],
        additionalAdjustmentItems: taxData.income?.additionalAdjustmentItems || [],
        adjustments: updatedAdjustments,
        adjustedGrossIncome,
      }
    });

    navigate('/deductions');
  };

  const getLimit = (planType: keyof typeof CONTRIBUTION_LIMITS_2025, isOver50: boolean = userAge >= 50) => {
    const limit = CONTRIBUTION_LIMITS_2025[planType];
    if (typeof limit === 'object' && 'under50' in limit) {
      return isOver50 ? limit.over50 : limit.under50;
    }
    if (typeof limit === 'object' && 'lesserOf' in limit) {
      return limit.lesserOf;
    }
    return limit;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary-dark mb-2">은퇴 계획 기여금</h1>
        <p className="text-gray-dark">세금 혜택을 받을 수 있는 은퇴 계획 기여금을 입력하세요.</p>
      </div>

      {/* 메인 컨텐츠 - 입력 폼과 동영상을 나란히 배치 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 폼 영역 (1/2 너비) */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {estimatedCredit > 0 && (
              <Alert className="bg-green-50 border-green-200">
                <TrendingUpIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>세이버즈 크레딧 예상액: ${estimatedCredit.toFixed(0)}</strong>
                  <br />
                  귀하의 소득 수준에서 은퇴 기여금에 대한 세금 크레딧을 받을 수 있습니다.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Tax-Deductible Retirement Plans */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PiggyBankIcon className="h-5 w-5" />
                      세금 공제 가능한 은퇴 계획
                    </CardTitle>
                    <CardDescription>
                      이 기여금들은 소득에서 공제되어 현재 세금을 줄여줍니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Traditional IRA */}
                    <FormField
                      control={form.control}
                      name="traditionalIRA"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            Traditional IRA
                            <Badge variant="outline">
                              한도: ${getLimit('traditionalIRA').toLocaleString()}
                            </Badge>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="$0"
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  field.onChange(0);
                                } else {
                                  const numValue = Number(value);
                                  field.onChange(isNaN(numValue) ? 0 : numValue);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 401(k) */}
                    <FormField
                      control={form.control}
                      name="plan401k"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            401(k) Plan
                            <Badge variant="outline">
                              한도: ${getLimit('plan401k').toLocaleString()}
                            </Badge>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="$0"
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  field.onChange(0);
                                } else {
                                  const numValue = Number(value);
                                  field.onChange(isNaN(numValue) ? 0 : numValue);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 403(b) */}
                    <FormField
                      control={form.control}
                      name="plan403b"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            403(b) Plan
                            <Badge variant="outline">
                              한도: ${getLimit('plan403b').toLocaleString()}
                            </Badge>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="$0"
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  field.onChange(0);
                                } else {
                                  const numValue = Number(value);
                                  field.onChange(isNaN(numValue) ? 0 : numValue);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* SIMPLE IRA */}
                    <FormField
                      control={form.control}
                      name="simpleIRA"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            SIMPLE IRA
                            <Badge variant="outline">
                              한도: ${getLimit('simpleIRA').toLocaleString()}
                            </Badge>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="$0"
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  field.onChange(0);
                                } else {
                                  const numValue = Number(value);
                                  field.onChange(isNaN(numValue) ? 0 : numValue);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* SEP IRA */}
                    <FormField
                      control={form.control}
                      name="sepIRA"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            SEP IRA
                            <Badge variant="outline">
                              한도: 25% of income or $70,000
                            </Badge>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="$0"
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  field.onChange(0);
                                } else {
                                  const numValue = Number(value);
                                  field.onChange(isNaN(numValue) ? 0 : numValue);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* After-Tax Retirement Plans */}
                <Card>
                  <CardHeader>
                    <CardTitle>세후 은퇴 계획</CardTitle>
                    <CardDescription>
                      이 기여금들은 세금 공제가 되지 않지만 성장과 인출시 세금 혜택이 있습니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Roth IRA */}
                    <FormField
                      control={form.control}
                      name="rothIRA"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            Roth IRA
                            <Badge variant="outline">
                              한도: ${getLimit('rothIRA').toLocaleString()}
                            </Badge>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="$0"
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  field.onChange(0);
                                } else {
                                  const numValue = Number(value);
                                  field.onChange(isNaN(numValue) ? 0 : numValue);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* AGI Impact Summary */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle>조정총소득 영향</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>현재 AGI (Current AGI):</span>
                        <span>${(taxData.income?.adjustedGrossIncome || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>은퇴 기여금 공제:</span>
                        <span>${(form.watch('traditionalIRA') + form.watch('plan401k') + 
                                 form.watch('plan403b') + form.watch('plan457') + 
                                 form.watch('simpleIRA') + form.watch('sepIRA') + 
                                 form.watch('tsp')).toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>예상 조정총소득 (Projected AGI):</span>
                        <span>
                          ${Math.max(0, (taxData.income?.adjustedGrossIncome || 0) - 
                             (form.watch('traditionalIRA') + form.watch('plan401k') + 
                              form.watch('plan403b') + form.watch('plan457') + 
                              form.watch('simpleIRA') + form.watch('sepIRA') + 
                              form.watch('tsp'))).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-green-600 mt-2">
                        💡 은퇴 기여금으로 인한 세금 절약액: 약 ${Math.round(
                          (form.watch('traditionalIRA') + form.watch('plan401k') + 
                           form.watch('plan403b') + form.watch('plan457') + 
                           form.watch('simpleIRA') + form.watch('sepIRA') + 
                           form.watch('tsp')) * 0.22
                        ).toLocaleString()} (22% 세율 기준)
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/income')}
                  >
                    이전 단계
                  </Button>
                  <Button type="submit">
                    다음 단계 (공제)
                  </Button>
                </div>
              </form>
            </Form>

            {/* Information Alert */}
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>참고사항:</strong> 은퇴 계획 기여금 한도는 2025년 IRS 규정에 따릅니다. 
                50세 이상인 경우 추가 기여금(catch-up contributions)이 허용됩니다. 
                실제 한도는 소득 수준과 고용주 계획에 따라 달라질 수 있습니다.
              </AlertDescription>
            </Alert>
          </div>
        </div>
        
        {/* 동영상 영역 (1/2 너비) */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">은퇴계획 기여금 입력 방법 안내</h3>
                <p className="text-sm text-gray-600">세금 혜택을 받을 수 있는 은퇴계획 기여금 입력 과정을 확인하세요</p>
              </div>
              <div className="w-full">
                <div className="relative pb-[75%] h-0 overflow-hidden rounded-lg shadow-md">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/kce8i5gAG1k"
                    title="은퇴계획 기여금 입력 방법 안내"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500 text-center">
                은퇴계획 기여금 세금 혜택 활용 방법을 동영상으로 확인하세요
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}