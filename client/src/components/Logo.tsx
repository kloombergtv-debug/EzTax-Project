import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  theme?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ theme = 'light' }) => {
  return (
    <Link href="/">
      <div className="flex items-center cursor-pointer">
        <span className="text-black font-bold text-xl">
          Tax&Wealth
        </span>
      </div>
    </Link>
  );
};

export default Logo;
