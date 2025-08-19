import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  TrendingUpIcon, 
  PiggyBankIcon, 
  TargetIcon, 
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  Download,
  PhoneIcon,
  MailIcon
} from "lucide-react";

const retirementFormSchema = z.object({
  // 기본 정보
  currentAge: z.number().min(18).max(100),
  expectedRetirementAge: z.number().min(50).max(85),
  currentSavings: z.number().min(0),
  monthlyContribution: z.number().min(0),
  desiredRetirementIncome: z.number().min(0),
  expectedAnnualReturn: z.number().min(0).max(20).default(7),
  
  // 재정 상태
  currentIncome: z.number().min(0),
  emergencyFund: z.number().min(0),
  totalDebt: z.number().min(0),
  expectedSocialSecurityBenefit: z.number().min(0).default(0),
  
  // 생활 환경
  healthStatus: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  hasHealthInsurance: z.boolean().default(true),
  homeOwnership: z.enum(['own_outright', 'mortgage', 'rent']).default('mortgage'),
  familyStatus: z.enum(['single', 'married', 'divorced', 'widowed']).default('single'),
  dependentsCount: z.number().min(0).default(0),
  
  // 투자 성향
  investmentExperience: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
  expectedInflationRate: z.number().min(0).max(10).default(3)
});

type RetirementFormData = z.TypeOf<typeof retirementFormSchema>;

interface RetirementAnalysis {
  score: number;
  projectedSavings: number;
  additionalNeeded: number;
  monthlyNeeded: number;
  recommendations: string[];
  strengths: string[];
  concerns: string[];
  calculationDetails: {
    yearsToRetirement: number;
    investmentGrowth: number;
    contributionGrowth: number;
    socialSecurityValue: number;
    requiredAmount: number;
    requiredFromSavings: number;
    inflationAdjustedIncome: number;
    preparednessRatio: number;
    baseScore: number;
    financialHealthScore: number;
    lifestyleScore: number;
    emergencyRatio: number;
    debtRatio: number;
    savingsRate: number;
  };
}

export default function RetirementScoreStepByStep() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<RetirementAnalysis | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false]);
  const [showSSCalculator, setShowSSCalculator] = useState(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Consultation dialog state
  const [isConsultationDialogOpen, setIsConsultationDialogOpen] = useState(false);
  const [isSubmittingConsultation, setIsSubmittingConsultation] = useState(false);
  const [consultationFormData, setConsultationFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  
  // Social Security calculator state
  const [ssStartAge, setSsStartAge] = useState(25);
  const [ssRetireAge, setSsRetireAge] = useState(65);
  const [ssAvgSalary, setSsAvgSalary] = useState(80000);
  const [ssClaimAge, setSsClaimAge] = useState(67);

  const queryClient = useQueryClient();

  // Query for latest retirement assessment
  const { data: latestAssessment, isLoading: loadingAssessment } = useQuery({
    queryKey: ['/api/retirement-assessment/latest'],
  });

  // Mutation for saving retirement assessment
  const saveAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest({
        url: '/api/retirement-assessment',
        method: 'POST',
        body: data,
      });
      return response.json();
    },
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['/api/retirement-assessment/latest'] });
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: (error) => {
      console.error('Error saving assessment:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
  });

  const form = useForm<RetirementFormData>({
    resolver: zodResolver(retirementFormSchema),
    defaultValues: {
      currentAge: 45,
      expectedRetirementAge: 65,
      currentSavings: 0,
      monthlyContribution: 0,
      desiredRetirementIncome: 5000,
      expectedAnnualReturn: 7,
      currentIncome: 0,
      emergencyFund: 0,
      totalDebt: 0,
      expectedSocialSecurityBenefit: 0,
      healthStatus: 'good',
      hasHealthInsurance: true,
      homeOwnership: 'mortgage',
      familyStatus: 'single',
      dependentsCount: 0,
      investmentExperience: 'intermediate',
      riskTolerance: 'moderate',
      expectedInflationRate: 3
    }
  });

  // Load saved data when assessment is fetched
  useEffect(() => {
    if (latestAssessment?.assessmentData) {
      const data = latestAssessment.assessmentData;
      form.reset(data);
      
      // If results exist, set analysis
      if (latestAssessment.results) {
        setAnalysis({
          score: latestAssessment.results.totalScore,
          projectedSavings: latestAssessment.results.totalFutureValue,
          additionalNeeded: Math.max(0, latestAssessment.results.requiredFromSavings - latestAssessment.results.totalFutureValue),
          monthlyNeeded: Math.max(0, (latestAssessment.results.requiredFromSavings - latestAssessment.results.totalFutureValue) / (latestAssessment.results.yearsToRetirement * 12)),
          recommendations: latestAssessment.results.recommendations,
          strengths: [],
          concerns: [],
          calculationDetails: {
            yearsToRetirement: latestAssessment.results.yearsToRetirement,
            investmentGrowth: latestAssessment.results.investmentGrowth,
            contributionGrowth: latestAssessment.results.contributionGrowth,
            socialSecurityValue: latestAssessment.results.socialSecurityAnnualValue,
            requiredAmount: latestAssessment.results.requiredAmount,
            requiredFromSavings: latestAssessment.results.requiredFromSavings,
            inflationAdjustedIncome: latestAssessment.results.inflationAdjustedIncome,
            preparednessRatio: latestAssessment.results.totalFutureValue / latestAssessment.results.requiredFromSavings,
            baseScore: latestAssessment.results.baseScore,
            financialHealthScore: latestAssessment.results.financialHealthScore,
            lifestyleScore: latestAssessment.results.lifestyleScore,
            emergencyRatio: data.emergencyFund / (data.currentIncome * 0.25),
            debtRatio: data.totalDebt / data.currentIncome,
            savingsRate: (data.monthlyContribution * 12) / data.currentIncome
          }
        });
      }
    }
  }, [latestAssessment, form]);

  // Save assessment function
  const saveAssessment = async (formData: RetirementFormData, results?: RetirementAnalysis) => {
    setSaveStatus('saving');
    try {
      const assessmentData = {
        assessmentData: formData,
        results: results ? {
          totalScore: results.score,
          baseScore: results.calculationDetails.baseScore,
          financialHealthScore: results.calculationDetails.financialHealthScore,
          lifestyleScore: results.calculationDetails.lifestyleScore,
          yearsToRetirement: results.calculationDetails.yearsToRetirement,
          investmentGrowth: results.calculationDetails.investmentGrowth,
          contributionGrowth: results.calculationDetails.contributionGrowth,
          socialSecurityAnnualValue: results.calculationDetails.socialSecurityValue,
          totalFutureValue: results.projectedSavings,
          requiredAmount: results.calculationDetails.requiredAmount,
          requiredFromSavings: results.calculationDetails.requiredFromSavings,
          inflationAdjustedIncome: results.calculationDetails.inflationAdjustedIncome,
          recommendations: results.recommendations
        } : null
      };
      
      await saveAssessmentMutation.mutateAsync(assessmentData);
    } catch (error) {
      console.error('Error saving assessment:', error);
    }
  };

  // Load latest data function
  const loadLatestData = () => {
    if (latestAssessment && latestAssessment.assessmentData) {
      const data = latestAssessment.assessmentData;
      
      // Reset form with loaded data
      form.reset(data);
      
      // Set analysis if results exist
      if (latestAssessment.results) {
        setAnalysis({
          score: latestAssessment.results.totalScore,
          projectedSavings: latestAssessment.results.totalFutureValue,
          recommendations: latestAssessment.results.recommendations,
          calculationDetails: {
            baseScore: latestAssessment.results.baseScore,
            financialHealthScore: latestAssessment.results.financialHealthScore,
            lifestyleScore: latestAssessment.results.lifestyleScore,
            yearsToRetirement: latestAssessment.results.yearsToRetirement,
            investmentGrowth: latestAssessment.results.investmentGrowth,
            contributionGrowth: latestAssessment.results.contributionGrowth,
            socialSecurityValue: latestAssessment.results.socialSecurityAnnualValue,
            requiredAmount: latestAssessment.results.requiredAmount,
            requiredFromSavings: latestAssessment.results.requiredFromSavings,
            inflationAdjustedIncome: latestAssessment.results.inflationAdjustedIncome,
            preparednessRatio: latestAssessment.results.totalFutureValue / latestAssessment.results.requiredAmount,
            emergencyRatio: data.emergencyFund / (data.currentIncome * 6 / 12),
            debtRatio: data.totalDebt / data.currentIncome,
            savingsRate: data.monthlyContribution * 12 / data.currentIncome
          }
        });
      }
      
      // Show success message
      alert('저장된 데이터를 성공적으로 불러왔습니다!');
    } else {
      alert('불러올 데이터가 없습니다.');
    }
  };

  // Consultation handlers
  const handleConsultationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConsultationFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consultationFormData.name || !consultationFormData.phone || !consultationFormData.email) {
      toast({
        title: "필수 정보 누락",
        description: "이름, 전화번호, 이메일을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingConsultation(true);
    
    try {
      const response = await fetch('/api/send-consultation-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...consultationFormData,
          message: `은퇴 진단 상담 요청\n\n진단 점수: ${analysis?.score || 'N/A'}점\n\n${consultationFormData.message}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send consultation request');
      }

      toast({
        title: "상담 요청 완료",
        description: "전문가 상담 요청이 성공적으로 전송되었습니다. 빠른 시일 내에 연락드리겠습니다.",
      });

      setIsConsultationDialogOpen(false);
      setConsultationFormData({
        name: '',
        phone: '',
        email: '',
        message: ''
      });
    } catch (error) {
      console.error('Error sending consultation request:', error);
      toast({
        title: "전송 실패",
        description: "상담 요청 전송에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingConsultation(false);
    }
  };

  const stepTitles = [
    "1단계: 기본 정보",
    "2단계: 재정 상태", 
    "3단계: 생활 환경",
    "4단계: 투자 성향"
  ];

  const stepDescriptions = [
    "나이, 은퇴계획, 현재 저축 상황을 입력해주세요",
    "소득, 부채, 비상자금 등 재정상태를 진단합니다", 
    "건강, 주거, 가족상황 등을 확인합니다",
    "투자경험과 위험성향을 파악합니다"
  ];

  // 각 단계별 필수 필드 정의
  const requiredFieldsByStep = [
    ['currentAge', 'expectedRetirementAge', 'currentSavings', 'monthlyContribution', 'desiredRetirementIncome', 'expectedAnnualReturn'],
    ['currentIncome', 'emergencyFund', 'totalDebt', 'expectedSocialSecurityBenefit'],
    ['healthStatus', 'hasHealthInsurance', 'homeOwnership', 'familyStatus', 'dependentsCount'],
    ['investmentExperience', 'riskTolerance', 'expectedInflationRate']
  ];

  // 현재 단계의 필수 필드가 모두 입력되었는지 확인
  const validateCurrentStep = () => {
    const formValues = form.getValues();
    const currentStepFields = requiredFieldsByStep[currentStep];
    
    return currentStepFields.every(field => {
      const value = formValues[field as keyof RetirementFormData];
      if (typeof value === 'boolean') return true;
      if (typeof value === 'string') return value !== '';
      if (typeof value === 'number') return !isNaN(value) && value >= 0;
      return value !== undefined && value !== null;
    });
  };

  // 다음 단계로 진행
  const goToNextStep = () => {
    if (validateCurrentStep()) {
      const newCompletedSteps = [...completedSteps];
      newCompletedSteps[currentStep] = true;
      setCompletedSteps(newCompletedSteps);
      
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // 이전 단계로 돌아가기
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 모든 단계가 완료되었는지 확인
  const allStepsCompleted = completedSteps.every(step => step === true);

  // Social Security 계산 함수 (SSA.gov 기준)
  const calculateSocialSecurity = () => {
    const workingYears = Math.min(35, ssRetireAge - ssStartAge);
    const annualEarnings = ssAvgSalary; // 이미 연봉이므로 12를 곱하지 않음
    
    // 최소 10년(40분기) 납부 필요
    if (workingYears < 10) {
      return 0;
    }
    
    // 2024년 기준 bend points ($1,174, $7,078) - 월 기준
    const bendPoint1 = 1174;
    const bendPoint2 = 7078;
    
    // AIME 계산: 최고 35년 소득의 월평균 (인덱싱 적용 안함, 단순화)
    // 실제로는 과거 소득을 현재 가치로 인덱싱하지만 여기서는 단순화
    let totalIndexedEarnings = 0;
    for (let i = 0; i < 35; i++) {
      if (i < workingYears) {
        totalIndexedEarnings += annualEarnings;
      }
      // 35년 미만 근무시 나머지는 0으로 계산
    }
    const aime = totalIndexedEarnings / (35 * 12);
    
    // PIA 계산 (Primary Insurance Amount) - 2024년 공식
    let pia = 0;
    if (aime <= bendPoint1) {
      pia = aime * 0.9;
    } else if (aime <= bendPoint2) {
      pia = bendPoint1 * 0.9 + (aime - bendPoint1) * 0.32;
    } else {
      pia = bendPoint1 * 0.9 + (bendPoint2 - bendPoint1) * 0.32 + (aime - bendPoint2) * 0.15;
    }
    
    // 수령 시작 나이에 따른 조정
    const fullRetirementAge = 67; // 1960년 이후 출생자 기준
    let adjustmentFactor = 1.0;
    
    if (ssClaimAge < fullRetirementAge) {
      // 조기수령 감액: 처음 36개월은 월 5/9%, 그 이후는 월 5/12%
      const monthsEarly = (fullRetirementAge - ssClaimAge) * 12;
      if (monthsEarly <= 36) {
        adjustmentFactor = 1 - (monthsEarly * (5/9) / 100);
      } else {
        const firstReduction = 36 * (5/9) / 100;
        const additionalReduction = (monthsEarly - 36) * (5/12) / 100;
        adjustmentFactor = 1 - firstReduction - additionalReduction;
      }
      adjustmentFactor = Math.max(0.75, adjustmentFactor); // 최대 25% 감액
    } else if (ssClaimAge > fullRetirementAge) {
      // 연기수령 증액: 월 2/3% (연 8%)
      const monthsDelay = (ssClaimAge - fullRetirementAge) * 12;
      adjustmentFactor = 1 + (monthsDelay * (2/3) / 100);
      adjustmentFactor = Math.min(1.32, adjustmentFactor); // 최대 32% 증액 (70세까지)
    }
    
    return Math.round(pia * adjustmentFactor);
  };

  // 은퇴 점수 계산 - 개선된 버전
  const calculateRetirementScore = (data: RetirementFormData): RetirementAnalysis => {
    console.log("은퇴 점수 계산 시작 - 입력 데이터:", data);
    
    const yearsToRetirement = Math.max(1, data.expectedRetirementAge - data.currentAge);
    const annualContribution = data.monthlyContribution * 12;
    
    // 복리 계산 개선: Social Security도 포함
    const investmentGrowth = data.currentSavings * Math.pow(1 + data.expectedAnnualReturn / 100, yearsToRetirement);
    const contributionGrowth = data.expectedAnnualReturn > 0 
      ? annualContribution * (Math.pow(1 + data.expectedAnnualReturn / 100, yearsToRetirement) - 1) / (data.expectedAnnualReturn / 100)
      : annualContribution * yearsToRetirement;
    
    // Social Security는 4% 룰에서 별도 처리 (연금은 매년 받는 소득이므로)
    const socialSecurityAnnualValue = data.expectedSocialSecurityBenefit * 12;
    const totalFutureValue = investmentGrowth + contributionGrowth;
    
    // 인플레이션 조정된 필요 금액 (4% 룰 적용)
    const inflationAdjustedIncome = data.desiredRetirementIncome * Math.pow(1 + data.expectedInflationRate / 100, yearsToRetirement);
    const requiredFromSavings = Math.max(0, (inflationAdjustedIncome * 12) - socialSecurityAnnualValue);
    const requiredAmount = requiredFromSavings * 25; // 4% rule: Social Security 제외한 필요 금액만
    
    console.log("계산 결과:", {
      yearsToRetirement,
      investmentGrowth,
      contributionGrowth,
      socialSecurityAnnualValue,
      totalFutureValue,
      requiredAmount,
      requiredFromSavings,
      inflationAdjustedIncome
    });
    
    // 기본 준비율 점수 (0-70점)
    const preparednessRatio = totalFutureValue / requiredAmount;
    let baseScore = Math.min(70, preparednessRatio * 70);
    
    // 재정 건전성 점수 (0-20점)
    let financialHealthScore = 0;
    
    // 비상자금 점수 (0-5점)
    const emergencyRatio = data.currentIncome > 0 ? data.emergencyFund / (data.currentIncome / 12 * 6) : 0;
    financialHealthScore += Math.min(5, emergencyRatio * 5);
    
    // 부채 비율 점수 (0-5점)
    const debtRatio = data.currentIncome > 0 ? data.totalDebt / data.currentIncome : 0;
    if (debtRatio <= 0.1) financialHealthScore += 5;
    else if (debtRatio <= 0.3) financialHealthScore += 3;
    else if (debtRatio <= 0.5) financialHealthScore += 1;
    
    // 저축률 점수 (0-5점)
    const savingsRate = data.currentIncome > 0 ? (data.monthlyContribution * 12) / data.currentIncome : 0;
    if (savingsRate >= 0.20) financialHealthScore += 5; // 20% 이상
    else if (savingsRate >= 0.15) financialHealthScore += 4; // 15% 이상
    else if (savingsRate >= 0.10) financialHealthScore += 3; // 10% 이상
    else if (savingsRate >= 0.05) financialHealthScore += 2; // 5% 이상
    else if (savingsRate > 0) financialHealthScore += 1;
    
    // 투자 수익률 현실성 점수 (0-5점)
    if (data.expectedAnnualReturn >= 5 && data.expectedAnnualReturn <= 8) financialHealthScore += 5;
    else if (data.expectedAnnualReturn >= 3 && data.expectedAnnualReturn <= 10) financialHealthScore += 3;
    else financialHealthScore += 1;
    
    // 라이프스타일 점수 (0-10점)
    let lifestyleScore = 0;
    
    // 건강 점수 (0-3점)
    switch (data.healthStatus) {
      case 'excellent': lifestyleScore += 3; break;
      case 'good': lifestyleScore += 2; break;
      case 'fair': lifestyleScore += 1; break;
      case 'poor': lifestyleScore += 0; break;
    }
    
    // 보험 점수 (0-2점)
    if (data.hasHealthInsurance) lifestyleScore += 2;
    
    // 주거 상황 점수 (0-3점)
    switch (data.homeOwnership) {
      case 'own_outright': lifestyleScore += 3; break;
      case 'mortgage': lifestyleScore += 2; break;
      case 'rent': lifestyleScore += 1; break;
    }
    
    // 부양가족 부담 조정 (0-2점)
    if (data.dependentsCount === 0) lifestyleScore += 2;
    else if (data.dependentsCount <= 2) lifestyleScore += 1;
    
    const totalScore = Math.min(100, Math.max(0, baseScore + financialHealthScore + lifestyleScore));
    
    console.log("점수 계산:", {
      baseScore,
      financialHealthScore,
      lifestyleScore,
      totalScore
    });
    
    const additionalNeeded = Math.max(0, requiredAmount - totalFutureValue);
    const monthlyNeeded = additionalNeeded > 0 && yearsToRetirement > 0 
      ? additionalNeeded / (yearsToRetirement * 12) : 0;

    // 동적 강점/우려사항/추천사항 생성
    const strengths: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // 은퇴 자금 준비율
    if (preparednessRatio >= 1.2) {
      strengths.push(`은퇴 자금이 목표의 ${Math.round(preparednessRatio * 100)}%로 여유있게 준비되어 있습니다`);
    } else if (preparednessRatio >= 0.8) {
      strengths.push("은퇴 자금 목표 달성에 근접했습니다");
    } else if (preparednessRatio >= 0.5) {
      concerns.push("은퇴 자금이 목표의 절반 수준입니다");
      recommendations.push(`월 ${Math.round(monthlyNeeded).toLocaleString()}달러 추가 저축을 권장합니다`);
    } else {
      concerns.push("은퇴 자금이 심각하게 부족합니다");
      recommendations.push(`월 ${Math.round(monthlyNeeded).toLocaleString()}달러 추가 저축이 필요하며, 전문가 상담을 권장합니다`);
    }

    // 비상자금
    if (emergencyRatio >= 1) {
      strengths.push("충분한 비상 자금을 보유하고 있습니다");
    } else if (data.currentIncome > 0) {
      concerns.push("비상 자금이 부족합니다");
      recommendations.push(`${Math.round((6 - emergencyRatio * 6) * data.currentIncome / 12).toLocaleString()}달러의 추가 비상자금이 필요합니다`);
    }

    // 부채 관리
    if (debtRatio <= 0.3) {
      strengths.push("부채 비율이 안정적입니다");
    } else {
      concerns.push("부채 비율이 높습니다");
      recommendations.push("고금리 부채부터 우선 상환하여 부채 비율을 줄이세요");
    }

    // 저축률
    if (savingsRate >= 0.15) {
      strengths.push(`우수한 저축률(${Math.round(savingsRate * 100)}%)을 유지하고 있습니다`);
    } else if (savingsRate >= 0.10) {
      recommendations.push("저축률을 15% 이상으로 늘려보세요");
    } else {
      concerns.push("저축률이 너무 낮습니다");
      recommendations.push("소득의 최소 10% 이상 저축을 목표로 하세요");
    }

    return {
      score: Math.round(totalScore),
      projectedSavings: Math.round(totalFutureValue),
      additionalNeeded: Math.round(additionalNeeded),
      monthlyNeeded: Math.round(monthlyNeeded),
      recommendations,
      strengths,
      concerns,
      calculationDetails: {
        yearsToRetirement,
        investmentGrowth,
        contributionGrowth,
        socialSecurityValue: socialSecurityAnnualValue,
        requiredAmount,
        requiredFromSavings,
        inflationAdjustedIncome,
        preparednessRatio,
        baseScore,
        financialHealthScore,
        lifestyleScore,
        emergencyRatio,
        debtRatio,
        savingsRate
      }
    };
  };

  const onSubmit = async (data: RetirementFormData) => {
    setIsLoading(true);
    try {
      const result = calculateRetirementScore(data);
      setAnalysis(result);
      
      // Save assessment to database
      await saveAssessment(data, result);
    } catch (error) {
      console.error('Error calculating or saving assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAnalysis(null);
    setCurrentStep(0);
    setCompletedSteps([false, false, false, false]);
    form.reset();
  };

  if (analysis) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <TrendingUpIcon className="h-8 w-8 text-primary" />
            종합 은퇴 준비 점수
          </h1>
          <div className="text-5xl font-bold text-primary my-4">
            {analysis.score}점
          </div>
          <Progress value={analysis.score} className="w-full max-w-md mx-auto" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="h-5 w-5" />
                예상 은퇴 자금
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                ${analysis.projectedSavings.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TargetIcon className="h-5 w-5" />
                추가 필요 금액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                ${analysis.additionalNeeded.toLocaleString()}
              </div>
              <p className="text-gray-600">
                월 ${analysis.monthlyNeeded.toLocaleString()} 추가 저축 필요
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBankIcon className="h-5 w-5" />
                준비율
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {((analysis.projectedSavings / (form.getValues('desiredRetirementIncome') * 12 * 25)) * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {analysis.strengths.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircleIcon className="h-5 w-5" />
                강점
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-green-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {analysis.concerns.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-700">
              <strong>개선이 필요한 영역:</strong>
              <ul className="mt-2 space-y-1">
                {analysis.concerns.map((concern, index) => (
                  <li key={index}>• {concern}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              맞춤 추천 전략
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ArrowRightIcon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 상세 계산 과정 설명 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                📊 계산 과정 상세 설명
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                className="flex items-center gap-2"
              >
                {showCalculationDetails ? '숨기기' : '자세히 보기'}
                <ChevronRightIcon className={`h-4 w-4 transition-transform ${showCalculationDetails ? 'rotate-90' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          
          {showCalculationDetails && (
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">입력 데이터 요약</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>• 현재 나이: {form.getValues('currentAge')}세 → 은퇴 나이: {form.getValues('expectedRetirementAge')}세</div>
                  <div>• 은퇴까지 기간: <strong>{analysis.calculationDetails.yearsToRetirement}년</strong></div>
                  <div>• 현재 저축: ${form.getValues('currentSavings').toLocaleString()}</div>
                  <div>• 월 저축액: ${form.getValues('monthlyContribution').toLocaleString()}</div>
                  <div>• 목표 월 생활비: ${form.getValues('desiredRetirementIncome').toLocaleString()}</div>
                  <div>• 예상 투자수익률: {form.getValues('expectedAnnualReturn')}%</div>
                  <div>• 연소득: ${form.getValues('currentIncome').toLocaleString()}</div>
                  <div>• Social Security: ${form.getValues('expectedSocialSecurityBenefit').toLocaleString()}/월</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">1단계: 미래 자산 계산</h3>
                
                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-green-800">현재 저축 성장 (복리)</h4>
                  <p className="text-sm text-green-700">
                    ${form.getValues('currentSavings').toLocaleString()} × (1.{String(form.getValues('expectedAnnualReturn')).padStart(2, '0')})^{analysis.calculationDetails.yearsToRetirement} = 
                    <strong> ${Math.round(analysis.calculationDetails.investmentGrowth).toLocaleString()}</strong>
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-green-800">월 저축 누적 성장</h4>
                  <p className="text-sm text-green-700">
                    ${form.getValues('monthlyContribution').toLocaleString()} × 12개월 × 복리공식({analysis.calculationDetails.yearsToRetirement}년) = 
                    <strong> ${Math.round(analysis.calculationDetails.contributionGrowth).toLocaleString()}</strong>
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-green-800">Social Security 연간 혜택</h4>
                  <p className="text-sm text-green-700">
                    월 ${form.getValues('expectedSocialSecurityBenefit').toLocaleString()} × 12개월 = 
                    <strong> ${Math.round(analysis.calculationDetails.socialSecurityValue).toLocaleString()}/년</strong>
                    <br />
                    <span className="text-xs">(은퇴 후 매년 받는 연금이므로 별도 계산)</span>
                  </p>
                </div>

                <div className="bg-blue-100 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800">저축으로 마련할 자산</h4>
                  <p className="text-lg font-bold text-blue-900">
                    ${Math.round(analysis.calculationDetails.investmentGrowth).toLocaleString()} + 
                    ${Math.round(analysis.calculationDetails.contributionGrowth).toLocaleString()} = 
                    ${analysis.projectedSavings.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">2단계: 필요 금액 계산 (인플레이션 포함)</h3>
                
                <div className="bg-orange-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-orange-800">인플레이션 조정된 생활비</h4>
                  <p className="text-sm text-orange-700">
                    ${form.getValues('desiredRetirementIncome').toLocaleString()} × (1.{String(form.getValues('expectedInflationRate')).padStart(2, '0')})^{analysis.calculationDetails.yearsToRetirement} = 
                    <strong> ${Math.round(analysis.calculationDetails.inflationAdjustedIncome).toLocaleString()}/월</strong>
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-orange-800">저축으로 준비할 필요 금액</h4>
                  <p className="text-sm text-orange-700">
                    연간 필요액: ${Math.round(analysis.calculationDetails.inflationAdjustedIncome * 12).toLocaleString()}
                    <br />
                    Social Security 차감: -${Math.round(analysis.calculationDetails.socialSecurityValue).toLocaleString()}
                    <br />
                    저축 필요액: ${Math.round(analysis.calculationDetails.requiredFromSavings).toLocaleString()}/년
                    <br />
                    4% 룰 적용: <strong>${Math.round(analysis.calculationDetails.requiredAmount).toLocaleString()}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">3단계: 점수 계산 (총 {analysis.score}점)</h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800">기본 점수</h4>
                    <p className="text-sm text-purple-700 mb-2">
                      준비율: {Math.round(analysis.calculationDetails.preparednessRatio * 100)}%
                    </p>
                    <p className="text-lg font-bold text-purple-900">
                      {Math.round(analysis.calculationDetails.baseScore)}점/70점
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800">재정 건전성</h4>
                    <div className="text-xs text-purple-600 space-y-1">
                      <div>• 현재 비상자금: {isNaN(analysis.calculationDetails.emergencyRatio) ? 0 : Math.round(analysis.calculationDetails.emergencyRatio * 100)}% (6개월 소득 기준)</div>
                      <div>• 부채비율: {isNaN(analysis.calculationDetails.debtRatio) ? 0 : Math.round(analysis.calculationDetails.debtRatio * 100)}%</div>
                      <div>• 저축률: {isNaN(analysis.calculationDetails.savingsRate) ? 0 : Math.round(analysis.calculationDetails.savingsRate * 100)}%</div>
                    </div>
                    <p className="text-lg font-bold text-purple-900 mt-2">
                      {Math.round(analysis.calculationDetails.financialHealthScore)}점/20점
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800">라이프스타일</h4>
                    <div className="text-xs text-purple-600 space-y-1">
                      <div>• 건강상태: {form.getValues('healthStatus')}</div>
                      <div>• 건강보험: {form.getValues('hasHealthInsurance') ? '있음' : '없음'}</div>
                      <div>• 주거형태: {form.getValues('homeOwnership')}</div>
                      <div>• 현재 부양가족: {form.getValues('dependentsCount')}명 (배우자 제외)</div>
                    </div>
                    <p className="text-lg font-bold text-purple-900 mt-2">
                      {Math.round(analysis.calculationDetails.lifestyleScore)}점/10점
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">최종 점수 계산</h4>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.round(analysis.calculationDetails.baseScore)} + 
                    {Math.round(analysis.calculationDetails.financialHealthScore)} + 
                    {Math.round(analysis.calculationDetails.lifestyleScore)} = 
                    <span className="text-primary"> {analysis.score}점</span>
                  </p>
                </div>
              </div>

              {/* 비상자금 기준 설명 */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  💡 비상자금 6개월 기준의 이유
                </h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <div><strong>실직 대비:</strong> 평균 재취업 기간 3-5개월 (전문직은 6-12개월)</div>
                  <div><strong>의료비 응급상황:</strong> 건강보험 본인부담금 및 예상치 못한 의료비</div>
                  <div><strong>주거비 연속성:</strong> 렌트/모기지 등 고정비용 지속 지불 능력</div>
                  <div><strong>심리적 안정:</strong> 급하게 나쁜 조건의 일자리 선택하지 않고 냉정한 판단 가능</div>
                  <div className="pt-2 border-t border-blue-300">
                    <strong>개인별 조정:</strong> 안정적 직업(3-4개월), 자영업(8-12개월), 맞벌이(6개월 충분)
                  </div>
                </div>
              </div>

              {/* 학술적 근거 및 출처 */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  📖 계산 방식의 학술적 근거
                </h4>
                <div className="text-sm text-gray-700 space-y-3">
                  <div>
                    <strong>복리 계산:</strong> William F. Sharpe "Investments" 교과서의 미래가치 공식
                    <div className="text-xs text-gray-600 ml-4">FV = PV × (1 + r)^n (현재가치 성장), FV = PMT × [((1 + r)^n - 1) / r] (월 저축 성장)</div>
                  </div>
                  <div>
                    <strong>4% 룰:</strong> Trinity Study (1998) + William Bengen의 Safe Withdrawal Rate 연구
                    <div className="text-xs text-gray-600 ml-4">연간 4% 인출 시 30년간 자금 유지 가능성 95% 이상</div>
                  </div>
                  <div>
                    <strong>Social Security:</strong> Social Security Administration (SSA.gov) 공식 계산법
                    <div className="text-xs text-gray-600 ml-4">조기수령 감액률, 연기수령 증액률 적용</div>
                  </div>
                  <div>
                    <strong>비상자금 6개월:</strong> Federal Reserve 가계금융조사 + Dave Ramsey, Suze Orman 권장사항
                    <div className="text-xs text-gray-600 ml-4">평균 실직 기간 통계 및 재정 안정성 연구 기반</div>
                  </div>
                  <div>
                    <strong>저축률/부채비율:</strong> Bureau of Economic Analysis + Consumer Financial Protection Bureau
                    <div className="text-xs text-gray-600 ml-4">미국 가계 재정 통계 및 권장 기준</div>
                  </div>
                  <div>
                    <strong>투자수익률:</strong> S&P 500 Historical Returns + Vanguard 장기 투자 연구
                    <div className="text-xs text-gray-600 ml-4">장기 주식시장 평균 수익률 7-10% 기반</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>💡 이해하기:</strong> 이 점수는 현재 저축 패턴과 재정 상태를 기반으로 한 예상 결과입니다. 
                  실제 은퇴 준비는 시장 변동성, 건강 상태 변화, 인플레이션 등 다양한 요인의 영향을 받을 수 있습니다.
                  <br /><br />
                  <strong>계산 방식:</strong> 학술적 재정학 이론과 실무 재정 계획 업계의 베스트 프랙티스를 조합하여 
                  한국 고객에게 맞춘 종합적 접근법을 사용합니다.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Save Status */}
        {(saveStatus === 'saved' || saveStatus === 'saving') && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircleIcon className="h-4 w-4" />
            <AlertDescription className="text-green-700">
              {saveStatus === 'saving' 
                ? '은퇴 진단 결과를 저장하고 있습니다...' 
                : '은퇴 진단 결과가 안전하게 저장되었습니다!'}
            </AlertDescription>
          </Alert>
        )}

        {/* Expert Consultation Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <PhoneIcon className="h-5 w-5" />
              전문가 상담
            </CardTitle>
            <CardDescription className="text-blue-700">
              은퇴 진단 결과를 바탕으로 맞춤형 재정 설계를 받아보세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <PhoneIcon className="h-4 w-4" />
                    <span>전화 상담 가능</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <MailIcon className="h-4 w-4" />
                    <span>이메일 상담 가능</span>
                  </div>
                </div>
              </div>
              <Dialog open={isConsultationDialogOpen} onOpenChange={setIsConsultationDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    상담 예약하기
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>전문가 상담 요청</DialogTitle>
                    <DialogDescription>
                      은퇴 진단 결과를 바탕으로 전문가 상담을 요청하시겠습니까? 빠른 시일 내에 연락드리겠습니다.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitConsultation} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">이름 *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={consultationFormData.name}
                        onChange={handleConsultationInputChange}
                        placeholder="홍길동"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">전화번호 *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={consultationFormData.phone}
                        onChange={handleConsultationInputChange}
                        placeholder="010-1234-5678"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">이메일 *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={consultationFormData.email}
                        onChange={handleConsultationInputChange}
                        placeholder="example@email.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">상담 내용 (선택사항)</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={consultationFormData.message}
                        onChange={handleConsultationInputChange}
                        placeholder="상담받고 싶은 내용을 간단히 적어주세요"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsConsultationDialogOpen(false)}
                        disabled={isSubmittingConsultation}
                      >
                        취소
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmittingConsultation}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmittingConsultation ? '전송 중...' : '상담 요청하기'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={resetForm} variant="outline" className="flex-1">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            다시 계산하기
          </Button>
          <Button onClick={() => navigate('/review')} className="flex-1">
            세금 신고 완료하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <TrendingUpIcon className="h-8 w-8 text-primary" />
          은퇴 준비 상태 진단 (무료)
        </h1>
        <p className="text-gray-600">
          4단계 간단한 질문으로 당신의 은퇴 준비 점수를 확인하고 맞춤 전략을 받아보세요
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBankIcon className="h-5 w-5" />
            {stepTitles[currentStep]}
          </CardTitle>
          <CardDescription>
            {stepDescriptions[currentStep]}
          </CardDescription>
        </CardHeader>
        
        {/* Save/Load Controls */}
        <div className="px-6 mb-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadLatestData()}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                데이터 불러오기
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => saveAssessment(form.getValues())}
                disabled={saveAssessmentMutation.isPending || saveStatus === 'saving'}
                className="text-xs"
              >
                {saveStatus === 'saving' ? '저장 중...' : 
                 saveStatus === 'saved' ? '저장됨!' : 
                 saveStatus === 'error' ? '저장 실패' : '저장하기'}
              </Button>
              
              {loadingAssessment && (
                <span className="text-xs text-gray-500">데이터 로드 중...</span>
              )}
              
              {latestAssessment?.updatedAt && (
                <span className="text-xs text-green-600">
                  최근 저장: {new Date(latestAssessment.updatedAt).toLocaleString('ko-KR')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">진행 상황</span>
            <span className="text-sm font-medium text-primary">{currentStep + 1}/4 단계</span>
          </div>
          <Progress value={(currentStep + 1) * 25} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex flex-col items-center space-y-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === currentStep 
                    ? 'bg-primary text-white' 
                    : completedSteps[index] 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {completedSteps[index] ? '✓' : index + 1}
                </div>
                <span className={`text-xs text-center max-w-16 ${
                  index === currentStep ? 'text-primary font-medium' : 'text-gray-500'
                }`}>
                  {title.split(': ')[1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              {/* Step 0: 기본 정보 */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>현재 나이 *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="45"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expectedRetirementAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>희망 은퇴 나이 *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="65"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentSavings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>현재 총 저축액 ($) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="401k, IRA, 예금 등 합산"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthlyContribution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>월 저축액 ($) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="매월 추가 저축 금액"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="desiredRetirementIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>은퇴 후 예상 생활비 (주거비 포함 월비용 $) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="모기지/렌트 포함 월 총 생활비"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expectedAnnualReturn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>예상 연 투자수익률 (%) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5-6% 보수적 가정"
                              step="0.1"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 1: 재정 상태 */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currentIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>현재 연소득 ($) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="세후 소득"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyFund"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>현재 보유 비상 자금 ($) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="현재 가지고 있는 비상자금 금액"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalDebt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>총 부채 ($) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="모기지 제외 부채"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expectedSocialSecurityBenefit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>예상 Social Security 연금 (월 수령액 $) *</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="월 예상 수령액 (예: 2000)"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowSSCalculator(!showSSCalculator)}
                              className="flex items-center gap-1 whitespace-nowrap"
                            >
                              📊 상세 Social Security 계산기
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Social Security Calculator */}
                    {showSSCalculator && (
                      <div className="col-span-full">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-700">📊Social Security 추산기</CardTitle>
                            <CardDescription>
                              근무기간과 평균소득을 기반으로 예상 Social Security 연금을 계산합니다
                            </CardDescription>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                              <p className="text-sm text-yellow-800">
                                <strong>⚠️ 안내:</strong> 이 계산기는 대략적인 예상 금액을 제공합니다. 
                                정확한 혜택 금액은 <a href="https://www.ssa.gov/myaccount/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 font-medium">ssa.gov/myaccount/</a>에서 확인하시기 바랍니다.
                              </p>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  납부 시작 연령
                                </label>
                                <Input
                                  type="number"
                                  value={ssStartAge}
                                  onChange={(e) => setSsStartAge(Number(e.target.value))}
                                  min="18"
                                  max="67"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  은퇴 연령
                                </label>
                                <Input
                                  type="number"
                                  value={ssRetireAge}
                                  onChange={(e) => setSsRetireAge(Number(e.target.value))}
                                  min="62"
                                  max="70"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  연평균 연봉 ($)
                                </label>
                                <Input
                                  type="number"
                                  value={ssAvgSalary}
                                  onChange={(e) => setSsAvgSalary(Number(e.target.value))}
                                  min="0"
                                  step="1000"
                                  placeholder="예: 80000 (연봉)"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  수령 시작 연령
                                </label>
                                <Input
                                  type="number"
                                  value={ssClaimAge}
                                  onChange={(e) => setSsClaimAge(Number(e.target.value))}
                                  min="62"
                                  max="70"
                                />
                              </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-semibold text-lg mb-2">
                                예상 월 수령액: ${calculateSocialSecurity()}
                              </h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                {(() => {
                                  const workingYears = Math.min(35, ssRetireAge - ssStartAge);
                                  const annualEarnings = ssAvgSalary; // 이미 연봉
                                  const totalIndexedEarnings = workingYears * annualEarnings;
                                  const aime = totalIndexedEarnings / (35 * 12);
                                  
                                  return (
                                    <>
                                      <div>• 근무년수: {workingYears}년 / 35년</div>
                                      <div>• 연간 소득: ${annualEarnings.toLocaleString()}</div>
                                      <div>• AIME (35년 평균 월소득): ${Math.round(aime).toLocaleString()}</div>
                                      <div>• 수령 조정: {ssClaimAge === 67 ? '정상(FRA)' : ssClaimAge < 67 ? `조기수령(${67-ssClaimAge}년 빠름)` : `연기수령(${ssClaimAge-67}년 늦음)`}</div>
                                      {workingYears < 10 && (
                                        <div className="text-red-600 font-medium">⚠️ 10년 미만 납부로 수령 불가</div>
                                      )}
                                      {workingYears >= 10 && workingYears < 35 && (
                                        <div className="text-orange-600 font-medium">⚠️ 35년 미만 근무로 혜택 감소</div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            
                            <Button
                              type="button"
                              onClick={() => {
                                const calculatedAmount = calculateSocialSecurity();
                                form.setValue('expectedSocialSecurityBenefit', calculatedAmount);
                                setShowSSCalculator(false);
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              이 금액으로 적용
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: 생활 환경 */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="healthStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>건강 상태 *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="건강 상태 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="excellent">매우 좋음</SelectItem>
                              <SelectItem value="good">좋음</SelectItem>
                              <SelectItem value="fair">보통</SelectItem>
                              <SelectItem value="poor">나쁨</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasHealthInsurance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>건강보험 가입 *</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="homeOwnership"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>주거 상태 *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="주거 상태 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="own_outright">자가 (완전 소유)</SelectItem>
                              <SelectItem value="mortgage">자가 (모기지)</SelectItem>
                              <SelectItem value="rent">임대</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="familyStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>결혼상태 *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="결혼상태 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single">미혼</SelectItem>
                              <SelectItem value="married">기혼</SelectItem>
                              <SelectItem value="divorced">이혼</SelectItem>
                              <SelectItem value="widowed">사별</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dependentsCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>현재 부양가족 수 (배우자 제외) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="현재 부양 중인 자녀 및 가족 수"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: 투자 성향 */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="investmentExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>투자 경험 *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="투자 경험 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">초급 (1-2년)</SelectItem>
                              <SelectItem value="intermediate">중급 (3-7년)</SelectItem>
                              <SelectItem value="advanced">고급 (8년 이상)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="riskTolerance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>위험 성향 *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="위험 성향 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="conservative">보수적 (안정성 중시)</SelectItem>
                              <SelectItem value="moderate">균형형 (중간 위험)</SelectItem>
                              <SelectItem value="aggressive">공격적 (고수익 추구)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expectedInflationRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>예상 물가상승률 (%) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="3"
                              step="0.1"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goToPreviousStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  이전 단계
                </Button>

                {currentStep < 3 ? (
                  <Button 
                    type="button" 
                    onClick={goToNextStep}
                    disabled={!validateCurrentStep()}
                    className="flex items-center gap-2"
                  >
                    다음 단계
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={() => onSubmit(form.getValues())}
                    disabled={!validateCurrentStep() || isLoading}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCwIcon className="h-4 w-4 animate-spin" />
                        계산 및 저장 중...
                      </>
                    ) : (
                      <>
                        <TargetIcon className="h-4 w-4" />
                        종합 은퇴 점수 계산하기
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Validation Message */}
              {!validateCurrentStep() && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertDescription className="text-orange-700">
                    현재 단계의 모든 필수 항목(*)을 입력해주세요.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}