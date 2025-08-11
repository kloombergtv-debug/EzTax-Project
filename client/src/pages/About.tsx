import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, Target, Award } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-dark mb-6">
          회사 소개
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          EzTax는 개인과 가족이 쉽고 안전하게 세금 신고를 완료할 수 있도록 돕는 혁신적인 세무 플랫폼입니다.
          복잡한 세무 과정을 간단하게 만들어 누구나 접근할 수 있는 세무 서비스를 제공합니다.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-semibold text-primary-dark mb-4">미션</h2>
            <p className="text-gray-600 leading-relaxed">
              복잡한 세무 과정을 단순화하여 모든 사람이 쉽게 세금 신고를 완료하고, 
              최적의 절세 방안과 은퇴 계획을 세울 수 있도록 지원합니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-semibold text-primary-dark mb-4">비전</h2>
            <p className="text-gray-600 leading-relaxed">
              AI 기술과 사용자 중심의 디자인을 통해 세무 서비스의 새로운 기준을 제시하고, 
              모든 사람이 재정적으로 더 나은 결정을 내릴 수 있는 세상을 만듭니다.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Core Values */}
      <div className="mb-16">
        <h2 className="text-3xl font-heading font-bold text-center text-primary-dark mb-12">핵심 가치</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-primary-dark mb-4">보안 & 신뢰</h3>
            <p className="text-gray-600 leading-relaxed">
              최고 수준의 보안 기술로 고객의 개인정보와 재정 데이터를 안전하게 보호합니다.
              은행급 암호화와 다단계 보안 시스템을 통해 신뢰할 수 있는 서비스를 제공합니다.
            </p>
          </div>

          <div className="text-center">
            <Users className="h-16 w-16 text-primary mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-primary-dark mb-4">사용자 중심</h3>
            <p className="text-gray-600 leading-relaxed">
              복잡한 세무 용어와 절차를 이해하기 쉽게 설명하고, 
              직관적인 인터페이스를 통해 누구나 쉽게 사용할 수 있는 플랫폼을 구축합니다.
            </p>
          </div>

          <div className="text-center">
            <Target className="h-16 w-16 text-primary mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-primary-dark mb-4">정확성 & 효율성</h3>
            <p className="text-gray-600 leading-relaxed">
              최신 세법과 IRS 규정을 반영한 정확한 계산으로 신뢰할 수 있는 결과를 제공하며, 
              빠르고 효율적인 세금 신고 과정을 보장합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Our Story */}
      <Card className="mb-16">
        <CardContent className="p-12">
          <h2 className="text-3xl font-heading font-bold text-center text-primary-dark mb-8">우리의 이야기</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              EzTax는 "세금 신고가 왜 이렇게 복잡해야 할까?"라는 단순한 질문에서 시작되었습니다. 
              매년 수백만 명의 사람들이 복잡한 세무 소프트웨어와 씨름하거나 비싼 세무사 비용을 지불해야 하는 현실을 보며, 
              더 나은 해결책이 있어야 한다고 생각했습니다.
            </p>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              우리는 최신 기술과 세무 전문 지식을 결합하여, 복잡한 세무 과정을 간단하고 직관적으로 만드는 것을 목표로 합니다. 
              단순히 세금 신고를 돕는 것을 넘어, 개인의 재정 상황을 종합적으로 분석하여 
              절세 방안과 장기적인 재정 계획까지 제안하는 통합 플랫폼을 구축했습니다.
            </p>
            
            <p className="text-lg text-gray-600 leading-relaxed">
              오늘날 EzTax는 수만 명의 사용자들이 신뢰하는 세무 플랫폼으로 성장했으며, 
              앞으로도 지속적인 혁신을 통해 더 나은 세무 서비스를 제공하겠습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="mb-16">
        <h2 className="text-3xl font-heading font-bold text-center text-primary-dark mb-12">주요 서비스</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-primary-dark mb-3">스마트 세금 계산</h3>
              <p className="text-gray-600 leading-relaxed">
                AI 기반 세금 계산 엔진으로 정확하고 빠른 세금 계산을 제공합니다. 
                복잡한 공제 항목과 세액공제를 자동으로 적용하여 최적의 결과를 도출합니다.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-primary-dark mb-3">맞춤형 절세 방안</h3>
              <p className="text-gray-600 leading-relaxed">
                개인의 소득 구조와 생활 패턴을 분석하여 최적의 절세 전략을 제안합니다. 
                은퇴 계획, 교육비 공제, 의료비 공제 등 다양한 절세 옵션을 제공합니다.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-primary-dark mb-3">통합 재정 관리</h3>
              <p className="text-gray-600 leading-relaxed">
                세금 신고뿐만 아니라 은퇴 계획, 투자 전략, 보험 최적화까지 
                종합적인 재정 관리 솔루션을 제공합니다.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-primary-dark mb-3">실시간 지원</h3>
              <p className="text-gray-600 leading-relaxed">
                세무 전문가와의 실시간 상담을 통해 복잡한 세무 문제에 대한 
                전문적인 도움을 받을 수 있습니다.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-primary-dark mb-3">데이터 보안</h3>
              <p className="text-gray-600 leading-relaxed">
                은행급 보안 시스템과 256비트 암호화로 고객의 민감한 
                재정 정보를 안전하게 보호합니다.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-primary-dark mb-3">다국어 지원</h3>
              <p className="text-gray-600 leading-relaxed">
                한국어와 영어를 비롯한 다양한 언어를 지원하여 
                더 많은 사용자가 편리하게 서비스를 이용할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="text-center bg-primary/5 rounded-2xl p-12">
        <h2 className="text-3xl font-heading font-bold text-primary-dark mb-6">
          더 나은 세무 경험을 시작하세요
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          EzTax와 함께 복잡한 세무 과정을 간단하게 만들고, 
          스마트한 재정 관리의 첫걸음을 내딛으세요.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/personal-info" 
            className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition duration-200"
          >
            세금 계산 시작하기
          </a>
          <a 
            href="mailto:contact@eztax.com" 
            className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/10 transition duration-200"
          >
            문의하기
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;