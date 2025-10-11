import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { File, FileText, Clock, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';


const Home: React.FC = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // 자동 데이터 주입 제거 - 사용자가 직접 입력하도록 변경

  return (
    <div className="max-w-5xl mx-auto">
      <section className="mb-4 py-12 bg-blue-50 rounded-lg">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8 items-end">
            <div className="text-left flex-1">
              <h1 className="text-2xl font-bold text-slate-800 mb-2" style={{ fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", -apple-system, sans-serif' }}>
                지대현 Financial Advisor/세무사(EA)
              </h1>
              <p className="text-lg text-slate-600 mb-8" style={{ fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", -apple-system, sans-serif' }}>
                Rethink Wealth LLC
              </p>
              
              <h2 className="text-lg md:text-xl font-medium text-slate-700 leading-relaxed mb-6" style={{ fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
                안녕하십니까. 고객님이 매일 편안한 마음으로 잠을 청할수 있도록, 불확실한 내일로부터 가족과 꿈을 지켜드리는 <span className="text-primary font-semibold">전인적 (financial planning & holistic wealth) 재정 관리사 지대현</span>입니다.
              </h2>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-6" style={{ fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
                Income protection, investment, retirement and estate planning 같은 까다롭고 민감한 재정 문제는 <span className="text-primary font-semibold">아이비리그 출신 금융 전문가</span>인 저와 저희 팀에게 의지하시고, 고객님께서는 <span className="text-primary font-semibold">더 큰 꿈</span>과 <span className="text-primary font-semibold">의미 있는 삶</span>에 집중하십시오.
              </p>
              <div>
                <span 
                  onClick={() => navigate('/services')}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 cursor-pointer font-medium text-base transition-colors"
                  data-testid="link-services"
                >
                  재정관리사 (FA)가 하는일 자세히 알아보기
                  <span className="text-lg">→</span>
                </span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/ceo-profile-no-bg.png" 
                alt="CEO Profile"
                className="w-64 h-auto object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate('/about')}
              />
            </div>
          </div>
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
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-lg text-primary-dark mb-3">📚 주요 이력</h4>
                <ul className="mb-6 space-y-2">
                  <li>💼 현 Rethink Wealth 재정관리사</li>
                  <li>📊 FINRA Series 65 투자자문사</li>
                  <li>🧾 IRS 공인 세무사 (Enrolled Agent)</li>
                  <li>🏭 한화에어로스페이스 재무담당 상무</li>
                  <li>💊 동아제약 IR/PR 담당 이사</li>
                  <li>🏦 교보생명 – 재무실부장</li>
                  <li>🏢 LG전자 – IR팀 과장</li>
                  <li>📈 Nomura Securities – 애널리스트</li>
                </ul>
                
                <h4 className="font-semibold text-lg text-primary-dark mb-3">🎓 학력</h4>
                <ul className="space-y-2">
                  <li>🎓 U Penn – 경제학</li>
                  <li>🎓 연세대학교 국제대학원 – MBA</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-lg text-primary-dark mb-3">🏢 Rethink Wealth LLC</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>📍 <strong>본사/지사:</strong> 텍사스주 오스틴(Austin), 포트워스(Fort Worth), 휴스턴(Houston) 등에 사무소 보유</li>
                  <li>💼 <strong>업종:</strong> 전인적(financial planning & holistic wealth) 금융 계획, 자산 관리, 리스크 관리, 보험 등 종합 재무 서비스 제공</li>
                  <li>💡 <strong>철학/방식:</strong> "재정적 균형(life & money balance)"을 중요시하며, 각 개인의 목표와 가치에 맞게 재정 계획을 맞춤 설계</li>
                  <li>⚖️ <strong>독립 자문사:</strong> Client의 최선 이익(fiduciary duty)을 지향</li>
                  <li>🤝 <strong>파트너십:</strong> 2023년 9월부로 Summit Financial과 파트너십을 맺어, Summit의 투자 전략 팀 등이 Rethink Wealth의 재정 관리 서비스를 보강하는 구조로 운영 중</li>
                  <li>💰 <strong>투자 자산 관리(AUM):</strong> 7억 3,400만 달러</li>
                  <li>💵 <strong>현금 가치 자산(Cash Value AUM):</strong> 6억 9,700만 달러 이상</li>
                  <li>🛡️ <strong>보험 관련:</strong> Death Benefit, Disability Benefit 등</li>
                </ul>
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
