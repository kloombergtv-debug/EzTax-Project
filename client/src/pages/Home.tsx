import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { File, FileText, Clock, Shield } from 'lucide-react';
import { useTaxContext } from '@/context/TaxContext';
import { useAuth } from '@/hooks/use-auth';


const Home: React.FC = () => {
  const [, navigate] = useLocation();
  const { updateTaxData } = useTaxContext();
  const { user } = useAuth();
  
  // 자동 데이터 주입 제거 - 사용자가 직접 입력하도록 변경

  return (
    <div className="max-w-5xl mx-auto">
      <section className="mb-4 text-center py-10">
        <h1 className="text-xl md:text-2xl font-bold text-primary-dark mb-2" style={{ fontFamily: 'Batang, "Noto Serif KR", "Nanum Myeongjo", serif' }}>
          안녕하십니까. 고객님의 재정적 안정과 미래 설계를 돕는 종합 재정 전문가 지대현 FA입니다. 복잡하고 까다로운 재정 문제는 아이비리그 출신 금융 전문가인 저에게 맡기시고, 고객님께서는 더 소중한 일과 삶의 가치에 집중하시기 바랍니다.
        </h1>
        <div className="mt-4">
          <span 
            onClick={() => navigate('/services')}
            className="text-blue-600 hover:text-blue-800 cursor-pointer underline font-semibold text-lg"
            data-testid="link-services"
          >
            FA가 하는일 더 자세히 알아보기
          </span>
        </div>
      </section>

      <section className="mb-12 hidden">
        <h2 className="text-2xl font-heading font-bold text-primary-dark text-center mb-8">
          왜 EzTax인가요?
        </h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <File className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">간편한 세금계산</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">세금 신고의 각 단계를 차례대로 안내해 드립니다.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">절세 방안</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">귀하가 받을 수 있는 모든 공제와 세액 공제를 찾아드립니다.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <Clock className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">최적의 은퇴전략 제안</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">개인 맞춤형 은퇴 계획과 세금 최적화 전략을 제공합니다.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">안전하고 비공개적</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">귀하의 데이터는 은행 수준의 보안으로 암호화되고 보호됩니다.</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-8 hidden">
          <Button 
            variant="ghost" 
            className="text-gray-600 hover:text-primary underline text-lg font-medium"
            onClick={() => navigate('/about')}
          >
            EzTax 의 운영자 소개 →
          </Button>
        </div>
      </section>

      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-heading text-primary-dark">지대현 Financial Advisor/연방세무사(EA)</CardTitle>
            <CardDescription className="text-lg font-semibold text-gray-600 mt-1">Rethink Wealth LLC</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div>
                <h4 className="font-semibold text-lg text-primary-dark mb-3">📚 주요 이력</h4>
                <ul className="mb-6 space-y-2">
                  <li>💼 현 Rethink Wealth 재정관리사</li>
                  <li>📊 FINRA Series 65 투자자문사</li>
                  <li>🧾 IRS 공인 EA (Enrolled Agent)</li>
                  <li>🏭 한화그룹 – 재무담당 임원</li>
                  <li>🏦 교보생명 – 재무실부장</li>
                  <li>🏢 LG전자 – IR팀 과장</li>
                  <li>📈 Nomura Securities – 애널리스트</li>
                </ul>
                
                <h4 className="font-semibold text-lg text-primary-dark mb-3">🎓 학력</h4>
                <ul className="space-y-2">
                  <li>🎓 University of Pennsylvania – 경제학</li>
                  <li>🎓 연세대학교 국제대학원 – MBA</li>
                </ul>
              </div>
              <div className="flex flex-col items-center -mt-8">
                <img 
                  src="/ceo-profile.png" 
                  alt="CEO Profile"
                  className="w-[48rem] h-auto object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate('/about')}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 hidden">
            <Button 
              size="lg"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold"
              onClick={() => user ? navigate('/personal-info') : navigate('/auth')}
            >
              {user ? '지금 시작하기' : '로그인하고 시작하기(Login to Start)'}
            </Button>
            <Button 
              size="lg"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
              onClick={() => navigate('/personal-info')}
            >
              세금시뮬레이터(Tax Simulator)
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section className="mb-12 text-center">
        <p className="text-2xl md:text-3xl font-bold text-gray-600 mb-4 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
          Less Tax, More Wealth
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full sm:w-64"
                  onClick={() => navigate('/personal-info')}
                >
                  세금진단(AI절세방안)
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>가입없이도 세금을 계산해볼수 있습니다</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            size="lg" 
            className="bg-black hover:bg-gray-800 text-white font-bold w-full sm:w-64"
            onClick={() => navigate('/retirement-score')}
          >
            은퇴준비상태진단
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
