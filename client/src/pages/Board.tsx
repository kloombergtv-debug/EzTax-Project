import React, { useState } from 'react';
import { MessageSquare, Users, BookOpen, HelpCircle, ChevronRight, Calendar, User, Plus, X, Info, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface BoardPost {
  id: number;
  title: string;
  content: string;
  category: string;
  authorName: string;
  views: number;
  replies: number;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
}

const Board: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'usage'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  // Fetch board posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['/api/board/posts', selectedCategory],
    queryFn: () => apiRequest({
      url: `/api/board/posts?category=${selectedCategory}`,
      method: 'GET'
    })
  });

  // Count posts by category
  const { data: allPosts = [] } = useQuery({
    queryKey: ['/api/board/posts', 'all'],
    queryFn: () => apiRequest({
      url: '/api/board/posts',
      method: 'GET'
    })
  });

  const getCountByCategory = (categoryId: string) => {
    if (!Array.isArray(allPosts)) return 0;
    if (categoryId === 'all') return allPosts.length;
    return allPosts.filter((post: BoardPost) => post.category === categoryId).length;
  };

  const categories = [
    { id: 'all', name: '전체', icon: MessageSquare, count: getCountByCategory('all') },
    { id: 'usage', name: 'EzTax 사용법', icon: BookOpen, count: getCountByCategory('usage') },
    { id: 'tax', name: '세금신고 질문', icon: HelpCircle, count: getCountByCategory('tax') },
    { id: 'tax-tips', name: '절세/노후준비팁', icon: DollarSign, count: getCountByCategory('tax-tips') },
    { id: 'faq', name: 'FAQ', icon: Info, count: getCountByCategory('faq') },
    { id: 'general', name: '일반 질문', icon: Users, count: getCountByCategory('general') }
  ];

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (postData: typeof newPost) => apiRequest({
      url: '/api/board/posts',
      method: 'POST',
      body: postData
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/board/posts'] });
      setIsCreateModalOpen(false);
      setNewPost({ title: '', content: '', category: 'usage' });
      toast({
        title: "게시글이 성공적으로 작성되었습니다!",
        description: "다른 사용자들이 곧 답변해드릴 것입니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "게시글 작성 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      });
    }
  });

  const handleSubmitPost = () => {
    if (!isAuthenticated) {
      toast({
        title: "로그인 필요",
        description: "게시글을 작성하려면 로그인이 필요합니다.",
        variant: "destructive"
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: "입력 오류",
        description: "제목과 내용을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate(newPost);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const isPostNew = (createdAt: string) => {
    const postDate = new Date(createdAt);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return postDate > oneDayAgo;
  };

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
          {isAuthenticated ? (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mt-4" size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  새 글 작성
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>새 게시글 작성</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">카테고리</label>
                    <Select value={newPost.category} onValueChange={(value) => setNewPost({...newPost, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usage">EzTax 사용법</SelectItem>
                        <SelectItem value="tax">세금신고 질문</SelectItem>
                        <SelectItem value="tax-tips">절세/노후준비팁</SelectItem>
                        <SelectItem value="faq">FAQ</SelectItem>
                        <SelectItem value="general">일반 질문</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">제목</label>
                    <Input
                      placeholder="제목을 입력하세요"
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">내용</label>
                    <Textarea
                      placeholder="질문이나 의견을 자세히 작성해주세요"
                      rows={8}
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      취소
                    </Button>
                    <Button 
                      onClick={handleSubmitPost}
                      disabled={createPostMutation.isPending}
                    >
                      {createPostMutation.isPending ? '작성 중...' : '게시글 작성'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button 
              onClick={() => {
                toast({
                  title: "로그인 필요",
                  description: "게시글을 작성하려면 로그인이 필요합니다.",
                  variant: "destructive"
                });
                setTimeout(() => {
                  window.location.href = '/login';
                }, 1000);
              }}
              className="w-full mt-4 bg-gray-400 hover:bg-gray-500" 
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              로그인 후 글 작성
            </Button>
          )}
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
                  총 {Array.isArray(posts) ? posts.length : 0}개의 글
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">게시글을 불러오는 중...</p>
                </div>
              ) : !Array.isArray(posts) || posts.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">아직 게시글이 없습니다.</p>
                  <p className="text-sm text-gray-400">첫 번째 게시글을 작성해보세요!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(posts) && posts.map((post: BoardPost) => (
                    <div
                      key={post.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {isPostNew(post.createdAt) && (
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
                              <span>{post.authorName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(post.createdAt)}</span>
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
              )}

              {Array.isArray(posts) && posts.length > 0 && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      이전
                    </Button>
                    <Button variant="default" size="sm">
                      1
                    </Button>
                    <Button variant="outline" size="sm">
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Board;