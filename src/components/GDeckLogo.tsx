import React, { useState } from 'react';

interface GDeckLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const GDeckLogo: React.FC<GDeckLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const [imgSrc, setImgSrc] = useState<string>('/logo.webp');
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-18 h-18',
  }[size];

  const handleImageError = () => {
    setImgError(true);
  };

  if (imgError) {
    return (
      <div
        className={`${sizeClasses} rounded-xl bg-white flex items-center justify-center border border-[#dadce0] shrink-0 relative p-0.5 ${className}`}
      >
        <svg
          viewBox="0 0 48 48"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Google 4-Color Deck Geometric Icon */}
          <path
            d="M24 6L40 15V33L24 42L8 33V15L24 6Z"
            fill="#F8FAFD"
            stroke="#DADCE0"
            strokeWidth="1.5"
          />
          {/* 4 Google Quadrants */}
          <path d="M24 6L40 15L24 24L8 15L24 6Z" fill="#4285F4" />
          <path d="M40 15V33L24 24L40 15Z" fill="#EA4335" />
          <path d="M24 42L8 33L24 24L24 42Z" fill="#34A853" />
          <path d="M40 33L24 42L24 24L40 33Z" fill="#FBBC04" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-xl overflow-hidden border border-[#dadce0] shrink-0 relative bg-white flex items-center justify-center p-0.5 ${className}`}
    >
      <img
        src={imgSrc}
        alt="GDECK"
        onError={handleImageError}
        className="w-full h-full object-cover rounded-lg select-none scale-105"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
