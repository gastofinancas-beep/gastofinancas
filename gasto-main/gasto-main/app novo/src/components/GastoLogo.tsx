import React from 'react';

interface GastoLogoProps {
  size?: number;
  className?: string;
}

export function GastoLogo({ size = 28, className = '' }: GastoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="48" height="48" rx="14" fill="#10B981" />
      <path
        d="M14 26C14 19.3726 19.3726 14 26 14C32.6274 14 38 19.3726 38 26C38 32.6274 32.6274 38 26 38H14V26Z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="26" cy="26" r="5" fill="#047857" />
      <path
        d="M18 34L26 26"
        stroke="#10B981"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="34" cy="18" r="3" fill="#F59E0B" />
    </svg>
  );
}
