export type Currency = 'SYP' | 'USD' | 'EUR' | 'SAR' | 'AED'

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partial' | 'cancelled'

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  number: string
  patientId: string
  createdBy: string
  createdAt: string
  currency: Currency
  items: InvoiceItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  status: InvoiceStatus
  paid: number
  notes?: string
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  SYP: 'ل.س',
  USD: '$',
  EUR: '€',
  SAR: 'ر.س',
  AED: 'د.إ',
}
