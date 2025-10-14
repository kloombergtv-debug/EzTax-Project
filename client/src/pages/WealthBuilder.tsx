import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Calculator, PiggyBank } from 'lucide-react';

interface WealthData {
  year: number;
  wealth: number;
  displayWealth: string;
}

export default function WealthBuilder() {
  const [studyPeriod, setStudyPeriod] = useState(30);
  const [yearOneIncome, setYearOneIncome] = useState(100000);
  const [incomeGrowthRate, setIncomeGrowthRate] = useState(4);
  const [returnRate, setReturnRate] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [debtRate, setDebtRate] = useState(0);
  const [lifestyleRate, setLifestyleRate] = useState(0);
  const [savingsRate, setSavingsRate] = useState(0);

  const wealthData = useMemo(() => {
    const data: WealthData[] = [];
    let cumulativeWealth = 0;

    for (let year = 1; year <= studyPeriod; year++) {
      const income = yearOneIncome * Math.pow(1 + incomeGrowthRate / 100, year - 1);
      const taxes = income * (taxRate / 100);
      const debt = income * (debtRate / 100);
      const lifestyle = income * (lifestyleRate / 100);
      const savings = income * (savingsRate / 100);
      
      const netSavings = income - taxes - debt - lifestyle - savings;
      
      cumulativeWealth = (cumulativeWealth + netSavings) * (1 + returnRate / 100);
      
      data.push({
        year,
        wealth: Math.round(cumulativeWealth),
        displayWealth: `$${(cumulativeWealth / 1000).toFixed(1)}K`
      });
    }

    return data;
  }, [studyPeriod, yearOneIncome, incomeGrowthRate, returnRate, taxRate, debtRate, lifestyleRate, savingsRate]);

  const finalWealth = wealthData[wealthData.length - 1]?.wealth || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            자산 증식 시뮬레이터
          </h1>
          <p className="text-gray-600 dark:text-gray-400">미래의 재정 목표를 시각화하고 계획하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">예상 최종 자산</p>
                  <p className="text-3xl font-bold mt-1">${Math.round(finalWealth / 1000)}K</p>
                </div>
                <DollarSign className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">시뮬레이션 기간</p>
                  <p className="text-3xl font-bold mt-1">{studyPeriod}년</p>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">연평균 수익률</p>
                  <p className="text-3xl font-bold mt-1">{returnRate}%</p>
                </div>
                <PiggyBank className="h-12 w-12 text-pink-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                계산 설정
              </CardTitle>
              <CardDescription className="text-indigo-100">
                소득과 지출 정보를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    소득 정보
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="study-period" className="text-sm font-medium">
                        연구 기간 (년)
                      </Label>
                      <Input
                        id="study-period"
                        type="number"
                        value={studyPeriod}
                        onChange={(e) => setStudyPeriod(Number(e.target.value))}
                        className="mt-1"
                        data-testid="input-study-period"
                      />
                    </div>

                    <div>
                      <Label htmlFor="year-one-income" className="text-sm font-medium">
                        첫 해 소득 ($)
                      </Label>
                      <Input
                        id="year-one-income"
                        type="number"
                        value={yearOneIncome}
                        onChange={(e) => setYearOneIncome(Number(e.target.value))}
                        className="mt-1"
                        data-testid="input-year-one-income"
                      />
                    </div>

                    <div>
                      <Label htmlFor="income-growth" className="text-sm font-medium">
                        연간 소득 증가율 (%)
                      </Label>
                      <Input
                        id="income-growth"
                        type="number"
                        value={incomeGrowthRate}
                        onChange={(e) => setIncomeGrowthRate(Number(e.target.value))}
                        className="mt-1"
                        data-testid="input-income-growth"
                      />
                    </div>

                    <div>
                      <Label htmlFor="return-rate" className="text-sm font-medium">
                        세후 수익률 (%)
                      </Label>
                      <Select
                        value={returnRate.toString()}
                        onValueChange={(value) => setReturnRate(Number(value))}
                      >
                        <SelectTrigger className="mt-1" data-testid="select-return-rate">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((rate) => (
                            <SelectItem key={rate} value={rate.toString()}>
                              {rate}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    지출 정보
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tax-rate" className="text-sm font-medium">
                        세금 (%)
                      </Label>
                      <Input
                        id="tax-rate"
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="mt-1"
                        data-testid="input-tax-rate"
                      />
                    </div>

                    <div>
                      <Label htmlFor="debt-rate" className="text-sm font-medium">
                        부채 상환 (%)
                      </Label>
                      <Input
                        id="debt-rate"
                        type="number"
                        value={debtRate}
                        onChange={(e) => setDebtRate(Number(e.target.value))}
                        className="mt-1"
                        data-testid="input-debt-rate"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lifestyle-rate" className="text-sm font-medium">
                        생활비 (%)
                      </Label>
                      <Input
                        id="lifestyle-rate"
                        type="number"
                        value={lifestyleRate}
                        onChange={(e) => setLifestyleRate(Number(e.target.value))}
                        className="mt-1"
                        data-testid="input-lifestyle-rate"
                      />
                    </div>

                    <div>
                      <Label htmlFor="savings-rate" className="text-sm font-medium">
                        연간 저축 (%)
                      </Label>
                      <Input
                        id="savings-rate"
                        type="number"
                        value={savingsRate}
                        onChange={(e) => setSavingsRate(Number(e.target.value))}
                        className="mt-1"
                        data-testid="input-savings-rate"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                자산 증식 예측
              </CardTitle>
              <CardDescription className="text-pink-100">
                {studyPeriod}년간의 자산 성장 시뮬레이션
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={wealthData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      label={{ value: '연도', position: 'insideBottom', offset: -10, fill: '#374151' }}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      label={{ value: '누적 자산 ($)', angle: -90, position: 'insideLeft', fill: '#374151' }}
                    />
                    <Tooltip
                      formatter={(value: any) => [`$${value.toLocaleString()}`, '누적 자산']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '2px solid #8b5cf6',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={() => '실현 자산'}
                    />
                    <Bar
                      dataKey="wealth"
                      fill="url(#wealthGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={50}
                    />
                    <defs>
                      <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#d946ef" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-100">예상 최종 자산</p>
                    <p className="text-2xl font-bold mt-1">
                      ${finalWealth.toLocaleString()}
                    </p>
                  </div>
                  <PiggyBank className="h-10 w-10 text-indigo-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
