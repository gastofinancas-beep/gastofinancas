import React, { useState } from 'react';
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
import { findBrandIcon, findBrandDomain } from '../utils/brandIcons';
import { POPULAR_SUBSCRIPTION_PRESETS } from '../data/subscriptionPresets';

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
  const [sourceIndex, setSourceIndex] = useState(0);
  const normalizedKey = (serviceKey || name.toLowerCase().trim()).replace(/[^a-z0-9]/g, '');
  const nameKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const borderRadius = Math.round(size * 0.28); // Apple squircle ratio

  // Reinicia as tentativas quando o serviço muda
  React.useEffect(() => setSourceIndex(0), [normalizedKey, nameKey]);

  // 1. Logo oficial da marca embutido (Simple Icons), por chave do serviço ou pelo nome digitado
  const brand = findBrandIcon(normalizedKey) || (nameKey ? findBrandIcon(nameKey) : null);
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

  // 2. Logo da marca pela API de logos do Hunter (sem chave), com ícone do site como reserva
  const domain = findBrandDomain(normalizedKey) || (nameKey ? findBrandDomain(nameKey) : null);
  const iconSources = domain
    ? [
        `https://logos.hunter.io/${domain}`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      ]
    : [];
  if (domain && sourceIndex < iconSources.length) {
    return (
      <div
        style={{ width: size, height: size, borderRadius }}
        className={`bg-white flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden ${className}`}
        title={name || domain}
      >
        <img
          src={iconSources[sourceIndex]}
          alt={name || domain}
          style={{ width: size * 0.66, height: size * 0.66 }}
          className="object-contain pointer-events-none select-none"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setSourceIndex((i) => i + 1)}
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[inherit] pointer-events-none" />
      </div>
    );
  }

  // 3. Nome desconhecido: inicial sobre a cor do serviço (ou uma cor estável gerada do nome)
  const initial = (name || serviceKey).trim().charAt(0).toUpperCase();
  if (initial && /[A-Z0-9]/.test(initial)) {
    const preset = POPULAR_SUBSCRIPTION_PRESETS.find((p) => normalizedKey === p.serviceKey);
    const MONOGRAM_COLORS = ['#5B6CFF', '#00A3A3', '#E4572E', '#8E5BD9', '#2E9E5B', '#D6457D', '#3D7EDB', '#C27A1A'];
    let hash = 0;
    for (const ch of normalizedKey) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    const bg = preset?.color || MONOGRAM_COLORS[hash % MONOGRAM_COLORS.length];
    const r = parseInt(bg.slice(1, 3), 16);
    const g = parseInt(bg.slice(3, 5), 16);
    const b = parseInt(bg.slice(5, 7), 16);
    const light = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72;
    return (
      <div
        style={{ width: size, height: size, borderRadius, backgroundColor: bg, color: light ? '#111' : '#fff', fontSize: size * 0.44 }}
        className={`flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden font-bold leading-none select-none ${className}`}
        title={name || 'Assinatura'}
      >
        {initial}
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
