import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/types/invoice'
import { seedInvoices } from '@/data/seed'
import { generateId } from '@/lib/utils'

interface InvoicesState {
  invoices: Invoice[]
  counter: number
  addInvoice: (data: Omit<Invoice, 'id' | 'number' | 'createdAt' | 'subtotal' | 'total' | 'tax'> & {
    taxRate?: number
    tax?: number
  }) => Invoice
  updateInvoice: (id: string, data: Partial<Invoice>) => void
  updateStatus: (id: string, status: InvoiceStatus, paid?: number) => void
  deleteInvoice: (id: string) => void
  getByPatient: (patientId: string) => Invoice[]
  nextNumber: () => string
}

const calc = (items: InvoiceItem[], discount: number, taxRate: number) => {
  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const afterDiscount = Math.max(0, subtotal - discount)
  const tax = (afterDiscount * taxRate) / 100
  const total = afterDiscount + tax
  return { subtotal, tax, total }
}

export const useInvoicesStore = create<InvoicesState>()(
  persist(
    (set, get) => ({
      invoices: seedInvoices,
      counter: 4,
      addInvoice: (data) => {
        const counter = get().counter + 1
        const year = new Date().getFullYear()
        const number = `INV-${year}-${counter.toString().padStart(4, '0')}`
        const calcResult = calc(data.items, data.discount, data.taxRate ?? 0)
        const inv: Invoice = {
          id: generateId('inv'),
          number,
          createdAt: new Date().toISOString(),
          subtotal: calcResult.subtotal,
          tax: calcResult.tax,
          total: calcResult.total,
          patientId: data.patientId,
          createdBy: data.createdBy,
          currency: data.currency,
          items: data.items,
          discount: data.discount,
          paid: data.paid,
          status: data.status,
          notes: data.notes,
        }
        set((s) => ({ invoices: [inv, ...s.invoices], counter }))
        return inv
      },
      updateInvoice: (id, data) =>
        set((s) => ({
          invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...data } : i)),
        })),
      updateStatus: (id, status, paid) =>
        set((s) => ({
          invoices: s.invoices.map((i) =>
            i.id === id ? { ...i, status, paid: paid ?? i.paid } : i
          ),
        })),
      deleteInvoice: (id) =>
        set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) })),
      getByPatient: (patientId) => get().invoices.filter((i) => i.patientId === patientId),
      nextNumber: () => {
        const c = get().counter + 1
        return `INV-${new Date().getFullYear()}-${c.toString().padStart(4, '0')}`
      },
    }),
    { name: 'synapse_invoices', storage: createJSONStorage(() => localStorage) }
  )
)
