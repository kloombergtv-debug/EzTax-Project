import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, MessageSquare, Eye } from "lucide-react";
import { BoardPost } from "@shared/schema";

const BoardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  // Fetch individual post
  const { data: post, isLoading } = useQuery({
    queryKey: [`/api/board/posts/${id}`],
    enabled: !!id
  });

  const categories = [
    { id: 'usage', name: '사용법 문의' },
    { id: 'tax', name: '세금 질문' },
    { id: 'retirement', name: '은퇴 계획' },
    { id: 'tips', name: '절세/노후준비팁' },
    { id: 'faq', name: 'FAQ' },
    { id: 'general', name: '일반 질문' }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPostNew = (createdAt: string) => {
    const postDate = new Date(createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">게시글을 찾을 수 없습니다</h2>
          <Button onClick={() => navigate('/board')} data-testid="button-back-to-board">
            <ArrowLeft className="h-4 w-4 mr-2" />
            게시판으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/board')}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          게시판으로 돌아가기
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">게시글 상세</h1>
      </div>

      {/* Post Content */}
      <Card>
        <CardHeader>
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
          <CardTitle className="text-2xl text-gray-800 mb-4">
            {post.title}
          </CardTitle>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span data-testid="text-author">{post.authorName}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span data-testid="text-date">{formatDate(post.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span data-testid="text-replies">답글 {post.replies || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span data-testid="text-views">조회 {post.views || 0}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div 
              className="whitespace-pre-wrap text-gray-800 leading-relaxed"
              data-testid="text-content"
            >
              {post.content}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reply Section (placeholder) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>답글</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p>답글 기능은 곧 추가될 예정입니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BoardDetail;