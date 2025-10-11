import React from 'react';
import Logo from './Logo';
import { Link } from 'wouter';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-black text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center mb-4">
              <img 
                src="/dae-hyun-jee-logo.png" 
                alt="Dae Hyun Jee" 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-gray-light max-w-md">
              {t(
                '이 싸이트는 간단한 과정을 통해 절세 방안과 최적의 은퇴계획을 세울 수 있도록 설계되었습니다.',
                'This site supports you in creating optimal tax-saving strategies and retirement plans through a simple process.'
              )}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-heading font-semibold mb-4">{t('리소스', 'Resources')}</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="/personal-info"><div className="hover:text-white cursor-pointer">{t('세금계산기', 'Tax Calculator')}</div></Link></li>
                <li><Link href="/social-security-calculator"><div className="hover:text-white cursor-pointer">{t('Social Security 계산기', 'Social Security Calculator')}</div></Link></li>
                <li><Link href="/residency-checker"><div className="hover:text-white cursor-pointer">{t('거주자여부확인', 'Residency Checker')}</div></Link></li>
                <li><Link href="/board"><div className="hover:text-white cursor-pointer">{t('사용자 게시판', 'User Board')}</div></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">{t('회사 소개', 'Company')}</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li>
                  <a 
                    href="https://rethinkwealth.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white cursor-pointer block"
                  >
                    {t('회사 소개', 'About Us')}
                  </a>
                </li>
                <li>
                  <a 
                    href="https://rethinkwealth.com/careers/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white cursor-pointer block"
                  >
                    {t('채용 정보', 'Careers')}
                  </a>
                </li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">{t('보도 자료', 'Press')}</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">{t('문의하기', 'Contact')}</div></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">{t('법률', 'Legal')}</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="#"><div className="hover:text-white cursor-pointer">{t('개인정보 처리방침', 'Privacy Policy')}</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">{t('서비스 이용약관', 'Terms of Service')}</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">{t('보안', 'Security')}</div></Link></li>
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
          <p>&copy; {new Date().getFullYear()} Dae Hyun Jee. {t('모든 권리 보유.', 'All rights reserved.')}</p>
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
            <a 
              href="https://www.youtube.com/@BESTIR" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
