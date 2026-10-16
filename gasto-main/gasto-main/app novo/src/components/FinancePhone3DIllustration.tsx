import React from 'react';
import { motion } from 'motion/react';

export function FinancePhone3DIllustration() {
  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square flex items-center justify-center select-none">
      {/* Background ambient emerald & teal glowing aura in soft tones */}
      <div className="absolute w-64 h-64 rounded-full bg-emerald-100/70 blur-[75px] pointer-events-none" />
      <div className="absolute w-44 h-44 rounded-full bg-[#00FF88]/20 blur-[55px] pointer-events-none" />

      {/* Main Container with floating animation */}
      <motion.div
        animate={{ y: [-7, 7, -7] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <svg
          viewBox="0 0 360 360"
          className="w-full h-full overflow-visible drop-shadow-[0_16px_35px_rgba(15,23,42,0.16)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Phone Gradients */}
            <linearGradient id="phoneBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="60%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            <linearGradient id="phoneScreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="40%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Neon Green Cifrão (R$) 3D Gradient */}
            <radialGradient id="cifraoRadial" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="35%" stopColor="#34D399" />
              <stop offset="70%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </radialGradient>

            <linearGradient id="cifraoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Floating Soft 3D shapes */}
            <radialGradient id="pinkSphere" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FDE2EC" />
              <stop offset="40%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#BE185D" />
            </radialGradient>

            <linearGradient id="goldChip" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <filter id="cifraoGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#059669" floodOpacity="0.4" />
            </filter>

            <filter id="ambientShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Network constellation dots & lines (subtle slate for light mode) */}
          <g opacity="0.35" stroke="#64748B" strokeWidth="1.2">
            <line x1="85" y1="110" x2="155" y2="70" />
            <line x1="155" y1="70" x2="190" y2="105" />
            <line x1="190" y1="105" x2="190" y2="150" />
            <line x1="120" y1="125" x2="85" y2="110" />
            <line x1="255" y1="150" x2="255" y2="210" />
            <line x1="255" y1="210" x2="225" y2="250" />
            <line x1="120" y1="160" x2="90" y2="200" />
            <line x1="90" y1="200" x2="130" y2="230" />
          </g>

          {/* Network constellation dots */}
          <circle cx="85" cy="110" r="3.5" fill="#10B981" opacity="0.9" />
          <circle cx="155" cy="70" r="4.5" fill="#3B82F6" opacity="0.8" />
          <circle cx="190" cy="105" r="3" fill="#059669" />
          <circle cx="120" cy="125" r="3.5" fill="#64748B" opacity="0.6" />
          <circle cx="255" cy="150" r="4" fill="#3B82F6" opacity="0.8" />
          <circle cx="255" cy="210" r="3.5" fill="#10B981" />
          <circle cx="225" cy="250" r="4.5" fill="#059669" opacity="0.9" />
          <circle cx="90" cy="200" r="4" fill="#64748B" opacity="0.6" />
          <circle cx="130" cy="230" r="3.5" fill="#10B981" opacity="0.7" />
          <circle cx="288" cy="190" r="3" fill="#64748B" opacity="0.6" />
          <circle cx="288" cy="270" r="4" fill="#10B981" />
          <circle cx="90" cy="70" r="3.5" fill="#3B82F6" opacity="0.7" />

          {/* Floating 3D Pink Sphere (Left side) */}
          <g transform="translate(68, 140)" filter="url(#ambientShadow)">
            <circle cx="20" cy="20" r="24" fill="url(#pinkSphere)" />
            {/* Specular highlight */}
            <ellipse cx="14" cy="12" rx="7" ry="5" fill="#FFFFFF" opacity="0.65" />
          </g>

          {/* Floating 3D Pink Pyramid / Polygon (Top right) */}
          <g transform="translate(180, 58)" filter="url(#ambientShadow)">
            <polygon points="20,0 45,38 0,38" fill="#F472B6" />
            <polygon points="20,0 45,38 28,42" fill="#DB2777" opacity="0.8" />
            <polygon points="20,0 0,38 12,42" fill="#FBCFE8" opacity="0.9" />
          </g>

          {/* Floating 3D Soft Cube (Bottom right) */}
          <g transform="translate(260, 220)" filter="url(#ambientShadow)">
            <polygon points="20,0 42,12 42,36 20,24" fill="#F472B6" />
            <polygon points="0,12 20,0 20,24 0,36" fill="#FBCFE8" />
            <polygon points="0,36 20,24 42,36 22,48" fill="#DB2777" />
          </g>

          {/* 3D Smartphone (Center, standing tall) */}
          <g transform="translate(135, 95)" filter="url(#ambientShadow)">
            {/* Phone Case Outer Rim */}
            <rect x="0" y="0" width="102" height="175" rx="20" fill="url(#phoneBody)" stroke="#38BDF8" strokeWidth="2.5" />
            
            {/* Inner Screen */}
            <rect x="6" y="6" width="90" height="163" rx="15" fill="url(#phoneScreen)" />

            {/* Speaker notch */}
            <rect x="36" y="10" width="30" height="4" rx="2" fill="#0F172A" opacity="0.7" />

            {/* Financial Card floating inside phone */}
            <g transform="translate(14, 28)">
              <rect x="0" y="0" width="74" height="46" rx="8" fill="url(#cardGrad)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))" />
              {/* Card chip */}
              <rect x="6" y="7" width="12" height="8" rx="2" fill="#FDE68A" />
              {/* Card numbers & text */}
              <rect x="6" y="24" width="45" height="3" rx="1.5" fill="#FFFFFF" opacity="0.85" />
              <rect x="6" y="31" width="30" height="2.5" rx="1.2" fill="#FFFFFF" opacity="0.6" />
              <circle cx="62" cy="33" r="5" fill="#FFFFFF" opacity="0.5" />
              <circle cx="56" cy="33" r="5" fill="#34D399" opacity="0.7" />
            </g>

            {/* Statement lines / tracking rows inside phone */}
            <g transform="translate(14, 86)">
              <rect x="0" y="0" width="74" height="14" rx="4" fill="#FFFFFF" opacity="0.2" />
              <circle cx="7" cy="7" r="3" fill="#00FF88" />
              <rect x="15" y="5" width="28" height="4" rx="2" fill="#FFFFFF" opacity="0.85" />
              <rect x="50" y="5" width="18" height="4" rx="2" fill="#00FF88" />

              <rect x="0" y="18" width="74" height="14" rx="4" fill="#FFFFFF" opacity="0.15" />
              <circle cx="7" cy="25" r="3" fill="#F59E0B" />
              <rect x="15" y="23" width="32" height="4" rx="2" fill="#FFFFFF" opacity="0.75" />
              <rect x="52" y="23" width="16" height="4" rx="2" fill="#FFFFFF" opacity="0.6" />

              <rect x="0" y="36" width="74" height="14" rx="4" fill="#FFFFFF" opacity="0.12" />
              <circle cx="7" cy="43" r="3" fill="#38BDF8" />
              <rect x="15" y="41" width="24" height="4" rx="2" fill="#FFFFFF" opacity="0.7" />
              <rect x="50" y="41" width="18" height="4" rx="2" fill="#38BDF8" />
            </g>
          </g>

          {/* Floating Yellow/Gold Chip 1 (Top left across phone) */}
          <g transform="translate(170, 110)" filter="url(#ambientShadow)">
            <rect x="0" y="0" width="70" height="18" rx="9" fill="url(#goldChip)" />
            <circle cx="9" cy="9" r="4" fill="#FFFFFF" opacity="0.85" />
          </g>

          {/* Floating Yellow/Gold Chip 2 (Bottom left across phone) */}
          <g transform="translate(100, 230)" filter="url(#ambientShadow)">
            <rect x="0" y="0" width="72" height="26" rx="13" fill="url(#goldChip)" />
            <circle cx="13" cy="13" r="6" fill="#FFFFFF" opacity="0.9" />
            <rect x="25" y="11" width="34" height="4" rx="2" fill="#78350F" opacity="0.7" />
          </g>

          {/* 3D CIFRÃO ($ / R$) EM DESTAQUE */}
          <g transform="translate(80, 150)" filter="url(#cifraoGlow)">
            {/* 3D Coin Platform / Badge */}
            <circle cx="42" cy="42" r="42" fill="url(#cifraoRadial)" />
            <circle cx="42" cy="42" r="37" stroke="#10B981" strokeWidth="2.5" fill="none" opacity="0.9" />
            <circle cx="42" cy="42" r="33" fill="#047857" opacity="0.7" />

            {/* Specular curved reflection on the badge */}
            <path
              d="M 16 35 C 18 20 30 14 45 14 C 55 14 62 18 66 23 C 58 20 46 20 34 25 C 24 30 18 40 16 48 Z"
              fill="#FFFFFF"
              opacity="0.4"
            />

            {/* 3D Bold "R$" */}
            <g transform="translate(24, 20)">
              <text
                x="18"
                y="33"
                textAnchor="middle"
                fontSize="36"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                fill="#022C1A"
                opacity="0.8"
                transform="translate(2, 2.5)"
              >
                R$
              </text>
              <text
                x="18"
                y="33"
                textAnchor="middle"
                fontSize="36"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                fill="#FFFFFF"
              >
                R$
              </text>
            </g>

            {/* Sparkles around Cifrão */}
            <circle cx="78" cy="14" r="3" fill="#10B981" />
            <circle cx="6" cy="65" r="2.5" fill="#F59E0B" />
          </g>

          {/* Floating Financial Growth Badge (+18,4%) in clean modern style */}
          <g transform="translate(210, 175)" filter="url(#ambientShadow)">
            <rect x="0" y="0" width="94" height="28" rx="14" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="5" fill="#059669" />
            <path d="M 12 15 L 14 12 L 16 15" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <text x="26" y="18" fill="#059669" fontSize="11" fontWeight="800" fontFamily="system-ui">
              +18,4%
            </text>
            <text x="66" y="18" fill="#64748B" fontSize="8" fontWeight="700" fontFamily="system-ui">
              MÊS
            </text>
          </g>
        </svg>
      </motion.div>
    </div>
  );
}
