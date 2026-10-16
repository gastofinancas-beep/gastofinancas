import React from 'react';
import { motion } from 'motion/react';

export function WelcomeOrbitIllustration() {
  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square flex items-center justify-center select-none">
      {/* Ambient background glow in neon emerald */}
      <div className="absolute w-56 h-56 rounded-full bg-emerald-500/20 blur-[80px] pointer-events-none" />
      <div className="absolute w-40 h-40 rounded-full bg-[#00FF88]/15 blur-[60px] pointer-events-none" />

      {/* Main floating container */}
      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <svg
          viewBox="0 0 360 360"
          className="w-full h-full overflow-visible drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Coin Gradients */}
            <radialGradient id="coinFace" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFE885" />
              <stop offset="45%" stopColor="#F5B838" />
              <stop offset="85%" stopColor="#D98A1B" />
              <stop offset="100%" stopColor="#9C5A07" />
            </radialGradient>
            <linearGradient id="coinRim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E09F24" />
              <stop offset="100%" stopColor="#783F04" />
            </linearGradient>

            {/* Neon Green Glow Filter */}
            <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Block Shadows */}
            <filter id="blockShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Orbital Ring (Elliptical perspective like Image 1) */}
          <ellipse
            cx="180"
            cy="180"
            rx="130"
            ry="110"
            stroke="#ffffff"
            strokeOpacity="0.18"
            strokeWidth="2.5"
            strokeDasharray="5 5"
          />
          <ellipse
            cx="180"
            cy="180"
            rx="130"
            ry="110"
            stroke="#00FF88"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />

          {/* Connecting Thin Orbital Lines */}
          <path
            d="M 180 50 Q 280 80 295 180 T 180 310 T 65 180 Z"
            stroke="#ffffff"
            strokeOpacity="0.25"
            strokeWidth="1.8"
            fill="none"
          />

          {/* Central 3D Coin (Litecoin / Gastô Coin in Image 1) */}
          <g transform="translate(180, 180)">
            {/* Drop shadow on coin */}
            <ellipse cx="0" cy="18" rx="46" ry="16" fill="#000000" opacity="0.45" filter="blur(4px)" />
            
            {/* 3D Coin Rim Thickness */}
            <ellipse cx="0" cy="6" rx="46" ry="46" fill="url(#coinRim)" />
            
            {/* 3D Coin Face */}
            <circle cx="0" cy="0" r="46" fill="url(#coinFace)" />
            
            {/* Inner Coin Border */}
            <circle cx="0" cy="0" r="38" stroke="#FFF0A0" strokeWidth="2.5" strokeOpacity="0.75" fill="none" />

            {/* Embossed Gastô "G" / Cifrão Symbol */}
            <g transform="translate(-16, -20) scale(0.95)">
              <path
                d="M 24 6 C 14 6 7 13 7 23 C 7 33 14 40 24 40 C 31 40 37 36 39 29 L 24 29 L 24 23 L 45 23 C 45.5 25 46 27 46 29 C 46 41 36 47 24 47 C 10 47 0 37 0 23 C 0 10 10 0 24 0 C 33 0 40 4 44 11 L 38 16 C 35 10 30 6 24 6 Z"
                fill="#804400"
                opacity="0.35"
                transform="translate(1.5, 2)"
              />
              <path
                d="M 24 6 C 14 6 7 13 7 23 C 7 33 14 40 24 40 C 31 40 37 36 39 29 L 24 29 L 24 23 L 45 23 C 45.5 25 46 27 46 29 C 46 41 36 47 24 47 C 10 47 0 37 0 23 C 0 10 10 0 24 0 C 33 0 40 4 44 11 L 38 16 C 35 10 30 6 24 6 Z"
                fill="#FFF4B8"
              />
            </g>
          </g>

          {/* 3D Orbiting Server Blocks (Exactly matching the style from Image 1!) */}
          {/* Node 1: Top-Left (Rose/Pink Stack) */}
          <g transform="translate(100, 50)" filter="url(#blockShadow)">
            <rect x="0" y="0" width="44" height="12" rx="4" fill="#F472B6" />
            <rect x="2" y="2" width="40" height="8" rx="2" fill="#FBCFE8" />
            <circle cx="8" cy="6" r="1.5" fill="#DB2777" />
            
            <rect x="0" y="14" width="44" height="12" rx="4" fill="#F472B6" />
            <rect x="2" y="16" width="40" height="8" rx="2" fill="#FCE7F3" />
            <circle cx="8" cy="20" r="1.5" fill="#DB2777" />

            <rect x="0" y="28" width="44" height="12" rx="4" fill="#DB2777" />
            <rect x="2" y="30" width="40" height="8" rx="2" fill="#F472B6" />
            <circle cx="8" cy="34" r="1.5" fill="#9D174D" />
          </g>

          {/* Node 2: Top-Right (Mint / Emerald Stack) */}
          <g transform="translate(200, 52)" filter="url(#blockShadow)">
            <rect x="0" y="0" width="44" height="12" rx="4" fill="#34D399" />
            <rect x="2" y="2" width="40" height="8" rx="2" fill="#A7F3D0" />
            <circle cx="8" cy="6" r="1.5" fill="#059669" />

            <rect x="0" y="14" width="44" height="12" rx="4" fill="#10B981" />
            <rect x="2" y="16" width="40" height="8" rx="2" fill="#6EE7B7" />
            <circle cx="8" cy="20" r="1.5" fill="#047857" />
          </g>

          {/* Node 3: Right (Cyan / Sky Stack) */}
          <g transform="translate(248, 150)" filter="url(#blockShadow)">
            <rect x="0" y="0" width="46" height="12" rx="4" fill="#38BDF8" />
            <rect x="2" y="2" width="42" height="8" rx="2" fill="#BAE6FD" />
            <circle cx="8" cy="6" r="1.5" fill="#0284C7" />

            <rect x="0" y="14" width="46" height="12" rx="4" fill="#0284C7" />
            <rect x="2" y="16" width="42" height="8" rx="2" fill="#7DD3FC" />
            <circle cx="8" cy="20" r="1.5" fill="#0369A1" />

            <rect x="0" y="28" width="46" height="12" rx="4" fill="#0369A1" />
            <rect x="2" y="30" width="42" height="8" rx="2" fill="#38BDF8" />
            <circle cx="8" cy="34" r="1.5" fill="#075985" />
          </g>

          {/* Node 4: Bottom-Right (Soft Emerald / Mint Stack) */}
          <g transform="translate(205, 252)" filter="url(#blockShadow)">
            <rect x="0" y="0" width="44" height="12" rx="4" fill="#00D06C" />
            <rect x="2" y="2" width="40" height="8" rx="2" fill="#A7F3D0" />
            <circle cx="8" cy="6" r="1.5" fill="#047857" />

            <rect x="0" y="14" width="44" height="12" rx="4" fill="#059669" />
            <rect x="2" y="16" width="40" height="8" rx="2" fill="#34D399" />
            <circle cx="8" cy="20" r="1.5" fill="#064E3B" />
          </g>

          {/* Node 5: Bottom-Left (Warm Gold Stack) */}
          <g transform="translate(95, 235)" filter="url(#blockShadow)">
            <rect x="0" y="0" width="46" height="12" rx="4" fill="#FBBF24" />
            <rect x="2" y="2" width="42" height="8" rx="2" fill="#FDE68A" />
            <circle cx="8" cy="6" r="1.5" fill="#D97706" />

            <rect x="0" y="14" width="46" height="12" rx="4" fill="#F59E0B" />
            <rect x="2" y="16" width="42" height="8" rx="2" fill="#FCD34D" />
            <circle cx="8" cy="20" r="1.5" fill="#B45309" />

            <rect x="0" y="28" width="46" height="12" rx="4" fill="#D97706" />
            <rect x="2" y="30" width="42" height="8" rx="2" fill="#FBBF24" />
            <circle cx="8" cy="34" r="1.5" fill="#78350F" />
          </g>

          {/* Node 6: Left (Light Blue / Steel Stack) */}
          <g transform="translate(56, 120)" filter="url(#blockShadow)">
            <rect x="0" y="0" width="44" height="12" rx="4" fill="#60A5FA" />
            <rect x="2" y="2" width="40" height="8" rx="2" fill="#BFDBFE" />
            <circle cx="8" cy="6" r="1.5" fill="#2563EB" />

            <rect x="0" y="14" width="44" height="12" rx="4" fill="#3B82F6" />
            <rect x="2" y="16" width="40" height="8" rx="2" fill="#93C5FD" />
            <circle cx="8" cy="20" r="1.5" fill="#1D4ED8" />

            <rect x="0" y="28" width="44" height="12" rx="4" fill="#2563EB" />
            <rect x="2" y="30" width="40" height="8" rx="2" fill="#60A5FA" />
            <circle cx="8" cy="34" r="1.5" fill="#1E40AF" />
          </g>

          {/* Sparkles / Glowing Micro Dots */}
          <circle cx="160" cy="30" r="3" fill="#00FF88" filter="url(#emeraldGlow)" />
          <circle cx="310" cy="115" r="2.5" fill="#00FF88" filter="url(#emeraldGlow)" />
          <circle cx="45" cy="210" r="2" fill="#00FF88" filter="url(#emeraldGlow)" />
          <circle cx="280" cy="295" r="3" fill="#00FF88" filter="url(#emeraldGlow)" />
        </svg>
      </motion.div>
    </div>
  );
}
