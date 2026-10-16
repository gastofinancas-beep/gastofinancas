import React, { useRef, useCallback, CSSProperties } from 'react';

export interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum tilt angle in degrees (default: 14) */
  tiltLimit?: number;
  /** Scale factor on hover (optional) */
  scale?: number;
  /** Perspective distance in pixels (default: 1000) */
  perspective?: number;
  /** Card content */
  children: React.ReactNode;
  /** Additional CSS classes for outer hit area */
  className?: string;
  /** Additional CSS classes for inner tilting card */
  cardClassName?: string;
  /** Additional inline styles */
  style?: CSSProperties;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Transitions.dev — Card hover tilt component
 *
 * Implements pointer-tracked 3D card tilt with specular glare overlay.
 * Outer `.t-tilt` tracks the pointer and updates custom properties:
 * --tilt-rx, --tilt-ry, --tilt-gx, --tilt-gy
 */
export function TiltCard({
  tiltLimit = 14,
  perspective = 1000,
  children,
  className = '',
  cardClassName = '',
  style,
  disabled = false,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  ...restProps
}: TiltCardProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateTilt = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;
      const outer = outerRef.current;
      const card = cardRef.current;
      if (!outer || !card) return;

      const rect = outer.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

      const px = x / rect.width;
      const py = y / rect.height;

      const gxPct = (px * 100).toFixed(2);
      const gyPct = (py * 100).toFixed(2);

      // Card tilts toward pointer via rotateX/rotateY fed from JS
      const rxDeg = ((0.5 - py) * tiltLimit * 2).toFixed(2);
      const ryDeg = ((px - 0.5) * tiltLimit * 2).toFixed(2);

      outer.style.setProperty('--tilt-rx', `${rxDeg}deg`);
      outer.style.setProperty('--tilt-ry', `${ryDeg}deg`);
      outer.style.setProperty('--tilt-gx', `${gxPct}%`);
      outer.style.setProperty('--tilt-gy', `${gyPct}%`);

      outer.classList.add('is-hover');
      outer.classList.add('is-tilting');
      card.classList.add('is-tilting');

      if (tiltingTimerRef.current) clearTimeout(tiltingTimerRef.current);
      tiltingTimerRef.current = setTimeout(() => {
        outer.classList.remove('is-tilting');
        card.classList.remove('is-tilting');
      }, 120);
    },
    [disabled, tiltLimit]
  );

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      const outer = outerRef.current;
      if (outer) {
        outer.classList.add('is-hover');
      }
      onPointerEnter?.(e);
    },
    [disabled, onPointerEnter]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      updateTilt(e.clientX, e.clientY);
      onPointerMove?.(e);
    },
    [updateTilt, onPointerMove]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const outer = outerRef.current;
      const card = cardRef.current;
      if (outer) {
        if (tiltingTimerRef.current) clearTimeout(tiltingTimerRef.current);
        outer.classList.remove('is-hover');
        outer.classList.remove('is-tilting');
        if (card) card.classList.remove('is-tilting');

        outer.style.setProperty('--tilt-rx', '0deg');
        outer.style.setProperty('--tilt-ry', '0deg');
      }
      onPointerLeave?.(e);
    },
    [onPointerLeave]
  );

  const customStyle: CSSProperties = {
    ...(perspective ? { ['--tilt-perspective' as any]: `${perspective}px` } : {}),
    ...style,
  };

  return (
    <div
      ref={outerRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={(e) => {
        updateTilt(e.clientX, e.clientY);
        onPointerDown?.(e);
      }}
      onPointerUp={onPointerUp}
      onPointerCancel={(e) => {
        handlePointerLeave(e);
        onPointerCancel?.(e);
      }}
      style={customStyle}
      className={`t-tilt select-none relative ${className}`}
      {...restProps}
    >
      <div ref={cardRef} className={`t-tilt-card w-full h-full ${cardClassName}`}>
        {children}
        <div className="t-tilt-glare" aria-hidden="true" />
      </div>
    </div>
  );
}

export default TiltCard;
