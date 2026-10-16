import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#00C48C] hover:bg-[#00B07D] active:bg-[#009B6E] text-white shadow-xs hover:shadow-sm focus-visible:ring-[#00C48C] border border-transparent',
  secondary:
    'bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 active:bg-slate-300 dark:active:bg-white/20 text-slate-800 dark:text-slate-100 border border-transparent focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500',
  danger:
    'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs hover:shadow-sm focus-visible:ring-rose-500 border border-transparent',
  ghost:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 active:bg-slate-200 dark:active:bg-white/15 text-slate-700 dark:text-slate-200 border border-transparent focus-visible:ring-slate-400',
  outline:
    'bg-transparent border border-slate-300 dark:border-white/20 hover:bg-slate-100/70 dark:hover:bg-white/5 active:bg-slate-200/60 dark:active:bg-white/10 text-slate-700 dark:text-slate-200 focus-visible:ring-[#00C48C]',
};

const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'min-h-[2rem] h-auto sm:h-8 py-1.5 px-2.5 sm:px-3 text-xs gap-1.5 leading-tight',
  md: 'min-h-[2.5rem] h-auto sm:h-10 py-2 px-3.5 sm:px-4 text-xs sm:text-sm gap-2 leading-tight',
  lg: 'min-h-[2.75rem] h-auto sm:h-12 py-2.5 px-3.5 sm:px-5 text-xs sm:text-sm md:text-base gap-2 sm:gap-2.5 leading-tight',
};

const iconSizes: Record<'sm' | 'md' | 'lg', number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

function normalizeSize(size?: ButtonSize): 'sm' | 'md' | 'lg' {
  if (size === 'small' || size === 'sm') return 'sm';
  if (size === 'large' || size === 'lg') return 'lg';
  return 'md';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      type = 'button',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isBusy = isLoading || loading;
    const isDisabled = disabled || isBusy;
    const normalizedSize = normalizeSize(size);

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isBusy ? 'true' : undefined}
        aria-disabled={isDisabled ? 'true' : undefined}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center font-semibold rounded-lg min-w-0 max-w-full text-center',
          'transition-all duration-150 ease-in-out cursor-pointer select-none',
          // Focus ring for accessibility
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1C1C1E]',
          // Active pressed scale feedback
          'active:scale-[0.98]',
          // Disabled state
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100 disabled:shadow-none',
          // Full width
          fullWidth ? 'w-full' : '',
          // Size
          sizeStyles[normalizedSize],
          // Variant
          variantStyles[variant],
          // Custom class overrides
          className
        )}
        {...props}
      >
        {isBusy ? (
          <>
            <Loader2
              size={iconSizes[normalizedSize]}
              className="animate-spin shrink-0"
              aria-hidden="true"
            />
            {children && <span className="inline-flex items-center text-center leading-snug">{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>}
            {children && <span className="inline-flex items-center text-center leading-snug">{children}</span>}
            {rightIcon && <span className="inline-flex shrink-0 items-center">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
