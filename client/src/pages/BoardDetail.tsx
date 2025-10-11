import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import DOMPurify from 'dompurify';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, User, MessageSquare, Eye, EyeOff, Edit, Save, X, Trash2, Bold, Italic, Link, Table, Image, ChevronDown } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BoardPost } from "@shared/schema";
import rehypeRaw from 'rehype-raw';

// Safe Markdown renderer component
const SafeMarkdown = ({ content }: { content: string }) => {
  // Configure DOMPurify to allow safe HTML tags for images
  const cleanContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['img', 'a', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre', 'blockquote'],
    ALLOWED_ATTR: ['src', 'alt', 'href', 'title', 'style', 'width', 'height']
  });

  return (
    <div className="prose prose-sm max-w-none prose-gray dark:prose-invert prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:leading-relaxed prose-table:text-sm prose-th:border prose-th:border-gray-300 prose-th:px-3 prose-th:py-2 prose-th:bg-gray-50 prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Safe handling of images
          img: ({ src, alt, ...props }) => (
            <img 
              src={src} 
              alt={alt} 
              className="max-w-full h-auto rounded-md"
              loading="lazy"
              {...props}
            />
          ),
          // Table styling
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse" {...props}>
                {children}
              </table>
            </div>
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
};

const BoardDetail = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    category: ''
  });
  const [isEditPreviewMode, setIsEditPreviewMode] = useState(false);
  
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
      queryClient.invalidateQueries({ 
        queryKey: ['/api/board/posts'], 
        exact: false 
      });
      setIsEditing(false);
      setIsEditPreviewMode(false);
      toast({
        title: "게시글 수정 완료",
        description: "게시글이 성공적으로 수정되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "수정 실패",
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
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/board/posts'], 
        exact: false 
      });
      toast({
        title: "게시글 삭제 완료",
        description: "게시글이 성공적으로 삭제되었습니다.",
      });
      navigate('/board');
    },
    onError: (error: any) => {
      toast({
        title: "삭제 실패",
        description: error.message || "게시글 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  const categories = [
    { id: 'usage', name: 'FA 사용법' },
    { id: 'tax', name: '세금신고 질문' },
    { id: 'tax-tips', name: '절세/노후준비팁' },
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
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return postDate > oneDayAgo;
  };

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

  // Image upload for editing
  const handleEditImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "잘못된 파일 형식",
        description: "이미지 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과", 
        description: "이미지는 5MB 이하만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/uploads/images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('업로드 실패');
      }

      const result = await response.json();
      
      // 이미지 크기 선택 다이얼로그 표시
      const size = await showEditImageSizeDialog();
      
      let imageMarkdown;
      if (size === 'markdown') {
        imageMarkdown = `![${file.name}](${result.url})`;
      } else {
        const sizeStyle = getEditImageSizeStyle(size);
        imageMarkdown = `<img src="${result.url}" alt="${file.name}" style="${sizeStyle} height: auto; border-radius: 8px; max-width: 100%;">`;
      }
      
      setEditForm(prev => ({
        ...prev,
        content: prev.content + '\n' + imageMarkdown
      }));

      toast({
        title: "이미지 업로드 완료",
        description: "이미지가 성공적으로 업로드되었습니다.",
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  // Image size functions for editing
  const getEditImageSizeStyle = (size: string) => {
    switch (size) {
      case 'small': return 'width: 600px;';
      case 'medium': return 'width: 700px;';
      case 'large': return 'width: 800px;';
      case 'full': return 'width: 100%;';
      default: return 'width: 700px;';
    }
  };

  const showEditImageSizeDialog = (): Promise<string> => {
    return new Promise((resolve) => {
      const size = window.prompt(
        '이미지 크기를 선택하세요:\n\n' +
        '1 - 작음 (600px)\n' +
        '2 - 중간 (700px) ← 기본값\n' +
        '3 - 크게 (800px)\n' +
        '4 - 전체폭 (100%)\n' +
        '5 - 마크다운 형식\n\n' +
        '번호를 입력하세요 (1-5):'
      );
      
      switch (size) {
        case '1': resolve('small'); break;
        case '2': resolve('medium'); break;
        case '3': resolve('large'); break;
        case '4': resolve('full'); break;
        case '5': resolve('markdown'); break;
        default: resolve('medium'); break;
      }
    });
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setIsEditPreviewMode(false);
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditPreviewMode(!isEditPreviewMode)}
                      data-testid="button-preview-toggle"
                    >
                      {isEditPreviewMode ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          편집
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          미리보기
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleEditSave}
                      disabled={updatePostMutation.isPending}
                      size="sm"
                      data-testid="button-save"
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
                      size="sm"
                      data-testid="button-cancel"
                    >
                      <X className="h-4 w-4 mr-2" />
                      취소
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={handleEditStart}
                      variant="outline"
                      size="sm"
                      data-testid="button-edit"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      수정
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          data-testid="button-delete"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-testid="dialog-delete-confirm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-delete-cancel">취소</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deletePostMutation.isPending}
                            data-testid="button-delete-confirm"
                          >
                            {deletePostMutation.isPending ? "삭제 중..." : "삭제"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Title */}
          {isEditing ? (
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="게시글 제목을 입력하세요..."
              className="text-lg font-semibold mb-2"
              data-testid="input-edit-title"
            />
          ) : (
            <CardTitle className="text-xl" data-testid="text-title">{post.title}</CardTitle>
          )}

          {/* Meta info */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span data-testid="text-author">{post.author}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span data-testid="text-date">{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Content */}
          {isEditing ? (
            <div className="space-y-4">
              {!isEditPreviewMode && (
                <>
                  <div className="flex items-center justify-between bg-gray-50 rounded-t-md p-2 border border-b-0">
                    <div className="flex items-center space-x-1">
                      <Button
                        type="button"
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const textarea = document.getElementById('edit-content-textarea') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selectedText = textarea.value.substring(start, end);
                            const newText = `**${selectedText}**`;
                            const newContent = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
                            setEditForm(prev => ({ ...prev, content: newContent }));
                            
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 2, start + 2 + selectedText.length);
                            }, 0);
                          }
                        }}
                        data-testid="button-bold"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const textarea = document.getElementById('edit-content-textarea') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selectedText = textarea.value.substring(start, end);
                            const newText = `*${selectedText}*`;
                            const newContent = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
                            setEditForm(prev => ({ ...prev, content: newContent }));
                            
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 1, start + 1 + selectedText.length);
                            }, 0);
                          }
                        }}
                        data-testid="button-italic"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const url = window.prompt('링크 URL을 입력하세요:');
                          const text = window.prompt('링크 텍스트를 입력하세요:') || url;
                          if (url && text) {
                            const linkMarkdown = `[${text}](${url})`;
                            setEditForm(prev => ({
                              ...prev,
                              content: prev.content + linkMarkdown
                            }));
                          }
                        }}
                        data-testid="button-link"
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost" 
                            size="sm"
                            data-testid="button-table-dropdown"
                          >
                            <Table className="h-4 w-4" />
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => {
                              const tableMarkdown = `| 헤더1 | 헤더2 | 헤더3 |\n|-------|-------|-------|\n| 데이터1 | 데이터2 | 데이터3 |\n| 데이터4 | 데이터5 | 데이터6 |`;
                              setEditForm(prev => ({
                                ...prev,
                                content: prev.content + '\n' + tableMarkdown + '\n'
                              }));
                            }}
                            data-testid="menu-item-table-3x3"
                          >
                            3×3 표
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const tableMarkdown = `| 헤더1 | 헤더2 | 헤더3 | 헤더4 |\n|-------|-------|-------|-------|\n| 데이터1 | 데이터2 | 데이터3 | 데이터4 |\n| 데이터5 | 데이터6 | 데이터7 | 데이터8 |\n| 데이터9 | 데이터10 | 데이터11 | 데이터12 |`;
                              setEditForm(prev => ({
                                ...prev,
                                content: prev.content + '\n' + tableMarkdown + '\n'
                              }));
                            }}
                            data-testid="menu-item-table-4x4"
                          >
                            4×4 표
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <label className="cursor-pointer">
                      <Button
                        type="button"
                        variant="ghost" 
                        size="sm"
                        title="이미지 업로드"
                        asChild
                      >
                        <span>
                          <Image className="h-4 w-4" />
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageUpload}
                        className="hidden"
                        data-testid="input-edit-image-upload"
                      />
                    </label>
                  </div>
                  <Textarea
                    id="edit-content-textarea"
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="게시글 내용을 수정하세요.&#10;&#10;📝 Markdown 사용 가능:&#10;- **굵은 글씨** 또는 *기울임*&#10;- [링크](URL)&#10;- 표와 이미지 업로드&#10;- 미리보기로 확인해보세요!"
                    className="min-h-64 resize-y rounded-t-none border-t-0 focus:ring-0"
                    data-testid="textarea-edit-content"
                  />
                </>
              )}
              
              {isEditPreviewMode && (
                <div className="min-h-64 p-4 border rounded-md bg-white dark:bg-gray-900">
                  {editForm.content.trim() ? (
                    <SafeMarkdown content={editForm.content} />
                  ) : (
                    <p className="text-gray-500 italic">수정할 내용을 입력하면 여기에 미리보기가 표시됩니다.</p>
                  )}
                </div>
              )}
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
            <div data-testid="text-content">
              <SafeMarkdown content={post.content} />
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