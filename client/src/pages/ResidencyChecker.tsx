import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Home, Calendar } from 'lucide-react';
import { ChatBot } from '@/components/ChatBot';

const residencySchema = z.object({
  currentYearDays: z.number().min(0).max(365),
  previousYearDays: z.number().min(0).max(365),
  twoPreviousYearDays: z.number().min(0).max(365),
});

type ResidencyData = z.infer<typeof residencySchema>;

interface ResidencyResult {
  totalDays: number;
  isResident: boolean;
  breakdown: {
    current: number;
    previous: number;
    twoPrevious: number;
  };
}

const ResidencyChecker: React.FC = () => {
  const [result, setResult] = useState<ResidencyResult | null>(null);

  const form = useForm<ResidencyData>({
    resolver: zodResolver(residencySchema),
    defaultValues: {
      currentYearDays: 0,
      previousYearDays: 0,
      twoPreviousYearDays: 0,
    }
  });

  const calculateResidency = (data: ResidencyData): ResidencyResult => {
    const currentYearDays = data.currentYearDays;
    const previousYearDays = Math.round(data.previousYearDays * (1/3));
    const twoPreviousYearDays = Math.round(data.twoPreviousYearDays * (1/6));
    
    const totalDays = currentYearDays + previousYearDays + twoPreviousYearDays;
    const isResident = totalDays >= 183;

    return {
      totalDays: Math.round(totalDays),
      isResident,
      breakdown: {
        current: currentYearDays,
        previous: previousYearDays,
        twoPrevious: twoPreviousYearDays,
      }
    };
  };

  const onSubmit = (data: ResidencyData) => {
    const calculationResult = calculateResidency(data);
    setResult(calculationResult);
  };

  const resetForm = () => {
    form.reset();
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Home className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">미국 거주자 여부 확인</h1>
            <p className="text-gray-600 mt-2">
              미국 세법상 거주자 판정을 위한 실질적 거주 테스트 (Substantial Presence Test)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              거주일수 입력
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="currentYearDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          금년(2024) 체류일수
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="365"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousYearDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          전년(2023) 체류일수
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="365"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twoPreviousYearDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          전전년(2022) 체류일수
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="365"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4 justify-center">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Calculator className="h-4 w-4 mr-2" />
                    거주자 여부 계산
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    초기화
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* 계산 공식 설명 */}
        <Card>
          <CardHeader>
            <CardTitle>실질적 거주 테스트 (Substantial Presence Test)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">계산 공식</h3>
                <p className="text-blue-800">
                  <strong>금년 체류일수</strong> + 
                  (<strong>전년도 체류일수</strong> × 1/3) + 
                  (<strong>전전년도 체류일수</strong> × 1/6) = <strong>183일 이상</strong>
                </p>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 계산 결과가 183일 이상이면 미국 세법상 거주자로 분류됩니다.</p>
                <p>• 미국 거주자는 전 세계 소득에 대해 미국에서 세금을 납부해야 합니다.</p>
                <p>• 조약 혜택(Tax Treaty)이나 기타 예외사항이 있을 수 있으니 전문가와 상담하세요.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 계산 결과 */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>계산 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {result.breakdown.current}일
                    </div>
                    <div className="text-sm text-gray-600">금년 체류일수</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {result.breakdown.previous}일
                    </div>
                    <div className="text-sm text-gray-600">전년도 (× 1/3)</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {result.breakdown.twoPrevious}일
                    </div>
                    <div className="text-sm text-gray-600">전전년도 (× 1/6)</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      총 {result.totalDays}일
                    </div>
                    
                    <Alert className={result.isResident ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                      <AlertDescription className={result.isResident ? "text-red-800" : "text-green-800"}>
                        {result.isResident ? (
                          <span className="font-semibold">
                            🏠 미국 세법상 거주자입니다 (183일 이상)
                            <br />
                            전 세계 소득에 대해 미국 세금 신고 의무가 있습니다.
                          </span>
                        ) : (
                          <span className="font-semibold">
                            ✈️ 미국 세법상 비거주자입니다 (183일 미만)
                            <br />
                            미국 원천소득에 대해서만 세금 신고 의무가 있습니다.
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ChatBot context="거주자여부확인" />
    </div>
  );
};

export default ResidencyChecker;