import React from 'react';

interface CardContactlessProps {
  className?: string;
  size?: number;
}

export function CardContactless({ className = '', size = 20 }: CardContactlessProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 opacity-85 ${className}`}
      aria-label="Pagamento por aproximação (Contactless)"
    >
      <title>Pagamento por aproximação (Contactless)</title>
      <path d="M7.5 4.5a11 11 0 0 1 0 15" />
      <path d="M11 7a7 7 0 0 1 0 10" />
      <path d="M14.5 9.5a3 3 0 0 1 0 5" />
    </svg>
  );
}
