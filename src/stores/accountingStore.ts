import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Account, JournalEntry, Expense, JournalLine } from '@/types/accounting'
import { DEFAULT_ACCOUNTS } from '@/types/accounting'

interface AccountingState {
  accounts: Account[]
  journalEntries: JournalEntry[]
  expenses: Expense[]
  openingBalances: { accountId: string; debit: number; credit: number; date: string }[]

  addAccount: (a: Account) => void
  updateAccount: (id: string, data: Partial<Account>) => void
  deleteAccount: (id: string) => void

  addJournalEntry: (entry: JournalEntry) => void
  updateJournalEntry: (id: string, data: Partial<JournalEntry>) => void
  postJournalEntry: (id: string) => void
  deleteJournalEntry: (id: string) => void

  addExpense: (e: Expense) => JournalEntry
  approveExpense: (id: string, by: string) => void
  deleteExpense: (id: string) => void

  /** حساب رصيد حساب معين بناءً على القيود المرحلة */
  getAccountBalance: (accountId: string) => number
  /** قائمة الدخل (P&L) لفترة محددة */
  getIncomeStatement: (from: string, to: string) => {
    revenue: { accountId: string; name: string; amount: number }[]
    expenses: { accountId: string; name: string; amount: number }[]
    totalRevenue: number
    totalExpenses: number
    netIncome: number
  }
  /** الميزانية (Balance Sheet) */
  getBalanceSheet: (at: string) => {
    assets: { accountId: string; name: string; balance: number }[]
    liabilities: { accountId: string; name: string; balance: number }[]
    equity: { accountId: string; name: string; balance: number }[]
    totalAssets: number
    totalLiabilities: number
    totalEquity: number
  }
  /** توليد رقم قيد تسلسلي */
  nextEntryNumber: () => string
}

function computeBalance(
  account: Account,
  entries: JournalEntry[],
  opening: { accountId: string; debit: number; credit: number; date: string }[]
): number {
  // الأرصدة الافتتاحية
  const ob = opening.find((o) => o.accountId === account.id)
  let balance = (ob?.debit || 0) - (ob?.credit || 0)

  // قيود مرحلة
  for (const entry of entries) {
    if (entry.status !== 'posted') continue
    for (const line of entry.lines) {
      if (line.accountId === account.id) {
        balance += line.debit - line.credit
      }
    }
  }
  return balance
}

export const useAccountingStore = create<AccountingState>()(
  persist(
    (set, get) => ({
      accounts: DEFAULT_ACCOUNTS,
      journalEntries: [],
      expenses: [],
      openingBalances: [],

      addAccount: (a) => set((s) => ({ accounts: [...s.accounts, a] })),
      updateAccount: (id, data) =>
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...data } : a)) })),
      deleteAccount: (id) => set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

      addJournalEntry: (entry) => set((s) => ({ journalEntries: [...s.journalEntries, entry] })),
      updateJournalEntry: (id, data) =>
        set((s) => ({
          journalEntries: s.journalEntries.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
      postJournalEntry: (id) =>
        set((s) => ({
          journalEntries: s.journalEntries.map((e) =>
            e.id === id ? { ...e, status: 'posted', postedAt: new Date().toISOString() } : e
          ),
        })),
      deleteJournalEntry: (id) =>
        set((s) => ({ journalEntries: s.journalEntries.filter((e) => e.id !== id) })),

      addExpense: (e) => {
        const id = 'je_' + Date.now()
        const num = get().nextEntryNumber()
        // القيد: مدين حساب المصروف - دائن الصندوق/البنك
        const cashAccountId = e.paymentMethod === 'bank' ? 'acc_1200' : 'acc_1100'
        const line1: JournalLine = {
          id: 'l_' + Date.now() + '_1',
          accountId: e.category === 'salary' ? 'acc_5100' : e.category === 'rent' ? 'acc_5200' : e.category === 'utilities' ? 'acc_5300' : e.category === 'medication' ? 'acc_5400' : e.category === 'supplies' ? 'acc_5500' : e.category === 'maintenance' ? 'acc_5600' : e.category === 'marketing' ? 'acc_5700' : e.category === 'insurance' ? 'acc_5800' : 'acc_5900',
          debit: e.amount,
          credit: 0,
          description: e.description,
        }
        const line2: JournalLine = {
          id: 'l_' + Date.now() + '_2',
          accountId: cashAccountId,
          debit: 0,
          credit: e.amount,
          description: e.description,
        }
        const entry: JournalEntry = {
          id,
          entryNumber: num,
          date: e.date,
          description: e.description + (e.vendor ? ` - ${e.vendor}` : ''),
          reference: e.id,
          referenceType: 'expense',
          lines: [line1, line2],
          status: e.approved ? 'posted' : 'draft',
          createdBy: e.createdBy,
          createdAt: new Date().toISOString(),
          postedAt: e.approved ? new Date().toISOString() : undefined,
        }
        set((s) => ({
          expenses: [...s.expenses, e],
          journalEntries: [...s.journalEntries, entry],
        }))
        return entry
      },
      approveExpense: (id, by) =>
        set((s) => {
          const exp = s.expenses.find((e) => e.id === id)
          if (!exp) return s
          return {
            expenses: s.expenses.map((e) =>
              e.id === id ? { ...e, approved: true, approvedBy: by } : e
            ),
            journalEntries: s.journalEntries.map((je) =>
              je.reference === id
                ? { ...je, status: 'posted', postedAt: new Date().toISOString() }
                : je
            ),
          }
        }),
      deleteExpense: (id) =>
        set((s) => ({
          expenses: s.expenses.filter((e) => e.id !== id),
          journalEntries: s.journalEntries.filter((je) => je.reference !== id),
        })),

      getAccountBalance: (accountId) => {
        const s = get()
        const acc = s.accounts.find((a) => a.id === accountId)
        if (!acc) return 0
        return computeBalance(acc, s.journalEntries, s.openingBalances)
      },
      getIncomeStatement: (from, to) => {
        const s = get()
        const fromD = new Date(from).getTime()
        const toD = new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1

        const filtered = s.journalEntries.filter(
          (e) => e.status === 'posted' && new Date(e.date).getTime() >= fromD && new Date(e.date).getTime() <= toD
        )

        const revMap = new Map<string, number>()
        const expMap = new Map<string, number>()
        for (const e of filtered) {
          for (const line of e.lines) {
            const acc = s.accounts.find((a) => a.id === line.accountId)
            if (!acc) continue
            if (acc.type === 'revenue') {
              revMap.set(acc.id, (revMap.get(acc.id) || 0) + (line.credit - line.debit))
            } else if (acc.type === 'expense') {
              expMap.set(acc.id, (expMap.get(acc.id) || 0) + (line.debit - line.credit))
            }
          }
        }
        const revenue = Array.from(revMap.entries()).map(([accountId, amount]) => {
          const a = s.accounts.find((acc) => acc.id === accountId)!
          return { accountId, name: a.name, amount }
        })
        const expenses = Array.from(expMap.entries()).map(([accountId, amount]) => {
          const a = s.accounts.find((acc) => acc.id === accountId)!
          return { accountId, name: a.name, amount }
        })
        const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0)
        const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0)
        return { revenue, expenses, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses }
      },
      getBalanceSheet: (at) => {
        const s = get()
        const atT = new Date(at).getTime() + 24 * 60 * 60 * 1000 - 1
        const assets: { accountId: string; name: string; balance: number }[] = []
        const liabilities: { accountId: string; name: string; balance: number }[] = []
        const equity: { accountId: string; name: string; balance: number }[] = []
        for (const acc of s.accounts) {
          if (!acc.isLeaf) continue
          // حساب الرصيد التاريخي - نعتبر كل القيود المرحلة قبل التاريخ
          const filtered = s.journalEntries.filter(
            (e) => e.status === 'posted' && new Date(e.date).getTime() <= atT
          )
          const balance = computeBalance(acc, filtered, s.openingBalances)
          if (balance === 0 && acc.type !== 'equity') continue
          if (acc.type === 'asset') assets.push({ accountId: acc.id, name: acc.name, balance })
          else if (acc.type === 'liability') liabilities.push({ accountId: acc.id, name: acc.name, balance: -balance })
          else if (acc.type === 'equity') equity.push({ accountId: acc.id, name: acc.name, balance: -balance })
        }
        return {
          assets,
          liabilities,
          equity,
          totalAssets: assets.reduce((s, a) => s + a.balance, 0),
          totalLiabilities: liabilities.reduce((s, a) => s + a.balance, 0),
          totalEquity: equity.reduce((s, a) => s + a.balance, 0),
        }
      },
      nextEntryNumber: () => {
        const year = new Date().getFullYear()
        const count = get().journalEntries.filter((e) => e.entryNumber.startsWith(`JE-${year}-`)).length + 1
        return `JE-${year}-${String(count).padStart(4, '0')}`
      },
    }),
    {
      name: 'synapse_accounting',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
