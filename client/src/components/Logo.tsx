import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  theme?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ theme = 'light' }) => {
  return (
    <Link href="/">
      <div className="flex items-center gap-3 cursor-pointer">
        <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Times New Roman, serif' }}>
          Dae Hyun Jee
        </span>
        <img 
          src="/rethink-wealth-logo.png" 
          alt="Rethink Wealth" 
          className="h-8 w-auto"
        />
      </div>
    </Link>
  );
};

export default Logo;
