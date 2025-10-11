import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { File, FileText, Clock, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/LanguageContext';


const Home: React.FC = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // 자동 데이터 주입 제거 - 사용자가 직접 입력하도록 변경

  return (
    <div className="max-w-5xl mx-auto">
      <section className="mb-4 py-12 bg-white rounded-lg">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-end">
            <div className="lg:col-span-2 text-left">
              <h1 className="text-2xl font-bold text-slate-800 mb-2" style={{ fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", -apple-system, sans-serif' }}>
                {t('지대현 Financial Advisor/세무사(EA)', 'Dae Hyun Jee, Financial Advisor/EA')}
              </h1>
              <p className="text-lg text-slate-600 mb-8" style={{ fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", -apple-system, sans-serif' }}>
                Rethink Wealth LLC
              </p>
              
              <div className="text-sm text-slate-600 leading-relaxed mb-6 space-y-4" style={{ fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", -apple-system, sans-serif' }}>
                <p>
                  {t(
                    '미국인의 수입 대비 저축률은 평균 4~5% 정도 이며 한국도 비슷합니다. 그러나 연구 결과 퇴직시점에서 그 정도의 저축으로는 아무리 투자를 잘한다고 해도 현재 누리는 life style을 유지할 수 없으며 연령별로 차이는 있지만 적어도 20%는 저축을 해야 그 때부터 "리스크대비 투자수익률 극대화"가 의미가 있다고 합니다.',
                    'The average saving rate is about 4-5% of income in both the U.S. and Korea. However, research shows that even with excellent investment returns, this level of saving cannot maintain your current lifestyle in retirement. While it varies by age, you need to save at least 20% before "maximizing risk-adjusted returns" becomes meaningful.'
                  )}
                </p>
                <p>
                  {t(
                    '물론 그것이 다는 아닙니다. 우리가 최적의 저축수준을 도달하고 좋은 수익률을 올리더라도 우리의 control 밖에 있는 크리티칼한 리스크들을 대비해야 합니다. 갑작스러운 죽음이나 사고, 미국생활에 종종 터질 수 있는 말도 안되는 소송들 이런것들을 대비해 두지 않으면 나와 사랑하는 나의 가족들이 큰 고통에 빠질 수 있습니다.',
                    'Of course, that\'s not all. Even if we reach optimal savings levels and achieve good returns, we must prepare for critical risks beyond our control. Sudden death, accidents, or absurd lawsuits that can occur in American life - without preparing for these, you and your loved ones could face great hardship.'
                  )}
                </p>
                <div>
                  <p className="font-semibold text-primary mb-2">
                    {t('Rethink Wealth FA는', 'Rethink Wealth FA:')}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>{t(
                      '고객님과 고객님 가족이 갑작스런 빈곤에 빠지지 않도록 치명적 리스크(Critical Risks)를 대비하고',
                      'Prepare for Critical Risks to protect you and your family from sudden financial hardship'
                    )}</li>
                    <li>{t(
                      '충분한 Saving과 투자를 통해 퇴직후에도 누리고자 하시는 Life Style을 최대한 누리실 수 있도록 설계하며',
                      'Design your retirement plan to maximize the lifestyle you desire through sufficient savings and investment'
                    )}</li>
                    <li>{t(
                      '은퇴후 소득을 어떻게 받을지, 또 세금 문제와 상속 계획을 어떻게 할지 조언해드립니다.',
                      'Advise on post-retirement income, tax issues, and estate planning'
                    )}</li>
                  </ol>
                </div>
                <div>
                  <p className="font-semibold text-primary mb-2">
                    {t('특히 저 지대현 FA는', 'Specifically, I, Dae Hyun Jee FA:')}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>{t(
                      'Private Financial Planning 분야에 흔치 않은 아이비리그 출신의 Financial Advisor로써',
                      'As a rare Ivy League-educated Financial Advisor in Private Financial Planning'
                    )}</li>
                    <li>{t(
                      '20년이 넘도록 금융시장과 투자관련 분야에서 일해온 경험과',
                      'With over 20 years of experience in financial markets and investment fields'
                    )}</li>
                    <li>{t(
                      '회계, 세무영역에서의 전문가로써의 역량을 최대한 발휘하여',
                      'Maximizing my expertise in accounting and tax areas'
                    )}</li>
                  </ol>
                  <p className="mt-2">
                    {t(
                      '저의 이익보다는 고객의 이익을 우선해야하는 Fiduciary Investment Advisor로써의 책임을 다하겠습니다.',
                      'I will fulfill my responsibility as a Fiduciary Investment Advisor who prioritizes client interests over my own.'
                    )}<br/><br/>
                    {t('감사합니다.', 'Thank you.')}
                  </p>
                </div>
              </div>
              
              <div>
                <span 
                  onClick={() => navigate('/services')}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 cursor-pointer font-medium text-base transition-colors"
                  data-testid="link-services"
                >
                  {t('재정관리사 (FA)가 하는일 자세히 알아보기', 'Learn more about what a Financial Advisor (FA) does')}
                  <span className="text-lg">→</span>
                </span>
              </div>
            </div>
            <div className="lg:col-span-1 flex justify-center lg:justify-start">
              <img 
                src="/ceo-profile-no-bg.png" 
                alt="CEO Profile"
                className="w-full max-w-xs lg:max-w-none h-auto object-cover cursor-pointer hover:scale-105 transition-transform"
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
                <h4 className="font-semibold text-lg text-primary-dark mb-3">
                  📚 {t('주요 이력', 'Career Highlights')}
                </h4>
                <ul className="mb-6 space-y-2">
                  <li>💼 {t('현 Rethink Wealth 재정관리사', 'Current Financial Advisor at Rethink Wealth')}</li>
                  <li>📊 {t('FINRA Series 65 투자자문사', 'FINRA Series 65 Investment Advisor')}</li>
                  <li>🧾 {t('IRS 공인 세무사 (Enrolled Agent)', 'IRS Enrolled Agent (EA)')}</li>
                  <li>🏭 {t('한화에어로스페이스 재무IR담당 상무', 'Executive Director of Finance & IR, Hanwha Aerospace')}</li>
                  <li>💊 {t('동아제약 IR/PR 담당 이사', 'Director of IR/PR, Dong-A Pharmaceutical')}</li>
                  <li>🏦 {t('교보생명 – 재무실부장', 'General Manager of Finance, Kyobo Life Insurance')}</li>
                  <li>🏢 {t('LG전자 – IR팀 과장', 'Manager of IR Team, LG Electronics')}</li>
                  <li>📈 {t('Nomura Securities – 애널리스트', 'Analyst, Nomura Securities')}</li>
                </ul>
                
                <h4 className="font-semibold text-lg text-primary-dark mb-3">
                  🎓 {t('학력', 'Education')}
                </h4>
                <ul className="space-y-2">
                  <li>🎓 {t('U Penn – 경제학', 'University of Pennsylvania – Economics')}</li>
                  <li>🎓 {t('연세대학교 국제대학원 – MBA', 'Yonsei Graduate School of International Studies – MBA')}</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 
                  className="font-semibold text-lg text-primary-dark mb-3 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => window.open('https://rethinkwealth.com', '_blank')}
                >
                  🏢 Rethink Wealth LLC
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>📍 <strong>{t('본사/지사:', 'Offices:')}</strong> {t('텍사스주 오스틴(Austin), 포트워스(Fort Worth), 휴스턴(Houston) 등에 사무소 보유', 'Austin, Fort Worth, Houston, Texas')}</li>
                  <li>💼 <strong>{t('업종:', 'Services:')}</strong> {t('전인적(financial planning & holistic wealth) 금융 계획, 자산 관리, 리스크 관리, 보험 등 종합 재무 서비스 제공', 'Comprehensive financial planning, wealth management, risk management, insurance, and holistic wealth services')}</li>
                  <li>💡 <strong>{t('철학/방식:', 'Philosophy:')}</strong> {t('"재정적 균형(life & money balance)"을 중요시하며, 각 개인의 목표와 가치에 맞게 재정 계획을 맞춤 설계', 'Emphasizes "life & money balance" with personalized financial planning tailored to individual goals and values')}</li>
                  <li>⚖️ <strong>{t('독립 자문사:', 'Independent Advisory:')}</strong> {t("Client의 최선 이익(fiduciary duty)을 지향", "Committed to fiduciary duty for client's best interests")}</li>
                  <li>🤝 <strong>{t('파트너십:', 'Partnership:')}</strong> {t('2023년 9월부로 Summit Financial과 파트너십을 맺어, Summit의 투자 전략 팀 등이 Rethink Wealth의 재정 관리 서비스를 보강하는 구조로 운영 중', 'Since September 2023, partnered with Summit Financial to enhance services with their investment strategy team')}</li>
                  <li>💰 <strong>{t('투자 자산 관리(AUM):', 'Assets Under Management (AUM):')}</strong> {t('7억 3,400만 달러', '$734 million')}</li>
                  <li>💵 <strong>{t('현금 가치 자산(Cash Value AUM):', 'Cash Value AUM:')}</strong> {t('6억 9,700만 달러 이상', 'Over $697 million')}</li>
                  <li>🛡️ <strong>{t('보험 관련:', 'Insurance:')}</strong> {t('Death Benefit, Disability Benefit 등', 'Death Benefit, Disability Benefit, etc.')}</li>
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
                  {t('세금진단(AI절세방안)', 'Tax Diagnosis (AI Tax Saving)')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('가입없이도 세금을 계산해볼수 있습니다', 'Calculate your taxes without registration')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            size="lg" 
            className="bg-black hover:bg-gray-800 text-white font-bold w-full sm:w-64"
            onClick={() => navigate('/retirement-score')}
          >
            {t('은퇴준비상태진단', 'Retirement Readiness Assessment')}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
