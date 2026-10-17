import React from 'react';

export interface GastoLogoProps {
  /** Size in pixels (or string with units). Default: 32 */
  size?: number | string;
  /** Additional CSS classes */
  className?: string;
  /** Visual variant: dark (default) or emerald background */
  variant?: 'default' | 'glow' | 'emerald' | 'dark' | 'minimal';
  /** Whether to show only the "G" emblem without the rounded background */
  isolated?: boolean;
}

const ARC = 'M 346 168 A 128 128 0 1 0 384 256';
const BAR = 'M 384 256 L 268 256';

export function GastoLogo({
  size = 32,
  className = '',
  variant = 'default',
  isolated = false,
}: GastoLogoProps) {
  const isEmerald = variant === 'emerald';
  const bg = isEmerald ? '#059669' : '#0B1220';
  const arcColor = isolated ? 'currentColor' : '#FFFFFF';
  const barColor = isEmerald && !isolated ? '#A7F3D0' : '#34D399';

  return (
    <svg
      style={{ width: size, height: size }}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
      className={`shrink-0 select-none transition-all duration-300 ${className}`}
      aria-label="Gastô Logo"
      role="img"
    >
      {!isolated && <rect width="512" height="512" rx="116" fill={bg} />}
      <path d={ARC} stroke={arcColor} strokeWidth="62" strokeLinecap="round" />
      <path d={BAR} stroke={barColor} strokeWidth="62" strokeLinecap="round" />
    </svg>
  );
}
