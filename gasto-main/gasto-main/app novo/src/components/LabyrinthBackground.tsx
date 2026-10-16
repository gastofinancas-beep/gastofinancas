import React from 'react';

interface LabyrinthBackgroundProps {
  variant?: 'green' | 'blue';
  className?: string;
}

export function LabyrinthBackground({ variant = 'green', className = '' }: LabyrinthBackgroundProps) {
  // Brand green tones: vibrant emerald like the image, but in Gastô's signature green
  const isGreen = variant === 'green';

  const baseGradient = isGreen
    ? 'from-[#059669] via-[#047857] to-[#065f46]' // Rich vibrant emerald
    : 'from-[#1351FE] via-[#0047E0] to-[#0036B8]'; // Electric blue like the reference photo

  const strokeColor = isGreen
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.14)';

  const secondaryStrokeColor = isGreen
    ? 'rgba(52, 211, 153, 0.15)'
    : 'rgba(96, 165, 250, 0.15)';

  return (
    <div className={`absolute inset-0 overflow-hidden bg-linear-to-br ${baseGradient} ${className}`}>
      {/* Seamless Geometric Maze / Labyrinth Pattern rotated 45 degrees */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'contrast(1.05)' }}
      >
        <defs>
          <pattern
            id="geometric-labyrinth"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            {/* Primary labyrinth meanders */}
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
                M 20,-10 V 0
                M 20,120 V 130
              "
              fill="none"
              stroke={strokeColor}
              strokeWidth="11"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            {/* Parallel accent lines for high density like the photo */}
            <path
              d="
                M -10,0 H 130
                M 0,-10 V 130
                M 120,-10 V 130
                M -10,120 H 130
              "
              fill="none"
              stroke={secondaryStrokeColor}
              strokeWidth="3.5"
              strokeDasharray="18 12"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geometric-labyrinth)" />
      </svg>

      {/* Subtle vignette / center glow to make center logo pop */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.08) 0%, transparent 65%, rgba(0,0,0,0.2) 100%)'
        }}
      />
    </div>
  );
}
