import React from 'react';
import { motion } from 'motion/react';

interface CarSunsetIllustrationProps {
  className?: string;
}

export function CarSunsetIllustration({ className = '' }: CarSunsetIllustrationProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Círculo do Sol / Sunset Backdrop */}
      <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
        
        {/* Glow suave ao redor */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-300/40 via-amber-400/20 to-orange-500/0 blur-xl pointer-events-none" />

        {/* Disco Principal do Sol com Gradiente Dourado / Pôr do Sol */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-[#FCD34D] via-[#FBBF24] to-[#F59E0B] shadow-[inset_0_4px_20px_rgba(255,255,255,0.6)] flex items-center justify-center relative overflow-hidden">
          {/* Linhas horizontais sutis do pôr do sol */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-white/20 rounded-full mx-4" />
          <div className="absolute top-12 left-0 right-0 h-1.5 bg-white/25 rounded-full mx-2" />
          <div className="absolute top-20 left-0 right-0 h-1 bg-white/20 rounded-full mx-6" />
        </div>

        {/* Asas / Brilhos horizontais estilizados atrás do carro (como no mockup) */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex items-center justify-between px-1 pointer-events-none opacity-60">
          <div className="w-8 h-4 bg-amber-100/60 dark:bg-white/10 rounded-full blur-[1px]" />
          <div className="w-8 h-4 bg-amber-100/60 dark:bg-white/10 rounded-full blur-[1px]" />
        </div>

        {/* Carro Frontal Estilizado em Vetor SVG de Alta Qualidade */}
        <motion.div 
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="absolute -bottom-2 z-10 w-40 sm:w-48"
        >
          <svg viewBox="0 0 200 130" className="w-full h-auto drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)]">
            {/* Sombra dos Pneus no Asfalto */}
            <ellipse cx="100" cy="122" rx="76" ry="7" fill="#1C1917" opacity="0.35" />

            {/* Pneus Frontais */}
            <rect x="24" y="90" width="16" height="30" rx="6" fill="#1C1917" />
            <rect x="160" y="90" width="16" height="30" rx="6" fill="#1C1917" />
            {/* Detalhe da Roda */}
            <rect x="27" y="95" width="4" height="20" rx="2" fill="#44403C" />
            <rect x="169" y="95" width="4" height="20" rx="2" fill="#44403C" />

            {/* Teto e Cabine do Carro */}
            <path
              d="M 52,56 C 56,36 70,26 100,26 C 130,26 144,36 148,56 Z"
              fill="#F97316"
            />
            {/* Teto - Destaque superior */}
            <path
              d="M 62,32 C 74,28 100,27 138,32"
              stroke="#FDBA74"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Para-brisa Dianteiro com Reflexo */}
            <path
              d="M 56,54 C 60,38 72,30 100,30 C 128,30 140,38 144,54 Z"
              fill="#1E293B"
            />
            {/* Reflexo no Vidro */}
            <path
              d="M 68,48 L 78,34 C 84,32 94,32 98,32 L 84,48 Z"
              fill="white"
              opacity="0.25"
            />

            {/* Retrovisores */}
            <ellipse cx="32" cy="56" rx="9" ry="6" fill="#EA580C" />
            <ellipse cx="32" cy="56" rx="6" ry="4" fill="#1E293B" />
            <ellipse cx="168" cy="56" rx="9" ry="6" fill="#EA580C" />
            <ellipse cx="168" cy="56" rx="6" ry="4" fill="#1E293B" />

            {/* Capô / Entrada de Ar Superior */}
            <path
              d="M 28,68 C 30,56 50,56 100,56 C 150,56 170,56 172,68 L 176,96 C 176,104 168,110 156,110 L 44,110 C 32,110 24,104 24,96 Z"
              fill="#F97316"
            />
            {/* Scoop / Entrada de ar no capô */}
            <path
              d="M 74,58 C 78,54 122,54 126,58 C 122,62 78,62 74,58 Z"
              fill="#C2410C"
            />

            {/* Faróis Dianteiros Amarelos Iluminados (como na foto) */}
            {/* Farol Esquerdo Principal */}
            <ellipse cx="44" cy="80" rx="9" ry="9" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
            <ellipse cx="43" cy="78" rx="4" ry="4" fill="#FFFFFF" opacity="0.8" />
            {/* Farol de Milha Esquerdo */}
            <ellipse cx="64" cy="82" rx="6" ry="6" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.2" />

            {/* Farol Direito Principal */}
            <ellipse cx="156" cy="80" rx="9" ry="9" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
            <ellipse cx="155" cy="78" rx="4" ry="4" fill="#FFFFFF" opacity="0.8" />
            {/* Farol de Milha Direito */}
            <ellipse cx="136" cy="82" rx="6" ry="6" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.2" />

            {/* Grade Frontal do Radiador */}
            <path
              d="M 76,80 C 82,78 118,78 124,80 C 124,88 118,94 100,94 C 82,94 76,88 76,80 Z"
              fill="#1C1917"
            />
            {/* Linhas da Grade */}
            <line x1="84" y1="83" x2="116" y2="83" stroke="#44403C" strokeWidth="1.5" />
            <line x1="86" y1="88" x2="114" y2="88" stroke="#44403C" strokeWidth="1.5" />

            {/* Para-choque Inferior */}
            <path
              d="M 28,98 C 40,94 100,92 172,98 L 170,106 C 158,112 42,112 30,106 Z"
              fill="#C2410C"
            />
            <rect x="74" y="98" width="52" height="7" rx="3" fill="#1C1917" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

export default CarSunsetIllustration;
