import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function CurrencyInput({
  value,
  onChange,
  required = false,
  placeholder = '0,00',
  className = '',
}: CurrencyInputProps) {
  const formatToBRL = (num: number) => {
    if (!num && num !== 0) return '';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const [displayVal, setDisplayVal] = useState(() => formatToBRL(value));

  useEffect(() => {
    const parsed = parseFloat(displayVal.replace(/\./g, '').replace(',', '.')) || 0;
    if (Math.abs(parsed - (value || 0)) > 0.001) {
      setDisplayVal(formatToBRL(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setDisplayVal('');
      onChange(0);
      return;
    }
    const num = parseInt(raw, 10) / 100;
    setDisplayVal(formatToBRL(num));
    onChange(num);
  };

  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 dark:text-slate-400 pointer-events-none select-none">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={displayVal}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-base font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${className}`}
      />
    </div>
  );
}
