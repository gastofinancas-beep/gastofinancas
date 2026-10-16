import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { CustomDatePickerModal } from './CustomDatePickerModal';

export interface DatePickerInputProps {
  value: string; // YYYY-MM-DD or YYYY-MM
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  mode?: 'date' | 'month';
  minDate?: string;
  maxDate?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  title?: string;
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function DatePickerInput({
  value,
  onChange,
  label,
  placeholder = 'Selecione a data',
  mode = 'date',
  minDate,
  maxDate,
  className = '',
  inputClassName = '',
  disabled = false,
  required = false,
  icon,
  title
}: DatePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Format display text
  const formatDisplay = (val: string) => {
    if (!val) return '';
    const parts = val.split('-');
    if (mode === 'month' || parts.length === 2) {
      const year = parts[0];
      const monthIdx = Number(parts[1]) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${MONTH_NAMES_PT[monthIdx]} de ${year}`;
      }
      return `${parts[1]}/${parts[0]}`;
    }
    if (parts.length >= 3) {
      const [y, m, d] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    return val;
  };

  const displayText = formatDisplay(value);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
          {icon || <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />}
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={`w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer hover:border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden select-none disabled:opacity-50 disabled:cursor-not-allowed text-left ${inputClassName}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {!label && (icon || <Calendar size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />)}
          <span className={displayText ? 'font-medium' : 'text-slate-400 dark:text-slate-500'}>
            {displayText || placeholder}
          </span>
        </div>
        <ChevronDown size={15} className="text-slate-400 shrink-0 ml-2" />
      </button>

      <CustomDatePickerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        value={value}
        onChange={onChange}
        mode={mode}
        minDate={minDate}
        maxDate={maxDate}
        title={title || label}
      />
    </div>
  );
}
