import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, PiggyBank, TrendingUp, FileText } from 'lucide-react';

const Services = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary-dark mb-4">
          저와 저희 Rethink Wealth 재정 전문가팀이 도와드리는 것은:
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-primary-dark">
                  1. 소득 보호
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Protection of Income</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              가장 중요한 건 앞으로 벌어들일 소득을 지키는 겁니다. 아프거나 일을 못 하게 되더라도 생활을 유지하고, 혹시라도 갑작스러운 일이 생겨도 가족들이 경제적으로 흔들리지 않도록 보험 같은 효율적인 방법을 활용합니다.
            </p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow"
          data-testid="card-optimal-savings"
        >
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <PiggyBank className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-primary-dark">
                  2. 최적의 저축
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Save at an Optimal Level</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              미국인들과 한국인들 모두 평균적으로 소득의 4% 정도만 저축한다고 합니다. 사실 이 정도로는 아무리 수익률이 높아도 미래를 준비하기에 부족합니다. 그래서 저희는 고객님께 맞는 '적정 저축 수준'을 같이 정하고, 실제로 그 목표에 도달할 수 있게 습관과 도구들을 함께 코칭해드립니다.
            </p>
            <p 
              className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium mt-3 transition-colors"
              onClick={() => window.open('https://youtu.be/YZRRL_sVmKE', '_blank')}
              data-testid="link-optimal-savings-video"
            >
              최적의 저축률은 얼마일까? →
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-primary-dark">
                  3. 자산 성장
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Grow Wealth</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              저희가 강조하는 건 "수익률을 더 높여드리겠습니다"가 아닙니다. 제대로 된 자산관리사라면 누구나 시장 수준의 수익률을 만들어 드릴 수 있거든요. 저희의 강점은 자산을 키워가는 과정에서 세금을 어떻게 줄일지, 위험을 어떻게 관리할지를 함께 고민하고 실행한다는 점입니다.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-primary-dark">
                  4. 분배 계획
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Distribution Planning</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              많은 분들이 은퇴 이후 소득을 어떻게 받을지, 또 세금 문제와 상속 계획을 어떻게 할지에서 큰 도움을 받으십니다. 저희는 이런 부분을 세금과 리스크 관점에서 미리 준비하도록 코칭하고 계획을 세워드립니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Services;
