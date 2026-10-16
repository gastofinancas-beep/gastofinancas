"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { cn } from "../lib/utils";

/**
 * Formats a numeric value into Brazilian Real (BRL) currency string
 * with customizable prefix and suffix.
 */
export function formatBrazilianCurrency(
  val: number,
  prefix = "R$ ",
  suffix = "",
  decimals = 2
): string {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(absVal);

  if (prefix.startsWith("+")) {
    const cleanPrefix = prefix.slice(1);
    return isNegative
      ? `-${cleanPrefix}${formatted}${suffix}`
      : `+${cleanPrefix}${formatted}${suffix}`;
  }
  if (prefix.startsWith("-")) {
    const cleanPrefix = prefix.slice(1);
    return `-${cleanPrefix}${formatted}${suffix}`;
  }

  return isNegative
    ? `-${prefix}${formatted}${suffix}`
    : `${prefix}${formatted}${suffix}`;
}

/**
 * Splits formatted BRL currency into sign, integers, and decimals
 * for stylized multi-sized typography.
 */
export function formatSplitBRL(val: number, decimals = 2) {
  const isNegative = val < 0;
  const abs = Math.abs(val);
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(abs);
  const [integers, decs] = formatted.split(",");
  return {
    isNegative,
    integers: integers || "0",
    decimals: decs || "00",
  };
}

export interface CountUpCurrencyProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  delay?: number;
  isVisible?: boolean;
  animateOnMount?: boolean;
}

/**
 * CountUpCurrency: A fluid, hardware-accelerated count-up currency component
 * powered by motion's `animate` and `useMotionValue`.
 * Triggers smooth interpolation whenever the value changes or is revealed.
 */
export function CountUpCurrency({
  value,
  prefix = "R$ ",
  suffix = "",
  decimals = 2,
  duration = 0.75,
  delay = 0,
  className = "",
  isVisible = true,
  animateOnMount = true,
  ...props
}: CountUpCurrencyProps) {
  const reduced = useReducedMotion() ?? false;
  const numValue = Number.isFinite(value) ? value : 0;

  const prevValRef = useRef<number>(animateOnMount ? 0 : numValue);
  const wasVisibleRef = useRef<boolean>(isVisible);
  const motionVal = useMotionValue(animateOnMount ? 0 : numValue);

  const [formattedText, setFormattedText] = useState(() => {
    if (!isVisible) return "••••••";
    return formatBrazilianCurrency(
      animateOnMount ? 0 : numValue,
      prefix,
      suffix,
      decimals
    );
  });

  useEffect(() => {
    if (!isVisible) {
      wasVisibleRef.current = false;
      setFormattedText("••••••");
      return;
    }

    const startVal = !wasVisibleRef.current ? 0 : motionVal.get();
    wasVisibleRef.current = true;
    motionVal.set(startVal);

    if (reduced || duration === 0) {
      motionVal.set(numValue);
      setFormattedText(formatBrazilianCurrency(numValue, prefix, suffix, decimals));
      prevValRef.current = numValue;
      return;
    }

    const anim = animate(motionVal, numValue, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1], // Apple-style smooth easeOutExpo
      onUpdate: (latest) => {
        setFormattedText(formatBrazilianCurrency(latest, prefix, suffix, decimals));
      },
      onComplete: () => {
        prevValRef.current = numValue;
        setFormattedText(formatBrazilianCurrency(numValue, prefix, suffix, decimals));
      },
    });

    return () => anim.stop();
  }, [numValue, isVisible, duration, delay, prefix, suffix, decimals, reduced]);

  return (
    <span
      className={cn("tabular-nums inline-block select-none", className)}
      {...props}
    >
      {formattedText}
    </span>
  );
}

export interface CountUpHeroBalanceProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  isVisible?: boolean;
  isDarkGreenCard?: boolean;
  duration?: number;
}

/**
 * CountUpHeroBalance: Specifically designed for hero balance displays (e.g. Dashboard).
 * Splits the currency symbol, integer portion, and decimals into synchronized
 * motion count-up typography.
 */
export function CountUpHeroBalance({
  value,
  isVisible = true,
  isDarkGreenCard = false,
  duration = 0.85,
  className = "",
  ...props
}: CountUpHeroBalanceProps) {
  const reduced = useReducedMotion() ?? false;
  const numValue = Number.isFinite(value) ? value : 0;

  const prevValRef = useRef<number>(0);
  const wasVisibleRef = useRef<boolean>(isVisible);
  const motionVal = useMotionValue(0);

  const [parts, setParts] = useState(() => formatSplitBRL(0));

  useEffect(() => {
    if (!isVisible) {
      wasVisibleRef.current = false;
      return;
    }

    const startVal = !wasVisibleRef.current ? 0 : motionVal.get();
    wasVisibleRef.current = true;
    motionVal.set(startVal);

    if (reduced || duration === 0) {
      motionVal.set(numValue);
      setParts(formatSplitBRL(numValue));
      prevValRef.current = numValue;
      return;
    }

    const anim = animate(motionVal, numValue, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setParts(formatSplitBRL(latest));
      },
      onComplete: () => {
        prevValRef.current = numValue;
        setParts(formatSplitBRL(numValue));
      },
    });

    return () => anim.stop();
  }, [numValue, isVisible, duration, reduced]);

  return (
    <div
      className={cn(
        "inline-flex items-baseline font-bold tracking-tight transition-all duration-500 ease-out transform",
        isDarkGreenCard ? "text-white" : "text-slate-900 dark:text-white",
        !isVisible
          ? "filter blur-[10px] sm:blur-[12px] opacity-40 select-none pointer-events-none scale-[0.98]"
          : "filter blur-0 opacity-100 scale-100",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "text-lg sm:text-2xl font-bold mr-1.5 tracking-normal self-baseline",
          isDarkGreenCard ? "text-emerald-200/90" : "text-slate-400 dark:text-slate-500"
        )}
      >
        {parts.isNegative ? "-R$" : "R$"}
      </span>
      <span
        className={cn(
          "text-4xl sm:text-5xl md:text-6xl font-black tabular-nums tracking-tight",
          isDarkGreenCard ? "text-white" : "text-slate-900 dark:text-white"
        )}
      >
        {!isVisible ? "••••" : parts.integers}
      </span>
      <span
        className={cn(
          "text-2xl sm:text-3xl md:text-4xl font-extrabold tabular-nums tracking-tight self-baseline ml-0.5",
          isDarkGreenCard ? "text-white" : "text-slate-700 dark:text-slate-200"
        )}
      >
        {!isVisible ? ",••" : `,${parts.decimals}`}
      </span>
    </div>
  );
}

/**
 * AnimatedCurrency: Drop-in replacement for currency values with count-up animation.
 */
export function AnimatedCurrency({
  value,
  prefix = "R$ ",
  decimals = 2,
  duration = 0.75,
  className,
  isVisible = true,
  ...props
}: {
  value: number;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  isVisible?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <CountUpCurrency
      value={value}
      prefix={prefix}
      decimals={decimals}
      duration={duration}
      className={className}
      isVisible={isVisible}
      {...props}
    />
  );
}

export interface AnimatedCounterProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "prefix"> {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  isVisible?: boolean;
  separator?: string;
  decimalSeparator?: string;
  grouping?: string;
  padStart?: number;
}

/**
 * AnimatedCounter: Drop-in counter component supporting count-up animation.
 */
export function AnimatedCounter({
  value,
  decimals = 0,
  duration = 0.75,
  prefix,
  suffix,
  className,
  isVisible = true,
  ...props
}: AnimatedCounterProps) {
  if (!isVisible) {
    return (
      <span
        className={cn(
          "inline-flex items-center tabular-nums select-none",
          className
        )}
        {...props}
      >
        {prefix != null && <span>{prefix}</span>}
        <span>••••••</span>
        {suffix != null && <span>{suffix}</span>}
      </span>
    );
  }

  const prefixStr = typeof prefix === "string" ? prefix : "";
  const suffixStr = typeof suffix === "string" ? suffix : "";

  return (
    <CountUpCurrency
      value={value}
      prefix={prefixStr}
      suffix={suffixStr}
      decimals={decimals}
      duration={duration}
      className={className}
      isVisible={isVisible}
      {...props}
    />
  );
}

export default AnimatedCounter;
