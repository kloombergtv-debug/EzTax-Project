import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  theme?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ theme = 'light' }) => {
  return (
    <Link href="/">
      <div className="flex items-center cursor-pointer">
        <img 
          src="/rethink-wealth-logo.png" 
          alt="Rethink Wealth" 
          className="h-10 w-auto"
        />
      </div>
    </Link>
  );
};

export default Logo;
