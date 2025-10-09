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
        <nav className="flex items-center space-x-1">
          <Button 
            variant={location === '/' ? "default" : "ghost"} 
            size="sm"
            className={`text-xs ${location === '/' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white hover:text-gray-300'}`}
            onClick={() => navigate('/')}
          >
            Home
          </Button>
          <Button 
            variant={location === '/services' ? "default" : "ghost"} 
            size="sm"
            className={`text-xs ${location === '/services' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white hover:text-gray-300'}`}
            onClick={() => navigate('/services')}
          >
            서비스
          </Button>
          <Button 
            variant={location === '/about' ? "default" : "ghost"} 
            size="sm"
            className={`text-xs ${location === '/about' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white hover:text-gray-300'}`}
            onClick={() => navigate('/about')}
          >
            소개
          </Button>
          <Button 
            variant={location === '/personal-info' ? "default" : "ghost"} 
            size="sm"
            className={`text-xs ${location === '/personal-info' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white hover:text-gray-300'}`}
            onClick={() => navigate('/personal-info')}
          >
            세금진단
          </Button>
          <Button 
            variant={location === '/retirement-score' ? "default" : "ghost"} 
            size="sm"
            className={`text-xs ${location === '/retirement-score' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white hover:text-gray-300'}`}
            onClick={() => navigate('/retirement-score')}
          >
            은퇴준비
          </Button>
          <Button 
            variant={location === '/residency-checker' ? "default" : "ghost"} 
            size="sm"
            className={`text-xs ${location === '/residency-checker' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white hover:text-gray-300'}`}
            onClick={() => navigate('/residency-checker')}
          >
            거주지확인
          </Button>
          <Button 
            variant={location === '/capital-gains' ? "default" : "ghost"} 
            size="sm"
            className={`text-xs ${location === '/capital-gains' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white hover:text-gray-300'}`}
            onClick={() => navigate('/capital-gains')}
          >
            자본이득
          </Button>
          <Button 
            variant={location === '/board' ? "default" : "ghost"} 
            size="sm"
            className={`text-xs flex items-center gap-1 ${location === '/board' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white hover:text-gray-300'}`}
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
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center text-sm"
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
