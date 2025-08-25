import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Clock, 
  DollarSign, 
  FileText,
  Users,
  CheckCircle,
  Calendar
} from 'lucide-react';

// 주별 전문가 데이터
const expertsByState = {
  'NY': {
    stateName: '뉴욕',
    experts: [
      {
        id: 1,
        name: '정승욱',
        title: '세무전문가(EA)',
        image: '/expert-photo.png',
        rating: 4.9,
        reviews: 127,
        experience: '15년+',
        specialties: ['개인세무', '투자자문', '은퇴설계', '절세전략'],
        languages: ['한국어', '영어'],
        hourlyRate: '$150-200',
        responseTime: '2시간 이내',
        bio: 'GTAX Consulting Group 대표이자 재미한인등록세무사협회(NAKAEA) 부회장으로 활동하고 있습니다. 서울대학교 법학박사 출신으로 홍익대학교·중앙대학교에서 강의하며, 대법원 판례평석위원회 위원을 역임했습니다.',
        certifications: ['FINRA Series 65', 'IRS EA'],
        education: ['한국외국어대학교 법학 학사', '서울대학교 법학석사 (1990)', '서울대학교 법학박사 (1998)'],
        career: [
          'GTAX Consulting Group 대표 (2021~현재)',
          '재미한인등록세무사협회(NAKAEA) 부회장 (2024~현재)',
          '홍익대학교·중앙대학교 강의',
          '대법원 판례평석위원회 위원',
          'IMF 외환위기 시기 예금보험공사(KDIC) 기업·금융 구조조정 참여'
        ],
        expertise: ['세금 보고 및 조세 전략 수립', '회계 시스템 선택 및 구축', 'IRS 감사 대응 및 관련 자문'],
        availability: 'Mon-Fri 9AM-6PM EST',
        phone: '(212) 555-0123',
        email: 'expert.ny@ezfintech.com'
      }
    ]
  },
  'CA': {
    stateName: '캘리포니아',
    experts: [
      {
        id: 3,
        name: '박준호',
        title: 'EA/세무전문가',
        image: '/api/placeholder/150/150',
        rating: 4.9,
        reviews: 203,
        experience: '18년+',
        specialties: ['캘리포니아주세', '스톡옵션', '스타트업세무', '국제세무'],
        languages: ['한국어', '영어'],
        hourlyRate: '$160-220',
        responseTime: '1시간 이내',
        bio: '실리콘밸리 지역 테크 업계 종사자를 위한 세무 전문가입니다. 스톡옵션, RSU 세무처리와 캘리포니아 주세 최적화에 특화되어 있습니다.',
        certifications: ['IRS EA', 'CFP'],
        availability: 'Mon-Fri 7AM-8PM PST',
        phone: '(650) 555-0789',
        email: 'park.ea@catax.com'
      }
    ]
  }
};

interface ExpertConsultationByStateProps {}

const ExpertConsultationByState: React.FC<ExpertConsultationByStateProps> = () => {
  const { state } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedExpert, setSelectedExpert] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    consultationType: '',
    message: '',
    preferredTime: ''
  });

  const stateData = expertsByState[state as keyof typeof expertsByState];

  if (!stateData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">해당 주의 전문가 정보를 준비 중입니다</h2>
            <p className="text-gray-600 mb-4">
              {state} 지역의 세무 전문가 정보를 곧 추가할 예정입니다.
            </p>
            <Button onClick={() => navigate('/review')}>
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      const response = await fetch('/api/send-expert-consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          expertName: selectedExpert?.name,
          expertEmail: selectedExpert?.email,
          state: stateData.stateName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send consultation request');
      }

      toast({
        title: "상담 요청 완료",
        description: `${selectedExpert?.name} 전문가에게 상담 요청이 전송되었습니다. 빠른 시일 내에 연락드리겠습니다.`,
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        phone: '',
        email: '',
        consultationType: '',
        message: '',
        preferredTime: ''
      });
      setIsDialogOpen(false);
      setSelectedExpert(null);
    } catch (error) {
      console.error('Error sending consultation request:', error);
      toast({
        title: "전송 실패",
        description: "상담 요청 전송에 실패했습니다. 직접 전화나 이메일로 연락해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConsultationDialog = (expert: any) => {
    setSelectedExpert(expert);
    setIsDialogOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stateData.stateName} 세무 전문가</h1>
            <p className="text-gray-600 mt-2">
              {stateData.stateName} 지역의 검증된 세무 전문가들과 상담하세요
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/review')}
          className="mb-6"
        >
          ← 세금 검토 페이지로 돌아가기
        </Button>
      </div>

      {/* Experts Grid */}
      <div className="grid gap-6">
        {stateData.experts.map((expert) => (
          <Card key={expert.id} className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Expert Photo & Basic Info */}
                <div className="flex-shrink-0 text-center lg:text-left">
                  <div className="w-36 h-36 rounded-full mx-auto lg:mx-0 mb-6 shadow-lg overflow-hidden border-4 border-white bg-gray-100">
                    <img 
                      src={expert.image}
                      alt={expert.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjNDI4NWY0Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI5MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+7KCVPC90ZXh0Pgo8L3N2Zz4K";
                      }}
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{expert.name} 대표</h3>
                  <p className="text-blue-700 font-semibold mb-4 text-lg">{expert.title}</p>
                  
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="font-bold text-lg">{expert.rating}</span>
                    <span className="text-gray-600">({expert.reviews}개 리뷰)</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 text-sm font-semibold">
                      IRS EA
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1 text-sm font-semibold">
                      NAKAEA 부회장
                    </Badge>
                  </div>
                </div>

                {/* Expert Details */}
                <div className="flex-1">
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-600" />
                          주요 이력
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            <span className="text-gray-700 font-medium">GTAX Consulting Group 대표 (2021~현재)</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            <span className="text-gray-700 font-medium">재미한인등록세무사협회(NAKAEA) 부회장 (2024~현재)</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            <span className="text-gray-700 font-medium">홍익대학교·중앙대학교 강의</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            <span className="text-gray-700 font-medium">대법원 판례평석위원회 위원</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            <span className="text-gray-700 font-medium">IMF 외환위기 시기, 예금보험공사(KDIC)에서 기업 및 금융 구조조정 참여</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-bold text-gray-800 mb-3 flex items-center">
                          <Users className="h-4 w-4 mr-2 text-green-600" />
                          학력
                        </h5>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                            <span className="text-gray-700">한국외국어대학교 법학 학사</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                            <span className="text-gray-700">서울대학교 법학석사(LL.M., 1990)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                            <span className="text-gray-700">서울대학교 법학박사(1998) 상법전공</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
                          <Star className="h-5 w-5 mr-2 text-pink-500" />
                          전문 분야
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                            <span className="text-gray-700">미국 개인 및 사업자 세무 상담</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                            <span className="text-gray-700">자산관리 및 투자 불린 최적화</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                            <span className="text-gray-700">투자정보 수익, 자산운용</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                            <span className="text-gray-700">고액자산가 명품 정책 컨설팅</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                            <span className="text-gray-700">해외자산 및 글로벌 세무 규정 대응</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                            <span className="text-gray-700">투자수익 대비 서술세율 분석</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                            <span className="text-gray-700">은퇴자금 시뮬레이션 모델링</span>
                          </div>
                        </div>
                      </div>
                      

                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h4 className="font-bold text-gray-800 mb-4 text-lg">회사소개</h4>
                    <div className="bg-white rounded-lg p-6 shadow-inner">
                      <p className="text-gray-700 leading-relaxed text-base">
                        G-Tax는 Grace Tax입니다.
                        <br /><br />
                        G-Tax는 Grace Tax를 줄인 말입니다. 은혜는 값 없이 받은 선물입니다. 은혜를 받은 자가 다시 그 은혜를 베푸는 것은 당연합니다. 한인디아스포라로서 저희가 가진 세법지식과 경험을 나눔으로써 언어와 문화가 다른 타국에 와서 고생하는 동족과 다민족의 정착과 성공을 돕고, 다시 그 고객이 축복의 통로가 되어 베품과 나눔을 실현하는 것이 저희의 꿈(Vision)입니다.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => openConsultationDialog(expert)}
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      상담 예약하기
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg"
                    >
                      <Phone className="mr-2 h-5 w-5" />
                      {expert.phone}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold py-3 px-6 rounded-lg"
                    >
                      <Mail className="mr-2 h-5 w-5" />
                      이메일 문의
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Consultation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedExpert?.name} 전문가 상담 예약</DialogTitle>
            <DialogDescription>
              전문가 상담을 위한 정보를 입력해주세요. 빠른 시일 내에 연락드리겠습니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitConsultation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="consultationType">상담 유형</Label>
              <select
                id="consultationType"
                name="consultationType"
                value={formData.consultationType}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">선택하세요</option>
                <option value="tax-filing">세금신고</option>
                <option value="tax-planning">절세전략</option>
                <option value="investment">투자상담</option>
                <option value="retirement">은퇴설계</option>
                <option value="business">사업자세무</option>
                <option value="other">기타</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferredTime">희망 상담 시간</Label>
              <Input
                id="preferredTime"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleInputChange}
                placeholder="예: 평일 오후 2-4시"
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
  );
};

export default ExpertConsultationByState;