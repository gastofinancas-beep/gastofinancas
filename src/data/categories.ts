import type { LucideIcon } from 'lucide-react';
import {
  Utensils,
  ShoppingCart,
  Car,
  Home,
  HeartPulse,
  Plane,
  GraduationCap,
  ShoppingBag,
  Tv,
  Fuel,
  Smartphone,
  Tag,
} from 'lucide-react';

export interface CategoryDefinition {
  id: string;
  label: string;
  fullLabel: string;
  icon: LucideIcon;
  color: string;
  keywords?: string[];
}

export const EXPENSE_CATEGORIES: CategoryDefinition[] = [
  { id: 'alimentacao', label: 'Alimentação', fullLabel: 'Alimentação & Restaurante', icon: Utensils, color: '#F59E0B' },
  { id: 'mercado', label: 'Supermercado', fullLabel: 'Supermercado & Feira', icon: ShoppingCart, color: '#10B981' },
  { id: 'transporte', label: 'Transporte', fullLabel: 'Transporte & Combustível', icon: Car, color: '#3B82F6' },
  { id: 'moradia', label: 'Moradia', fullLabel: 'Moradia & Casa', icon: Home, color: '#8B5CF6' },
  { id: 'saude', label: 'Saúde', fullLabel: 'Saúde & Farmácia', icon: HeartPulse, color: '#EC4899' },
  { id: 'lazer', label: 'Lazer', fullLabel: 'Lazer & Entretenimento', icon: Plane, color: '#F97316' },
  { id: 'educacao', label: 'Educação', fullLabel: 'Educação & Cursos', icon: GraduationCap, color: '#6366F1' },
  { id: 'compras', label: 'Compras', fullLabel: 'Compras & Vestuário', icon: ShoppingBag, color: '#14B8A6' },
  { id: 'servicos', label: 'Serviços', fullLabel: 'Serviços & Assinaturas', icon: Tv, color: '#06B6D4' },
  { id: 'combustivel', label: 'Combustível', fullLabel: 'Combustível & Posto', icon: Fuel, color: '#EF4444' },
  { id: 'eletronicos', label: 'Tecnologia', fullLabel: 'Eletrônicos & Equipamentos', icon: Smartphone, color: '#64748B' },
  { id: 'outros', label: 'Outros', fullLabel: 'Outros / Diversos', icon: Tag, color: '#94A3B8' },
];

// Helper to normalize and get category info
export function getCategoryInfo(categoryId: string): CategoryDefinition {
  const normalized = (categoryId || 'outros').toLowerCase().trim();
  
  // Direct match
  const direct = EXPENSE_CATEGORIES.find(c => c.id === normalized);
  if (direct) return direct;

  // Synonyms/aliases
  if (normalized.includes('casa') || normalized.includes('moradia') || normalized.includes('aluguel') || normalized.includes('condom')) {
    return EXPENSE_CATEGORIES.find(c => c.id === 'moradia') || EXPENSE_CATEGORIES[3];
  }
  if (normalized.includes('comida') || normalized.includes('restaurante') || normalized.includes('lanche') || normalized.includes('alimenta')) {
    return EXPENSE_CATEGORIES.find(c => c.id === 'alimentacao') || EXPENSE_CATEGORIES[0];
  }
  if (normalized.includes('mercado') || normalized.includes('feira') || normalized.includes('supermercado')) {
    return EXPENSE_CATEGORIES.find(c => c.id === 'mercado') || EXPENSE_CATEGORIES[1];
  }
  if (normalized.includes('uber') || normalized.includes('onibus') || normalized.includes('metro') || normalized.includes('transp')) {
    return EXPENSE_CATEGORIES.find(c => c.id === 'transporte') || EXPENSE_CATEGORIES[2];
  }
  if (normalized.includes('viagem') || normalized.includes('lazer') || normalized.includes('cinema') || normalized.includes('bar')) {
    return EXPENSE_CATEGORIES.find(c => c.id === 'lazer') || EXPENSE_CATEGORIES[5];
  }
  if (normalized.includes('farmacia') || normalized.includes('medico') || normalized.includes('saude') || normalized.includes('hospital')) {
    return EXPENSE_CATEGORIES.find(c => c.id === 'saude') || EXPENSE_CATEGORIES[4];
  }
  if (normalized.includes('escola') || normalized.includes('curso') || normalized.includes('educa')) {
    return EXPENSE_CATEGORIES.find(c => c.id === 'educacao') || EXPENSE_CATEGORIES[6];
  }
  if (normalized.includes('roupa') || normalized.includes('vestuario') || normalized.includes('compra')) {
    return EXPENSE_CATEGORIES.find(c => c.id === 'compras') || EXPENSE_CATEGORIES[7];
  }
  if (normalized.includes('netflix') || normalized.includes('spotify') || normalized.includes('assinatura') || normalized.includes('servico')) {
    return EXPENSE_CATEGORIES.find(c => c.id === 'servicos') || EXPENSE_CATEGORIES[8];
  }

  // Fallback for custom or unknown category
  return {
    id: normalized,
    label: categoryId ? (categoryId.charAt(0).toUpperCase() + categoryId.slice(1)) : 'Outros',
    fullLabel: categoryId ? (categoryId.charAt(0).toUpperCase() + categoryId.slice(1)) : 'Outros',
    icon: Tag,
    color: '#94A3B8',
  };
}
