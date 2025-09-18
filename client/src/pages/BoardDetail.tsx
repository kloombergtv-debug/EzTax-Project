import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, User, MessageSquare, Eye, Edit, Save, X, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BoardPost } from "@shared/schema";

const BoardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    category: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch individual post
  const { data: post, isLoading } = useQuery({
    queryKey: [`/api/board/posts/${id}`],
    enabled: !!id
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (updateData: { title: string; content: string; category: string }) => {
      const response = await apiRequest({
        url: `/api/board/posts/${id}`,
        method: 'PUT',
        body: updateData
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/board/posts/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/board/posts'] });
      setIsEditing(false);
      toast({
        title: "게시글이 성공적으로 수정되었습니다!",
        description: "변경사항이 저장되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "게시글 수정 실패",
        description: error.message || "게시글 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest({
        url: `/api/board/posts/${id}`,
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/board/posts'] });
      toast({
        title: "게시글이 성공적으로 삭제되었습니다!",
        description: "게시글이 완전히 삭제되었습니다.",
      });
      // Redirect to board list
      navigate('/board');
    },
    onError: (error: any) => {
      toast({
        title: "게시글 삭제 실패",
        description: error.message || "게시글 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
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

  // Check if user can edit post (author or admin)
  const canEdit = post && user && (post.userId === user.id || user.username === 'admin');

  // Start editing
  const handleEditStart = () => {
    if (post) {
      setEditForm({
        title: post.title,
        content: post.content,
        category: post.category
      });
      setIsEditing(true);
    }
  };

  // Cancel editing
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({ title: '', content: '', category: '' });
  };

  // Save changes
  const handleEditSave = () => {
    if (editForm.title.trim() && editForm.content.trim()) {
      updatePostMutation.mutate(editForm);
    } else {
      toast({
        title: "입력 오류",
        description: "제목과 내용을 모두 입력해주세요.",
        variant: "destructive",
      });
    }
  };

  // Delete post handler
  const handleDelete = () => {
    deletePostMutation.mutate();
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {isPostNew(post.createdAt) && (
                <Badge variant="destructive" className="text-xs">
                  새글
                </Badge>
              )}
              {isEditing ? (
                <Select value={editForm.category} onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="text-xs">
                  {categories.find(cat => cat.id === post.category)?.name}
                </Badge>
              )}
            </div>
            
            {/* Edit/Delete buttons - only show to author or admin */}
            {canEdit && (
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <Button 
                      size="sm" 
                      onClick={handleEditSave}
                      disabled={updatePostMutation.isPending}
                      data-testid="button-save"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      저장
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleEditCancel}
                      disabled={updatePostMutation.isPending}
                      data-testid="button-cancel"
                    >
                      <X className="h-4 w-4 mr-1" />
                      취소
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleEditStart}
                      data-testid="button-edit"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      수정
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          data-testid="button-delete"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>게시글 삭제 확인</AlertDialogTitle>
                          <AlertDialogDescription>
                            정말로 이 게시글을 삭제하시겠습니까? 
                            <br />
                            <strong>삭제된 게시글은 복구할 수 없습니다.</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-delete-cancel">
                            취소
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deletePostMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                            data-testid="button-delete-confirm"
                          >
                            {deletePostMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                삭제 중...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제하기
                              </>
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            )}
          </div>
          
          {isEditing ? (
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              className="text-2xl font-bold border-0 px-0 focus-visible:ring-0"
              placeholder="게시글 제목을 입력하세요"
              data-testid="input-edit-title"
            />
          ) : (
            <CardTitle className="text-2xl text-gray-800 mb-4">
              {post.title}
            </CardTitle>
          )}
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
          {isEditing ? (
            <div className="space-y-4">
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="게시글 내용을 입력하세요"
                className="min-h-64 resize-y"
                data-testid="textarea-edit-content"
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  onClick={handleEditSave}
                  disabled={updatePostMutation.isPending}
                  data-testid="button-save-bottom"
                >
                  {updatePostMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      저장
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleEditCancel}
                  disabled={updatePostMutation.isPending}
                  data-testid="button-cancel-bottom"
                >
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <div 
                className="whitespace-pre-wrap text-gray-800 leading-relaxed"
                data-testid="text-content"
              >
                {post.content}
              </div>
            </div>
          )}
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