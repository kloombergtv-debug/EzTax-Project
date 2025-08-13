import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FilingStatus, PersonalInformation } from '@shared/schema';
import { useTaxContext, TaxData } from '@/context/TaxContext';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatBot } from '@/components/ChatBot';

enum CheckerStep {
  START = 'start',
  MARRIED = 'married',
  SINGLE = 'single',
  WIDOW_WITH_DEPENDENT = 'widow_with_dependent',
  WIDOW_WITHOUT_DEPENDENT = 'widow_without_dependent',
  WIDOW_HAS_DEPENDENT = 'widow_has_dependent',
  WIDOW_HAS_DEPENDENT_OVER_2Y = 'widow_has_dependent_over_2y',
  RESULT = 'result'
}

type DecisionTreeNode = {
  question: string;
  description?: string;
  options: {
    label: string;
    value: string;
    nextStep: CheckerStep | null;
    result?: FilingStatus;
  }[];
};

const decisionTree: Record<CheckerStep, DecisionTreeNode> = {
  [CheckerStep.START]: {
    question: '세금 부과년도 12월 31일 현재 상태 기준, 다음 중 어떤 상태인지 선택하세요',
    options: [
      { label: '1. 결혼', value: 'married', nextStep: CheckerStep.MARRIED },
      { label: '2. 독신, 미혼, 또는 법적으로 별거', value: 'single', nextStep: CheckerStep.SINGLE },
      { label: '3. 미망인 (배우자 세금연도에 사망)', value: 'widow_current', nextStep: CheckerStep.WIDOW_WITH_DEPENDENT },
      { label: '4. 미망인 (배우자 세금연도 이전에 사망)', value: 'widow_previous', nextStep: CheckerStep.WIDOW_WITHOUT_DEPENDENT }
    ]
  },
  [CheckerStep.MARRIED]: {
    question: '배우자와 함께 세금 보고하시겠습니까?',
    description: '부부 공동 신고는 일반적으로 세금 혜택이 더 크지만, 특수한 상황에서는 별도 신고가 유리할 수 있습니다.',
    options: [
      { label: '예', value: 'yes', nextStep: CheckerStep.RESULT, result: 'married_joint' },
      { label: '아니오', value: 'no', nextStep: CheckerStep.RESULT, result: 'married_separate' }
    ]
  },
  [CheckerStep.SINGLE]: {
    question: '부양가족이 있습니까?',
    description: '부양가족이 있고 가정 유지 비용의 절반 이상을 부담하는 경우 세대주(Head of Household) 지위를 얻을 수 있습니다.',
    options: [
      { label: '예', value: 'yes', nextStep: CheckerStep.RESULT, result: 'head_of_household' },
      { label: '아니오', value: 'no', nextStep: CheckerStep.RESULT, result: 'single' }
    ]
  },
  [CheckerStep.WIDOW_WITH_DEPENDENT]: {
    question: '배우자가 세금연도에 사망한 경우',
    description: '배우자가 사망한 해에는 부양가족 여부와 관계없이 부부 공동 신고(Married Filing Jointly)를 할 수 있습니다. 이는 일반적으로 세금 혜택이 가장 큰 옵션입니다.',
    options: [
      { label: '부부 공동 신고하기', value: 'yes', nextStep: CheckerStep.RESULT, result: 'married_joint' }
    ]
  },
  [CheckerStep.WIDOW_WITHOUT_DEPENDENT]: {
    question: '배우자가 세금연도 이전에 사망한 경우',
    description: '부양가족이 있고, 배우자가 사망한 시점이 언제인지 선택해주세요. (예: 2024년 세금 신고 기준)',
    options: [
      { label: '배우자 사망 후 2년 이내 (예: 2022년 또는 2023년에 사망)', value: 'within_2_years', nextStep: CheckerStep.WIDOW_HAS_DEPENDENT },
      { label: '배우자 사망 후 2년 초과 (예: 2021년 또는 그 이전에 사망)', value: 'over_2_years', nextStep: CheckerStep.WIDOW_HAS_DEPENDENT_OVER_2Y },
      { label: '부양가족 없음', value: 'no_dependent', nextStep: CheckerStep.RESULT, result: 'single' }
    ]
  },
  [CheckerStep.WIDOW_HAS_DEPENDENT]: {
    question: '부양가족이 있습니까?',
    description: '배우자 사망 후 2년 이내 (예: 2024년 세금 신고 기준 2022-2023년 사망)이고 부양가족이 있는 경우 적격 미망인(Qualifying Widow/er) 지위를 획득할 수 있습니다.',
    options: [
      { label: '예', value: 'yes', nextStep: CheckerStep.RESULT, result: 'qualifying_widow' },
      { label: '아니오', value: 'no', nextStep: CheckerStep.RESULT, result: 'single' }
    ]
  },
  [CheckerStep.WIDOW_HAS_DEPENDENT_OVER_2Y]: {
    question: '부양가족이 있습니까?',
    description: '배우자 사망 후 2년 초과 (예: 2024년 세금 신고 기준 2021년 이전 사망)이지만 부양가족이 있는 경우 세대주(Head of Household) 지위를 획득할 수 있습니다.',
    options: [
      { label: '예', value: 'yes', nextStep: CheckerStep.RESULT, result: 'head_of_household' },
      { label: '아니오', value: 'no', nextStep: CheckerStep.RESULT, result: 'single' }
    ]
  },
  [CheckerStep.RESULT]: {
    question: '결과',
    options: []
  }
};

const filingStatusInfo = {
  single: {
    title: '미혼 (Single)',
    description: '미혼이거나 이혼 또는 별거 상태이며 다른 신고 상태에 해당하지 않는 경우의 신고 상태입니다.',
    taxImplications: '기본 세율이 적용되며, 다른 신고 상태에 비해 세액공제와 표준공제 금액이 적을 수 있습니다.'
  },
  married_joint: {
    title: '부부 공동 신고 (Married Filing Jointly)',
    description: '기혼자로 배우자와 함께 단일 세금 신고서를 제출하는 경우의 신고 상태입니다.',
    taxImplications: '대부분의 경우 세금 혜택이 가장 큰 신고 상태이며, A 더 높은 표준공제와 세액공제, 더 낮은 세율이 적용될 수 있습니다.'
  },
  married_separate: {
    title: '부부 개별 신고 (Married Filing Separately)',
    description: '기혼자로 배우자와 별도로 세금 신고서를 제출하는 경우의 신고 상태입니다.',
    taxImplications: '일반적으로 세금 혜택이 줄어들지만, 특정 상황(배우자의 세금 부채가 많은 경우 등)에서는 유리할 수 있습니다.'
  },
  head_of_household: {
    title: '세대주 (Head of Household)',
    description: '미혼이면서 부양가족과 함께 거주하며 가정 유지 비용의 절반 이상을 부담하는 경우의 신고 상태입니다.',
    taxImplications: '미혼 신고보다 낮은 세율, 더 높은 표준공제, 그리고 더 많은 세액공제 혜택을 받을 수 있습니다.'
  },
  qualifying_widow: {
    title: '적격 미망인 (Qualifying Widow/er)',
    description: '배우자가 최근 2년 내에 사망했으며 부양 자녀가 있는 경우의 신고 상태입니다.',
    taxImplications: '부부 공동 신고와 동일한 세율과 표준공제 혜택을 받을 수 있어 유리합니다.'
  }
};

export default function FilingStatusChecker() {
  const [, setLocation] = useLocation();
  const { updateTaxData, taxData } = useTaxContext();
  const [currentStep, setCurrentStep] = useState<CheckerStep>(CheckerStep.START);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [result, setResult] = useState<FilingStatus | null>(null);
  const [decisionPath, setDecisionPath] = useState<Array<{ question: string, answer: string }>>([]);

  const handleOptionSelect = (value: string) => {
    setSelectedOption(value);
    
    const currentNode = decisionTree[currentStep];
    const selectedOptionObj = currentNode.options.find(opt => opt.value === value);
    
    if (selectedOptionObj) {
      // 결정 경로에 현재 선택 추가
      setDecisionPath([
        ...decisionPath,
        { 
          question: currentNode.question, 
          answer: selectedOptionObj.label 
        }
      ]);
      
      if (selectedOptionObj.result) {
        setResult(selectedOptionObj.result);
      }
      
      if (selectedOptionObj.nextStep) {
        setCurrentStep(selectedOptionObj.nextStep);
      }
    }
  };

  const handleApplyResult = () => {
    if (result) {
      // localStorage에서 임시 저장된 폼 데이터 복원
      const savedFormData = localStorage.getItem('tempPersonalInfo');
      let currentPersonalInfo = taxData.personalInfo;
      
      // localStorage에 저장된 데이터가 있으면 우선 사용
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          currentPersonalInfo = parsedData;
          console.log("FilingStatusChecker - 저장된 폼 데이터 복원:", parsedData);
        } catch (error) {
          console.error("Failed to parse saved form data:", error);
        }
      }
      
      if (currentPersonalInfo) {
        // 기존 personalInfo 데이터 보존하고 filingStatus만 업데이트
        const preservedData = {
          ...currentPersonalInfo,
          filingStatus: result
        };
        
        updateTaxData({ personalInfo: preservedData });
        // localStorage도 업데이트
        localStorage.setItem('tempPersonalInfo', JSON.stringify(preservedData));
        console.log("FilingStatusChecker - 데이터 보존하며 filingStatus 업데이트:", preservedData);
      } else {
        // 빈 personalInfo 객체를 서버에 저장하지 않고, filingStatus만 업데이트
        console.log("FilingStatusChecker - 기존 데이터 없음, filingStatus만 로컬 저장");
        // localStorage에 filingStatus만 저장
        const filingStatusOnly = { filingStatus: result };
        localStorage.setItem('tempFilingStatus', JSON.stringify(filingStatusOnly));
      }
      
      setLocation('/personal-info');
    }
  };
  
  const handleStartOver = () => {
    setCurrentStep(CheckerStep.START);
    setSelectedOption('');
    setResult(null);
    setDecisionPath([]);
  };

  const renderCurrentStep = () => {
    const currentNode = decisionTree[currentStep];
    
    if (currentStep === CheckerStep.RESULT && result) {
      return (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="text-green-500 h-6 w-6" />
              <h3 className="text-xl font-bold text-green-700">결정된 신고 상태:</h3>
            </div>
            
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-primary">
                {filingStatusInfo[result].title}
              </h2>
              <p className="mt-2 text-gray-700">
                {filingStatusInfo[result].description}
              </p>
            </div>
            
            <Alert className="mb-4">
              <AlertDescription>
                <strong>세금 영향:</strong> {filingStatusInfo[result].taxImplications}
              </AlertDescription>
            </Alert>

            <div className="mt-6 flex gap-4">
              <Button 
                onClick={() => setLocation('/personal-info')}
                className="flex-1 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                개인정보 페이지로 돌아가기
              </Button>
              <Button variant="outline" onClick={handleStartOver} className="flex-1">
                다시 시작하기
              </Button>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">결정 경로:</h3>
            <div className="border rounded-lg p-4 bg-slate-50">
              <ul className="space-y-3">
                {decisionPath.map((step, index) => (
                  <li key={index} className="flex gap-2 items-start">
                    <div className="bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{step.question}</p>
                      <p className="text-primary-dark">답변: {step.answer}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">부양가족 요건:</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-blue-700">
              <li>자녀의 경우 반년이상 같은 주소에 동거한 18세 이하이거나 18세 이상~24세의 경우는 Full time 학생이어야 합니다.</li>
              <li>또한 부모가 자녀의 생활의 반이상을 부담했어야 합니다.</li>
              <li>자녀가 아닌 경우 (예를 들어 부모님이나 직계 부양자때) 생활비의 반이상을 부담했어야 합니다.</li>
              <li>또한 부양자의 수입이 4,300달러(2023년기준, 매년 달라짐) 이하여야 합니다.</li>
              <li>조건을 충족 아니더라도 선택적 아닌 경우 그냥 같은 주소에 동거했어야 합니다.</li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3">{currentNode.question}</h2>
          {currentNode.description && (
            <p className="text-gray-600">{currentNode.description}</p>
          )}
        </div>

        <RadioGroup 
          className="space-y-4"
          value={selectedOption}
          onValueChange={handleOptionSelect}
        >
          {currentNode.options.map((option) => (
            <div key={option.value} className="flex items-start space-x-2">
              <RadioGroupItem 
                value={option.value} 
                id={option.value}
                className="mt-1" 
              />
              <Label 
                htmlFor={option.value} 
                className="font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/personal-info')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            개인정보 페이지로 돌아가기
          </Button>
          
          {currentStep !== CheckerStep.START && (
            <Button 
              variant="ghost" 
              onClick={handleStartOver}
            >
              처음부터 다시
            </Button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="container max-w-4xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">
          세금 신고 상태 확인 (Filing Status Checker)
        </h1>
        <p className="text-gray-600">
          아래 질문에 답하여 귀하에게 가장 적합한 세금 신고 상태(Filing Status)를 결정하세요.
        </p>
      </div>

      <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">💬 AI 세무 전문가 도움</h3>
        <ChatBot context="세금 신고 상태 확인" />
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">신고 상태 결정</CardTitle>
        </CardHeader>
        <CardContent>
          {renderCurrentStep()}
        </CardContent>
      </Card>
    </div>
  );
}