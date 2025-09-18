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

// Safe Markdown renderer component
const SafeMarkdown = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-sm max-w-none prose-gray dark:prose-invert prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:leading-relaxed prose-table:text-sm prose-th:border prose-th:border-gray-300 prose-th:px-3 prose-th:py-2 prose-th:bg-gray-50 prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Security: Disable HTML tags that could be dangerous
          script: () => null,
          style: () => null,
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
        {DOMPurify.sanitize(content)}
      </ReactMarkdown>
    </div>
  );
};

const BoardDetail = () => {
  const { id } = useParams<{ id: string }>();
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
      queryClient.invalidateQueries({ 
        queryKey: ['/api/board/posts'], 
        exact: false 
      });
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
    { id: 'usage', name: 'EzTax 사용법' },
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
        // 마크다운 형식으로 크기 정보를 포함
        const sizeClass = getEditImageSizeClass(size);
        imageMarkdown = `![${file.name}](${result.url})\n<!-- ${sizeClass} -->`;
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
      toast({
        title: "업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // Markdown formatting helpers for editing
  const insertEditMarkdown = (prefix: string, suffix?: string) => {
    const textarea = document.getElementById('edit-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const newText = suffix 
      ? `${prefix}${selectedText}${suffix}` 
      : `${prefix}${selectedText}`;
    
    const newContent = 
      textarea.value.substring(0, start) + 
      newText + 
      textarea.value.substring(end);
    
    setEditForm(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      const newCursorPos = start + prefix.length + selectedText.length + (suffix?.length || 0);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  // Cancel editing
  // Generate table template based on size for editing
  const generateEditTableTemplate = (rows: number, cols: number) => {
    const headers = Array.from({ length: cols }, (_, i) => `헤더${i + 1}`).join(' | ');
    const separator = Array.from({ length: cols }, () => '-------').join(' | ');
    const dataRows = Array.from({ length: rows - 1 }, (_, rowIndex) => 
      Array.from({ length: cols }, (_, colIndex) => `데이터${rowIndex + 1}-${colIndex + 1}`).join(' | ')
    );
    
    return `| ${headers} |\n|${separator}|\n${dataRows.map(row => `| ${row} |`).join('\n')}`;
  };

  // Image size functions for editing
  const getEditImageSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'IMAGE_SIZE_SMALL';
      case 'medium': return 'IMAGE_SIZE_MEDIUM';
      case 'large': return 'IMAGE_SIZE_LARGE';
      case 'full': return 'IMAGE_SIZE_FULL';
      default: return 'IMAGE_SIZE_MEDIUM';
    }
  };

  const showEditImageSizeDialog = (): Promise<string> => {
    return new Promise((resolve) => {
      const size = window.prompt(
        '이미지 크기를 선택하세요:\n\n' +
        '1 - 작음 (200px)\n' +
        '2 - 중간 (400px)\n' +
        '3 - 큼 (600px)\n' +
        '4 - 전체 폭\n' +
        '5 - 기본 마크다운\n\n' +
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">내용</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditPreviewMode(!isEditPreviewMode)}
                  data-testid={isEditPreviewMode ? "button-edit-edit-mode" : "button-edit-preview-mode"}
                >
                  {isEditPreviewMode ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      편집
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      미리보기
                    </>
                  )}
                </Button>
              </div>
              
              {!isEditPreviewMode && (
                <>
                  {/* Markdown Toolbar for Editing */}
                  <div className="flex items-center space-x-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-t-md border border-b-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertEditMarkdown('**', '**')}
                      data-testid="button-edit-bold"
                      title="굵게"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertEditMarkdown('*', '*')}
                      data-testid="button-edit-italic"
                      title="기울임"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertEditMarkdown('[', '](url)')}
                      data-testid="button-edit-link"
                      title="링크"
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                    <div className="border-l border-gray-300 h-6 mx-2" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          data-testid="button-edit-table-dropdown"
                          title="표 크기 선택"
                        >
                          <Table className="h-4 w-4" />
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => insertEditMarkdown(generateEditTableTemplate(2, 2))}>
                          2x2 표 (2행 2열)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => insertEditMarkdown(generateEditTableTemplate(3, 3))}>
                          3x3 표 (3행 3열)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => insertEditMarkdown(generateEditTableTemplate(4, 4))}>
                          4x4 표 (4행 4열)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => insertEditMarkdown(generateEditTableTemplate(5, 5))}>
                          5x5 표 (5행 5열)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => insertEditMarkdown(generateEditTableTemplate(3, 2))}>
                          3x2 표 (3행 2열)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => insertEditMarkdown(generateEditTableTemplate(2, 4))}>
                          2x4 표 (2행 4열)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="border-l border-gray-300 h-6 mx-2" />
                    <label className="flex">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        data-testid="button-edit-image-upload"
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