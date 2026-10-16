import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Pencil, Calendar, CalendarDays } from 'lucide-react';

export interface CustomDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string; // YYYY-MM-DD or YYYY-MM
  onChange: (dateStr: string) => void;
  mode?: 'date' | 'month';
  minDate?: string;
  maxDate?: string;
  title?: string;
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_SHORT_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// Weekday headers matching the design S M T W T F S (or D S T Q Q S S)
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function CustomDatePickerModal({
  isOpen,
  onClose,
  value,
  onChange,
  mode = 'date',
  minDate,
  maxDate,
  title
}: CustomDatePickerModalProps) {
  // Parse initial date
  const parseInitialDate = (valStr: string) => {
    if (!valStr) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate()
      };
    }
    const parts = valStr.split('-').map(Number);
    if (parts.length >= 3) {
      return { year: parts[0], month: parts[1] - 1, day: parts[2] };
    }
    if (parts.length === 2) {
      return { year: parts[0], month: parts[1] - 1, day: 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  };

  const parsed = parseInitialDate(value);
  const [currentYear, setCurrentYear] = useState<number>(parsed.year);
  const [currentMonth, setCurrentMonth] = useState<number>(parsed.month); // 0-11
  const [selectedDay, setSelectedDay] = useState<number>(parsed.day);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>(mode === 'month' ? 'months' : 'days');

  // Reset when opened with a new value
  useEffect(() => {
    if (isOpen) {
      const p = parseInitialDate(value);
      setCurrentYear(p.year);
      setCurrentMonth(p.month);
      setSelectedDay(p.day);
      setViewMode(mode === 'month' ? 'months' : 'days');

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, value, mode]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  // Previous month trailing days
  const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrev = () => {
    if (viewMode === 'days') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(prev => prev - 1);
      } else {
        setCurrentMonth(prev => prev - 1);
      }
    } else if (viewMode === 'months') {
      setCurrentYear(prev => prev - 1);
    } else if (viewMode === 'years') {
      setCurrentYear(prev => prev - 12);
    }
  };

  const handleNext = () => {
    if (viewMode === 'days') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(prev => prev + 1);
      } else {
        setCurrentMonth(prev => prev + 1);
      }
    } else if (viewMode === 'months') {
      setCurrentYear(prev => prev + 1);
    } else if (viewMode === 'years') {
      setCurrentYear(prev => prev + 12);
    }
  };

  const handleSelectToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDay(now.getDate());
    if (mode === 'month') {
      setViewMode('months');
    } else {
      setViewMode('days');
    }
  };

  const handleApply = () => {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    if (mode === 'month') {
      onChange(`${currentYear}-${mStr}`);
    } else {
      const safeDay = Math.min(selectedDay, daysInMonth);
      const dStr = String(safeDay).padStart(2, '0');
      onChange(`${currentYear}-${mStr}-${dStr}`);
    }
    onClose();
  };

  const isCurrentDay = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day
    );
  };

  // Year range for years picker
  const startYearGrid = Math.floor(currentYear / 12) * 12;
  const yearsList = Array.from({ length: 12 }, (_, i) => startYearGrid + i);

  return createPortal(
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm overflow-y-auto"
      >
        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[340px] sm:max-w-[360px] bg-white dark:bg-[#1C1C1E] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 p-5 sm:p-6 overflow-hidden select-none my-auto"
        >
          {/* Header Title + Today button */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {title || (mode === 'month' ? 'Selecionar Mês' : 'Selecionar Data')}
            </p>
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              title="Ir para o dia de hoje"
            >
              <CalendarDays size={13} />
              <span>Hoje</span>
            </button>
          </div>

          {/* Segmented Mode Selector: Dia vs Mês vs Ano (Only if not month-only mode) */}
          {mode !== 'month' && (
            <div className="flex items-center p-1 bg-slate-100 dark:bg-[#2C2C2E] rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => setViewMode('days')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === 'days'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar size={13} />
                <span>Dia</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('months')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === 'months'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Mês</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('years')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === 'years'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Ano</span>
              </button>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW 1: DAYS VIEW                                    */}
          {/* ==================================================== */}
          {viewMode === 'days' && (
            <div className="space-y-4">
              {/* Header: Month Year + Pencil icon on left, < > arrows on right */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewMode('months')}
                  className="flex items-center gap-2 group cursor-pointer text-left hover:opacity-80 transition-opacity"
                  title="Selecionar Mês ou Ano"
                >
                  <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white capitalize tracking-tight">
                    {MONTH_NAMES_PT[currentMonth]} {currentYear}
                  </span>
                  <Pencil size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                    title="Mês anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                    title="Próximo mês"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Subheader: Weekday columns D S T Q Q S S */}
              <div className="grid grid-cols-7 text-center pt-1">
                {WEEKDAYS.map((wd, idx) => (
                  <span
                    key={`wd-${idx}`}
                    className={`text-xs font-bold ${
                      idx === 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {wd}
                  </span>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-y-1.5 text-center">
                {/* Previous month trailing slots */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                  const prevDayNum = prevMonthDaysCount - firstDayOfWeek + i + 1;
                  return (
                    <div
                      key={`prev-${i}`}
                      className="h-9 w-9 mx-auto flex items-center justify-center text-xs font-medium text-slate-300 dark:text-slate-600 select-none"
                    >
                      {String(prevDayNum).padStart(2, '0')}
                    </div>
                  );
                })}

                {/* Current month days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = selectedDay === dayNum;
                  const isToday = isCurrentDay(dayNum);
                  const isSunday = (firstDayOfWeek + i) % 7 === 0;

                  return (
                    <button
                      key={`day-${dayNum}`}
                      type="button"
                      onClick={() => setSelectedDay(dayNum)}
                      className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center text-xs transition-all cursor-pointer select-none relative ${
                        isSelected
                          ? 'bg-emerald-500 text-white font-bold shadow-md scale-105 z-10'
                          : isToday
                          ? 'border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                          : isSunday
                          ? 'text-rose-500 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                          : 'text-slate-800 dark:text-slate-200 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                      }`}
                    >
                      {String(dayNum).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>

              {/* Day Feedback Pill */}
              <div className="pt-1 text-center">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Dia selecionado: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{String(selectedDay).padStart(2, '0')} de {MONTH_NAMES_PT[currentMonth]}</strong>
                </span>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW 2: MONTH VIEW                                   */}
          {/* ==================================================== */}
          {viewMode === 'months' && (
            <div className="space-y-4">
              {/* Header: Year + Pencil icon on left, < > arrows on right */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewMode('years')}
                  className="flex items-center gap-2 group cursor-pointer text-left hover:opacity-80 transition-opacity"
                  title="Alterar Ano"
                >
                  <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {currentYear}
                  </span>
                  <Pencil size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                    title="Ano anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                    title="Próximo ano"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* 12 Months in a 3x4 Grid */}
              <div className="grid grid-cols-3 gap-2.5 py-2">
                {MONTH_SHORT_PT.map((mShort, idx) => {
                  const isSelectedMonth = currentMonth === idx;
                  return (
                    <button
                      key={mShort}
                      type="button"
                      onClick={() => {
                        setCurrentMonth(idx);
                        if (mode !== 'month') {
                          setViewMode('days');
                        }
                      }}
                      className={`py-3 px-2 rounded-2xl text-center font-semibold text-sm transition-all cursor-pointer ${
                        isSelectedMonth
                          ? 'bg-emerald-500 text-white font-bold shadow-md scale-[1.02]'
                          : 'bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30'
                      }`}
                    >
                      {mShort}
                    </button>
                  );
                })}
              </div>

              {/* Month Feedback */}
              <div className="pt-1 text-center">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Mês selecionado: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{MONTH_NAMES_PT[currentMonth]} de {currentYear}</strong>
                </span>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW 3: YEARS LIST JUMP                              */}
          {/* ==================================================== */}
          {viewMode === 'years' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {startYearGrid} - {startYearGrid + 11}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2">
                {yearsList.map(y => {
                  const isSelectedYear = currentYear === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setCurrentYear(y);
                        setViewMode('months');
                      }}
                      className={`py-2.5 px-2 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                        isSelectedYear
                          ? 'bg-emerald-500 text-white font-bold shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* BOTTOM ACTIONS: CANCEL / APPLY BUTTONS               */}
          {/* ==================================================== */}
          <div className="pt-4 mt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-xs transition-colors cursor-pointer text-center"
            >
              Aplicar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
