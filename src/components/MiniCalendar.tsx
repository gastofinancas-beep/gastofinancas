import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Calendar, CalendarDays } from 'lucide-react';
import { todayLocalISO, parseLocalISO } from '../utils/dateUtils';

interface MiniCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_SHORT_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function MiniCalendar({ selectedDate, onSelectDate, onClose }: MiniCalendarProps) {
  const initialDate = selectedDate ? parseLocalISO(selectedDate) : new Date();
  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState<number>(initialDate.getDate());
  const [viewMode, setViewMode] = useState<'days' | 'months'>('days');

  // Days in month calculation
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrev = () => {
    if (viewMode === 'days') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(prev => prev - 1);
      } else {
        setCurrentMonth(prev => prev - 1);
      }
    } else {
      setCurrentYear(prev => prev - 1);
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
    } else {
      setCurrentYear(prev => prev + 1);
    }
  };

  const handleSelectToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDay(now.getDate());
    setViewMode('days');
  };

  const handleApply = () => {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(selectedDay).padStart(2, '0');
    onSelectDate(`${currentYear}-${monthStr}-${dayStr}`);
    onClose();
  };

  const todayIso = todayLocalISO();

  return (
    <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 p-4 sm:p-5 space-y-3.5 select-none">
      {/* Top row: Label + Today shortcut */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Calendário
        </span>
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

      {/* Segmented Mode Selector: Dia vs Mês */}
      <div className="flex items-center p-1 bg-slate-100 dark:bg-[#2C2C2E] rounded-xl">
        <button
          type="button"
          onClick={() => setViewMode('days')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            viewMode === 'months'
              ? 'bg-emerald-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Mês</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* VIEW 1: DAYS VIEW                                    */}
      {/* ==================================================== */}
      {viewMode === 'days' && (
        <>
          {/* Header Month & Year with Pencil */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMode('months')}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity text-left"
              title="Alterar mês"
            >
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white capitalize">
                {MONTH_NAMES_PT[currentMonth]} {currentYear}
              </span>
              <Pencil size={15} className="text-emerald-600 dark:text-emerald-400" />
            </button>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((wd, idx) => (
              <span
                key={idx}
                className={`text-xs font-bold ${
                  idx === 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {/* Previous month blanks */}
            {Array.from({ length: firstDayOfWeek }).map((_, index) => {
              const prevDayNum = prevMonthDaysCount - firstDayOfWeek + index + 1;
              return (
                <div
                  key={`empty-${index}`}
                  className="h-8 w-8 mx-auto flex items-center justify-center text-xs font-medium text-slate-300 dark:text-slate-600 select-none"
                >
                  {String(prevDayNum).padStart(2, '0')}
                </div>
              );
            })}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dayNum = index + 1;
              const monthStr = String(currentMonth + 1).padStart(2, '0');
              const dayStr = String(dayNum).padStart(2, '0');
              const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

              const isSelected = selectedDay === dayNum;
              const isToday = todayIso === dateStr;
              const isSunday = (firstDayOfWeek + index) % 7 === 0;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => setSelectedDay(dayNum)}
                  className={`h-8 w-8 mx-auto rounded-full text-xs transition-all cursor-pointer select-none flex items-center justify-center relative ${
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
        </>
      )}

      {/* ==================================================== */}
      {/* VIEW 2: MONTHS VIEW                                  */}
      {/* ==================================================== */}
      {viewMode === 'months' && (
        <>
          <div className="flex items-center justify-between">
            <span className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              {currentYear}
              <Pencil size={15} className="text-emerald-600 dark:text-emerald-400" />
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                title="Ano anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                title="Próximo ano"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1">
            {MONTH_SHORT_PT.map((mShort, idx) => {
              const isSelectedMonth = currentMonth === idx;
              return (
                <button
                  key={mShort}
                  type="button"
                  onClick={() => {
                    setCurrentMonth(idx);
                    setViewMode('days');
                  }}
                  className={`py-2.5 px-1.5 rounded-xl text-center font-semibold text-xs transition-all cursor-pointer ${
                    isSelectedMonth
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30'
                      : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  {mShort}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Bottom Actions: Cancel & Apply */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 px-3 rounded-xl border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold text-xs tracking-wide transition-colors cursor-pointer text-center"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-xs tracking-wide shadow-xs transition-colors cursor-pointer text-center"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
