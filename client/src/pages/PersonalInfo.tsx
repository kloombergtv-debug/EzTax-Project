import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalInfoSchema, type PersonalInformation } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Save, RefreshCw } from 'lucide-react';
import ProgressTracker from '@/components/ProgressTracker';
import { useTaxContext } from '../context/TaxContext';
import { useLocation } from 'wouter';

const relationshipOptions = [
  { value: "child", label: "자녀 (Child)" },
  { value: "parent", label: "부모 (Parent)" },
  { value: "grandparent", label: "조부모 (Grandparent)" },
  { value: "sibling", label: "형제자매 (Sibling)" },
  { value: "grandchild", label: "손자녀 (Grandchild)" },
  { value: "niece_nephew", label: "조카 (Niece/Nephew)" },
  { value: "aunt_uncle", label: "삼촌/이모/고모 (Aunt/Uncle)" },
  { value: "in_law", label: "인척 (In-law)" },
  { value: "foster_child", label: "위탁 자녀 (Foster Child)" },
  { value: "other", label: "기타 (Other)" },
];

const PersonalInfo: React.FC = () => {
  // 모든 Hook을 최상단에 선언 (조건부 호출 금지)
  const { taxData, updateTaxData, isDataReady } = useTaxContext();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showSpouseInfo, setShowSpouseInfo] = useState(false);
  const [manualLoadComplete, setManualLoadComplete] = useState(false);

  const emptyDefaults: PersonalInformation = {
    firstName: '',
    middleInitial: '', // 기본값 유지하되 UI에서 숨김
    lastName: '',
    ssn: '', // 기본값 유지하되 UI에서 숨김
    dateOfBirth: '',
    email: '',
    phone: '', // 기본값 유지하되 UI에서 숨김
    address1: '', // 기본값 유지하되 UI에서 숨김
    address2: '', // 기본값 유지하되 UI에서 숨김
    city: '',
    state: '',
    zipCode: '', // 기본값 유지하되 UI에서 숨김
    filingStatus: 'single',
    isDisabled: false,
    isNonresidentAlien: false,
    dependents: [],
    spouseInfo: undefined
  };

  const form = useForm<PersonalInformation>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: taxData.personalInfo || emptyDefaults
  });

  const { fields: dependentFields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dependents'
  });

  const filingStatus = form.watch('filingStatus');

  // 데이터 로딩 완료 후 폼 초기화
  useEffect(() => {
    if (!isDataReady || manualLoadComplete) {
      return;
    }
    
    // 저장된 데이터가 있으면 폼에 반영
    if (taxData.personalInfo) {
      console.log("PersonalInfo - 서버 데이터로 폼 초기화:", taxData.personalInfo);
      form.reset(taxData.personalInfo);
    } else {
      // localStorage에서 임시 데이터 확인
      try {
        const tempPersonalInfo = localStorage.getItem('tempPersonalInfo');
        if (tempPersonalInfo) {
          const parsedData = JSON.parse(tempPersonalInfo);
          console.log("PersonalInfo - localStorage 데이터로 폼 초기화:", parsedData);
          form.reset({ ...emptyDefaults, ...parsedData });
        }
      } catch (error) {
        console.error("localStorage 데이터 복원 오류:", error);
      }
    }
  }, [isDataReady, taxData.personalInfo, form, manualLoadComplete]);

  useEffect(() => {
    const shouldShowSpouse = filingStatus === 'married_joint' || filingStatus === 'married_separate';
    setShowSpouseInfo(shouldShowSpouse);
  }, [filingStatus]);

  // 데이터 로딩 체크는 모든 Hook 이후에
  if (!isDataReady) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-center">데이터 로딩 중...</div>
      </div>
    );
  }

  const onSubmit = async (data: PersonalInformation) => {
    try {
      // localStorage에 백업 저장
      localStorage.setItem('tempPersonalInfo', JSON.stringify(data));
      
      await updateTaxData({ personalInfo: data });
      
      // 성공 시 임시 데이터 정리
      localStorage.removeItem('tempPersonalInfo');
      localStorage.removeItem('tempFilingStatus');
      
      toast({
        title: "저장 완료",
        description: "개인정보가 성공적으로 저장되었습니다.",
      });
      
      setTimeout(() => {
        navigate('/income');
      }, 1000);
    } catch (error) {
      console.error("개인정보 저장 오류:", error);
      toast({
        title: "저장 실패",
        description: "개인정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const addDependent = () => {
    append({
      firstName: '',
      lastName: '',
      ssn: '',
      relationship: relationshipOptions[0].value,
      dateOfBirth: '',
      isDisabled: false,
      isNonresidentAlien: false,
      isQualifyingChild: true
    });
  };

  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  // 수동 데이터 불러오기 함수
  const handleManualDataReload = async () => {
    try {
      const response = await fetch('/api/tax-return', {
        credentials: 'include',
        cache: 'no-cache'
      });

      if (response.ok) {
        const serverData = await response.json();
        console.log('수동 데이터 불러오기 결과:', serverData);
        
        if (serverData?.personalInfo) {
          const personalInfo = serverData.personalInfo;
          console.log('불러온 개인정보 데이터:', personalInfo);
          
          // 폼 완전 재설정
          form.reset({
            firstName: personalInfo.firstName || '',
            middleInitial: personalInfo.middleInitial || '',
            lastName: personalInfo.lastName || '',
            ssn: personalInfo.ssn || '',
            dateOfBirth: personalInfo.dateOfBirth || '',
            email: personalInfo.email || '',
            phone: personalInfo.phone || '',
            address1: personalInfo.address1 || '',
            address2: personalInfo.address2 || '',
            city: personalInfo.city || '',
            state: personalInfo.state || '',
            zipCode: personalInfo.zipCode || '',
            filingStatus: personalInfo.filingStatus || 'single',
            isDisabled: personalInfo.isDisabled || false,
            isNonresidentAlien: personalInfo.isNonresidentAlien || false,
            spouseInfo: personalInfo.spouseInfo || {
              firstName: '',
              lastName: '',
              ssn: '',
              dateOfBirth: '',
              isDisabled: false,
              isNonresidentAlien: false
            },
            dependents: personalInfo.dependents || []
          });

          // TaxContext 업데이트를 통한 데이터 반영
          await updateTaxData({ personalInfo: personalInfo });
          
          // 강제로 페이지 새로고침하여 데이터 반영
          window.location.reload();

          // Filing Status에 따른 배우자 정보 표시 설정
          const maritalStatuses = ['married_joint', 'married_separate'];
          setShowSpouseInfo(maritalStatuses.includes(personalInfo.filingStatus || 'single'));

          // 수동 로드 완료 표시
          setManualLoadComplete(true);
          
          // 강제 리렌더링 및 디버깅
          setTimeout(() => {
            console.log('폼 재설정 후 현재 값들:', form.getValues());
            console.log('폼 상태:', form.formState);
          }, 100);

          toast({
            title: "데이터 불러오기 완료",
            description: `${personalInfo.firstName} ${personalInfo.lastName}님의 정보를 불러왔습니다.`,
          });
        } else {
          toast({
            title: "저장된 데이터 없음",
            description: "저장된 개인정보가 없습니다.",
            variant: "destructive",
          });
        }
      } else {
        throw new Error('데이터 불러오기 실패');
      }
    } catch (error) {
      console.error('수동 데이터 불러오기 오류:', error);
      toast({
        title: "데이터 불러오기 실패",
        description: "저장된 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <ProgressTracker currentStep="personal-info" />
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">개인정보 (Personal Information)</h1>
            <p className="text-gray-600">세금 신고서 작성을 위해 개인정보를 입력해주세요.</p>
          </div>
          <Button 
            type="button" 
            onClick={handleManualDataReload}
            variant="outline"
            className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            저장된 데이터 불러오기
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* 기본 개인정보 */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름 (First Name)</FormLabel>
                      <FormControl>
                        <Input placeholder="이름을 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>성 (Last Name)</FormLabel>
                      <FormControl>
                        <Input placeholder="성을 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>출생연도 (Birth Year)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="예: 1990" 
                          min="1900" 
                          max={new Date().getFullYear()}
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일 (Email)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="이메일 주소" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


            </CardContent>
          </Card>

          {/* 주소 정보 */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">주소 정보</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>시/군 (City)</FormLabel>
                        <FormControl>
                          <Input placeholder="도시명" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>주 (State)</FormLabel>
                        <FormControl>
                          <Input placeholder="주 코드 (예: TX)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 신고 상태 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">신고 상태 (Filing Status)</h2>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    // 현재 폼 데이터를 localStorage에 저장
                    const currentFormData = form.getValues();
                    localStorage.setItem('tempPersonalInfo', JSON.stringify(currentFormData));
                    console.log("Filing Status 확인 전 데이터 저장:", currentFormData);
                    navigate('/filing-status-checker');
                  }}
                  className="text-sm"
                >
                  Filing Status 확인
                </Button>
              </div>
              
              <FormField
                control={form.control}
                name="filingStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>신고 상태</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="신고 상태를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">미혼 (Single)</SelectItem>
                        <SelectItem value="married_joint">부부합산신고 (Married Filing Jointly)</SelectItem>
                        <SelectItem value="married_separate">부부개별신고 (Married Filing Separately)</SelectItem>
                        <SelectItem value="head_of_household">세대주 (Head of Household)</SelectItem>
                        <SelectItem value="qualifying_widow">적격미망인 (Qualifying Widow(er))</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 배우자 정보 (결혼한 경우에만 표시) */}
          {showSpouseInfo && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">배우자 정보 (Spouse Information)</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="spouseInfo.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>배우자 이름 (Spouse First Name)</FormLabel>
                        <FormControl>
                          <Input placeholder="배우자 이름" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="spouseInfo.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>배우자 성 (Spouse Last Name)</FormLabel>
                        <FormControl>
                          <Input placeholder="배우자 성" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>


                
                <FormField
                  control={form.control}
                  name="spouseInfo.dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>배우자 출생연도 (Spouse Birth Year)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="예: 1985" 
                          min="1900" 
                          max={new Date().getFullYear()}
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* 부양가족 정보 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">부양가족 (Dependents)</h2>
                <Button type="button" onClick={addDependent} variant="outline" size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  부양가족 추가
                </Button>
              </div>

              {dependentFields.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  부양가족이 없습니다. 위의 버튼을 클릭하여 추가하세요.
                </p>
              ) : (
                <div className="space-y-4">
                  {dependentFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">부양가족 {index + 1}</h3>
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`dependents.${index}.firstName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>이름</FormLabel>
                              <FormControl>
                                <Input placeholder="부양가족 이름" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`dependents.${index}.lastName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>성</FormLabel>
                              <FormControl>
                                <Input placeholder="부양가족 성" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`dependents.${index}.relationship`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>관계</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="관계 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {relationshipOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`dependents.${index}.dateOfBirth`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>출생연도</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="예: 2010" 
                                  min="1900" 
                                  max={new Date().getFullYear()}
                                  {...field} 
                                  onChange={(e) => field.onChange(e.target.value)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>


                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 저장 버튼 */}
          <div className="flex justify-center mt-8">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg">
              <Save className="h-5 w-5 mr-3" />
              저장하고 계속
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PersonalInfo;