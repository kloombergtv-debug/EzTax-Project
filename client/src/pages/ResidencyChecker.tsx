import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, type ZodType } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Home, Calendar, GraduationCap, ArrowLeft } from 'lucide-react';
import { ChatBot } from '@/components/ChatBot';
import { useLocation } from 'wouter';

const residencySchema = z.object({
  currentDate: z.string().min(1, "현재 날짜를 입력해주세요"),
  currentYearDays: z.number().min(0).max(366),
  previousYearDays: z.number().min(0).max(366),
  twoPreviousYearDays: z.number().min(0).max(366),
  visaType: z.enum(['f1_student', 'j1_student', 'm1_student', 'j1_non_student', 'h1b', 'l1', 'o1', 'tn', 'e2', 'eb_immigrant']),
  visaStartDate: z.string().optional(),
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
  isVisaException: boolean;
  visaNote?: string;
  exemptionYears?: number;
}

const ResidencyChecker: React.FC = () => {
  const [result, setResult] = useState<ResidencyResult | null>(null);
  const [showVisaFields, setShowVisaFields] = useState(true);
  const [, navigate] = useLocation();

  // 현재 날짜를 자동으로 설정 (UTC 시간대 고려)
  const getCurrentDate = () => {
    const today = new Date();
    // UTC 기준으로 날짜 계산하여 시간대 문제 방지
    const year = today.getUTCFullYear();
    const month = String(today.getUTCMonth() + 1).padStart(2, '0');
    const day = String(today.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const form = useForm<ResidencyData>({
    resolver: zodResolver(residencySchema),
    defaultValues: {
      currentDate: getCurrentDate(), // 자동으로 오늘 날짜 설정
      currentYearDays: 0,
      previousYearDays: 0,
      twoPreviousYearDays: 0,
      visaType: 'f1_student' as const,
      visaStartDate: "",
    }
  });

  const calculateResidency = (data: ResidencyData): ResidencyResult => {
    // 현재 날짜와 세금 신고 대상 연도 계산
    const inputDate = new Date(data.currentDate);
    const inputYear = inputDate.getFullYear();
    const taxYear = inputYear - 1; // 세금 신고 대상 연도 (예: 2025년 → 2024년 신고)
    
    // 계산 기준일을 세금 신고 대상 연도의 12월 31일로 설정
    const calculationDate = new Date(taxYear, 11, 31); // 12월은 11 (0-based)
    
    // 면제 체류 기간 계산 (미국 최초 입국일부터 세금 신고 대상 연도 말까지)
    let exemptYears = 0;
    let exemptDays = 0;
    let exemptCalendarYears = 0; // F-1 학생용 캘린더 연도 계산
    
    if (data.visaStartDate) {
      const firstEntryDate = new Date(data.visaStartDate);
      const timeDiff = calculationDate.getTime() - firstEntryDate.getTime();
      exemptDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      exemptYears = Math.floor(exemptDays / 365.25); // 윤년 고려 (J-1 Non-student용)
      
      // F-1 학생 비자용 캘린더 연도 계산
      const entryYear = firstEntryDate.getFullYear();
      exemptCalendarYears = taxYear - entryYear + 1; // 입국년도부터 세금신고대상연도까지
      
      console.log('거주자 계산 디버그:', {
        visaType: data.visaType,
        firstEntryDate: firstEntryDate.toLocaleDateString('ko-KR'),
        inputDate: inputDate.toLocaleDateString('ko-KR'),
        calculationDate: calculationDate.toLocaleDateString('ko-KR'),
        inputDateRaw: data.currentDate, // 원본 입력값 확인
        taxYear,
        entryYear: firstEntryDate.getFullYear(),
        exemptDays,
        exemptYears: (exemptDays/365.25).toFixed(2) + '년', // J-1용
        exemptCalendarYears: exemptCalendarYears + '캘린더년' // F-1용
      });
    }

    // 비자별 예외 규정 확인
    let exemptionLimit = 0;
    let visaNote = '';
    
    if (data.visaType === 'f1_student' || data.visaType === 'j1_student' || data.visaType === 'm1_student') {
      exemptionLimit = 5;
      console.log('학생 비자 계산:', {
        visaType: data.visaType,
        exemptCalendarYears,
        condition: exemptCalendarYears < 5
      });
      
      if (exemptCalendarYears < 5) {
        console.log(`${data.visaType.toUpperCase()} 학생: 캘린더 ${exemptCalendarYears}년 (5년 미만)으로 비거주자 반환`);
        return {
          totalDays: 0,
          isResident: false,
          breakdown: {
            current: 0,
            previous: 0,
            twoPrevious: 0,
          },
          isVisaException: true,
          visaNote: `${data.visaType.toUpperCase()} 학생: 5년 미만 → 자동 비거주자`,
          exemptionYears: 5
        };
      } else {
        visaNote = `${data.visaType.toUpperCase()} 학생: 5년 초과 → 일반 SPT 적용`;
      }
    } else if (data.visaType === 'j1_non_student') {
      exemptionLimit = 2;
      console.log('J-1 Non-student 계산:', {
        exemptYears,
        exemptDays,
        condition: exemptYears < 2
      });
      
      if (exemptYears < 2) {
        console.log('J-1 Non-student: 2년 미만으로 비거주자 반환');
        return {
          totalDays: 0,
          isResident: false,
          breakdown: {
            current: 0,
            previous: 0,
            twoPrevious: 0,
          },
          isVisaException: true,
          visaNote: `J-1 비학생 (교수/연구원): 2년 미만 → 자동 비거주자`,
          exemptionYears: 2
        };
      } else {
        // J-1 Non-Student는 6년 중 2년 룰 적용
        if (exemptYears >= 2 && exemptYears < 6) {
          visaNote = `J-1 비학생: 2년 이상 → 일반 SPT 적용`;
        } else if (exemptYears >= 6) {
          visaNote = `J-1 비학생: 6년 초과 → 6년 중 2년 면제 규칙 확인 필요`;
        }
      }
    } else if (['h1b', 'l1', 'o1', 'tn', 'e2', 'eb_immigrant'].includes(data.visaType)) {
      // 취업/투자/이민 비자는 면제 기간 없음 - 바로 일반 SPT 적용
      const visaTypeNames = {
        h1b: 'H-1B (전문직 취업)',
        l1: 'L-1 (주재원 파견)',
        o1: 'O-1 (특기자)',
        tn: 'TN (NAFTA/USMCA 전문직)',
        e2: 'E-2 (투자자)',
        eb_immigrant: 'EB 이민비자/영주권자'
      };
      visaNote = `${visaTypeNames[data.visaType as keyof typeof visaTypeNames]}: 면제 기간 없음 → 일반 SPT 규칙 적용`;
    }

    // 일반 SPT 계산
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
      isVisaException: false,
      visaNote: visaNote || undefined,
      exemptionYears: exemptionLimit
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
                          <br />
                          <span className="text-green-600">
                            ✓ 거주자 판정은 자동으로 {new Date(field.value).getFullYear() - 1}년 12월 31일까지 계산됩니다
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

                {/* 비자 타입 선택 */}
                <div className="border-t pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <label className="text-sm font-medium">
                      비자 타입 선택
                    </label>
                  </div>

                  
                  <FormField
                    control={form.control}
                    name="visaType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <select
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              const hasExemption = ['f1_student', 'j1_student', 'm1_student', 'j1_non_student'].includes(e.target.value);
                              setShowVisaFields(hasExemption);
                            }}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <optgroup label="학생 비자 (면제 기간 있음)">
                              <option value="f1_student">F-1 Student (학생)</option>
                              <option value="j1_student">J-1 Student (학생)</option>
                              <option value="m1_student">M-1 Student (학생)</option>
                              <option value="j1_non_student">J-1 Non-Student (교수/연구원)</option>
                            </optgroup>
                            <optgroup label="취업/투자 비자 (면제 기간 없음)">
                              <option value="h1b">H-1B (전문직 취업)</option>
                              <option value="l1">L-1 (주재원 파견)</option>
                              <option value="o1">O-1 (특기자)</option>
                              <option value="tn">TN (NAFTA/USMCA 전문직)</option>
                              <option value="e2">E-2 (투자자)</option>
                              <option value="eb_immigrant">EB 이민비자/영주권자</option>
                            </optgroup>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {showVisaFields && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <FormField
                        control={form.control}
                        name="visaStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-blue-900">미국 최초 입국일 (해당 비자를 가지고 미국에 입국한 날짜)</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                className="bg-white"
                              />
                            </FormControl>
                            <div className="text-xs text-blue-700 mt-1 space-y-1">
                              <div><strong>⚠️ 중요: 면제 기간 계산 방법</strong></div>
                              <div>• 비자 발급일이 아닌 <strong>미국 최초 입국일</strong>부터 계산</div>
                              <div>• <strong>면제 체류자(exempt individual)</strong>로 체류한 <strong>첫 달력연도</strong>부터 카운트</div>
                              <div>• <strong>면제기간(Exempt Period)</strong>은 미국 체류일수와 관계없이, <strong>캘린더 연도로 계산됨</strong></div>
                              <div>• <strong>F-1, J-1, M-1 Student:</strong> 5년 미만 자동 비거주자</div>
                              <div>• <strong>J-1 Non-Student:</strong> 2년 미만 자동 비거주자</div>
                              <div>• <strong>H-1B, L-1, O-1, TN, E-2, EB:</strong> 면제 기간 없음 (바로 SPT 적용)</div>
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
                  비자별 특별 규정
                </h4>
                <div className="text-sm text-amber-800 space-y-1">
                  <p>• <strong>면제 기간 있는 비자:</strong></p>
                  <p className="ml-4">- F-1, J-1, M-1 Student: 5년간 SPT 제외</p>
                  <p className="ml-4">- J-1 Non-Student: 2년간 SPT 제외</p>
                  <p>• <strong>면제 기간 없는 비자:</strong></p>
                  <p className="ml-4">- H-1B, L-1, O-1, TN, E-2, EB 이민비자/영주권: 바로 일반 SPT 적용</p>
                  <p>• <strong>계산 기준:</strong> 비자 발급일이 아닌 미국 최초 입국일부터</p>
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
                    {!result.isVisaException && (
                      <div className="text-3xl font-bold mb-2">
                        총 {result.totalDays}일
                      </div>
                    )}
                    
                    {result.visaNote && (
                      <div className="mb-4 p-3 bg-blue-100 rounded-lg">
                        <div className="flex items-center justify-center gap-2 text-blue-800">
                          <GraduationCap className="h-5 w-5" />
                          <span className="font-medium">{result.visaNote}</span>
                        </div>
                      </div>
                    )}
                    
                    <Alert className={result.isResident ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                      <AlertDescription className={`${result.isResident ? "text-red-800" : "text-green-800"} text-lg`}>
                        {result.isResident ? (
                          <span className="font-bold text-xl">
                            🏠 미국 세법상 거주자입니다 {!result.isVisaException && "(183일 이상)"}
                            <br />
                            <span className="text-lg">전 세계 소득에 대해 미국 세금 신고 의무가 있습니다.</span>
                          </span>
                        ) : (
                          <span className="font-bold text-xl">
                            ✈️ 미국 세법상 비거주자입니다 
                            {result.isVisaException ? "(비자 예외)" : "(183일 미만)"}
                            <br />
                            <span className="text-lg">미국 원천소득에 대해서만 세금 신고 의무가 있습니다-비거주자(1040-NR)로 신고</span>
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>

                    {/* 결과 저장하고 돌아가기 버튼 */}
                    <div className="mt-6 text-center">
                      <Button 
                        type="button" 
                        onClick={() => {
                          // 결과를 localStorage에 저장
                          localStorage.setItem('residencyResult', JSON.stringify({
                            isResident: result.isResident,
                            isNonresidentAlien: !result.isResident,
                            timestamp: new Date().toISOString()
                          }));
                          
                          // PersonalInfo 페이지로 돌아가기
                          navigate('/personal-info');
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        결과 저장하고 기본정보로 돌아가기
                      </Button>
                    </div>
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