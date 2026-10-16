import { FreelanceEntry, FreelanceExpense, FreelanceGoals, FreelanceCategory, FreelanceExpenseCategory } from '../types';
import { todayLocalISO } from '../utils/dateUtils';

export const FREELANCE_CATEGORY_CONFIG: Record<FreelanceCategory, { label: string; icon: string; color: string; bg: string }> = {
  design: { label: 'Design & UI/UX', icon: 'Palette', color: '#EC4899', bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
  desenvolvimento: { label: 'Programação & Web', icon: 'Code', color: '#3B82F6', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  marketing: { label: 'Marketing & Tráfego', icon: 'Megaphone', color: '#F59E0B', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  video: { label: 'Edição de Vídeo / Reels', icon: 'Video', color: '#8B5CF6', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  redacao: { label: 'Redação & Copywriting', icon: 'FileText', color: '#10B981', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  consultoria: { label: 'Consultoria / Mentoria', icon: 'Briefcase', color: '#6366F1', bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  fotografia: { label: 'Foto / Ensaio', icon: 'Camera', color: '#06B6D4', bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  servicos: { label: 'Prestação de Serviços', icon: 'Wrench', color: '#14B8A6', bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  aulas: { label: 'Aulas / Treinamentos', icon: 'GraduationCap', color: '#E11D48', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  outros: { label: 'Outros Freelas', icon: 'Sparkles', color: '#64748B', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
};

export const FREELANCE_EXPENSE_CATEGORY_CONFIG: Record<FreelanceExpenseCategory, { label: string; icon: string; color: string }> = {
  ferramentas: { label: 'Ferramentas / Plugins', icon: 'Wrench', color: '#8B5CF6' },
  software: { label: 'Software / Assinaturas', icon: 'Laptop', color: '#3B82F6' },
  transporte: { label: 'Transporte / Deslocamento', icon: 'Car', color: '#F59E0B' },
  alimentacao: { label: 'Alimentação no Trabalho', icon: 'Coffee', color: '#EC4899' },
  material: { label: 'Materiais & Equipamentos', icon: 'Package', color: '#10B981' },
  taxas: { label: 'Taxas & Plataformas', icon: 'Receipt', color: '#EF4444' },
  subcontratacao: { label: 'Parcerias / Terceirização', icon: 'Users', color: '#6366F1' },
  cursos: { label: 'Cursos & Capacitação', icon: 'BookOpen', color: '#06B6D4' },
  outros: { label: 'Outros Gastos', icon: 'MoreHorizontal', color: '#64748B' },
};

const today = todayLocalISO();

export const INITIAL_FREELANCE_ENTRIES: FreelanceEntry[] = [];

export const INITIAL_FREELANCE_EXPENSES: FreelanceExpense[] = [];

export const INITIAL_FREELANCE_GOALS: FreelanceGoals = {
  monthlyIncomeGoal: 2000.00,
};
