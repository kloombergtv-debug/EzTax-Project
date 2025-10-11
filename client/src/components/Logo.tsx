import React from 'react';
import { Link } from 'wouter';
import { Shield } from 'lucide-react';

interface LogoProps {
  theme?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ theme = 'light' }) => {
  return (
    <Link href="/">
      <div className="flex items-center gap-2 cursor-pointer">
        <Shield className="w-7 h-7 text-white" strokeWidth={2} />
        <span className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.02em' }}>
          Daehyun.life
        </span>
      </div>
    </Link>
  );
};

export default Logo;
