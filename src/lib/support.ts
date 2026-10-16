/**
 * Canal de suporte exibido no app. Configure no Netlify:
 * - VITE_SUPPORT_WHATSAPP: número com DDI e DDD, só dígitos (ex.: 5511999999999)
 * - VITE_SUPPORT_EMAIL: e-mail de suporte (se vazio, usa VITE_PRIVACY_EMAIL)
 * Sem nenhum dos dois, o link de suporte não aparece.
 */
const whatsapp = String(import.meta.env.VITE_SUPPORT_WHATSAPP || '').replace(/\D/g, '');
const email = String(import.meta.env.VITE_SUPPORT_EMAIL || import.meta.env.VITE_PRIVACY_EMAIL || '').trim();

const subject = 'Ajuda com o Gastô';

export const supportUrl: string | null = whatsapp
  ? `https://wa.me/${whatsapp}?text=${encodeURIComponent('Olá! Preciso de ajuda com o Gastô.')}`
  : email
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : null;
