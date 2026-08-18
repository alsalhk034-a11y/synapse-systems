import { format, formatDistanceToNow, parseISO, differenceInYears, differenceInMonths } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { CURRENCY_SYMBOLS, type Currency } from '@/types/invoice'
import type { Language } from '@/types'

export function formatDate(iso: string, lang: Language = 'ar', pattern = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(iso), pattern, { locale: lang === 'ar' ? ar : enUS })
  } catch {
    return iso
  }
}

export function formatTime(iso: string, lang: Language = 'ar'): string {
  return formatDate(iso, lang, 'HH:mm')
}

export function formatDateTime(iso: string, lang: Language = 'ar'): string {
  return formatDate(iso, lang, 'dd MMM yyyy • HH:mm')
}

export function formatRelative(iso: string, lang: Language = 'ar'): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: lang === 'ar' ? ar : enUS })
  } catch {
    return iso
  }
}

export function formatAge(birthIso: string, lang: Language = 'ar'): string {
  const birth = parseISO(birthIso)
  const now = new Date()
  const years = differenceInYears(now, birth)
  const months = differenceInMonths(now, birth) % 12
  if (lang === 'ar') {
    if (years === 0) return `${months} شهر`
    if (years >= 2) return `${years} سنوات`
    return `${years} سنة و ${months} شهر`
  }
  if (years === 0) return `${months} months`
  if (years >= 2) return `${years} years`
  return `${years} year ${months} months`
}

export function ageInYears(birthIso: string): number {
  return differenceInYears(new Date(), parseISO(birthIso))
}

export function ageInMonths(birthIso: string): number {
  return differenceInMonths(new Date(), parseISO(birthIso))
}

export function formatCurrency(value: number, currency: Currency, lang: Language = 'ar'): string {
  const symbol = CURRENCY_SYMBOLS[currency]
  const formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-SY' : 'en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value)
  return lang === 'ar' ? `${formatted} ${symbol}` : `${symbol}${formatted}`
}

// alias محاسبي - يقبل المبلغ والعملة فقط ويستخدم العربية افتراضياً
export const formatMoney = (value: number, currency: Currency): string =>
  formatCurrency(value, currency, 'ar')

export function formatNumber(value: number, lang: Language = 'ar'): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SY' : 'en-US').format(value)
}

export function todayISO(): string {
  return new Date().toISOString()
}

export function startOfDayISO(date = new Date()): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
