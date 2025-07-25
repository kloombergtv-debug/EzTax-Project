import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PersonalInformation,
  Income,
  Deductions,
  TaxCredits,
  AdditionalTax,
  CalculatedResults,
  RetirementContributions
} from '@shared/schema';
import { calculateTaxes } from '../utils/tax-calculations';

export interface TaxData {
  id?: number;
  userId?: number;
  taxYear: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  personalInfo?: PersonalInformation;
  income?: Income;
  deductions?: Deductions;
  taxCredits?: TaxCredits;
  retirementContributions?: RetirementContributions;
  additionalTax?: AdditionalTax;
  calculatedResults?: CalculatedResults;
}

interface TaxContextType {
  taxData: TaxData;
  isLoading: boolean;
  isDataReady: boolean;
  updateTaxData: (data: Partial<TaxData>) => Promise<void>;
  saveTaxData: () => Promise<void>;
  loadTaxData: () => Promise<void>;
}

const TaxContext = createContext<TaxContextType | undefined>(undefined);

export const useTaxContext = () => {
  const context = useContext(TaxContext);
  if (!context) {
    throw new Error('useTaxContext must be used within a TaxProvider');
  }
  return context;
};

export const TaxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [taxData, setTaxData] = useState<TaxData>({
    taxYear: 2025,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    calculatedResults: {
      totalIncome: 0,
      adjustments: 0,
      adjustedGrossIncome: 0,
      deductions: 0,
      taxableIncome: 0,
      federalTax: 0,
      credits: 0,
      taxDue: 0,
      payments: 0,
      refundAmount: 0,
      amountOwed: 0
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // Check user authentication
        const userResponse = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-cache'
        });
        
        if (!userResponse.ok) {
          console.log('사용자 인증 실패 - 빈 데이터로 시작');
          setIsDataReady(true);
          setIsLoading(false);
          return;
        }
        
        const currentUser = await userResponse.json();
        console.log(`사용자 로그인 확인: ${currentUser.username} (ID: ${currentUser.id})`);
        
        // If user changed, clear data
        if (currentUserId !== null && currentUserId !== currentUser.id) {
          console.log('사용자 변경 - 데이터 초기화');
          setTaxData({
            taxYear: 2025,
            status: 'in_progress',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            calculatedResults: {
              totalIncome: 0,
              adjustments: 0,
              adjustedGrossIncome: 0,
              deductions: 0,
              taxableIncome: 0,
              federalTax: 0,
              credits: 0,
              taxDue: 0,
              payments: 0,
              refundAmount: 0,
              amountOwed: 0
            }
          });
        }
        
        setCurrentUserId(currentUser.id);
        
        // Load tax data for this user
        const taxResponse = await fetch('/api/tax-return', {
          credentials: 'include',
          cache: 'no-cache'
        });
        
        if (taxResponse.ok) {
          const serverTaxData = await taxResponse.json();
          console.log(`사용자 ${currentUser.username}의 세금 데이터 로드:`, {
            hasPersonalInfo: !!serverTaxData.personalInfo,
            hasIncome: !!serverTaxData.income,
            firstName: serverTaxData.personalInfo?.firstName
          });
          
          if (serverTaxData && (serverTaxData.personalInfo || serverTaxData.income)) {
            console.log('서버 데이터를 TaxContext에 로드 중...');
            setTaxData(serverTaxData);
          } else {
            console.log('빈 데이터 - 새 사용자로 시작');
          }
        } else {
          console.log('세금 데이터 로드 실패 - 새로운 데이터로 시작');
        }
        
        setIsDataReady(true);
      } catch (error) {
        console.error('데이터 로드 오류:', error);
        setIsDataReady(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [currentUserId]);

  const updateTaxData = async (data: Partial<TaxData>) => {
    try {
      console.log('updateTaxData 호출됨:', Object.keys(data));
      
      // Deep merge function
      const deepMerge = (target: any, source: any) => {
        if (!source) return target;
        if (!target) return source;
        
        const result = { ...target };
        
        for (const key in source) {
          if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
          } else {
            result[key] = source[key];
          }
        }
        
        return result;
      };

      // Merge with existing data
      const mergedData = {
        ...taxData,
        ...data,
        updatedAt: new Date().toISOString(),
        personalInfo: data.personalInfo ? deepMerge(taxData.personalInfo, data.personalInfo) : taxData.personalInfo,
        income: data.income ? deepMerge(taxData.income, data.income) : taxData.income,
        deductions: data.deductions ? deepMerge(taxData.deductions, data.deductions) : taxData.deductions,
        taxCredits: data.taxCredits ? deepMerge(taxData.taxCredits, data.taxCredits) : taxData.taxCredits,
        retirementContributions: data.retirementContributions ? deepMerge(taxData.retirementContributions, data.retirementContributions) : taxData.retirementContributions,
        additionalTax: data.additionalTax ? deepMerge(taxData.additionalTax, data.additionalTax) : taxData.additionalTax
      };

      // Calculate taxes automatically when data changes
      try {
        const calculatedResults = calculateTaxes(mergedData);
        mergedData.calculatedResults = calculatedResults;
        console.log('세금 자동 계산 완료:', calculatedResults);
      } catch (error) {
        console.error('세금 계산 오류:', error);
        // 계산 오류가 있어도 데이터는 저장
      }

      setTaxData(mergedData);
      
      // Auto-save to server
      if (currentUserId && mergedData.id) {
        console.log(`사용자 ${currentUserId} 데이터 업데이트 시작 (세금신고서 ID: ${mergedData.id})`);
        const response = await fetch(`/api/tax-return/${mergedData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(mergedData),
        });
        
        if (response.ok) {
          console.log('✅ 데이터가 성공적으로 저장되었습니다');
        } else {
          console.error('❌ 자동 저장 실패:', response.statusText);
          const errorText = await response.text();
          console.error('응답 내용:', errorText);
        }
      } else if (currentUserId) {
        console.log(`사용자 ${currentUserId} 새 세금신고서 생성 시작`);
        // Create new tax return for user
        const response = await fetch('/api/tax-return', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(mergedData),
        });
        
        if (response.ok) {
          const newTaxReturn = await response.json();
          console.log(`✅ 새 세금 신고서 생성됨 (ID: ${newTaxReturn.id})`);
          setTaxData(prev => ({ ...prev, id: newTaxReturn.id }));
        } else {
          console.error('❌ 세금신고서 생성 실패:', response.statusText);
          const errorText = await response.text();
          console.error('응답 내용:', errorText);
        }
      } else {
        console.warn('⚠️ 사용자 ID 또는 세금신고서 ID가 없어 저장을 건너뜁니다');
        console.log('현재 상태:', { currentUserId, taxReturnId: mergedData.id });
      }
    } catch (error) {
      console.error('데이터 업데이트 실패:', error);
    }
  };

  const saveTaxData = async () => {
    try {
      if (taxData.id) {
        const response = await fetch(`/api/tax-return/${taxData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(taxData),
        });
        
        if (response.ok) {
          console.log('데이터가 성공적으로 저장되었습니다');
        } else {
          console.error('저장 실패:', response.statusText);
        }
      } else {
        console.log('저장할 데이터 ID가 없습니다');
      }
    } catch (error) {
      console.error('저장 중 오류:', error);
    }
  };

  const loadTaxData = async () => {
    try {
      setIsLoading(true);
      console.log('수동 데이터 로딩 시작');
      
      // 먼저 사용자 확인
      const userResponse = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (!userResponse.ok) {
        console.log('사용자 인증 실패 - 빈 데이터로 시작');
        setIsLoading(false);
        setIsDataReady(true);
        return;
      }
      
      const user = await userResponse.json();
      console.log(`사용자 로그인 확인: ${user.username} (ID: ${user.id})`);
      setCurrentUserId(user.id);
      
      // 세금 데이터 로드
      const taxResponse = await fetch('/api/tax-return', {
        credentials: 'include'
      });
      
      if (taxResponse.ok) {
        const serverData = await taxResponse.json();
        console.log("수동 새로고침 - 서버 데이터 로드:", {
          hasPersonalInfo: !!serverData.personalInfo,
          hasIncome: !!serverData.income,
          firstName: serverData.personalInfo?.firstName
        });
        
        console.log("서버 데이터를 TaxContext에 로드 중...");
        setTaxData(serverData);
      } else {
        console.log('세금 데이터 없음 - 새 사용자로 시작');
      }
      
      setIsLoading(false);
      setIsDataReady(true);
    } catch (error) {
      console.error('수동 데이터 로딩 오류:', error);
      setIsLoading(false);
      setIsDataReady(true);
    }
  };

  return (
    <TaxContext.Provider
      value={{
        taxData,
        isLoading,
        isDataReady,
        updateTaxData,
        saveTaxData,
        loadTaxData,
      }}
    >
      {children}
    </TaxContext.Provider>
  );
};