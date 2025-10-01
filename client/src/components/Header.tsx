import React, { useState } from 'react';
import Logo from './Logo';
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Save, LogIn, LogOut, User, RefreshCcw, ClipboardCheck, Shield, Home, DollarSign, PiggyBank, FileText, CreditCard, Calculator, Eye, Lock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
// import { useTaxContext } from '@/context/TaxContext';
import { useAuth } from '@/hooks/use-auth';
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

const Header: React.FC = () => {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  // TaxContext는 임시로 사용하지 않음 - 오류 방지
  // const taxContext = useTaxContext();
  // const { taxData, saveTaxReturn, resetToZero, updateTaxData } = taxContext || {};
  const { user, logoutMutation } = useAuth();
  const [isResetting, setIsResetting] = useState(false);

  const handleSaveProgress = async () => {
    // 임시로 기능 비활성화 - TaxContext 오류 방지
    toast({
      title: "저장 기능 임시 비활성화",
      description: "곧 복원될 예정입니다.",
    });
  };
  
  // 모든 필드 초기화 함수
  const handleReset = async () => {
    // 임시로 기능 비활성화 - TaxContext 오류 방지
    toast({
      title: "초기화 기능 임시 비활성화",
      description: "곧 복원될 예정입니다.",
    });
    setIsResetting(false);
  };

  // Only show buttons on tax form pages
  const showButtons = location !== '/' && location !== '/not-found' && location !== '/auth';

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <header className="bg-black shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <Logo />
        </div>
        
        {/* 주요 페이지 네비게이션 */}
        <nav className="hidden lg:flex items-center space-x-2">
          <Button 
            variant={location === '/board' ? "default" : "ghost"} 
            size="sm"
            className={`text-sm flex items-center gap-1 ${location !== '/board' ? 'text-white hover:text-white' : ''}`}
            onClick={() => navigate('/board')}
          >
            <MessageSquare className="h-4 w-4" />
            게시판
          </Button>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center text-sm font-medium">
                <User className="h-4 w-4 mr-1" />
                {user.username}
              </div>
              {user.username === 'admin' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-primary-dark hover:text-primary flex items-center text-sm"
                  onClick={() => navigate('/admin')}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  관리자
                </Button>
              )}

              <Button 
                variant="outline" 
                size="sm"
                className="text-primary-dark hover:text-primary flex items-center text-sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span>로그아웃(Logout)</span>
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-primary-dark hover:text-primary flex items-center text-sm"
                onClick={handleLogin}
              >
                <LogIn className="h-4 w-4 mr-1" />
                <span>로그인(Login)</span>
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="bg-primary hover:bg-primary-dark text-white flex items-center text-sm"
                onClick={() => navigate('/auth?tab=register')}
              >
                <User className="h-4 w-4 mr-1" />
                <span>회원가입</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
