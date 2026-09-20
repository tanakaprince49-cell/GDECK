import React, { useState } from 'react';
import { GoogleLogo } from './GoogleIcons';

interface GDeckLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const GDeckLogo: React.FC<GDeckLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-18 h-18',
  }[size];

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-9 h-9',
    xl: 'w-12 h-12',
  }[size];

  if (imgError) {
    return (
      <div
        className={`${sizeClasses} rounded-xl bg-white flex items-center justify-center border border-[#dadce0] shadow-xs shrink-0 relative p-1 ${className}`}
      >
        <GoogleLogo className={iconSizes} />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-xl overflow-hidden border border-[#dadce0] shrink-0 relative bg-white flex items-center justify-center p-0.5 shadow-xs ${className}`}
    >
      <img
        src="/logo.webp"
        alt="GDECK"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover rounded-lg select-none scale-105"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
