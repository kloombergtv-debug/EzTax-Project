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
    <div className="min-h-screen bg-white dark:bg-black py-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-1">
            자산 증식 시뮬레이터
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">미래의 재정 목표를 시각화하고 계획하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          <Card className="bg-gray-900 dark:bg-gray-800 text-white border-gray-800">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">예상 최종 자산</p>
                  <p className="text-xl font-bold mt-0.5">${Math.round(finalWealth / 1000)}K</p>
                </div>
                <DollarSign className="h-6 w-6 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 dark:bg-gray-700 text-white border-gray-700">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">시뮬레이션 기간</p>
                  <p className="text-xl font-bold mt-0.5">{studyPeriod}년</p>
                </div>
                <TrendingUp className="h-6 w-6 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-700 dark:bg-gray-600 text-white border-gray-600">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-xs">연평균 수익률</p>
                  <p className="text-xl font-bold mt-0.5">{returnRate}%</p>
                </div>
                <PiggyBank className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-xl border-gray-200 dark:border-gray-700">
            <CardHeader className="bg-black dark:bg-gray-900 text-white">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                계산 설정
              </CardTitle>
              <CardDescription className="text-gray-400">
                소득과 지출 정보를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
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

                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
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

          <Card className="shadow-xl border-gray-200 dark:border-gray-700">
            <CardHeader className="bg-black dark:bg-gray-900 text-white">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                자산 증식 예측
              </CardTitle>
              <CardDescription className="text-gray-400">
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
                        border: '2px solid #000000',
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
                        <stop offset="0%" stopColor="#000000" stopOpacity={1} />
                        <stop offset="100%" stopColor="#4B5563" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 p-4 bg-black dark:bg-gray-900 text-white rounded-lg border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">예상 최종 자산</p>
                    <p className="text-2xl font-bold mt-1">
                      ${finalWealth.toLocaleString()}
                    </p>
                  </div>
                  <PiggyBank className="h-10 w-10 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
