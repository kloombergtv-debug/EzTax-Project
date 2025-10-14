import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingUp, DollarSign, Calculator, PiggyBank } from 'lucide-react';

interface WealthData {
  year: number;
  wealth: number;
  taxes: number;
  debt: number;
  lifestyle: number;
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
  
  // 계산된 값들을 저장할 state
  const [calculatedPeriod, setCalculatedPeriod] = useState(30);
  const [calculatedIncome, setCalculatedIncome] = useState(100000);
  const [calculatedIncomeGrowth, setCalculatedIncomeGrowth] = useState(4);
  const [calculatedReturn, setCalculatedReturn] = useState(0);
  const [calculatedTax, setCalculatedTax] = useState(0);
  const [calculatedDebt, setCalculatedDebt] = useState(0);
  const [calculatedLifestyle, setCalculatedLifestyle] = useState(0);
  
  // 연간 저축은 자동 계산: 100% - 세금 - 부채 - 생활비
  const savingsRate = 100 - taxRate - debtRate - lifestyleRate;
  
  // 계산 버튼 핸들러
  const handleCalculate = () => {
    setCalculatedPeriod(studyPeriod);
    setCalculatedIncome(yearOneIncome);
    setCalculatedIncomeGrowth(incomeGrowthRate);
    setCalculatedReturn(returnRate);
    setCalculatedTax(taxRate);
    setCalculatedDebt(debtRate);
    setCalculatedLifestyle(lifestyleRate);
  };

  const wealthData = useMemo(() => {
    const data: WealthData[] = [];
    let cumulativeWealth = 0;
    let cumulativeTaxes = 0;
    let cumulativeDebt = 0;
    let cumulativeLifestyle = 0;

    for (let year = 1; year <= calculatedPeriod; year++) {
      const income = calculatedIncome * Math.pow(1 + calculatedIncomeGrowth / 100, year - 1);
      const taxes = income * (calculatedTax / 100);
      const debt = income * (calculatedDebt / 100);
      const lifestyle = income * (calculatedLifestyle / 100);
      
      // 누적 비용 계산
      cumulativeTaxes += taxes;
      cumulativeDebt += debt;
      cumulativeLifestyle += lifestyle;
      
      // 저축액 = 소득 - 세금 - 부채 - 생활비
      const netSavings = income - taxes - debt - lifestyle;
      
      cumulativeWealth = (cumulativeWealth + netSavings) * (1 + calculatedReturn / 100);
      
      data.push({
        year,
        wealth: Math.round(cumulativeWealth),
        taxes: -Math.round(cumulativeTaxes),
        debt: -Math.round(cumulativeDebt),
        lifestyle: -Math.round(cumulativeLifestyle),
        displayWealth: `$${(cumulativeWealth / 1000).toFixed(1)}K`
      });
    }

    return data;
  }, [calculatedPeriod, calculatedIncome, calculatedIncomeGrowth, calculatedReturn, calculatedTax, calculatedDebt, calculatedLifestyle]);

  const finalWealth = wealthData[wealthData.length - 1]?.wealth || 0;
  
  // Calculate max values for Y-axis domain
  const maxWealth = Math.max(...wealthData.map(d => d.wealth));
  const maxExpense = Math.max(...wealthData.map(d => Math.abs(d.taxes + d.debt + d.lifestyle)));
  const yAxisMax = Math.max(maxWealth, maxExpense) * 1.1;
  
  // 지출이 있는지 확인
  const hasExpenses = calculatedTax > 0 || calculatedDebt > 0 || calculatedLifestyle > 0;
  const yAxisDomain = hasExpenses ? [-yAxisMax, yAxisMax] : [0, yAxisMax];

  return (
    <div className="min-h-screen bg-white dark:bg-black py-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-xl border-gray-200 dark:border-gray-700">
            <CardHeader className="bg-black dark:bg-gray-900 text-white py-3">
              <CardTitle className="text-xl">자산 증식 시뮬레이터</CardTitle>
              <CardDescription className="text-gray-400 text-xs">미래의 재정 목표를 시각화하고 계획하세요</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    소득 정보
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label htmlFor="study-period" className="text-sm font-medium whitespace-nowrap w-40">
                        연구 기간 (년)
                      </Label>
                      <Input
                        id="study-period"
                        type="number"
                        value={studyPeriod}
                        onChange={(e) => setStudyPeriod(Number(e.target.value))}
                        className="flex-1"
                        data-testid="input-study-period"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Label htmlFor="year-one-income" className="text-sm font-medium whitespace-nowrap w-40">
                        첫 해 소득 ($)
                      </Label>
                      <Input
                        id="year-one-income"
                        type="number"
                        value={yearOneIncome}
                        onChange={(e) => setYearOneIncome(Number(e.target.value))}
                        className="flex-1"
                        data-testid="input-year-one-income"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Label htmlFor="income-growth" className="text-sm font-medium whitespace-nowrap w-40">
                        연간 소득 증가율 (%)
                      </Label>
                      <Input
                        id="income-growth"
                        type="number"
                        value={incomeGrowthRate}
                        onChange={(e) => setIncomeGrowthRate(Number(e.target.value))}
                        className="flex-1"
                        data-testid="input-income-growth"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Label htmlFor="return-rate" className="text-sm font-medium whitespace-nowrap w-40">
                        세후 수익률 (%)
                      </Label>
                      <Select
                        value={returnRate.toString()}
                        onValueChange={(value) => setReturnRate(Number(value))}
                      >
                        <SelectTrigger className="flex-1" data-testid="select-return-rate">
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
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label htmlFor="tax-rate" className="text-sm font-medium whitespace-nowrap w-40">
                        세금 (%)
                      </Label>
                      <Input
                        id="tax-rate"
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="flex-1"
                        data-testid="input-tax-rate"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Label htmlFor="debt-rate" className="text-sm font-medium whitespace-nowrap w-40">
                        부채 상환 (%)
                      </Label>
                      <Input
                        id="debt-rate"
                        type="number"
                        value={debtRate}
                        onChange={(e) => setDebtRate(Number(e.target.value))}
                        className="flex-1"
                        data-testid="input-debt-rate"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Label htmlFor="lifestyle-rate" className="text-sm font-medium whitespace-nowrap w-40">
                        생활비 (%)
                      </Label>
                      <Input
                        id="lifestyle-rate"
                        type="number"
                        value={lifestyleRate}
                        onChange={(e) => setLifestyleRate(Number(e.target.value))}
                        className="flex-1"
                        data-testid="input-lifestyle-rate"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Label htmlFor="savings-rate" className="text-sm font-medium whitespace-nowrap w-40">
                        연간 저축 (%)
                      </Label>
                      <Input
                        id="savings-rate"
                        type="number"
                        value={savingsRate}
                        readOnly
                        className="flex-1 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        data-testid="input-savings-rate"
                      />
                    </div>
                  </div>
                </div>

                {/* 계산 버튼 */}
                <button
                  onClick={handleCalculate}
                  className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  data-testid="button-calculate"
                >
                  <Calculator className="h-5 w-5" />
                  계산하기
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-gray-200 dark:border-gray-700">
            <CardHeader className="bg-black dark:bg-gray-900 text-white py-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-4 w-4" />
                자산 증식 예측
              </CardTitle>
              <CardDescription className="text-gray-400 text-xs">
                {studyPeriod}년간의 자산 성장 시뮬레이션
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={wealthData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis
                      domain={yAxisDomain}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      label={{ value: '금액 ($)', angle: -90, position: 'insideLeft', fill: '#374151' }}
                    />
                    {hasExpenses && <ReferenceLine y={0} stroke="#000" strokeWidth={2} />}
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        const labels: Record<string, string> = {
                          'wealth': '실현 자산',
                          'taxes': '누적 세금',
                          'debt': '누적 부채',
                          'lifestyle': '누적 생활비'
                        };
                        return [`$${Math.abs(value).toLocaleString()}`, labels[name] || name];
                      }}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '2px solid #000000',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '10px' }}
                      formatter={(value) => {
                        if (value === 'wealth') return '실현 자산';
                        if (value === 'taxes') return '세금';
                        if (value === 'debt') return '부채';
                        if (value === 'lifestyle') return '생활비';
                        return value;
                      }}
                    />
                    <Bar
                      dataKey="wealth"
                      stackId="positive"
                      fill="#22C55E"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={50}
                    />
                    {calculatedTax > 0 && (
                      <Bar
                        dataKey="taxes"
                        stackId="negative"
                        fill="#7F1D1D"
                        radius={[0, 0, 8, 8]}
                        maxBarSize={50}
                      />
                    )}
                    {calculatedDebt > 0 && (
                      <Bar
                        dataKey="debt"
                        stackId="negative"
                        fill="#DC2626"
                        maxBarSize={50}
                      />
                    )}
                    {calculatedLifestyle > 0 && (
                      <Bar
                        dataKey="lifestyle"
                        stackId="negative"
                        fill="#EF4444"
                        maxBarSize={50}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 예상 최종 자산 */}
              <div className="mt-3 p-3 bg-black dark:bg-gray-900 text-white rounded-lg border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">예상 최종 자산</p>
                    <p className="text-xl font-bold mt-0.5">
                      ${finalWealth.toLocaleString()}
                    </p>
                  </div>
                  <PiggyBank className="h-8 w-8 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
