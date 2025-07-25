import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { Users, Search, Calendar, Mail, User, Shield, AlertTriangle, Edit, Trash2, Key, FileText, DollarSign, Receipt, CreditCard, Calculator } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
// Remove date-fns import since it's not available

interface AdminUser {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  googleId?: string;
  createdAt: string;
  lastLogin?: string;
  taxReturnsCount: number;
  status: 'active' | 'inactive';
}

export default function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', displayName: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showTaxDataDialog, setShowTaxDataDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user has admin privileges - only admin allowed
  const isAdmin = user && user.username === 'admin';

  // Redirect if not admin
  if (user && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <CardTitle className="text-red-800">접근 권한 없음</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              관리자 권한이 필요합니다. 이 페이지에 접근할 수 있는 권한이 없습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              홈페이지로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: users, isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!isAdmin, // Only fetch if user is admin
  });

  // Query for user tax data
  const { data: taxData, isLoading: isTaxDataLoading } = useQuery({
    queryKey: [`/api/admin/users/${selectedUserId}/tax-data`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!selectedUserId && !!isAdmin,
  });

  // Mutations for admin actions
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => apiRequest({
      url: `/api/admin/users/${userId}`,
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "성공",
        description: "사용자가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "사용자 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: { username: string; email: string; displayName: string } }) =>
      apiRequest({
        url: `/api/admin/users/${userId}`,
        method: 'PUT',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowEditDialog(false);
      setEditingUser(null);
      toast({
        title: "성공",
        description: "사용자 정보가 업데이트되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "사용자 정보 업데이트에 실패했습니다.",
        variant: "destructive"
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: number; newPassword: string }) =>
      apiRequest({
        url: `/api/admin/users/${userId}/reset-password`,
        method: 'POST',
        body: { newPassword }
      }),
    onSuccess: () => {
      setShowPasswordDialog(false);
      setEditingUser(null);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      toast({
        title: "성공",
        description: "비밀번호가 재설정되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "비밀번호 재설정에 실패했습니다.",
        variant: "destructive"
      });
    }
  });

  const deleteUserTaxReturnsMutation = useMutation({
    mutationFn: (userId: number) => apiRequest({
      url: `/api/admin/users/${userId}/tax-returns`,
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "성공",
        description: "사용자의 모든 세금 신고서가 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "오류",
        description: error.message || "세금 신고서 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  });

  // Functions to handle tax data viewing
  const handleViewTaxData = (userId: number) => {
    console.log(`Admin attempting to view tax data for user ID: ${userId}`);
    setSelectedUserId(userId);
    setShowTaxDataDialog(true);
    
    // Force refetch the tax data
    queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}/tax-data`] });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // Handler functions
  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email || '',
      displayName: user.displayName || ''
    });
    setShowEditDialog(true);
  };

  const handleResetPassword = (user: AdminUser) => {
    setEditingUser(user);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowPasswordDialog(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    if (user.id === 3) {
      toast({
        title: "오류",
        description: "관리자 계정은 삭제할 수 없습니다.",
        variant: "destructive"
      });
      return;
    }
    
    if (confirm(`정말로 사용자 "${user.username}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleSubmitEdit = () => {
    if (!editingUser) return;
    
    if (!editForm.username.trim()) {
      toast({
        title: "오류",
        description: "사용자 이름을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    updateUserMutation.mutate({
      userId: editingUser.id,
      data: editForm
    });
  };

  const handleSubmitPassword = () => {
    if (!editingUser) return;
    
    if (!passwordForm.newPassword.trim()) {
      toast({
        title: "오류",
        description: "새 비밀번호를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "오류",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive"
      });
      return;
    }

    resetPasswordMutation.mutate({
      userId: editingUser.id,
      newPassword: passwordForm.newPassword
    });
  };

  const filteredUsers = users?.filter((user: AdminUser) => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter((u: AdminUser) => u.status === 'active').length || 0;
  const googleUsers = users?.filter((u: AdminUser) => u.googleId).length || 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">관리자 데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">관리자 권한 필요</h3>
            <p className="text-gray-600">이 페이지에 접근하려면 관리자 권한이 필요합니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 패널</h1>
        <p className="text-gray-600">가입 회원 관리 및 통계</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 회원수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">전체 가입 회원</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 회원</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">활성화된 계정</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">구글 로그인</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{googleUsers}</div>
            <p className="text-xs text-muted-foreground">구글 계정 연동</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            회원 검색
          </CardTitle>
          <CardDescription>사용자명, 이메일, 또는 표시명으로 검색하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="검색어를 입력하세요..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>회원 목록</CardTitle>
          <CardDescription>총 {filteredUsers.length}명의 회원</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>사용자명</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>로그인 방식</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>신고서 수</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        {user.displayName && user.displayName !== user.username && (
                          <div className="text-sm text-gray-500">{user.displayName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      ) : (
                        <span className="text-gray-400">없음</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.googleId ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Google
                        </Badge>
                      ) : (
                        <Badge variant="outline">Local</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.taxReturnsCount}건
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.status === 'active' ? 'default' : 'secondary'}
                        className={user.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {user.status === 'active' ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetPassword(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Key className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewTaxData(user.id)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                        {user.taxReturnsCount > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm(`사용자 "${user.username}"의 모든 세금 신고서를 삭제하시겠습니까?`)) {
                                deleteUserTaxReturnsMutation.mutate(user.id);
                              }
                            }}
                            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                        {user.id !== 3 && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">회원이 없습니다</h3>
              <p className="text-gray-600">
                {searchTerm ? '검색 조건에 맞는 회원이 없습니다.' : '아직 가입한 회원이 없습니다.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">사용자명</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="사용자명을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="이메일을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="displayName">표시명</Label>
              <Input
                id="displayName"
                value={editForm.displayName}
                onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="표시명을 입력하세요"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                취소
              </Button>
              <Button onClick={handleSubmitEdit} disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? '수정 중...' : '수정'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 재설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="새 비밀번호를 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="비밀번호를 다시 입력하세요"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                취소
              </Button>
              <Button onClick={handleSubmitPassword} disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? '재설정 중...' : '재설정'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tax Data Viewing Dialog */}
      <Dialog open={showTaxDataDialog} onOpenChange={setShowTaxDataDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              사용자 세금 정보
            </DialogTitle>
          </DialogHeader>
          
          {isTaxDataLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-lg">세금 정보를 불러오는 중...</div>
            </div>
          ) : taxData ? (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal">개인정보</TabsTrigger>
                <TabsTrigger value="income">소득</TabsTrigger>
                <TabsTrigger value="deductions">공제</TabsTrigger>
                <TabsTrigger value="credits">세액공제</TabsTrigger>
                <TabsTrigger value="results">계산결과</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      개인정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {taxData.personalInfo ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">이름</Label>
                          <p className="text-sm">{taxData.personalInfo.firstName || 'N/A'} {taxData.personalInfo.lastName || ''}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">생년월일</Label>
                          <p className="text-sm">{formatDate(taxData.personalInfo.dateOfBirth)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">이메일</Label>
                          <p className="text-sm">{taxData.personalInfo.email || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">전화번호</Label>
                          <p className="text-sm">{taxData.personalInfo.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">주소</Label>
                          <p className="text-sm">
                            {taxData.personalInfo.address1 || 'N/A'}
                            {taxData.personalInfo.address2 && `, ${taxData.personalInfo.address2}`}
                            <br />
                            {taxData.personalInfo.city || ''}, {taxData.personalInfo.state || ''} {taxData.personalInfo.zipCode || ''}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">신고유형</Label>
                          <p className="text-sm">{taxData.personalInfo.filingStatus || 'N/A'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">개인정보가 입력되지 않았습니다.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="income" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      소득 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {taxData.income ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">급여 소득</Label>
                          <p className="text-sm">{formatCurrency(taxData.income.wages)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">사업 소득</Label>
                          <p className="text-sm">{formatCurrency(taxData.income.businessIncome)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">이자 소득</Label>
                          <p className="text-sm">{formatCurrency(taxData.income.interest)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">배당 소득</Label>
                          <p className="text-sm">{formatCurrency(taxData.income.dividends)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">기타 소득</Label>
                          <p className="text-sm">{formatCurrency(taxData.income.otherIncome)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">총 소득</Label>
                          <p className="text-sm font-bold">{formatCurrency(taxData.income.totalIncome)}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">소득 정보가 입력되지 않았습니다.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deductions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      공제 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {taxData.deductions ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">공제 유형</Label>
                          <p className="text-sm">{taxData.deductions.deductionType === 'standard' ? '표준공제' : '항목별공제'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">총 공제액</Label>
                          <p className="text-sm font-bold">{formatCurrency(taxData.deductions.totalDeductions)}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">공제 정보가 입력되지 않았습니다.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="credits" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      세액공제 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {taxData.taxCredits ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">아동세액공제</Label>
                          <p className="text-sm">{formatCurrency(taxData.taxCredits.childTaxCredit)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">기타 부양가족 공제</Label>
                          <p className="text-sm">{formatCurrency(taxData.taxCredits.creditForOtherDependents)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">근로소득세액공제</Label>
                          <p className="text-sm">{formatCurrency(taxData.taxCredits.earnedIncomeCredit)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">총 세액공제</Label>
                          <p className="text-sm font-bold">{formatCurrency(taxData.taxCredits.totalCredits)}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">세액공제 정보가 입력되지 않았습니다.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="results" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      계산 결과
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {taxData.calculatedResults ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">총 소득</Label>
                          <p className="text-sm">{formatCurrency(taxData.calculatedResults.totalIncome)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">수정총소득(AGI)</Label>
                          <p className="text-sm">{formatCurrency(taxData.calculatedResults.adjustedGrossIncome)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">과세소득</Label>
                          <p className="text-sm">{formatCurrency(taxData.calculatedResults.taxableIncome)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">연방세</Label>
                          <p className="text-sm">{formatCurrency(taxData.calculatedResults.federalTax)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">세액공제</Label>
                          <p className="text-sm">{formatCurrency(taxData.calculatedResults.credits)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">최종 세액</Label>
                          <p className="text-sm font-bold">{formatCurrency(taxData.calculatedResults.taxDue)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">환급액</Label>
                          <p className="text-sm text-green-600 font-bold">{formatCurrency(taxData.calculatedResults.refundAmount)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">납부액</Label>
                          <p className="text-sm text-red-600 font-bold">{formatCurrency(taxData.calculatedResults.amountOwed)}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">계산 결과가 없습니다.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">해당 사용자의 세금 정보가 없습니다.</p>
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowTaxDataDialog(false)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}