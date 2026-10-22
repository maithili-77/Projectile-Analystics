import React, { useState } from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

export const GunLogo: React.FC<Props> = ({
  size = 'md',
  className = '',
  showGlow = true
}) => {
  const [imgError, setImgError] = useState(false);

  // Increased sizes with visible length so the sniper rifle and crosshair are clearly visible
  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-12 h-12 sm:w-14 sm:h-14 rounded-xl',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl',
    xl: 'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl',
  }[size];

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl bg-white p-0.5 border border-slate-300/80 shadow-md transition-all duration-300 group-hover:scale-105 active:scale-95 overflow-hidden select-none ${
        showGlow ? 'shadow-[0_4px_16px_rgba(23,37,54,0.12)]' : ''
      } ${sizeClasses} ${className}`}
    >
      {!imgError ? (
        <img
          src="/ballistic-analyst-logo.jpg"
          alt="Ballistic Analyst Logo"
          className="w-full h-full object-contain rounded-lg"
          onError={() => setImgError(true)}
        />
      ) : (
        /* Fallback if image fails to load */
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1 text-slate-800"
        >
          {/* Crosshair circle */}
          <circle cx="16" cy="14" r="9" stroke="#1D4ED8" strokeWidth="1.5" strokeDasharray="6 3" />
          {/* Rifle */}
          <path d="M4 18L10 16L14 14L24 12V10L14 12L10 14L4 16Z" fill="#1E293B" />
          {/* Bullet */}
          <path d="M26 11L29 11L27.5 12Z" fill="#FF8A24" />
        </svg>
      )}
    </div>
  );
};
