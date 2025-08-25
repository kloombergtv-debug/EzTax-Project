import React, { useState } from 'react';
import { MessageSquare, Users, BookOpen, HelpCircle, ChevronRight, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Board: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: '전체', icon: MessageSquare, count: 156 },
    { id: 'usage', name: 'EzTax 사용법', icon: BookOpen, count: 42 },
    { id: 'tax', name: '세금신고 질문', icon: HelpCircle, count: 73 },
    { id: 'general', name: '일반 질문', icon: Users, count: 41 }
  ];

  const samplePosts = [
    {
      id: 1,
      title: 'Form 1040 작성 시 W-2 입력하는 방법이 궁금합니다',
      category: 'usage',
      author: '김○○',
      date: '2025-01-25',
      replies: 3,
      views: 45,
      isNew: true
    },
    {
      id: 2,
      title: '자영업자 세금 계산에서 Schedule C 경비 항목 질문',
      category: 'tax',
      author: '이○○',
      date: '2025-01-25',
      replies: 7,
      views: 89,
      isNew: true
    },
    {
      id: 3,
      title: 'Child Tax Credit 계산이 이상한 것 같아요',
      category: 'tax',
      author: '박○○',
      date: '2025-01-24',
      replies: 12,
      views: 156,
      isNew: false
    },
    {
      id: 4,
      title: 'EzTax에서 IRS 직접 제출이 안 되는 이유가 궁금합니다',
      category: 'usage',
      author: '최○○',
      date: '2025-01-24',
      replies: 5,
      views: 234,
      isNew: false
    },
    {
      id: 5,
      title: '부양가족 추가하는 방법을 모르겠어요',
      category: 'usage',
      author: '정○○',
      date: '2025-01-23',
      replies: 8,
      views: 167,
      isNew: false
    }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? samplePosts 
    : samplePosts.filter(post => post.category === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">사용자 게시판</h1>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">EzTax 커뮤니티에 오신 것을 환영합니다!</h2>
              <div className="text-gray-600 space-y-2">
                <p>
                  <strong>💡 EzTax 사용방법</strong>과 <strong>🏛️ 세금신고 관련 질문</strong>을 자유롭게 해주세요.
                </p>
                <p>
                  전문가와 다른 사용자들이 친절하게 답변해드립니다. 
                  여러분의 경험과 지식을 공유하여 모두가 함께 성장하는 커뮤니티를 만들어가요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 카테고리 사이드바 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">카테고리</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* 글쓰기 버튼 */}
          <Button className="w-full mt-4" size="lg">
            <MessageSquare className="h-4 w-4 mr-2" />
            새 글 작성
          </Button>
        </div>

        {/* 게시글 목록 */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedCategory === 'all' ? '전체 게시글' : categories.find(cat => cat.id === selectedCategory)?.name}
                </CardTitle>
                <div className="text-sm text-gray-500">
                  총 {filteredPosts.length}개의 글
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {post.isNew && (
                            <Badge variant="destructive" className="text-xs">
                              새글
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {categories.find(cat => cat.id === post.category)?.name}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2 hover:text-blue-600">
                          {post.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{post.author}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{post.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>답글 {post.replies}</span>
                          </div>
                          <div>
                            조회 {post.views}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    이전
                  </Button>
                  <Button variant="default" size="sm">
                    1
                  </Button>
                  <Button variant="outline" size="sm">
                    2
                  </Button>
                  <Button variant="outline" size="sm">
                    3
                  </Button>
                  <Button variant="outline" size="sm">
                    다음
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Board;