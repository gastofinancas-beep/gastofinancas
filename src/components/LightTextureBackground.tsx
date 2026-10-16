import React from 'react';

interface LightTextureBackgroundProps {
  className?: string;
}

export function LightTextureBackground({ className = '' }: LightTextureBackgroundProps) {
  return (
    <div 
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none bg-linear-to-b from-[#FFFFFF] via-[#F8FAF9] to-[#F1F6F3] ${className}`}
      aria-hidden="true"
    >
      {/* 1. Subtle Ambient Radial Glows */}
      <div 
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-60 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(52, 211, 153, 0.05) 45%, transparent 70%)'
        }}
      />
      <div 
        className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-50 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(5, 150, 105, 0.08) 0%, rgba(16, 185, 129, 0.03) 50%, transparent 70%)'
        }}
      />

      {/* 2. Delicate Architectural Dot Matrix Pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-70"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="subtle-dot-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            {/* Primary soft slate dots */}
            <circle cx="2" cy="2" r="1" fill="#0f172a" fillOpacity="0.04" />
            {/* Secondary tiny emerald accent dots */}
            <circle cx="14" cy="14" r="0.75" fill="#059669" fillOpacity="0.06" />
          </pattern>

          {/* 3. Whispering Faint Geometric Labyrinth Motif (Matching Screen 1 branding, whisper-light) */}
          <pattern
            id="faint-labyrinth"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <path
              d="
                M -10,20 H 40 V 60 H 20 V 100 H 60 V 80 H 40 V 40 H 80 V 20 H 130
                M 60,-10 V 20 H 80 V -10
                M 100,-10 V 40 H 130
                M -10,40 H 0
                M 60,130 V 100 H 80 V 130
                M 100,130 V 80 H 130
                M -10,80 H 0
                M 80,60 H 100 V 60
                M 100,60 V 80 H 120
                M -10,60 H 0
              "
              fill="none"
              stroke="#059669"
              strokeWidth="5"
              strokeOpacity="0.03"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </pattern>
        </defs>

        {/* Render faint labyrinth texture */}
        <rect width="100%" height="100%" fill="url(#faint-labyrinth)" />
        {/* Render dot grid on top */}
        <rect width="100%" height="100%" fill="url(#subtle-dot-grid)" />
      </svg>

      {/* 4. Soft Vignette Overlay to focus attention on content */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%, rgba(240, 248, 244, 0.35) 100%)'
        }}
      />
    </div>
  );
}
