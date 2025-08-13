import React, { useState, useEffect, useReducer } from 'react';
import { useLocation } from 'wouter';
import { useTaxContext } from '@/context/TaxContext';
import { Income } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Calculator, ArrowLeft, Save, Lock, Download, Crown, Check } from 'lucide-react';
import { ChatBot } from '@/components/ChatBot';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// 거래 항목 인터페이스 정의
interface Transaction {
  id: number;
  description: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  profit: number;
  purchaseDate: string; // 구매 날짜
  saleDate: string;     // 판매 날짜
  isLongTerm: boolean;  // 장기투자 여부
}

// 리듀서 액션 타입
type TransactionAction = 
  | { type: 'ADD_TRANSACTION'; transaction: Transaction }
  | { type: 'REMOVE_TRANSACTION'; id: number }
  | { type: 'CLEAR_TRANSACTIONS' };

// 리듀서 함수
function transactionReducer(state: Transaction[], action: TransactionAction): Transaction[] {
  console.log('Reducer called with action:', action.type, 'Current state:', state);
  
  switch (action.type) {
    case 'ADD_TRANSACTION':
      const newState = [...state, action.transaction];
      console.log('ADD_TRANSACTION - New state:', newState);
      return newState;
    case 'REMOVE_TRANSACTION':
      const filteredState = state.filter(t => t.id !== action.id);
      console.log('REMOVE_TRANSACTION - Filtered state:', filteredState);
      return filteredState;
    case 'CLEAR_TRANSACTIONS':
      console.log('CLEAR_TRANSACTIONS - Clearing state');
      return [];
    default:
      return state;
  }
}

export default function CapitalGainsCalculator() {
  const [, setLocation] = useLocation();
  const { taxData, updateTaxData } = useTaxContext();
  const { toast } = useToast();
  
  // 컴포넌트 재마운트를 위한 키
  const [componentKey, setComponentKey] = useState(0);
  
  // localStorage 기반 상태 관리
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // localStorage에서 거래 목록 가져오기
  const getTransactionsFromStorage = (): Transaction[] => {
    try {
      const stored = localStorage.getItem('capitalGainsTransactions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };
  
  // localStorage에 거래 목록 저장하기
  const saveTransactionsToStorage = (transactions: Transaction[]) => {
    try {
      localStorage.setItem('capitalGainsTransactions', JSON.stringify(transactions));
      console.log('거래 목록 localStorage에 저장됨:', transactions);
    } catch (error) {
      console.error('localStorage 저장 실패:', error);
    }
  };
  
  // 현재 거래 목록 (localStorage에서 항상 최신 데이터 가져오기)
  const transactions = getTransactionsFromStorage();
  
  // 테스트를 위한 하드코딩된 더미 데이터 (디버깅용)
  const [showTestData, setShowTestData] = useState(false);
  const testTransactions: Transaction[] = [
    {
      id: 999,
      description: "테스트 거래",
      buyPrice: 100,
      sellPrice: 200,
      quantity: 10,
      profit: 1000,
      purchaseDate: "2024-01-01",
      saleDate: "2025-01-01",
      isLongTerm: true
    }
  ];
  
  // 실제 표시할 거래 목록 (테스트 데이터 또는 실제 데이터)
  const displayTransactions = showTestData ? testTransactions : transactions;
  
  // 거래 목록 상태 변화 추적
  useEffect(() => {
    console.log('거래 목록 상태 업데이트됨:', transactions);
  }, [transactions]);
  
  // 새로운 거래 입력을 위한 상태
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id' | 'profit' | 'isLongTerm'>>({
    description: '',
    buyPrice: 0,
    sellPrice: 0,
    quantity: 0,
    purchaseDate: '',
    saleDate: ''
  });
  
  // 업로드 상태 관리
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // 프리미엄 상태 관리 (모든 기능 오픈)
  const [isPremium, setIsPremium] = useState<boolean>(true);
  
  // 프리미엄 기능 안내 다이얼로그 관리
  const [premiumDialogOpen, setPremiumDialogOpen] = useState<boolean>(false);
  
  // 장기/단기 자본 이득 및 손실 계산
  const longTermGains = transactions
    .filter(t => t.isLongTerm && t.profit > 0)
    .reduce((sum, t) => sum + t.profit, 0);
    
  const shortTermGains = transactions
    .filter(t => !t.isLongTerm && t.profit > 0)
    .reduce((sum, t) => sum + t.profit, 0);
    
  const longTermLosses = transactions
    .filter(t => t.isLongTerm && t.profit < 0)
    .reduce((sum, t) => sum + Math.abs(t.profit), 0);
    
  const shortTermLosses = transactions
    .filter(t => !t.isLongTerm && t.profit < 0)
    .reduce((sum, t) => sum + Math.abs(t.profit), 0);
  
  // 순 자본 이득/손실 계산 (이익에서 손실을 차감)
  const netLongTermGains = Math.max(0, longTermGains - longTermLosses);
  const netShortTermGains = Math.max(0, shortTermGains - shortTermLosses);
  
  // 총 자본 이득은 순 이익의 합계
  const totalCapitalGains = netLongTermGains + netShortTermGains;
    
  // 실제 소득 구간에 따른 자본 이득세 계산
  const calculateLongTermCapitalGainsTax = (gains: number) => {
    if (gains <= 0) return 0;
    
    // AGI 계산 (모든 소득 포함, 자본 이득 제외)
    const wages = taxData.income?.wages || 0;
    const otherEarnedIncome = taxData.income?.otherEarnedIncome || 0;
    const interestIncome = taxData.income?.interestIncome || 0;
    const dividends = taxData.income?.dividends || 0;
    const businessIncome = taxData.income?.businessIncome || 0;
    const rentalIncome = taxData.income?.rentalIncome || 0;
    const retirementIncome = taxData.income?.retirementIncome || 0;
    const unemploymentIncome = taxData.income?.unemploymentIncome || 0;
    const otherIncome = taxData.income?.otherIncome || 0;
    
    // AGI = 모든 일반 소득 합계 (자본 이득 제외)
    const adjustedGrossIncome = wages + otherEarnedIncome + interestIncome + 
                               dividends + businessIncome + rentalIncome + 
                               retirementIncome + unemploymentIncome + otherIncome;
    
    // 표준공제 적용하여 과세소득 계산
    const filingStatus = taxData.personalInfo?.filingStatus || 'single';
    const standardDeduction = {
      single: 13850,
      married_joint: 27700,
      married_separate: 13850,
      head_of_household: 20800,
      qualifying_widow: 27700
    }[filingStatus] || 13850;
    
    // 과세소득 = AGI - 표준공제 (음수가 되지 않도록)
    const taxableIncomeBeforeCapitalGains = Math.max(0, adjustedGrossIncome - standardDeduction);
    
    // 자본 이득세 계산을 위한 총 과세소득 (일반 과세소득 + 자본 이득)
    const totalTaxableIncome = taxableIncomeBeforeCapitalGains + gains;
    
    // 2024/2025년 장기 자본 이득세율 구간 (소득 구간별)
    const capitalGainsRates = {
      single: [
        { rate: 0.00, upTo: 47025 },    // 0%
        { rate: 0.15, upTo: 518900 },   // 15%
        { rate: 0.20, upTo: Infinity }  // 20%
      ],
      married_joint: [
        { rate: 0.00, upTo: 94050 },    // 0%
        { rate: 0.15, upTo: 583750 },   // 15%
        { rate: 0.20, upTo: Infinity }  // 20%
      ],
      married_separate: [
        { rate: 0.00, upTo: 47025 },    // 0%
        { rate: 0.15, upTo: 291875 },   // 15%
        { rate: 0.20, upTo: Infinity }  // 20%
      ],
      head_of_household: [
        { rate: 0.00, upTo: 63000 },    // 0%
        { rate: 0.15, upTo: 551350 },   // 15%
        { rate: 0.20, upTo: Infinity }  // 20%
      ]
    };
    
    const brackets = capitalGainsRates[filingStatus as keyof typeof capitalGainsRates] || capitalGainsRates.single;
    let taxOwed = 0;
    let remainingGains = gains;
    let currentIncomeLevel = taxableIncomeBeforeCapitalGains; // 일반 과세소득 부분
    
    for (const bracket of brackets) {
      if (remainingGains <= 0) break;
      
      const availableInBracket = Math.max(0, bracket.upTo - currentIncomeLevel);
      
      if (availableInBracket > 0) {
        const gainsInBracket = Math.min(remainingGains, availableInBracket);
        taxOwed += gainsInBracket * bracket.rate;
        remainingGains -= gainsInBracket;
        currentIncomeLevel += gainsInBracket;
      } else {
        currentIncomeLevel = bracket.upTo;
      }
    }
    
    console.log(`장기 자본 이득세 계산: 
      AGI: $${adjustedGrossIncome.toLocaleString()}, 
      표준공제: $${standardDeduction.toLocaleString()},
      일반과세소득: $${taxableIncomeBeforeCapitalGains.toLocaleString()},
      자본이득: $${gains.toLocaleString()}, 
      총과세소득: $${totalTaxableIncome.toLocaleString()}, 
      납부세액: $${taxOwed.toLocaleString()}, 
      실효세율: ${((taxOwed/gains)*100).toFixed(1)}%`);
    
    return taxOwed;
  };
  
  // 단기 자본 이득세 계산 (일반소득세율 적용)
  const calculateShortTermCapitalGainsTax = (gains: number) => {
    if (gains <= 0) return 0;
    
    // AGI 계산 (모든 소득 포함, 자본 이득 제외)
    const wages = taxData.income?.wages || 0;
    const otherEarnedIncome = taxData.income?.otherEarnedIncome || 0;
    const interestIncome = taxData.income?.interestIncome || 0;
    const dividends = taxData.income?.dividends || 0;
    const businessIncome = taxData.income?.businessIncome || 0;
    const rentalIncome = taxData.income?.rentalIncome || 0;
    const retirementIncome = taxData.income?.retirementIncome || 0;
    const unemploymentIncome = taxData.income?.unemploymentIncome || 0;
    const otherIncome = taxData.income?.otherIncome || 0;
    
    const adjustedGrossIncome = wages + otherEarnedIncome + interestIncome + 
                               dividends + businessIncome + rentalIncome + 
                               retirementIncome + unemploymentIncome + otherIncome;
    
    // 표준공제 적용하여 과세소득 계산
    const filingStatus = taxData.personalInfo?.filingStatus || 'single';
    const standardDeduction = {
      single: 13850,
      married_joint: 27700,
      married_separate: 13850,
      head_of_household: 20800,
      qualifying_widow: 27700
    }[filingStatus] || 13850;
    
    const taxableIncomeBeforeCapitalGains = Math.max(0, adjustedGrossIncome - standardDeduction);
    
    // 2024/2025년 일반소득세율 구간
    const ordinaryTaxRates = {
      single: [
        { rate: 0.10, upTo: 11600 },
        { rate: 0.12, upTo: 47150 },
        { rate: 0.22, upTo: 100525 },
        { rate: 0.24, upTo: 191950 },
        { rate: 0.32, upTo: 243725 },
        { rate: 0.35, upTo: 609350 },
        { rate: 0.37, upTo: Infinity }
      ],
      married_joint: [
        { rate: 0.10, upTo: 23200 },
        { rate: 0.12, upTo: 94300 },
        { rate: 0.22, upTo: 201050 },
        { rate: 0.24, upTo: 383900 },
        { rate: 0.32, upTo: 487450 },
        { rate: 0.35, upTo: 731200 },
        { rate: 0.37, upTo: Infinity }
      ],
      married_separate: [
        { rate: 0.10, upTo: 11600 },
        { rate: 0.12, upTo: 47150 },
        { rate: 0.22, upTo: 100525 },
        { rate: 0.24, upTo: 191950 },
        { rate: 0.32, upTo: 243725 },
        { rate: 0.35, upTo: 365600 },
        { rate: 0.37, upTo: Infinity }
      ],
      head_of_household: [
        { rate: 0.10, upTo: 16550 },
        { rate: 0.12, upTo: 63100 },
        { rate: 0.22, upTo: 100500 },
        { rate: 0.24, upTo: 191950 },
        { rate: 0.32, upTo: 243700 },
        { rate: 0.35, upTo: 609350 },
        { rate: 0.37, upTo: Infinity }
      ]
    };
    
    const brackets = ordinaryTaxRates[filingStatus as keyof typeof ordinaryTaxRates] || ordinaryTaxRates.single;
    let taxOwed = 0;
    let remainingGains = gains;
    let currentIncomeLevel = taxableIncomeBeforeCapitalGains;
    
    for (const bracket of brackets) {
      if (remainingGains <= 0) break;
      
      const availableInBracket = Math.max(0, bracket.upTo - currentIncomeLevel);
      
      if (availableInBracket > 0) {
        const gainsInBracket = Math.min(remainingGains, availableInBracket);
        taxOwed += gainsInBracket * bracket.rate;
        remainingGains -= gainsInBracket;
        currentIncomeLevel += gainsInBracket;
      } else {
        currentIncomeLevel = bracket.upTo;
      }
    }
    
    console.log(`단기 자본 이득세 계산: 
      AGI: $${adjustedGrossIncome.toLocaleString()}, 
      표준공제: $${standardDeduction.toLocaleString()},
      일반과세소득: $${taxableIncomeBeforeCapitalGains.toLocaleString()},
      단기자본이득: $${gains.toLocaleString()}, 
      납부세액: $${taxOwed.toLocaleString()}, 
      실효세율: ${gains > 0 ? ((taxOwed/gains)*100).toFixed(1) : 0}%`);
    
    return taxOwed;
  };

  // 장기/단기 자본 이득세 계산 (순 이익 기준)
  const estimatedLongTermTax = calculateLongTermCapitalGainsTax(netLongTermGains);
  const estimatedShortTermTax = calculateShortTermCapitalGainsTax(netShortTermGains);
  const totalEstimatedTax = estimatedLongTermTax + estimatedShortTermTax;
  
  // 입력 필드 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let processedValue: string | number = value;
    
    // 문자열 필드들
    if (name === 'description' || name === 'purchaseDate' || name === 'saleDate') {
      processedValue = value;
    } else {
      // 숫자 필드들 (buyPrice, sellPrice, quantity)
      processedValue = value === '' ? 0 : Number(value);
    }
    
    setNewTransaction(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };
  
  // 날짜 문자열을 Date 객체로 변환하는 헬퍼 함수
  const parseDate = (dateStr: string): Date => {
    return new Date(dateStr);
  };
  
  // 두 날짜 사이의 차이가 1년 이상인지 확인하는 함수
  const isLongTermInvestment = (purchaseDate: string, saleDate: string): boolean => {
    if (!purchaseDate || !saleDate) return false;
    
    const purchase = parseDate(purchaseDate);
    const sale = parseDate(saleDate);
    
    // 유효한 날짜인지 확인
    if (isNaN(purchase.getTime()) || isNaN(sale.getTime())) return false;
    
    // 구매일이 판매일보다 미래인 경우
    if (purchase > sale) return false;
    
    // 1년(365일)을 밀리초로 변환
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    
    // 구매일과 판매일의 차이가 1년 이상인지 확인
    return (sale.getTime() - purchase.getTime()) >= oneYearInMs;
  };
  
  // 새 거래 추가
  const addTransaction = () => {
    console.log('거래 추가 시도:', newTransaction);
    
    if (!newTransaction.description || 
        newTransaction.buyPrice <= 0 || 
        newTransaction.sellPrice <= 0 || 
        newTransaction.quantity <= 0 ||
        !newTransaction.purchaseDate || 
        !newTransaction.saleDate) {
      console.log('입력 검증 실패:', {
        description: newTransaction.description,
        buyPrice: newTransaction.buyPrice,
        sellPrice: newTransaction.sellPrice,
        quantity: newTransaction.quantity,
        purchaseDate: newTransaction.purchaseDate,
        saleDate: newTransaction.saleDate
      });
      toast({
        title: "입력 오류",
        description: "모든 필드를 올바르게 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    // 이익 계산
    const profit = (newTransaction.sellPrice - newTransaction.buyPrice) * newTransaction.quantity;
    
    // 장기/단기 투자 여부 판단
    const isLongTerm = isLongTermInvestment(newTransaction.purchaseDate, newTransaction.saleDate);
    
    console.log('계산된 값들:', { profit, isLongTerm });
    
    // 새 거래 추가 - 직접 배열 조작
    const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    const newTransactionWithId = { 
      ...newTransaction, 
      id: newId, 
      profit,
      isLongTerm 
    };
    
    console.log('추가할 거래:', newTransactionWithId);
    console.log('기존 거래 목록:', transactions);
    
    // localStorage에 저장하고 강제 리렌더링
    const updatedList = [...transactions, newTransactionWithId];
    console.log('새로 생성된 배열:', updatedList);
    
    saveTransactionsToStorage(updatedList);
    setForceUpdate(prev => prev + 1);
    setComponentKey(prev => prev + 1);
    
    // 입력 필드 초기화
    setNewTransaction({
      description: '',
      buyPrice: 0,
      sellPrice: 0,
      quantity: 0,
      purchaseDate: '',
      saleDate: ''
    });
    
    toast({
      title: "거래 추가됨",
      description: "새 거래가 목록에 추가되었습니다."
    });
  };
  
  // 거래 삭제
  const removeTransaction = (id: number) => {
    const filteredList = transactions.filter(transaction => transaction.id !== id);
    saveTransactionsToStorage(filteredList);
    setForceUpdate(prev => prev + 1);
    setComponentKey(prev => prev + 1);
    toast({
      title: "거래 삭제됨",
      description: "선택한 거래가 목록에서 제거되었습니다."
    });
  };
  
  // 프리미엄 기능 페이지로 이동
  const goToPremiumPage = () => {
    setLocation('/premium-features');
  };
  
  // 프리미엄 기능 접근 체크 (모든 기능 오픈)
  const checkPremiumAccess = (featureName: string) => {
    return true; // 모든 기능 접근 가능
  };

  // 1099-B 파일 업로드 시뮬레이션
  const simulateFileUpload = () => {
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // 업로드 진행 상황 시뮬레이션
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          // 업로드 완료 후 예시 데이터 추가
          const sampleTransactions: Transaction[] = [
            { 
              id: transactions.length + 1, 
              description: '아마존 주식', 
              buyPrice: 130, 
              sellPrice: 145, 
              quantity: 20, 
              profit: 300,
              purchaseDate: '2023-08-12',
              saleDate: '2024-03-25',
              isLongTerm: false
            },
            { 
              id: transactions.length + 2, 
              description: '구글 주식', 
              buyPrice: 2200, 
              sellPrice: 2350, 
              quantity: 5, 
              profit: 750,
              purchaseDate: '2022-05-18',
              saleDate: '2024-02-10',
              isLongTerm: true
            },
            { 
              id: transactions.length + 3, 
              description: '페이스북 주식', 
              buyPrice: 320, 
              sellPrice: 340, 
              quantity: 15, 
              profit: 300,
              purchaseDate: '2023-04-01',
              saleDate: '2024-05-01',
              isLongTerm: true
            }
          ];
          
          setTransactions(prev => [...prev, ...sampleTransactions]);
          
          toast({
            title: "1099-B 파일 처리 완료",
            description: "파일에서 3개의 거래가 추출되었습니다.",
            duration: 5000
          });
        }
        return newProgress;
      });
    }, 200);
  };
  
  // 자본 이득 저장 및 수입 페이지로 이동
  const saveAndReturn = () => {
    console.log('saveAndReturn 함수 호출됨');
    console.log('현재 taxData:', taxData);
    console.log('현재 totalCapitalGains:', totalCapitalGains);
    
    // 기존 소득 데이터가 있으면 업데이트, 없으면 새로 생성
    const existingIncome = taxData.income || {
      wages: 0,
      otherEarnedIncome: 0,
      interestIncome: 0,
      dividends: 0,
      businessIncome: 0,
      capitalGains: 0,
      rentalIncome: 0,
      retirementIncome: 0,
      unemploymentIncome: 0,
      otherIncome: 0,
      totalIncome: 0
    };
    
    // 새 소득 객체 생성
    const newIncome: Income = {
      ...existingIncome,
      // 자본 이득 업데이트
      capitalGains: totalCapitalGains,
      // 총소득 재계산
      totalIncome: (
        Number(existingIncome.wages) +
        Number(existingIncome.otherEarnedIncome) +
        Number(existingIncome.interestIncome) +
        Number(existingIncome.dividends) +
        Number(existingIncome.businessIncome) +
        totalCapitalGains +
        Number(existingIncome.rentalIncome) +
        Number(existingIncome.retirementIncome) +
        Number(existingIncome.unemploymentIncome) +
        Number(existingIncome.otherIncome)
      )
    };
    
    console.log('새로 생성된 income 데이터:', newIncome);
    
    // 세금 데이터 업데이트
    updateTaxData({ income: newIncome });
    
    // 성공 메시지
    toast({
      title: "자본 이득 저장 완료",
      description: `자본 이득 $${totalCapitalGains.toLocaleString()}이(가) 소득에 추가되었습니다.`,
      duration: 3000
    });
    
    console.log('소득 페이지로 이동 중...');
    
    // 소득 페이지로 이동
    setLocation('/income');
  };
  
  return (
    <div key={componentKey} className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">자본 이득 계산기 (Capital Gains Calculator)</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/income')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>소득 페이지로 돌아가기</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              자본 이득을 계산하려면 아래에 거래 정보를 입력하세요.
              계산된 총 자본 이득은 소득 페이지의 자본 이득(Capital Gains) 필드에 자동으로 반영됩니다.
            </p>
          </div>
          

          
          {/* 거래 목록 테이블 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">거래 목록</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTestData(!showTestData)}
              >
                {showTestData ? "실제 데이터" : "테스트 데이터"}
              </Button>
            </div>
            <Table key={forceUpdate}>
              <TableCaption>자본 이득 거래 내역</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">종목/자산 설명</TableHead>
                  <TableHead className="text-right">매수가 ($)</TableHead>
                  <TableHead className="text-right">매도가 ($)</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead className="text-center">구매일</TableHead>
                  <TableHead className="text-center">판매일</TableHead>
                  <TableHead className="text-center">유형</TableHead>
                  <TableHead className="text-right">이익/손실 ($)</TableHead>
                  <TableHead className="w-[80px]">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell className="text-right">${transaction.buyPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${transaction.sellPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{transaction.quantity}</TableCell>
                    <TableCell className="text-center">{transaction.purchaseDate}</TableCell>
                    <TableCell className="text-center">{transaction.saleDate}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        transaction.isLongTerm 
                          ? "bg-green-100 text-green-800" 
                          : "bg-amber-100 text-amber-800"
                      )}>
                        {transaction.isLongTerm ? '장기' : '단기'}
                      </span>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      transaction.profit > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ${transaction.profit.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTransaction(transaction.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* 새 거래 추가 폼 */}
          <div className="mb-6 p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-3">새 거래 추가</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="description">종목/자산 설명</Label>
                <Input
                  id="description"
                  name="description"
                  value={newTransaction.description}
                  onChange={handleInputChange}
                  placeholder="예: 테슬라 주식"
                />
              </div>
              <div>
                <Label htmlFor="buyPrice">매수가 ($)</Label>
                <Input
                  id="buyPrice"
                  name="buyPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTransaction.buyPrice || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="sellPrice">매도가 ($)</Label>
                <Input
                  id="sellPrice"
                  name="sellPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTransaction.sellPrice || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <Label htmlFor="quantity">수량</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={newTransaction.quantity || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="purchaseDate">구매일</Label>
                <Input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  value={newTransaction.purchaseDate}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="saleDate">판매일</Label>
                <Input
                  id="saleDate"
                  name="saleDate"
                  type="date"
                  value={newTransaction.saleDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button onClick={addTransaction} className="w-auto px-6">
                거래 추가
              </Button>
            </div>
          </div>
          
          {/* 요약 및 결과 */}
          <div className="bg-gray-50 p-6 rounded-md">
            <h3 className="text-xl font-bold mb-4">자본 이득 및 예상 세금 요약</h3>
            
            {/* 소득 구간별 세율 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">📊 2024/2025년 장기 자본 이득세율 구간</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium">0% 세율:</span>
                    <div className="text-xs">
                      • 독신: $47,025 이하<br/>
                      • 부부 합산: $94,050 이하
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">15% 세율:</span>
                    <div className="text-xs">
                      • 독신: $47,026 - $518,900<br/>
                      • 부부 합산: $94,051 - $583,750
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">20% 세율:</span>
                    <div className="text-xs">
                      • 독신: $518,901 이상<br/>
                      • 부부 합산: $583,751 이상
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-600 italic">
                  * 세율은 과세소득(AGI - 표준공제 + 자본이득)을 기준으로 적용됩니다.<br/>
                  * 정확한 계산을 위해 소득 페이지에서 모든 소득 정보를 먼저 입력하세요.
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 장기 투자 요약 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">장기</span>
                  장기 투자 (1년 이상)
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">이익 총액:</span>
                    <span className="font-medium text-green-600">${longTermGains.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">손실 총액:</span>
                    <span className="font-medium text-red-600">${longTermLosses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">순 이익:</span>
                    <span className="font-medium text-blue-600">${netLongTermGains.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">실제 세율:</span>
                    <span className="font-medium text-blue-600">
                      {netLongTermGains > 0 ? 
                        `${((estimatedLongTermTax / netLongTermGains) * 100).toFixed(1)}%` : 
                        '0%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">과세소득 기준:</span>
                    <span className="font-medium text-blue-600">
                      {(() => {
                        // AGI 계산
                        const wages = taxData.income?.wages || 0;
                        const otherEarnedIncome = taxData.income?.otherEarnedIncome || 0;
                        const interestIncome = taxData.income?.interestIncome || 0;
                        const dividends = taxData.income?.dividends || 0;
                        const businessIncome = taxData.income?.businessIncome || 0;
                        const rentalIncome = taxData.income?.rentalIncome || 0;
                        const retirementIncome = taxData.income?.retirementIncome || 0;
                        const unemploymentIncome = taxData.income?.unemploymentIncome || 0;
                        const otherIncome = taxData.income?.otherIncome || 0;
                        
                        const adjustedGrossIncome = wages + otherEarnedIncome + interestIncome + 
                                                   dividends + businessIncome + rentalIncome + 
                                                   retirementIncome + unemploymentIncome + otherIncome;
                        
                        const filingStatus = taxData.personalInfo?.filingStatus || 'single';
                        const standardDeduction = {
                          single: 13850,
                          married_joint: 27700,
                          married_separate: 13850,
                          head_of_household: 20800,
                          qualifying_widow: 27700
                        }[filingStatus] || 13850;
                        
                        const taxableIncome = Math.max(0, adjustedGrossIncome - standardDeduction);
                        const totalTaxableIncome = taxableIncome + netLongTermGains;
                        
                        if (filingStatus === 'single') {
                          if (totalTaxableIncome <= 47025) return '0% 구간';
                          if (totalTaxableIncome <= 518900) return '15% 구간';
                          return '20% 구간';
                        } else if (filingStatus === 'married_joint') {
                          if (totalTaxableIncome <= 94050) return '0% 구간';
                          if (totalTaxableIncome <= 583750) return '15% 구간';
                          return '20% 구간';
                        } else {
                          if (totalTaxableIncome <= 47025) return '0% 구간';
                          if (totalTaxableIncome <= 291875) return '15% 구간';
                          return '20% 구간';
                        }
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">예상 세금:</span>
                    <span className="font-bold">${estimatedLongTermTax.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* 단기 투자 요약 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">단기</span>
                  단기 투자 (1년 미만)
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">이익 총액:</span>
                    <span className="font-medium text-green-600">${shortTermGains.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">손실 총액:</span>
                    <span className="font-medium text-red-600">${shortTermLosses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">순 이익:</span>
                    <span className="font-medium text-blue-600">${netShortTermGains.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">실제 세율:</span>
                    <span className="font-medium text-blue-600">
                      {netShortTermGains > 0 ? 
                        `${((estimatedShortTermTax / netShortTermGains) * 100).toFixed(1)}%` : 
                        '0%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">예상 세금:</span>
                    <span className="font-bold">${estimatedShortTermTax.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 총 자본 이득 및 세금 */}
            <div className="bg-white p-4 rounded-lg border border-green-200 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">총 자본 이득 (Net Capital Gains)</h3>
                  <p className="text-gray-600 text-sm">
                    모든 거래의 순 이익 (이익 - 손실)을 합산한 금액입니다.
                  </p>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2 md:mt-0">
                  ${totalCapitalGains.toLocaleString()}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">예상 총 세금 (Estimated Tax)</h3>
                  <p className="text-gray-600 text-sm">
                    장기 및 단기 자본 이득에 부과되는 예상 세금 합계입니다.
                  </p>
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-2 md:mt-0">
                  ${totalEstimatedTax.toLocaleString()}
                </div>
              </div>
            </div>
            

            
            <div className="flex justify-end">
              <Button
                onClick={saveAndReturn}
                size="lg"
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>자본 이득 저장 및 돌아가기</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <ChatBot context="자본이득계산기" />

    </div>
  );
}