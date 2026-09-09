import React from 'react';
import { motion } from 'motion/react';

export function FinanceIllustration() {
  return (
    <div className="relative w-full max-w-[480px] h-[380px] sm:h-[420px] flex items-center justify-center select-none">
      {/* Background ambient neon glow */}
      <div className="absolute w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none -top-10 -left-10 animate-pulse" />
      <div className="absolute w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none bottom-0 right-0" />

      {/* Main SVG Composition */}
      <svg
        viewBox="0 0 500 420"
        className="w-full h-full overflow-visible drop-shadow-2xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Hologram Gradients */}
          <linearGradient id="holoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FF88" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00C9A7" stopOpacity="0.08" />
          </linearGradient>

          <linearGradient id="holoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FF88" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#05D5FA" stopOpacity="0.08" />
          </linearGradient>

          <linearGradient id="holoGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00FF88" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="chairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D3748" />
            <stop offset="100%" stopColor="#1A202C" />
          </linearGradient>

          {/* Filter for neon glow effect */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Circular Podium / Platform */}
        <ellipse cx="250" cy="340" rx="190" ry="55" fill="#1e1b2e" />
        <ellipse cx="250" cy="336" rx="180" ry="50" fill="url(#pedestalGrad)" />
        <ellipse cx="250" cy="336" rx="160" ry="42" fill="#F1F5F9" opacity="0.9" />

        {/* Platform Grid Lines (Futuristic Grid) */}
        <ellipse cx="250" cy="336" rx="130" ry="32" stroke="#00FF88" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 4" />
        <line x1="160" y1="336" x2="340" y2="336" stroke="#00FF88" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3 3" />

        {/* Modern Minimalist Chair (Left of Platform) */}
        <g id="chair" transform="translate(60, 200)">
          {/* Chair Legs */}
          <line x1="35" y1="95" x2="15" y2="145" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
          <line x1="35" y1="95" x2="48" y2="145" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="95" x2="72" y2="142" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="95" x2="32" y2="140" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          
          {/* Leg Tips in Neon Green */}
          <circle cx="15" cy="145" r="2.5" fill="#00FF88" filter="url(#neonGlow)" />
          <circle cx="48" cy="145" r="2.5" fill="#00FF88" filter="url(#neonGlow)" />
          <circle cx="72" cy="142" r="2.5" fill="#00FF88" filter="url(#neonGlow)" />

          {/* Chair Seat & Backrest */}
          <path
            d="M 28 5 C 28 0, 48 0, 52 5 L 56 60 C 56 75, 48 85, 35 90 C 20 90, 15 80, 15 65 Z"
            fill="url(#chairGrad)"
          />
          <path
            d="M 18 68 C 18 68, 30 85, 55 80 C 65 78, 65 65, 52 65 C 38 65, 25 60, 18 68 Z"
            fill="#1E293B"
          />
        </g>

        {/* Indoor Plant in Pot (Right of Platform) */}
        <g id="plant" transform="translate(340, 240)">
          {/* Pot */}
          <path d="M 18 55 L 23 90 C 24 95, 46 95, 47 90 L 52 55 Z" fill="#242038" />
          <ellipse cx="35" cy="55" rx="17" ry="5" fill="#3D3759" />

          {/* Leaves */}
          <path d="M 35 55 Q 15 25 8 10 Q 25 22 35 55" fill="#00E599" />
          <path d="M 35 55 Q 35 15 35 0 Q 42 20 35 55" fill="#00FF88" />
          <path d="M 35 55 Q 55 25 65 15 Q 52 30 35 55" fill="#00C978" />
          <path d="M 35 55 Q 48 35 58 32 Q 45 45 35 55" fill="#00B36B" />
          <path d="M 35 55 Q 22 35 12 32 Q 25 45 35 55" fill="#10B981" />
        </g>

        {/* Character Standing on Platform */}
        <g id="character" transform="translate(195, 115)">
          {/* Shadow beneath feet */}
          <ellipse cx="48" cy="225" rx="35" ry="8" fill="#0F172A" opacity="0.3" />

          {/* Shoes */}
          <path d="M 22 216 L 38 216 C 42 216, 44 222, 38 225 L 20 225 C 16 225, 16 216, 22 216 Z" fill="#334155" />
          <line x1="26" y1="216" x2="26" y2="225" stroke="#00FF88" strokeWidth="1.5" />

          <path d="M 58 210 L 74 210 C 78 210, 80 216, 74 219 L 56 219 C 52 219, 52 210, 58 210 Z" fill="#334155" />
          <line x1="62" y1="210" x2="62" y2="219" stroke="#00FF88" strokeWidth="1.5" />

          {/* Legs */}
          <rect x="24" y="165" width="10" height="52" rx="4" fill="#FCA5A5" />
          <rect x="60" y="165" width="10" height="46" rx="4" fill="#FCA5A5" />

          {/* Shorts */}
          <path d="M 18 120 L 78 120 L 74 170 L 53 170 L 48 135 L 43 170 L 22 170 Z" fill="#242838" />

          {/* Torso / T-Shirt */}
          <path d="M 20 65 Q 48 60 76 65 L 78 122 L 18 122 Z" fill="#2D3748" />

          {/* Arms reaching forward to the holographic screens */}
          {/* Left Arm reaching to left screen */}
          <path
            d="M 22 68 Q -5 95 -12 110 Q -8 116 2 110 Q 15 95 32 78 Z"
            fill="#2D3748"
          />
          <circle cx="-12" cy="112" r="5" fill="#FCA5A5" />

          {/* Right Arm reaching to right screen */}
          <path
            d="M 74 68 Q 98 90 108 108 Q 102 115 92 110 Q 82 92 68 78 Z"
            fill="#2D3748"
          />
          <circle cx="108" cy="110" r="5" fill="#FCA5A5" />

          {/* Neck & Head */}
          <rect x="42" y="48" width="12" height="18" fill="#FCA5A5" rx="3" />
          
          {/* Head */}
          <ellipse cx="48" cy="36" rx="16" ry="18" fill="#FCA5A5" />

          {/* Hair */}
          <path
            d="M 32 30 C 32 15, 64 15, 64 30 C 64 22, 58 12, 48 12 C 38 12, 32 22, 32 30 Z"
            fill="#1E293B"
          />
          <path d="M 30 28 Q 38 20 48 20 Q 58 20 66 28 L 65 35 Q 58 26 48 26 Q 38 26 31 35 Z" fill="#0F172A" />

          {/* Futuristic VR Visor / Glasses glowing neon green */}
          <g id="vrVisor">
            <rect
              x="30"
              y="26"
              width="36"
              height="14"
              rx="4"
              fill="#00FF88"
              filter="url(#neonGlow)"
            />
            <rect x="32" y="28" width="32" height="10" rx="3" fill="#00CC6A" />
            <line x1="34" y1="33" x2="62" y2="33" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.8" />
            {/* Visor Strap */}
            <path d="M 30 33 L 26 34 M 66 33 L 70 34" stroke="#1E293B" strokeWidth="3" />
          </g>
        </g>

        {/* ======================================================== */}
        {/* LEFT HOLOGRAPHIC CURVED SCREEN (Financial Mountain & Line Chart) */}
        {/* ======================================================== */}
        <motion.g
          animate={{
            y: [0, -6, 0],
            rotate: [0, -0.5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Hologram Projector Light Cone */}
          <polygon
            points="60,110 210,135 210,250 60,280"
            fill="url(#holoGradient1)"
            stroke="#00FF88"
            strokeWidth="1.8"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
          />

          {/* Screen Content: Grid, Peaks & Currency Nodes */}
          {/* Curved Header Bar */}
          <path d="M 68 122 L 200 144" stroke="#00FF88" strokeWidth="2" strokeOpacity="0.8" />
          
          {/* Mountain / Financial Growth Peaks */}
          <polygon
            points="75,255 105,175 135,215 165,160 195,235"
            fill="none"
            stroke="#00FF88"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <polygon
            points="75,255 105,175 135,215 165,160 195,235 195,255 75,255"
            fill="#00FF88"
            fillOpacity="0.12"
          />

          {/* Glowing Currency & Metric Nodes */}
          <circle cx="105" cy="175" r="4" fill="#00FF88" filter="url(#neonGlow)" />
          <circle cx="165" cy="160" r="4.5" fill="#00FF88" filter="url(#neonGlow)" />
          <circle cx="178" cy="138" r="6" stroke="#00FF88" strokeWidth="1.5" fill="none" />
          
          {/* Subtle Data Label */}
          <text x="75" y="140" fill="#00FF88" fontSize="10" fontWeight="bold" opacity="0.9" fontFamily="sans-serif">
            R$ +14.850
          </text>
        </motion.g>

        {/* ======================================================== */}
        {/* RIGHT HOLOGRAPHIC CURVED SCREEN (Financial Bar Chart & Analytics) */}
        {/* ======================================================== */}
        <motion.g
          animate={{
            y: [0, -7, 0],
            rotate: [0, 0.6, 0],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        >
          {/* Hologram Projection Plane */}
          <polygon
            points="290,135 440,110 440,280 290,250"
            fill="url(#holoGradient2)"
            stroke="#00FF88"
            strokeWidth="1.8"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
          />

          {/* Header Bar */}
          <path d="M 298 145 L 430 123" stroke="#00FF88" strokeWidth="2" strokeOpacity="0.8" />

          {/* Bar Chart Columns */}
          {/* Bar 1 */}
          <rect x="312" y="195" width="18" height="42" fill="none" stroke="#00FF88" strokeWidth="2" rx="2" />
          <rect x="312" y="195" width="18" height="42" fill="#00FF88" fillOpacity="0.3" rx="2" />

          {/* Bar 2 (Higher) */}
          <rect x="345" y="170" width="18" height="70" fill="none" stroke="#00FF88" strokeWidth="2" rx="2" />
          <rect x="345" y="170" width="18" height="70" fill="#00FF88" fillOpacity="0.45" rx="2" />

          {/* Bar 3 (Highest) */}
          <rect x="378" y="150" width="18" height="93" fill="none" stroke="#00FF88" strokeWidth="2" rx="2" />
          <rect x="378" y="150" width="18" height="93" fill="#00FF88" fillOpacity="0.6" rx="2" />

          {/* Bar 4 */}
          <rect x="410" y="180" width="16" height="66" fill="none" stroke="#00FF88" strokeWidth="2" rx="2" />
          <rect x="410" y="180" width="16" height="66" fill="#00FF88" fillOpacity="0.35" rx="2" />

          {/* Target Milestone Indicator Line */}
          <line x1="305" y1="165" x2="430" y2="145" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.7" />
        </motion.g>

        {/* Floating Financial Elements / Sparkles */}
        <motion.g
          animate={{
            y: [-4, 6, -4],
            x: [-2, 2, -2],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Small Floating Credit Card */}
          <g transform="translate(110, 70) rotate(-12)">
            <rect width="44" height="28" rx="4" fill="#0F172A" stroke="#00FF88" strokeWidth="1.5" filter="url(#neonGlow)" />
            <rect x="4" y="6" width="8" height="6" rx="1.5" fill="#F59E0B" />
            <line x1="4" y1="18" x2="28" y2="18" stroke="#00FF88" strokeWidth="1.5" strokeOpacity="0.8" />
            <circle cx="36" cy="20" r="3" fill="#00FF88" fillOpacity="0.6" />
          </g>
        </motion.g>

        {/* Floating Coin / Dollar Token */}
        <motion.g
          animate={{
            y: [5, -7, 5],
            rotate: [-5, 8, -5],
          }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        >
          <g transform="translate(390, 60)">
            <circle cx="14" cy="14" r="14" fill="#1E293B" stroke="#00FF88" strokeWidth="2" filter="url(#neonGlow)" />
            <text x="14" y="19" fill="#00FF88" fontSize="15" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
              $
            </text>
          </g>
        </motion.g>

        {/* Floating Sparkles & Particles */}
        <circle cx="210" cy="80" r="2" fill="#00FF88" opacity="0.8">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="310" cy="90" r="2.5" fill="#00FF88" opacity="0.6">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="150" cy="300" r="1.5" fill="#00FF88" opacity="0.5" />
        <circle cx="380" cy="320" r="2" fill="#00FF88" opacity="0.7" />
      </svg>
    </div>
  );
}
