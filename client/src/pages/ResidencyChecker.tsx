import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Home, Calendar, GraduationCap } from 'lucide-react';
import { ChatBot } from '@/components/ChatBot';

const residencySchema = z.object({
  currentDate: z.string().min(1, "현재 날짜를 입력해주세요"),
  currentYearDays: z.number().min(0).max(366),
  previousYearDays: z.number().min(0).max(366),
  twoPreviousYearDays: z.number().min(0).max(366),
  isStudent: z.boolean(),
  studentVisaStartDate: z.string().optional(),
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
  isStudentException: boolean;
  studentNote?: string;
}

const ResidencyChecker: React.FC = () => {
  const [result, setResult] = useState<ResidencyResult | null>(null);
  const [showStudentFields, setShowStudentFields] = useState(false);

  // 현재 날짜를 자동으로 설정
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const form = useForm<ResidencyData>({
    resolver: zodResolver(residencySchema),
    defaultValues: {
      currentDate: getCurrentDate(), // 자동으로 오늘 날짜 설정
      currentYearDays: 0,
      previousYearDays: 0,
      twoPreviousYearDays: 0,
      isStudent: false,
      studentVisaStartDate: "",
    }
  });

  const calculateResidency = (data: ResidencyData): ResidencyResult => {
    // 현재 날짜와 세금 신고 대상 연도 계산
    const currentDate = new Date(data.currentDate);
    const currentYear = currentDate.getFullYear();
    const taxYear = currentYear - 1; // 세금 신고 대상 연도 (예: 2025년 → 2024년 신고)
    
    // 학생 비자 기간 계산
    let studentYears = 0;
    if (data.isStudent && data.studentVisaStartDate) {
      const visaStartDate = new Date(data.studentVisaStartDate);
      const yearsDiff = currentDate.getFullYear() - visaStartDate.getFullYear();
      const monthsDiff = currentDate.getMonth() - visaStartDate.getMonth();
      studentYears = yearsDiff + (monthsDiff >= 0 ? 0 : -1);
    }

    // F1, J1, M1 학생 비자 예외 규정 확인 (5년 미만)
    if (data.isStudent && studentYears < 5) {
      return {
        totalDays: 0,
        isResident: false,
        breakdown: {
          current: 0,
          previous: 0,
          twoPrevious: 0,
        },
        isStudentException: true,
        studentNote: `학생 비자 ${Math.round(studentYears * 10) / 10}년차: 5년 미만으로 자동 비거주자 처리`
      };
    }

    // 일반 SPT 계산 (학생 5년 초과 포함)
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
      },
      isStudentException: false,
      studentNote: data.isStudent && studentYears >= 5 
        ? `학생 비자 ${Math.round(studentYears * 10) / 10}년차: 5년 초과로 일반 SPT 규칙 적용`
        : undefined
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
                {/* 현재 날짜 정보 */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">계산 기준일</span>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="currentDate"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-medium text-blue-900">
                            {new Date(field.value).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })}
                          </div>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              className="bg-white w-auto text-sm"
                            />
                          </FormControl>
                        </div>
                        <div className="text-sm text-blue-700 mt-2">
                          이 날짜를 기준으로 세금 신고 대상 연도가 자동 계산됩니다.
                          <br />
                          <span className="font-medium">
                            세금 신고 대상: {new Date(field.value).getFullYear() - 1}년도
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="currentYearDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          세금신고 대상년도 체류일수
                          <span className="text-sm text-gray-500">
                            ({new Date(form.watch('currentDate')).getFullYear() - 1}년)
                          </span>
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
                          전년도 체류일수
                          <span className="text-sm text-gray-500">
                            ({new Date(form.watch('currentDate')).getFullYear() - 2}년)
                          </span>
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
                          전전년도 체류일수
                          <span className="text-sm text-gray-500">
                            ({new Date(form.watch('currentDate')).getFullYear() - 3}년)
                          </span>
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

                {/* 학생 비자 예외 규정 */}
                <div className="border-t pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <label className="text-sm font-medium">
                      F1, J1, M1 학생 비자 소지자입니까?
                    </label>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="isStudent"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              setShowStudentFields(e.target.checked);
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-gray-600 cursor-pointer">
                          네, 학생 비자 소지자입니다 (F1/J1/M1)
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {showStudentFields && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <FormField
                        control={form.control}
                        name="studentVisaStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-blue-900">
                              학생 비자 시작일 (F1/J1/M1)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                className="bg-white"
                              />
                            </FormControl>
                            <div className="text-xs text-blue-700 mt-1">
                              • 비자 시작일부터 현재까지의 기간을 자동 계산합니다<br/>
                              • 5년 미만: 자동으로 비거주자 처리<br/>
                              • 5년 이상: 일반 SPT 규칙 적용
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
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
                  <strong>세금신고 대상년도 체류일수</strong> + 
                  (<strong>전년도 체류일수</strong> × 1/3) + 
                  (<strong>전전년도 체류일수</strong> × 1/6) = <strong>183일 이상</strong>
                </p>
                <div className="text-xs text-blue-600 mt-2">
                  입력하신 현재 날짜를 기준으로 해당 연도들이 자동 계산됩니다.
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 계산 결과가 183일 이상이면 미국 세법상 거주자로 분류됩니다.</p>
                <p>• 미국 거주자는 전 세계 소득에 대해 미국에서 세금을 납부해야 합니다.</p>
                <p>• 조약 혜택(Tax Treaty)이나 기타 예외사항이 있을 수 있으니 전문가와 상담하세요.</p>
              </div>
              
              <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  학생 비자 특별 규정 (F1/J1/M1)
                </h4>
                <div className="text-sm text-amber-800 space-y-1">
                  <p>• <strong>처음 5년:</strong> SPT 계산에서 체류일수 완전 제외 → 자동 비거주자</p>
                  <p>• <strong>5년 초과:</strong> 일반 SPT 규칙 적용 (183일 기준)</p>
                  <p>• <strong>추가 혜택:</strong> Closer Connection Exception, 한미조세조약 적용 가능</p>
                </div>
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
                    <div className="text-sm text-gray-600">2024년 체류일수</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {result.breakdown.previous}일
                    </div>
                    <div className="text-sm text-gray-600">2023년 (× 1/3)</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {result.breakdown.twoPrevious}일
                    </div>
                    <div className="text-sm text-gray-600">2022년 (× 1/6)</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-center">
                    {!result.isStudentException && (
                      <div className="text-3xl font-bold mb-2">
                        총 {result.totalDays}일
                      </div>
                    )}
                    
                    {result.studentNote && (
                      <div className="mb-4 p-3 bg-blue-100 rounded-lg">
                        <div className="flex items-center justify-center gap-2 text-blue-800">
                          <GraduationCap className="h-5 w-5" />
                          <span className="font-medium">{result.studentNote}</span>
                        </div>
                      </div>
                    )}
                    
                    <Alert className={result.isResident ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                      <AlertDescription className={result.isResident ? "text-red-800" : "text-green-800"}>
                        {result.isResident ? (
                          <span className="font-semibold">
                            🏠 미국 세법상 거주자입니다 {!result.isStudentException && "(183일 이상)"}
                            <br />
                            전 세계 소득에 대해 미국 세금 신고 의무가 있습니다.
                          </span>
                        ) : (
                          <span className="font-semibold">
                            ✈️ 미국 세법상 비거주자입니다 
                            {result.isStudentException ? "(학생 비자 예외)" : "(183일 미만)"}
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