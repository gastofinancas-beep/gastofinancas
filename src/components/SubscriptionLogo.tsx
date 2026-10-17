import React from 'react';
import { 
  Tv, 
  Music, 
  Sparkles, 
  Gamepad2, 
  Cloud, 
  Layers, 
  GraduationCap, 
  HeartPulse, 
  CreditCard as DefaultIcon,
  Bot,
  BrainCircuit,
  FileText,
  Video,
  BookOpen
} from 'lucide-react';
import { SubscriptionCategory } from '../types';
import { findBrandIcon } from '../utils/brandIcons';

interface SubscriptionLogoProps {
  serviceKey?: string;
  category?: SubscriptionCategory;
  name?: string;
  size?: number;
  className?: string;
}

export function SubscriptionLogo({
  serviceKey = '',
  category = 'outros',
  name = '',
  size = 48,
  className = '',
}: SubscriptionLogoProps) {
  const normalizedKey = (serviceKey || name.toLowerCase().trim()).replace(/[^a-z0-9]/g, '');
  const borderRadius = Math.round(size * 0.28); // Apple squircle ratio

  // 1. Spotify (Green circle with sound arcs)
  if (normalizedKey.includes('spotify')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-[#1DB954] flex items-center justify-center text-black shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title="Spotify"
      >
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.496 9.722 1.115.294.18.386.562.207.855zm1.227-2.73c-.226.367-.708.483-1.075.257-2.69-1.653-6.79-2.131-9.97-1.165-.413.125-.85-.11-1.07-.423-.125-.413.11-.85.423-1.07 3.633-1.103 8.163-.568 11.235 1.325.367.226.483.708.257 1.076zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.494.15-1.02-.128-1.17-.622-.15-.494.128-1.02.622-1.17 3.535-1.073 9.404-.87 13.13 1.344.444.264.59.838.327 1.282-.264.444-.838.59-1.282.327z" />
        </svg>
        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[inherit] pointer-events-none" />
      </div>
    );
  }

  // 2. ChatGPT / OpenAI (Teal rosette)
  if (normalizedKey.includes('chatgpt') || normalizedKey.includes('openai')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-[#10A37F] flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title="ChatGPT"
      >
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 0 1 7.07 17.07l-1.41-1.41A8 8 0 0 0 12 4V2z" />
          <path d="M22 12a10 10 0 0 1-17.07 7.07l1.41-1.41A8 8 0 0 0 20 12h2z" />
          <path d="M12 22a10 10 0 0 1-7.07-17.07l1.41 1.41A8 8 0 0 0 12 20v2z" />
          <path d="M2 12a10 10 0 0 1 17.07-7.07l-1.41 1.41A8 8 0 0 0 4 12H2z" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
        <div className="absolute inset-0 ring-1 ring-inset ring-white/15 rounded-[inherit] pointer-events-none" />
      </div>
    );
  }

  // 3. Netflix (Dark background with bold red N)
  if (normalizedKey.includes('netflix')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-[#141414] flex items-center justify-center text-[#E50914] shrink-0 shadow-xs border border-white/10 relative overflow-hidden ${className}`}
        title="Netflix"
      >
        <span className="font-bold tracking-tighter" style={{ fontSize: size * 0.54, fontFamily: 'system-ui, sans-serif' }}>
          N
        </span>
      </div>
    );
  }

  // 4. Apple (Apple One, iCloud, Apple Music, Apple TV)
  if (normalizedKey.includes('apple') || normalizedKey.includes('icloud')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-xs border border-white/10 dark:border-black/10 relative overflow-hidden ${className}`}
        title="Apple"
      >
        <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.06 1.7-0.93 2.73 1.01.08 2.03-.48 2.65-1.23z" />
        </svg>
      </div>
    );
  }

  // 5. Globoplay (Iconic multi-color gradient loop)
  if (normalizedKey.includes('globoplay') || normalizedKey.includes('globo')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/15 flex items-center justify-center shrink-0 shadow-xs p-1.5 relative overflow-hidden ${className}`}
        title="Globoplay"
      >
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-pink-500 via-amber-400 to-sky-400 p-[2.5px] flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500" />
          </div>
        </div>
      </div>
    );
  }

  // 6. PlayStation (PS Plus)
  if (normalizedKey.includes('playstation') || normalizedKey.includes('psplus') || normalizedKey.includes('ps5')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-[#00439C] flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title="PlayStation"
      >
        <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.7 15.3l3.6 1.3V5.5l-3.6 1.2v8.6zm5.8-9.8v9.8l2.6-.9V7.9l-2.6-2.4zM2.5 17.8l5.2-1.8v-2.3L2.5 15.4v2.4zm14.8-4.1v2.3l4.2 1.5v-2.4l-4.2-1.4z" />
          <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // 7. Amazon Prime (Cyan smile arrow)
  if (normalizedKey.includes('amazon') || normalizedKey.includes('prime')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-[#00A8E1] flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title="Amazon Prime"
      >
        <span className="font-bold text-white lowercase tracking-tight" style={{ fontSize: size * 0.44 }}>
          prime
        </span>
      </div>
    );
  }

  // 8. Adobe Creative Cloud (Rainbow swirl)
  if (normalizedKey.includes('adobe') || normalizedKey.includes('creativecloud')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-gradient-to-tr from-red-500 via-purple-500 to-amber-400 flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title="Adobe"
      >
        <div className="w-3/4 h-3/4 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/40">
          <span className="font-bold text-white uppercase text-[11px] tracking-tight">Ai</span>
        </div>
      </div>
    );
  }

  // 9. YouTube Premium (Red with white play)
  if (normalizedKey.includes('youtube')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-[#FF0000] flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title="YouTube Premium"
      >
        <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 21c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 3c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
        </svg>
      </div>
    );
  }

  // 10. Disney+
  if (normalizedKey.includes('disney')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-[#113CCF] flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title="Disney+"
      >
        <span className="font-bold italic tracking-tighter" style={{ fontSize: size * 0.42 }}>
          D+
        </span>
      </div>
    );
  }

  // 11. Max / HBO Max
  if (normalizedKey.includes('max') || normalizedKey.includes('hbo')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-[#002BE7] flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title="Max"
      >
        <span className="font-bold tracking-widest text-white uppercase" style={{ fontSize: size * 0.34 }}>
          MAX
        </span>
      </div>
    );
  }

  // 12. Xbox / Game Pass
  if (normalizedKey.includes('xbox') || normalizedKey.includes('gamepass')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-[#107C10] flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title="Xbox Game Pass"
      >
        <Gamepad2 size={size * 0.54} className="stroke-[2.2]" />
      </div>
    );
  }

  // 13. Canva
  if (normalizedKey.includes('canva')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-gradient-to-br from-[#00C4CC] to-[#7D2AE8] flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title="Canva"
      >
        <span className="font-serif italic font-bold" style={{ fontSize: size * 0.5 }}>
          C
        </span>
      </div>
    );
  }

  // 14. Claude / Anthropic
  if (normalizedKey.includes('claude') || normalizedKey.includes('anthropic')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-[#D97706] flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title="Claude"
      >
        <BrainCircuit size={size * 0.54} className="stroke-[2.2]" />
      </div>
    );
  }

  // 15. Notion
  if (normalizedKey.includes('notion')) {
    return (
      <div 
        style={{ width: size, height: size, borderRadius }} 
        className={`bg-black text-white flex items-center justify-center shrink-0 shadow-xs border border-white/10 relative overflow-hidden ${className}`}
        title="Notion"
      >
        <span className="font-serif font-bold" style={{ fontSize: size * 0.52 }}>
          N
        </span>
      </div>
    );
  }

  // Logo oficial da marca (Simple Icons), quando existir
  const brand = findBrandIcon(normalizedKey);
  if (brand) {
    const lightBg = brand.luminance > 0.72;
    return (
      <div
        style={{ width: size, height: size, borderRadius, backgroundColor: `#${brand.hex}` }}
        className={`flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title={brand.title}
      >
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill={lightBg ? '#111' : '#fff'} aria-hidden="true">
          <path d={brand.path} />
        </svg>
        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[inherit] pointer-events-none" />
      </div>
    );
  }

  // Fallback by Category with refined Apple palette
  const categoryIcons: Record<SubscriptionCategory, React.ReactNode> = {
    streaming: <Tv size={size * 0.48} className="text-white stroke-[2.2]" />,
    musica: <Music size={size * 0.48} className="text-white stroke-[2.2]" />,
    ia: <Sparkles size={size * 0.48} className="text-white stroke-[2.2]" />,
    jogos: <Gamepad2 size={size * 0.48} className="text-white stroke-[2.2]" />,
    nuvem: <Cloud size={size * 0.48} className="text-white stroke-[2.2]" />,
    produtividade: <Layers size={size * 0.48} className="text-white stroke-[2.2]" />,
    educacao: <GraduationCap size={size * 0.48} className="text-white stroke-[2.2]" />,
    saude: <HeartPulse size={size * 0.48} className="text-white stroke-[2.2]" />,
    outros: <DefaultIcon size={size * 0.48} className="text-white stroke-[2.2]" />,
  };

  const categoryBg: Record<SubscriptionCategory, string> = {
    streaming: 'bg-gradient-to-br from-rose-500 to-rose-600',
    musica: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    ia: 'bg-gradient-to-br from-violet-600 to-indigo-700',
    jogos: 'bg-gradient-to-br from-purple-600 to-fuchsia-600',
    nuvem: 'bg-gradient-to-br from-sky-500 to-blue-600',
    produtividade: 'bg-gradient-to-br from-blue-600 to-indigo-600',
    educacao: 'bg-gradient-to-br from-amber-500 to-orange-600',
    saude: 'bg-gradient-to-br from-pink-500 to-rose-500',
    outros: 'bg-gradient-to-br from-slate-600 to-slate-700',
  };

  return (
    <div 
      style={{ width: size, height: size, borderRadius }} 
      className={`${categoryBg[category] || 'bg-slate-700'} flex items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden ${className}`}
      title={name || 'Assinatura'}
    >
      {categoryIcons[category] || <DefaultIcon size={size * 0.48} />}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/15 rounded-[inherit] pointer-events-none" />
    </div>
  );
}
