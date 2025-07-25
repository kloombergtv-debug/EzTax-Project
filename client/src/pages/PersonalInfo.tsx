import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTaxContext } from "@/context/TaxContext";
import { personalInfoSchema, type PersonalInformation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, RefreshCw } from "lucide-react";
import ProgressTracker from "@/components/ProgressTracker";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const FILING_STATUS_OPTIONS = [
  { value: "single", label: "미혼(Single)" },
  { value: "married_joint", label: "부부합산(Married Filing Jointly)" },
  { value: "married_separate", label: "부부별산(Married Filing Separately)" },
  { value: "head_of_household", label: "세대주(Head of Household)" },
  { value: "qualifying_widow", label: "적격과부(Qualifying Widow)" }
];

export default function PersonalInfo() {
  const [, setLocation] = useLocation();
  const { taxData, updateTaxData, isDataReady, loadTaxData } = useTaxContext();
  const { toast } = useToast();
  const [showSpouseInfo, setShowSpouseInfo] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const emptyDefaults: PersonalInformation = {
    firstName: '',
    middleInitial: '',
    lastName: '',
    ssn: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    filingStatus: 'single',
    isDisabled: false,
    isNonresidentAlien: false,
    dependents: [],
    spouseInfo: undefined
  };

  const form = useForm<PersonalInformation>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: emptyDefaults
  });

  const filingStatus = form.watch("filingStatus");

  // Income 페이지와 완전히 동일한 데이터 로딩 로직
  useEffect(() => {
    if (isDataReady && taxData.personalInfo && Object.keys(taxData.personalInfo).length > 0) {
      console.log("PersonalInfo - 서버 데이터로 폼 초기화:", taxData.personalInfo);
      
      const serverData = {
        firstName: taxData.personalInfo.firstName || '',
        middleInitial: taxData.personalInfo.middleInitial || '',
        lastName: taxData.personalInfo.lastName || '',
        ssn: taxData.personalInfo.ssn || '',
        dateOfBirth: taxData.personalInfo.dateOfBirth || '',
        email: taxData.personalInfo.email || '',
        phone: taxData.personalInfo.phone || '',
        address1: taxData.personalInfo.address1 || '',
        address2: taxData.personalInfo.address2 || '',
        city: taxData.personalInfo.city || '',
        state: taxData.personalInfo.state || '',
        zipCode: taxData.personalInfo.zipCode || '',
        filingStatus: taxData.personalInfo.filingStatus || 'single',
        isDisabled: taxData.personalInfo.isDisabled || false,
        isNonresidentAlien: taxData.personalInfo.isNonresidentAlien || false,
        dependents: taxData.personalInfo.dependents || [],
        spouseInfo: taxData.personalInfo.spouseInfo
      };
      
      console.log("PersonalInfo - 최종 폼 데이터:", serverData);
      form.reset(serverData);
      
      // 배우자 정보 표시 설정
      const shouldShowSpouse = serverData.filingStatus === 'married_joint' || serverData.filingStatus === 'married_separate';
      setShowSpouseInfo(shouldShowSpouse);
    }
  }, [isDataReady, taxData.personalInfo, form]);

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

      setLocation("/income");
    } catch (error) {
      console.error("개인정보 저장 오류:", error);
      toast({
        title: "저장 실패",
        description: "개인정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      console.log("수동 데이터 새로고침 시작");
      await loadTaxData();
      
      // 잠시 후 폼 데이터 강제 업데이트
      setTimeout(() => {
        if (taxData.personalInfo && Object.keys(taxData.personalInfo).length > 0) {
          console.log("새로고침 후 폼 업데이트:", taxData.personalInfo);
          form.reset(taxData.personalInfo);
          
          const shouldShowSpouse = taxData.personalInfo.filingStatus === 'married_joint' || 
                                   taxData.personalInfo.filingStatus === 'married_separate';
          setShowSpouseInfo(shouldShowSpouse);
        }
      }, 500);
      
      toast({
        title: "데이터 새로고침 완료",
        description: "저장된 개인정보를 성공적으로 불러왔습니다.",
      });
    } catch (error) {
      console.error("데이터 새로고침 오류:", error);
      toast({
        title: "새로고침 실패",
        description: "데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const addDependent = () => {
    const currentDependents = form.getValues("dependents") || [];
    form.setValue("dependents", [
      ...currentDependents,
      {
        firstName: "",
        lastName: "",
        ssn: "",
        relationship: "child",
        dateOfBirth: "",
        isDisabled: false,
        isNonresidentAlien: false,
        isQualifyingChild: false
      }
    ]);
  };

  const removeDependent = (index: number) => {
    const currentDependents = form.getValues("dependents") || [];
    form.setValue("dependents", currentDependents.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* 진행 단계 표시 */}
      <div className="mb-8">
        <ProgressTracker currentStep={1} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">개인정보 (Personal Information)</CardTitle>
              <p className="text-muted-foreground">세금 신고서 작성을 위해 개인정보를 입력해주세요.</p>
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">
                  ⚠️ 필수 입력 사항: <span className="font-bold">생년월일</span>과 <span className="font-bold">주(State)</span>만 입력하시면 다음 페이지로 진행할 수 있습니다.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  이름, 사회보장번호, 주소 등은 선택사항입니다. 배우자와 부양가족도 생년월일만 필수입니다.
                </p>
              </div>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? '불러오는 중...' : '저장된 데이터 불러오기'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* 기본 정보 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이름 (First Name) <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="이름을 입력하세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="middleInitial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>중간 이름 (Middle Initial)</FormLabel>
                        <FormControl>
                          <Input placeholder="중간 이름 (선택사항)" {...field} />
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
                        <FormLabel>성 (Last Name) <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="성을 입력하세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ssn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>사회보장번호 (SSN) <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="XXX-XX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>생년월일 (Date of Birth) <span className="text-red-500">*필수</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일 (Email) <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="이메일 주소" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>전화번호 (Phone) <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="XXX-XXX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 주소 정보 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">주소 정보</h3>
                <FormField
                  control={form.control}
                  name="address1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>주소 1 (Address Line 1) <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="주소를 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>주소 2 (Address Line 2) - 선택사항</FormLabel>
                      <FormControl>
                        <Input placeholder="아파트, 동, 호수 등" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>시/군 (City) <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
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
                        <FormLabel>주 (State) <span className="text-red-500">*필수</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="주 코드 (예: TX)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES.map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>우편번호 (ZIP Code) <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="우편번호" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Filing Status */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Filing Status</h3>
                <FormField
                  control={form.control}
                  name="filingStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>신고 형태를 선택하세요</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Filing Status를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FILING_STATUS_OPTIONS.map(option => (
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
              </div>

              {/* 특수 상황 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">특수 상황</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isDisabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>장애인 여부</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isNonresidentAlien"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>비거주 외국인 여부</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 배우자 정보 */}
              {showSpouseInfo && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">배우자 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="spouseInfo.firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>배우자 이름 <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
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
                          <FormLabel>배우자 성 <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                          <FormControl>
                            <Input placeholder="배우자 성" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="spouseInfo.ssn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>배우자 SSN <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                          <FormControl>
                            <Input placeholder="XXX-XX-XXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="spouseInfo.dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>배우자 생년월일 <span className="text-red-500">*필수</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* 부양가족 정보 */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">부양가족 정보</h3>
                  <Button type="button" onClick={addDependent} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    부양가족 추가
                  </Button>
                </div>
                
                {form.watch("dependents")?.map((_, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">부양가족 {index + 1}</Badge>
                      <Button
                        type="button"
                        onClick={() => removeDependent(index)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`dependents.${index}.firstName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이름 <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                            <FormControl>
                              <Input placeholder="이름" {...field} />
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
                            <FormLabel>성 <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                            <FormControl>
                              <Input placeholder="성" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`dependents.${index}.ssn`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SSN <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                            <FormControl>
                              <Input placeholder="XXX-XX-XXXX" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`dependents.${index}.relationship`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>관계 <span className="text-gray-400 text-sm">(선택사항)</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="관계 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="child">자녀</SelectItem>
                                <SelectItem value="parent">부모</SelectItem>
                                <SelectItem value="sibling">형제/자매</SelectItem>
                                <SelectItem value="other">기타</SelectItem>
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
                            <FormLabel>생년월일 <span className="text-red-500">*필수</span></FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                  이전
                </Button>
                <Button type="submit">
                  다음: 소득 정보
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}