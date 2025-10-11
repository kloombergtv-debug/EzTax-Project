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
        <Shield className="w-8 h-8 text-white" strokeWidth={2} />
        <span className="text-base md:text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.02em' }}>
          Dae Hyun Jee
        </span>
      </div>
    </Link>
  );
};

export default Logo;
