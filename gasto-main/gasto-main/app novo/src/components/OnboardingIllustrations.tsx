import React from 'react';
import { motion } from 'motion/react';

// Illustration 1: Financial Management (Character on coin stacks, laptop, clipboard checklist, calendar & calculator)
export function BudgetManagementIllustration() {
  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[390px] h-[210px] sm:h-[240px] mx-auto flex items-center justify-center select-none">
      <svg
        viewBox="40 32 240 230"
        className="relative z-10 w-full h-full drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle background sparks & dots */}
        <circle cx="50" cy="80" r="2.5" fill="#10B981" opacity="0.4" />
        <circle cx="280" cy="90" r="2" fill="#10B981" opacity="0.4" />
        <path d="M 45 70 L 49 70 M 47 68 L 47 72" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <path d="M 275 120 L 279 120 M 277 118 L 277 122" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

        {/* --- Back Clipboard / Planner --- */}
        <g id="clipboard" transform="translate(100, 38)">
          {/* Clipboard board */}
          <rect x="0" y="8" width="135" height="180" rx="10" fill="#FFFFFF" stroke="#10B981" strokeWidth="3" />
          <rect x="0" y="8" width="135" height="180" rx="10" fill="#FFFFFF" />
          
          {/* Clip Top */}
          <rect x="42" y="0" width="50" height="16" rx="4" fill="#34D399" stroke="#059669" strokeWidth="2.5" />
          <circle cx="67" cy="8" r="3.5" fill="#FFFFFF" />

          {/* Calendar inside clipboard */}
          <g transform="translate(14, 28)">
            <rect x="0" y="0" width="48" height="42" rx="4" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
            <rect x="0" y="0" width="48" height="12" rx="4" fill="#10B981" />
            {/* Calendar spiral hooks */}
            <circle cx="8" cy="2" r="1.5" fill="#047857" />
            <circle cx="18" cy="2" r="1.5" fill="#047857" />
            <circle cx="28" cy="2" r="1.5" fill="#047857" />
            <circle cx="38" cy="2" r="1.5" fill="#047857" />
            {/* Calendar grid dots */}
            <rect x="6" y="18" width="6" height="5" rx="1" fill="#A7F3D0" />
            <rect x="16" y="18" width="6" height="5" rx="1" fill="#A7F3D0" />
            <rect x="26" y="18" width="6" height="5" rx="1" fill="#A7F3D0" />
            <rect x="36" y="18" width="6" height="5" rx="1" fill="#059669" />
            <rect x="6" y="27" width="6" height="5" rx="1" fill="#A7F3D0" />
            <rect x="16" y="27" width="6" height="5" rx="1" fill="#059669" />
            <rect x="26" y="27" width="6" height="5" rx="1" fill="#A7F3D0" />
            <rect x="36" y="27" width="6" height="5" rx="1" fill="#A7F3D0" />
          </g>

          {/* Checklist items with checkmarks */}
          <g transform="translate(70, 32)">
            <rect x="0" y="0" width="16" height="16" rx="3" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
            <path d="M4 8.5 L7 11.5 L12 4.5" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="22" y1="8" x2="42" y2="8" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />

            <rect x="0" y="22" width="16" height="16" rx="3" fill="#ECFDF5" stroke="#10B981" strokeWidth="2" />
            <path d="M4 30.5 L7 33.5 L12 26.5" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="22" y1="30" x2="42" y2="30" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Lines on clipboard */}
          <line x1="14" y1="86" x2="115" y2="86" stroke="#D1FAE5" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="14" y1="102" x2="100" y2="102" stroke="#D1FAE5" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="14" y1="118" x2="110" y2="118" stroke="#D1FAE5" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* --- Big Calculator on Right --- */}
        <g id="calculator" transform="translate(185, 110)">
          <rect x="0" y="0" width="76" height="116" rx="10" fill="#ECFDF5" stroke="#059669" strokeWidth="3" />
          {/* Display */}
          <rect x="8" y="10" width="60" height="22" rx="4" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.5" />
          <line x1="16" y1="21" x2="56" y2="21" stroke="#047857" strokeWidth="3" strokeLinecap="round" />

          {/* Buttons grid */}
          <g fill="#FFFFFF" stroke="#10B981" strokeWidth="1.5">
            <rect x="8" y="40" width="16" height="14" rx="3" />
            <rect x="30" y="40" width="16" height="14" rx="3" />
            <rect x="52" y="40" width="16" height="14" rx="3" fill="#A7F3D0" />

            <rect x="8" y="58" width="16" height="14" rx="3" />
            <rect x="30" y="58" width="16" height="14" rx="3" />
            <rect x="52" y="58" width="16" height="14" rx="3" fill="#A7F3D0" />

            <rect x="8" y="76" width="16" height="14" rx="3" />
            <rect x="30" y="76" width="16" height="14" rx="3" />
            <rect x="52" y="76" width="16" height="14" rx="3" fill="#A7F3D0" />

            <rect x="8" y="94" width="38" height="14" rx="3" fill="#059669" stroke="#047857" />
            <rect x="52" y="94" width="16" height="14" rx="3" fill="#059669" stroke="#047857" />
          </g>
        </g>

        {/* --- Stacks of Coins under the character --- */}
        <g id="coin-stacks" transform="translate(48, 175)">
          {/* Left coin stack */}
          <g>
            {[0, 8, 16, 24, 32].map((y, i) => (
              <g key={i}>
                <rect x="18" y={y + 12} width="46" height="12" rx="6" fill="#059669" stroke="#047857" strokeWidth="1.5" />
                <ellipse cx="41" cy={y + 12} rx="23" ry="5" fill={i === 0 ? "#34D399" : "#10B981"} stroke="#047857" strokeWidth="1.5" />
              </g>
            ))}
          </g>

          {/* Front coin stack */}
          <g transform="translate(30, 18)">
            {[0, 8, 16, 24].map((y, i) => (
              <g key={i}>
                <rect x="25" y={y + 12} width="48" height="12" rx="6" fill="#047857" stroke="#065F46" strokeWidth="1.5" />
                <ellipse cx="49" cy={y + 12} rx="24" ry="5" fill={i === 0 ? "#10B981" : "#059669"} stroke="#065F46" strokeWidth="1.5" />
              </g>
            ))}
          </g>
        </g>

        {/* --- Character Sitting on Coins with Laptop --- */}
        <g id="character" transform="translate(85, 105)">
          {/* Hair back / bun */}
          <ellipse cx="38" cy="20" rx="8" ry="7" fill="#1E293B" />
          <circle cx="32" cy="14" r="5" fill="#1E293B" />

          {/* Head & Neck */}
          <circle cx="43" cy="25" r="9" fill="#FFDFC4" stroke="#1E293B" strokeWidth="1.8" />
          <path d="M 40 33 L 42 42" stroke="#FFDFC4" strokeWidth="4" />

          {/* Hair front */}
          <path d="M 37 17 C 43 17, 49 20, 50 25 C 47 24, 43 24, 40 27 Z" fill="#1E293B" />

          {/* Body / Torso (White shirt with clean strokes) */}
          <path d="M 36 43 L 53 43 L 58 72 L 31 72 Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" strokeLinejoin="round" />

          {/* Legs sitting on stack */}
          <path d="M 33 72 L 33 96 L 68 96" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 33 72 L 33 96 L 68 96" stroke="#059669" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Shoe */}
          <ellipse cx="72" cy="97" rx="6" ry="3.5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />

          {/* Arms holding laptop */}
          <path d="M 43 50 L 58 64 L 70 60" stroke="#FFDFC4" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 43 50 L 58 64 L 70 60" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* Laptop */}
          <g transform="translate(56, 52) rotate(15)">
            {/* Screen */}
            <rect x="0" y="0" width="26" height="18" rx="2" fill="#34D399" stroke="#047857" strokeWidth="1.5" />
            {/* Screen detail */}
            <rect x="3" y="3" width="20" height="12" rx="1" fill="#ECFDF5" />
            <line x1="6" y1="7" x2="16" y2="7" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6" y1="11" x2="20" y2="11" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
            {/* Base keyboard */}
            <path d="M -2 18 L 28 18 L 25 21 L 1 21 Z" fill="#94A3B8" stroke="#047857" strokeWidth="1.2" />
          </g>
        </g>

        {/* Floating Coin badge ($ / R$) */}
        <g transform="translate(230, 78)">
          <circle cx="15" cy="15" r="13" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
          <circle cx="15" cy="15" r="10" fill="#FDE68A" />
          <text x="15" y="19" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#92400E" fontFamily="sans-serif">$</text>
        </g>

        {/* Floating Coin badge on left */}
        <g transform="translate(50, 100)">
          <circle cx="14" cy="14" r="12" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
          <circle cx="14" cy="14" r="9" fill="#FDE68A" />
          <text x="14" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400E" fontFamily="sans-serif">R$</text>
        </g>
      </svg>
    </div>
  );
}

// Illustration 2: Fastest Payment & Cards (Woman presenting financial growth charts, money bag & coins)
export function FastestPaymentIllustration() {
  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[400px] h-[215px] sm:h-[245px] mx-auto flex items-center justify-center select-none">
      <svg
        viewBox="40 58 216 190"
        className="relative z-10 w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Floating dots menu on top left */}
        <circle cx="48" cy="76" r="2.5" fill="#1E293B" />
        <circle cx="55" cy="76" r="2.5" fill="#1E293B" />
        <circle cx="62" cy="76" r="2.5" fill="#1E293B" />

        {/* Main Presentation Board */}
        <g id="presentation-board" transform="translate(52, 85)">
          <rect x="0" y="0" width="195" height="120" rx="8" fill="#FFFFFF" stroke="#60A5FA" strokeWidth="3" />
          
          {/* Rising Chart Graphic inside Board */}
          <g transform="translate(18, 16)">
            <rect x="0" y="0" width="70" height="52" rx="4" fill="#F8FAFC" stroke="#93C5FD" strokeWidth="1.5" />
            {/* Grid lines */}
            <line x1="8" y1="42" x2="62" y2="42" stroke="#E2E8F0" strokeWidth="1" />
            <line x1="8" y1="28" x2="62" y2="28" stroke="#E2E8F0" strokeWidth="1" />
            <line x1="8" y1="14" x2="62" y2="14" stroke="#E2E8F0" strokeWidth="1" />
            {/* Rising zigzag line */}
            <path d="M 12 36 L 26 26 L 40 32 L 56 12" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Bar columns */}
            <rect x="18" y="28" width="5" height="14" fill="#BFDBFE" rx="1" />
            <rect x="32" y="32" width="5" height="10" fill="#BFDBFE" rx="1" />
            <rect x="46" y="16" width="5" height="26" fill="#3B82F6" rx="1" />
          </g>

          {/* Circular Percentage Gauges inside Board */}
          <g transform="translate(98, 46)">
            <rect x="0" y="0" width="80" height="42" rx="6" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
            {/* Dial 1 */}
            <circle cx="24" cy="21" r="13" stroke="#BFDBFE" strokeWidth="3" fill="none" />
            <circle cx="24" cy="21" r="13" stroke="#2563EB" strokeWidth="3" strokeDasharray="65 100" fill="none" />
            <text x="24" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1E40AF" fontFamily="sans-serif">78%</text>

            {/* Dial 2 */}
            <circle cx="58" cy="21" r="13" stroke="#BFDBFE" strokeWidth="3" fill="none" />
            <circle cx="58" cy="21" r="13" stroke="#2563EB" strokeWidth="3" strokeDasharray="50 100" fill="none" />
            <text x="58" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1E40AF" fontFamily="sans-serif">68%</text>
          </g>

          {/* Upper right growth chart browser window */}
          <g transform="translate(104, -20)">
            <rect x="0" y="0" width="74" height="60" rx="6" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2.5" />
            {/* Blue header with dots */}
            <rect x="0" y="0" width="74" height="14" rx="6" fill="#2563EB" />
            <circle cx="8" cy="7" r="1.8" fill="#FFFFFF" />
            <circle cx="14" cy="7" r="1.8" fill="#FFFFFF" />
            <circle cx="20" cy="7" r="1.8" fill="#FFFFFF" />
            {/* Bars */}
            <rect x="10" y="38" width="6" height="14" fill="#93C5FD" rx="1" />
            <rect x="20" y="32" width="6" height="20" fill="#93C5FD" rx="1" />
            <rect x="30" y="28" width="6" height="24" fill="#60A5FA" rx="1" />
            <rect x="40" y="22" width="6" height="30" fill="#3B82F6" rx="1" />
            <rect x="50" y="16" width="6" height="36" fill="#2563EB" rx="1" />
            <path d="M 8 36 L 18 30 L 28 26 L 38 20 L 52 14" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        </g>

        {/* --- Woman Presenter on Left --- */}
        <g id="woman-presenter" transform="translate(50, 92)">
          {/* Hair ponytail */}
          <path d="M 12 18 C 6 22, 4 30, 8 34" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
          
          {/* Head & face */}
          <circle cx="20" cy="22" r="9" fill="#FFDFC4" stroke="#1E293B" strokeWidth="1.8" />
          <path d="M 14 16 C 18 14, 25 15, 27 20 C 24 19, 21 21, 18 24 Z" fill="#1E293B" />

          {/* Royal Blue Jacket / Top */}
          <path d="M 14 36 L 27 36 L 36 78 L 10 78 Z" fill="#2563EB" stroke="#1E40AF" strokeWidth="1.8" />
          {/* Collar detail */}
          <path d="M 18 36 L 21 48 L 24 36" stroke="#FFFFFF" strokeWidth="2" fill="#FFFFFF" />

          {/* Pointer Arm extending right */}
          <path d="M 27 44 L 56 50" stroke="#2563EB" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 56 50 L 78 48" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />

          {/* Dark Trousers */}
          <path d="M 14 78 L 10 128" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" />
          <path d="M 28 78 L 32 128" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" />

          {/* Shoes */}
          <ellipse cx="8" cy="130" rx="6" ry="3" fill="#1E293B" />
          <ellipse cx="34" cy="130" rx="6" ry="3" fill="#1E293B" />
        </g>

        {/* --- Plump Money Sack with Dollar Sign --- */}
        <g id="money-sack" transform="translate(196, 172)">
          {/* Tie neck */}
          <path d="M 26 12 C 22 4, 34 4, 30 12" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2" />
          <path d="M 22 14 L 34 14" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />

          {/* Sack belly */}
          <path d="M 28 14 C 12 18, 4 36, 6 56 C 8 72, 48 72, 50 56 C 52 36, 44 18, 28 14 Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2" />
          
          {/* Currency sign on sack */}
          <text x="28" y="48" textAnchor="middle" fontSize="19" fontWeight="bold" fill="#FFFFFF" fontFamily="sans-serif">$</text>
        </g>

        {/* Gold coins stacked on right front */}
        <g id="gold-coins" transform="translate(170, 204)">
          <g transform="translate(0, 0)">
            <rect x="0" y="8" width="30" height="10" rx="5" fill="#D97706" />
            <ellipse cx="15" cy="8" rx="15" ry="6" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
            <text x="15" y="11" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#92400E" fontFamily="sans-serif">$</text>
          </g>
          <g transform="translate(16, 4)">
            <rect x="0" y="8" width="30" height="10" rx="5" fill="#D97706" />
            <ellipse cx="15" cy="8" rx="15" ry="6" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
            <text x="15" y="11" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#92400E" fontFamily="sans-serif">$</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

// Illustration 3: Safe & Secure Financial Platform (Analyst, security shield, biometrics, cards & pie chart)
export function SecurePlatformIllustration() {
  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[400px] h-[215px] sm:h-[245px] mx-auto flex items-center justify-center select-none">
      <svg
        viewBox="28 54 242 178"
        className="relative z-10 w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Floating User Avatar Badge top left */}
        <g transform="translate(42, 65)">
          <rect x="0" y="0" width="22" height="22" rx="5" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.2" />
          <circle cx="11" cy="8" r="3.5" fill="#60A5FA" />
          <path d="M 5 18 C 6 14, 16 14, 17 18 Z" fill="#60A5FA" />
        </g>

        {/* Floating percentage icon */}
        <g transform="translate(34, 135)">
          <circle cx="11" cy="11" r="11" fill="#93C5FD" opacity="0.9" />
          <text x="11" y="15" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#FFFFFF" fontFamily="sans-serif">%</text>
        </g>

        {/* Floating Dollar badge top right */}
        <g transform="translate(230, 60)">
          <circle cx="10" cy="10" r="10" fill="#DBEAFE" />
          <text x="10" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2563EB" fontFamily="sans-serif">$</text>
        </g>

        {/* --- Main Dashboard Container --- */}
        <g id="analytics-screen" transform="translate(70, 78)">
          <rect x="0" y="0" width="175" height="115" rx="12" fill="#FFFFFF" stroke="#60A5FA" strokeWidth="3" />

          {/* Dark Header/Card inside dashboard with Pie Chart */}
          <g transform="translate(18, 14)">
            <rect x="0" y="0" width="138" height="85" rx="8" fill="#1E293B" />
            
            {/* Pie Chart */}
            <g transform="translate(38, 42)">
              <path d="M 0 0 L 0 -22 A 22 22 0 0 1 22 0 Z" fill="#3B82F6" />
              <path d="M 0 0 L 22 0 A 22 22 0 0 1 -12 18 Z" fill="#93C5FD" />
              <path d="M 0 0 L -12 18 A 22 22 0 0 1 0 -22 Z" fill="#FFFFFF" />
            </g>

            {/* Stats bars beside pie chart */}
            <g transform="translate(74, 28)">
              <rect x="0" y="0" width="50" height="8" rx="4" fill="#FFFFFF" />
              <rect x="0" y="14" width="38" height="8" rx="4" fill="#64748B" />
              <rect x="0" y="28" width="46" height="8" rx="4" fill="#3B82F6" />
            </g>
          </g>

          {/* Small info tag on top left */}
          <g transform="translate(-14, -6)">
            <rect x="0" y="0" width="38" height="42" rx="6" fill="#1E293B" stroke="#2563EB" strokeWidth="2" />
            <circle cx="12" cy="12" r="5" fill="#FFFFFF" />
            <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1E293B" fontFamily="sans-serif">i</text>
            <line x1="8" y1="26" x2="30" y2="26" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="32" x2="24" y2="32" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>

        {/* --- Cash Slot / Platform --- */}
        <g id="security-tray" transform="translate(72, 185)">
          <ellipse cx="80" cy="14" rx="85" ry="14" fill="#EFF6FF" />
          <rect x="0" y="0" width="165" height="24" rx="8" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
          {/* Cash bills popping out */}
          <g transform="translate(54, -6)">
            <rect x="0" y="0" width="24" height="14" rx="2" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
            <circle cx="12" cy="7" r="3" fill="#2563EB" />
          </g>
          <g transform="translate(84, -6)">
            <rect x="0" y="0" width="24" height="14" rx="2" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
            <circle cx="12" cy="7" r="3" fill="#2563EB" />
          </g>
        </g>

        {/* --- Analyst / Security Specialist in Royal Blue on Right --- */}
        <g id="analyst" transform="translate(202, 88)">
          {/* Head & hair */}
          <circle cx="26" cy="22" r="9" fill="#FFDFC4" stroke="#1E293B" strokeWidth="1.8" />
          <path d="M 18 18 C 21 14, 30 14, 34 18 C 34 22, 33 24, 33 24 C 30 22, 22 22, 18 24 Z" fill="#1E293B" />
          {/* Beard / hair detail */}
          <path d="M 23 28 C 25 30, 27 30, 29 28" stroke="#1E293B" strokeWidth="1.8" fill="none" />

          {/* Royal Blue Suit / Blazer */}
          <path d="M 16 36 L 36 36 L 44 82 L 8 82 Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1.8" />
          {/* White shirt & black tie */}
          <polygon points="26,36 24,48 28,48" fill="#FFFFFF" />
          <polygon points="25,38 27,38 27,52 25,52" fill="#1E293B" />

          {/* Left arm holding secure folder/tablet */}
          <rect x="18" y="52" width="22" height="28" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
          <line x1="22" y1="60" x2="36" y2="60" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
          <line x1="22" y1="66" x2="32" y2="66" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />

          {/* Right Arm pointing towards screen */}
          <path d="M 16 42 L -6 48 L -14 54" stroke="#2563EB" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="-14" cy="54" r="3.5" fill="#FFDFC4" />

          {/* Dark Trousers */}
          <path d="M 14 82 L 10 132" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" />
          <path d="M 32 82 L 34 132" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" />

          {/* Shoes */}
          <ellipse cx="8" cy="134" rx="6" ry="3" fill="#1E293B" />
          <ellipse cx="36" cy="134" rx="6" ry="3" fill="#1E293B" />
        </g>

        {/* Stack of Gold Coins on bottom right */}
        <g id="gold-coins-right" transform="translate(236, 192)">
          {[0, 6, 12].map((y, i) => (
            <g key={i}>
              <rect x="0" y={y + 6} width="28" height="8" rx="4" fill="#D97706" />
              <ellipse cx="14" cy={y + 6} rx="14" ry="5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.2" />
              <text x="14" y={y + 9} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#92400E" fontFamily="sans-serif">$</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
