import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  TrendingUpIcon, 
  StarIcon, 
  UsersIcon,
  ShieldIcon,
  GlobeIcon,
  AwardIcon,
  BuildingIcon,
  PhoneIcon,
  MailIcon
} from "lucide-react";

export default function About() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.email) {
      toast({
        title: "필수 정보 누락",
        description: "이름, 전화번호, 이메일을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/send-consultation-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send consultation request');
      }

      toast({
        title: "상담 요청 완료",
        description: "전문가 상담 요청이 성공적으로 전송되었습니다. 빠른 시일 내에 연락드리겠습니다.",
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        phone: '',
        email: '',
        message: ''
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error sending consultation request:', error);
      toast({
        title: "전송 실패",
        description: "상담 요청 전송에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">


      {/* Company Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-8 hidden">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <StarIcon className="h-6 w-6" />
              우리의 미션
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed text-sm">
                기술의 힘으로 복잡한 세무와 은퇴 계획을 누구나 쉽게 이해하고 실행할 수 있게 만듭니다. 
                혁신적인 핀테크 솔루션을 통해 개인의 재정적 성공을 지원하고, 
                더 풍요로운 미래를 향한 여정에 동행합니다.
              </p>
              <p className="text-blue-600 font-medium text-xs">
                혁신적인 핀테크 솔루션을 통해 개인의 재정적 성공을 지원
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUpIcon className="h-6 w-6" />
              우리의 비전
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed text-sm">
                세계 최고의 AI 기반 세무·은퇴 플랫폼이 되어 모든 사람이 재정적 자유를 달성할 수 있도록 돕겠습니다. 
                몬테카를로 시뮬레이션과 같은 첨단 기술로 정확한 예측을 제공하고, 
                개인 맞춤형 전략으로 부의 창조를 실현합니다.
              </p>
              <p className="text-green-600 font-medium text-xs">
                절세, 그 이상의 가치를 전하는 재정플랜 플랫폼
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Values */}
      <Card className="hidden">
        <CardHeader>
          <CardTitle className="text-center text-2xl">핵심 가치</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <ShieldIcon className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">신뢰성</h3>
              <p className="text-sm text-gray-600">
                정확한 계산과 검증된 데이터로 믿을 수 있는 서비스를 제공합니다.
              </p>
            </div>
            <div className="text-center">
              <UsersIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">접근성</h3>
              <p className="text-sm text-gray-600">
                복잡한 세무를 누구나 쉽게 이해할 수 있도록 단순화합니다.
              </p>
            </div>
            <div className="text-center">
              <AwardIcon className="h-12 w-12 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">전문성</h3>
              <p className="text-sm text-gray-600">
                세무 전문가의 깊이 있는 지식과 경험을 기술로 구현합니다.
              </p>
            </div>
            <div className="text-center">
              <GlobeIcon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">혁신</h3>
              <p className="text-sm text-gray-600">
                AI와 데이터 분석으로 차세대 금융 서비스를 선도합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Founder & CEO Profile */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 주요 이력 */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">📚 주요 이력</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>💼 현 Rethink Wealth 재정관리사</li>
                <li>🎓 Midwest 대학 재무회계학 교수/연구원</li>
                <li>🧾 IRS 공인 세무사 (Enrolled Agent)</li>
                <li>🏭 한화에어로스페이스 재무IR담당 상무</li>
                <li>💊 동아제약 IR/PR 담당 이사</li>
                <li>🏦 교보생명 – 재무실부장</li>
                <li>🏢 LG전자 – IR팀 과장</li>
                <li>📈 Nomura Securities – 애널리스트</li>
              </ul>
            </div>
            
            {/* 학력 */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">🎓 학력</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>🎓 U Penn – 경제학 학사</li>
                <li>🎓 연세대학교 국제대학원 – MBA</li>
              </ul>
            </div>
            
            {/* 전문 분야 */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">🧠 전문 분야</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• 자산관리 및 은퇴 플랜 최적화</li>
                <li>• 투자전략수립, 자산운용</li>
                <li>• 고액자산가 맞춤 절세 전략</li>
                <li>• 해외자산 및 글로벌 세무 규정 대응</li>
                <li>• 투자수익 대비 실효세율 분석</li>
                <li>• 몬테카를로 시뮬레이션 모델링</li>
              </ul>
            </div>
            
            {/* 사진 및 프로필 */}
            <div className="text-center">
              <img 
                src="/ceo-profile-no-bg.png"
                alt="지대현 FA"
                className="w-full h-auto object-contain mx-auto"
              />
              <h3 className="text-xl font-bold text-gray-800 mt-4 mb-2">
                지대현 FA
              </h3>
              <p className="text-gray-700 font-medium mb-3 text-sm">
                Financial Advisor/세무사
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="border-blue-300 text-blue-700 text-xs">FINRA Series 65</Badge>
                <Badge variant="outline" className="border-blue-300 text-blue-700 text-xs">IRS EA</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTO Profile */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 text-2xl">
            <BuildingIcon className="h-6 w-6" />
            기술 총괄 책임자
          </CardTitle>
          <CardDescription className="text-green-600">
            EzTax의 기술 혁신을 이끄는 전문가
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-shrink-0 text-center lg:text-left">
              <img 
                src="/cto-photo-new.png"
                alt="김영일 CTO"
                className="w-32 h-32 rounded-full object-cover border-4 border-green-200 mx-auto lg:mx-0"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 items-center justify-center text-white text-4xl font-bold border-4 border-green-200 mx-auto lg:mx-0 hidden">
                김
              </div>
              <h3 className="text-2xl font-bold text-green-800 mt-4 mb-2">
                김영일 CTO
              </h3>
              <p className="text-green-700 font-medium mb-4">
                최고기술책임자 / 풀스택 개발자
              </p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">AWS Certified</Badge>
                <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">React Expert</Badge>
                <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50">AI/ML Engineer</Badge>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-green-800 mb-3">💼 주요 이력</h4>
                  <ul className="text-sm text-green-700 space-y-2">
                    <li>🅾️ O'Reilly Auto Parts</li>
                    <li>▶️ Accenture Federal Services</li>
                    <li>🏢 Lennox International</li>
                    <li>🏒 National Hockey League (NHL)</li>
                    <li>🚀 EzTax 창립자&CTO</li>
                  </ul>
                  
                  <h4 className="font-semibold text-green-800 mb-3 mt-4">🎓 학력</h4>
                  <ul className="text-sm text-green-700 space-y-2">
                    <li>🎓 전북대학교 Computer Engineering</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-green-800 mb-3">⚡ 기술 전문 분야</h4>
                  <ul className="text-sm text-green-700 space-y-2">
                    <li>• UI/UX Engineer</li>
                    <li>• Salesforce UI/UX Developer</li>
                    <li>• Application Developer III</li>
                    <li>• Application Developer</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-white/80 p-6 rounded-lg mb-6 hidden">
                <h4 className="font-semibold text-green-800 mb-3">💡 CTO 메시지</h4>
                <p className="text-green-800 leading-relaxed mb-4">
                  <strong>🔮 "Technology for Better Financial Future"</strong> 라는 비전으로 
                  EzTax의 기술 혁신을 이끌고 있습니다. 복잡한 세무와 금융 계산을 
                  누구나 쉽게 활용할 수 있는 직관적인 플랫폼으로 구현하는 것이 목표입니다.
                </p>
                <p className="text-green-800 leading-relaxed mb-4">
                  최신 AI 기술과 클라우드 인프라를 활용하여 정확하고 빠른 세무 계산, 
                  개인화된 은퇴 설계, 그리고 실시간 투자 분석 서비스를 제공합니다. 
                  사용자 경험을 최우선으로 하는 기술 개발을 추구합니다.
                </p>
                <p className="text-green-800 leading-relaxed italic font-medium">
                  "기술로 금융을 단순화하고, 모든 사람이 더 나은 재정 미래를 설계할 수 있도록 돕겠습니다."
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-100/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">🏆 주요 성과</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• EzTax 플랫폼 99.9% 가용성 달성</li>
                    <li>• AI 세무 챗봇 정확도 95% 이상</li>
                    <li>• 페이지 로딩 속도 50% 개선</li>
                  </ul>
                </div>
                <div className="bg-green-100/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">🛠️ 기술 스택</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• React, TypeScript, Node.js</li>
                    <li>• PostgreSQL, Redis</li>
                    <li>• AWS, Docker, Kubernetes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <PhoneIcon className="h-6 w-6 text-primary" />
            연락처 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-4">전문가 상담 예약</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <PhoneIcon className="h-5 w-5 text-primary" />
                  <span>전화 상담 가능</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <MailIcon className="h-5 w-5 text-primary" />
                  <span>이메일 (daehyun.jee@rethinkwealth.com) 상담</span>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                    상담 예약하기
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>전문가 상담 요청</DialogTitle>
                    <DialogDescription>
                      세무 및 은퇴 계획 전문가 상담을 요청하시겠습니까? 빠른 시일 내에 연락드리겠습니다.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitConsultation} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">이름 *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="홍길동"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">전화번호 *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="010-1234-5678"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">이메일 *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="example@email.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">상담 내용 (선택사항)</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="상담받고 싶은 내용을 간단히 적어주세요"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        취소
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmitting ? '전송 중...' : '상담 요청하기'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-4">EzTax 플랫폼</h3>
              <p className="text-gray-600 mb-4">
                지금 바로 무료로 세금 계산과 은퇴 진단을 시작해보세요
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={() => navigate('/personal-info')}
                >
                  세금 신고 시작하기
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-primary text-primary hover:bg-primary/10"
                  onClick={() => navigate('/retirement-score')}
                >
                  은퇴 준비 상태 진단
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back to Home */}
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="border-gray-300"
        >
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  );
}