import React from 'react';

export interface GastoLogoProps {
  /** Size in pixels (or string with units). Default: 32 */
  size?: number | string;
  /** Additional CSS classes */
  className?: string;
  /** Visual theme variant */
  variant?: 'default' | 'glow' | 'emerald' | 'dark' | 'minimal';
  /** Whether to show outer squircle container or just the isolated emblem */
  isolated?: boolean;
}

export function GastoLogo({
  size = 32,
  className = '',
  variant = 'default',
  isolated = false,
}: GastoLogoProps) {
  // Unique instance ID to prevent SVG defs collision
  const uid = React.useId().replace(/:/g, '_');
  const bgGradId = `gasto-bg-${uid}`;
  const rimGradId = `gasto-rim-${uid}`;
  const darkGradId = `gasto-dark-${uid}`;
  const leafGradId = `gasto-leaf-${uid}`;
  const glowFilterId = `gasto-glow-${uid}`;
  const innerShadowId = `gasto-innershadow-${uid}`;

  const dimensionStyle = typeof size === 'number' ? { width: size, height: size } : { width: size, height: size };

  return (
    <svg
      style={dimensionStyle}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      className={`shrink-0 select-none drop-shadow-xs transition-all duration-300 ${className}`}
      aria-label="Gastô Logo"
      role="img"
    >
      <defs>
        {/* Background Gradient - Default (Ultra-clean Pearlescent White) */}
        <linearGradient id={bgGradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          {variant === 'emerald' ? (
            <>
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </>
          ) : variant === 'dark' ? (
            <>
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </>
          )}
        </linearGradient>

        {/* Specular Rim / Highlight Border */}
        <linearGradient id={rimGradId} x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={variant === 'dark' ? "0.2" : "0.95"} />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#64748B" stopOpacity="0.25" />
        </linearGradient>

        {/* Emblem "G" Deep Charcoal Brand Stem Gradient */}
        <linearGradient id={darkGradId} x1="16" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          {variant === 'emerald' ? (
            <>
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#ECFDF5" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="60%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#334155" />
            </>
          )}
        </linearGradient>

        {/* Growth Leaf Radiant Emerald Gradient */}
        <linearGradient id={leafGradId} x1="32" y1="32" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          {variant === 'emerald' ? (
            <>
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#A7F3D0" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="40%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </>
          )}
        </linearGradient>

        {/* Subtle Ambient Emerald Soft Glow */}
        <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#059669" floodOpacity="0.35" />
        </filter>

        {/* Inner Container Soft Depth */}
        <filter id={innerShadowId} x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.06" />
        </filter>
      </defs>

      {!isolated && (
        <>
          {/* Main Squircle Background */}
          <rect
            x="1"
            y="1"
            width="62"
            height="62"
            rx="17"
            fill={`url(#${bgGradId})`}
            filter={`url(#${innerShadowId})`}
          />

          {/* Precision Specular Outer Highlight Border (Sub-pixel Crisp) */}
          <rect
            x="1"
            y="1"
            width="62"
            height="62"
            rx="17"
            stroke={`url(#${rimGradId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Top-edge Glass Sheen Light Reflection */}
          <path
            d="M 18 2.5 H 46 C 54.5 2.5 61.5 9.5 61.5 18 V 22 C 61.5 12 52 3.5 40 3.5 H 24 C 12 3.5 2.5 12 2.5 22 V 18 C 2.5 9.5 9.5 2.5 18 2.5 Z"
            fill="white"
            fillOpacity={variant === 'dark' ? "0.08" : "0.55"}
          />
        </>
      )}

      {/* ============================================================ */}
      {/* "G" Brand Emblem - Master Precision Geometry (64x64 Grid)     */}
      {/* ============================================================ */}
      <g id="gasto-emblem" transform={isolated ? "scale(1.2) translate(-5.3, -5.3)" : undefined}>
        {/* Main "G" Outer Sweep Body */}
        <path
          d="M 41 18.5
             C 38.2 16.5 34.8 15.5 31 15.5
             C 21.8 15.5 14.5 22.8 14.5 32
             C 14.5 41.2 21.8 48.5 31 48.5
             C 33.6 48.5 35.8 48.0 38.2 46.8
             L 38.2 40.5
             C 36.1 41.6 33.8 42.2 31 42.2
             C 25.3 42.2 20.7 37.6 20.7 32
             C 20.7 26.4 25.3 21.8 31 21.8
             C 33.6 21.8 36.0 22.7 38.0 24.2
             L 42.2 20.0
             C 41.8 19.5 41.4 19.0 41 18.5
             Z"
          fill={`url(#${darkGradId})`}
        />

        {/* "G" Middle Horizontal Crossbar with smooth rounded caps */}
        <rect
          x="30.5"
          y="28"
          width="13"
          height="5.6"
          rx="2.8"
          fill={`url(#${darkGradId})`}
        />

        {/* Growth Leaf / Radiant Prosperity Facet (Bottom-Right Quadrant) */}
        <path
          d="M 31 32
             H 44.5
             C 44.5 39.4 38.4 45.5 31 45.5
             V 32
             Z"
          fill={`url(#${leafGradId})`}
          filter={`url(#${glowFilterId})`}
        />

        {/* Specular Micro-Accent Dot on Leaf */}
        <circle
          cx="37.5"
          cy="37.5"
          r="1.6"
          fill="white"
          fillOpacity={variant === 'emerald' ? "0.9" : "0.85"}
        />
      </g>
    </svg>
  );
}

