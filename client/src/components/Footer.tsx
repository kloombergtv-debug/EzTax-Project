import React from 'react';
import Logo from './Logo';
import { Link } from 'wouter';
import { Facebook, Twitter, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center mb-4">
              <img 
                src="/rethink-wealth-logo.png" 
                alt="Rethink Wealth" 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-gray-light max-w-md">
              이 싸이트는 간단한 과정을 통해 절세 방안과 최적의 은퇴계획을 세울 수 있도록 지원합니다.
              <br />
              EzTax supports you in creating optimal tax-saving strategies and retirement plans through a simple process.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-heading font-semibold mb-4">리소스</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="/personal-info"><div className="hover:text-white cursor-pointer">세금계산기</div></Link></li>
                <li><Link href="/social-security-calculator"><div className="hover:text-white cursor-pointer">Social Security 계산기</div></Link></li>
                <li><Link href="/residency-checker"><div className="hover:text-white cursor-pointer">거주자여부확인</div></Link></li>
                <li><Link href="/board"><div className="hover:text-white cursor-pointer">사용자 게시판</div></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">회사 소개</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li>
                  <a 
                    href="https://rethinkwealth.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white cursor-pointer block"
                  >
                    회사 소개
                  </a>
                </li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">채용 정보</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">보도 자료</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">문의하기</div></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">법률</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="#"><div className="hover:text-white cursor-pointer">개인정보 처리방침</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">서비스 이용약관</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">보안</div></Link></li>
                <li>
                  <a 
                    href="https://ezclient-portal.replit.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white cursor-pointer block"
                  >
                    Client Portal
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-gray-light flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} EzTax Inc. 모든 권리 보유.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <a href="#" className="hover:text-white">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-white">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-white">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
