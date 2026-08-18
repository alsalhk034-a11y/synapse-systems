import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Calculator, TrendingUp, TrendingDown, Wallet, Receipt, Plus,
  FileText, BarChart3, BookOpen, DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useAccountingStore } from '@/stores/accountingStore'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/stores/toastStore'
import { formatMoney, formatDate } from '@/lib/format'

type Tab = 'overview' | 'chart' | 'entries' | 'expenses' | 'pnl' | 'balance'

export function AccountingPage() {
  const { t, lang } = useTranslation()
  const isAr = lang === 'ar'
  const hasPerm = useAuthStore((s) => s.hasPermission)
  const user = useAuthStore((s) => s.currentUser)
  const {
    accounts, journalEntries, expenses,
    addExpense, approveExpense, deleteExpense,
    getIncomeStatement, getBalanceSheet
  } = useAccountingStore()

  const [tab, setTab] = useState<Tab>('overview')
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddEntry, setShowAddEntry] = useState(false)

  if (!hasPerm('accounting.view')) {
    return (
      <div className="surface mx-auto max-w-2xl p-8 text-center">
        <h2 className="text-xl font-bold">⛔ {isAr ? 'ليست لديك صلاحية' : 'No permission'}</h2>
        <p className="mt-2 text-sm text-[var(--text-3)]">
          {isAr ? 'لا تملك صلاحية الوصول إلى المحاسبة. تواصل مع مدير النظام.' : 'You do not have access to accounting. Contact admin.'}
        </p>
      </div>
    )
  }

  const pnl = useMemo(() => getIncomeStatement(from, to), [getIncomeStatement, from, to, journalEntries])
  const bs = useMemo(() => getBalanceSheet(to), [getBalanceSheet, to, journalEntries])

  const tabs: Array<{ key: Tab; label: string; icon: any }> = [
    { key: 'overview', label: isAr ? 'نظرة عامة' : 'Overview', icon: BarChart3 },
    { key: 'pnl', label: isAr ? 'قائمة الدخل' : 'P&L', icon: TrendingUp },
    { key: 'balance', label: isAr ? 'الميزانية' : 'Balance Sheet', icon: Wallet },
    { key: 'entries', label: isAr ? 'القيود' : 'Journal', icon: BookOpen },
    { key: 'expenses', label: isAr ? 'المصروفات' : 'Expenses', icon: Receipt },
    { key: 'chart', label: isAr ? 'دليل الحسابات' : 'Chart of Accounts', icon: FileText },
  ]

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.accounting}</h1>
          <p className="text-sm text-[var(--text-3)]">
            {isAr ? 'نظام محاسبة متكامل وفق معايير IFRS - القيد المزدوج' : 'Full accounting per IFRS standards - double entry'}
          </p>
        </div>
        {hasPerm('accounting.manage') && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAddEntry(true)} leftIcon={<Plus className="h-4 w-4" />}>
              {t.newJournalEntry}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowAddExpense(true)} leftIcon={<Plus className="h-4 w-4" />}>
              {t.addExpense}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5">
        {tabs.map((tt) => {
          const Icon = tt.icon
          return (
            <button
              key={tt.key}
              onClick={() => setTab(tt.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === tt.key ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow' : 'text-[var(--text-2)] hover:bg-[var(--bg-2)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tt.label}
            </button>
          )
        })}
      </div>

      {/* Period */}
      {(tab === 'pnl' || tab === 'balance' || tab === 'overview') && (
        <Card>
          <CardBody className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{t.from}</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="!py-1.5 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{t.to}</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="!py-1.5 text-xs" />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t.totalRevenue}
            value={formatMoney(pnl.totalRevenue, 'SYP')}
            icon={TrendingUp}
            color="emerald"
            delta={isAr ? 'للفترة' : 'For period'}
          />
          <StatCard
            label={t.totalExpenses}
            value={formatMoney(pnl.totalExpenses, 'SYP')}
            icon={TrendingDown}
            color="rose"
            delta={isAr ? 'للفترة' : 'For period'}
          />
          <StatCard
            label={pnl.netIncome >= 0 ? t.netIncome : t.netLoss}
            value={formatMoney(Math.abs(pnl.netIncome), 'SYP')}
            icon={pnl.netIncome >= 0 ? TrendingUp : TrendingDown}
            color={pnl.netIncome >= 0 ? 'blue' : 'rose'}
            delta={isAr ? 'هامش ربح' : 'Profit margin'}
          />
          <StatCard
            label={isAr ? 'صافي الأصول' : 'Net Assets'}
            value={formatMoney(bs.totalAssets - bs.totalLiabilities, 'SYP')}
            icon={Wallet}
            color="violet"
            delta={isAr ? 'حتى اليوم' : 'As of today'}
          />
        </div>
      )}

      {/* P&L Tab */}
      {tab === 'pnl' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-emerald-600">{t.revenue}</h3>
            </CardHeader>
            <CardBody>
              {pnl.revenue.length === 0 ? (
                <p className="text-xs text-[var(--text-3)]">{t.noData}</p>
              ) : (
                <table className="w-full text-xs">
                  <tbody>
                    {pnl.revenue.map((r) => (
                      <tr key={r.accountId} className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-semibold">{r.name}</td>
                        <td className="py-1.5 text-end tabular-nums font-bold text-emerald-600">
                          {formatMoney(r.amount, 'SYP')}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                      <td className="py-2 font-bold">{t.totalRevenue}</td>
                      <td className="py-2 text-end tabular-nums font-bold text-emerald-700">
                        {formatMoney(pnl.totalRevenue, 'SYP')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-rose-600">{t.expenses}</h3>
            </CardHeader>
            <CardBody>
              {pnl.expenses.length === 0 ? (
                <p className="text-xs text-[var(--text-3)]">{t.noData}</p>
              ) : (
                <table className="w-full text-xs">
                  <tbody>
                    {pnl.expenses.map((e) => (
                      <tr key={e.accountId} className="border-b border-[var(--border)]">
                        <td className="py-1.5 font-semibold">{e.name}</td>
                        <td className="py-1.5 text-end tabular-nums font-bold text-rose-600">
                          {formatMoney(e.amount, 'SYP')}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20">
                      <td className="py-2 font-bold">{t.totalExpenses}</td>
                      <td className="py-2 text-end tabular-nums font-bold text-rose-700">
                        {formatMoney(pnl.totalExpenses, 'SYP')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
          <Card className="lg:col-span-2">
            <CardBody>
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 p-4">
                <div className="text-sm font-semibold">
                  {pnl.netIncome >= 0 ? t.netIncome : t.netLoss}
                </div>
                <div className={`text-2xl font-bold ${pnl.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatMoney(Math.abs(pnl.netIncome), 'SYP')}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Balance Sheet Tab */}
      {tab === 'balance' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BalanceCard title={t.assets} items={bs.assets} total={bs.totalAssets} color="blue" />
          <BalanceCard title={t.liabilities} items={bs.liabilities} total={bs.totalLiabilities} color="rose" />
          <BalanceCard title={t.equity} items={bs.equity} total={bs.totalEquity} color="violet" />
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold">المعادلة المحاسبية</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2 rounded-xl bg-[var(--bg-2)] p-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span>{t.assets}:</span>
                  <span className="font-bold tabular-nums">{formatMoney(bs.totalAssets, 'SYP')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.liabilities} + {t.equity}:</span>
                  <span className="font-bold tabular-nums">{formatMoney(bs.totalLiabilities + bs.totalEquity, 'SYP')}</span>
                </div>
                <div className={`mt-2 flex justify-between rounded-md p-2 text-xs ${Math.abs(bs.totalAssets - (bs.totalLiabilities + bs.totalEquity)) < 0.01 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30' : 'bg-rose-100 text-rose-800'}`}>
                  <span>الفرق:</span>
                  <span className="font-bold">{formatMoney(bs.totalAssets - bs.totalLiabilities - bs.totalEquity, 'SYP')}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Journal Entries */}
      {tab === 'entries' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold">{t.journalEntries} ({journalEntries.length})</h3>
          </CardHeader>
          <CardBody className="p-0">
            {journalEntries.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--text-3)]">
                {t.noData} - {isAr ? 'لم يتم تسجيل أي قيد بعد' : 'No journal entries yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-2)]/50">
                      <th className="p-2 text-start font-semibold">{t.entryNumber}</th>
                      <th className="p-2 text-start font-semibold">{t.date}</th>
                      <th className="p-2 text-start font-semibold">{t.description || 'الوصف'}</th>
                      <th className="p-2 text-end font-semibold">{t.debit}</th>
                      <th className="p-2 text-end font-semibold">{t.credit}</th>
                      <th className="p-2 text-center font-semibold">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalEntries.slice().reverse().map((je) => {
                      const total = je.lines.reduce((sum, l) => sum + l.debit, 0)
                      return (
                        <tr key={je.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-2)]/30">
                          <td className="p-2 font-mono font-semibold">{je.entryNumber}</td>
                          <td className="p-2 tabular-nums">{formatDate(je.date)}</td>
                          <td className="p-2 max-w-[300px] truncate">{je.description}</td>
                          <td className="p-2 text-end tabular-nums font-bold text-emerald-600">{formatMoney(total, 'SYP')}</td>
                          <td className="p-2 text-end tabular-nums font-bold text-rose-600">{formatMoney(total, 'SYP')}</td>
                          <td className="p-2 text-center">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              je.status === 'posted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-950/30'
                            }`}>
                              {je.status === 'posted' ? t.posted : t.draft}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Expenses */}
      {tab === 'expenses' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-bold">{t.expenses} ({expenses.length})</h3>
            {hasPerm('accounting.manage') && (
              <Button size="sm" onClick={() => setShowAddExpense(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                {t.addExpense}
              </Button>
            )}
          </CardHeader>
          <CardBody className="p-0">
            {expenses.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--text-3)]">{t.noData}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-2)]/50">
                      <th className="p-2 text-start font-semibold">{t.date}</th>
                      <th className="p-2 text-start font-semibold">{t.category}</th>
                      <th className="p-2 text-start font-semibold">{t.description}</th>
                      <th className="p-2 text-start font-semibold">{t.vendor}</th>
                      <th className="p-2 text-end font-semibold">{t.total}</th>
                      <th className="p-2 text-center font-semibold">{t.status}</th>
                      <th className="p-2 text-center font-semibold">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.slice().reverse().map((e) => (
                      <tr key={e.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-2)]/30">
                        <td className="p-2 tabular-nums">{formatDate(e.date)}</td>
                        <td className="p-2">{e.category}</td>
                        <td className="p-2 max-w-[200px] truncate">{e.description}</td>
                        <td className="p-2">{e.vendor || '-'}</td>
                        <td className="p-2 text-end tabular-nums font-bold">{formatMoney(e.amount, e.currency)}</td>
                        <td className="p-2 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            e.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {e.approved ? t.approved : t.pending}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          {!e.approved && hasPerm('accounting.manage') && (
                            <Button size="sm" variant="ghost" onClick={() => approveExpense(e.id, user?.id || '')}>
                              {t.approve}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Chart of Accounts */}
      {tab === 'chart' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold">{t.chartOfAccounts}</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-1">
              {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => {
                const typeAccs = accounts.filter((a) => a.type === type)
                if (typeAccs.length === 0) return null
                return (
                  <div key={type} className="rounded-lg border border-[var(--border)]">
                    <div className="bg-[var(--bg-2)]/50 px-3 py-2 text-xs font-bold uppercase tracking-wider">
                      {t[type as keyof typeof t] || type}
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {typeAccs.map((a) => (
                        <div key={a.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[var(--text-3)]">{a.code}</span>
                            <span className="font-semibold">{a.name}</span>
                            {a.nameEn && <span className="text-[var(--text-3)]">({a.nameEn})</span>}
                          </div>
                          {!a.isLeaf && <span className="text-[10px] text-[var(--text-3)]">رئيسي</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onSave={(data) => {
            addExpense({
              id: 'exp_' + Date.now(),
              ...data,
              createdBy: user?.id || '',
              createdAt: new Date().toISOString(),
              approved: false,
            })
            toast.success(isAr ? 'تم إضافة المصروف' : 'Expense added')
            setShowAddExpense(false)
          }}
        />
      )}

      {showAddEntry && (
        <AddEntryModal
          accounts={accounts}
          onClose={() => setShowAddEntry(false)}
          onSave={(entry) => {
            useAccountingStore.getState().addJournalEntry(entry)
            toast.success(isAr ? 'تم إضافة القيد' : 'Entry added')
            setShowAddEntry(false)
          }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, delta }: { label: string; value: string; icon: any; color: string; delta: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500/10 to-cyan-500/10 text-blue-600',
    emerald: 'from-emerald-500/10 to-teal-500/10 text-emerald-600',
    rose: 'from-rose-500/10 to-pink-500/10 text-rose-600',
    violet: 'from-violet-500/10 to-purple-500/10 text-violet-600',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{label}</div>
          <div className="mt-1.5 text-xl font-bold tabular-nums">{value}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-2 text-[10px] text-[var(--text-3)]">{delta}</div>
    </motion.div>
  )
}

function BalanceCard({ title, items, total, color }: { title: string; items: { accountId: string; name: string; balance: number }[]; total: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/10',
    rose: 'border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/10',
    violet: 'border-violet-500/30 bg-violet-50/30 dark:bg-violet-950/10',
  }
  return (
    <Card className={colors[color]}>
      <CardHeader>
        <h3 className="text-sm font-bold">{title}</h3>
      </CardHeader>
      <CardBody>
        {items.length === 0 ? (
          <p className="text-xs text-[var(--text-3)]">-</p>
        ) : (
          <table className="w-full text-xs">
            <tbody>
              {items.map((i) => (
                <tr key={i.accountId} className="border-b border-[var(--border)]">
                  <td className="py-1.5">{i.name}</td>
                  <td className="py-1.5 text-end tabular-nums font-semibold">{formatMoney(i.balance, 'SYP')}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-current/30">
                <td className="py-2 font-bold">المجموع</td>
                <td className="py-2 text-end tabular-nums font-bold">{formatMoney(total, 'SYP')}</td>
              </tr>
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  )
}

function AddExpenseModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<any>('other')
  const [vendor, setVendor] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<any>('cash')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  return (
    <Modal open onClose={onClose} title="إضافة مصروف" size="md">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">التاريخ</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">الفئة</label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="rent">إيجار</option>
            <option value="utilities">كهرباء وماء</option>
            <option value="salary">رواتب</option>
            <option value="supplies">مستلزمات</option>
            <option value="medication">شراء أدوية</option>
            <option value="equipment">معدات</option>
            <option value="maintenance">صيانة</option>
            <option value="marketing">تسويق</option>
            <option value="insurance">تأمينات</option>
            <option value="tax">ضرائب</option>
            <option value="other">أخرى</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">المبلغ</label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">الوصف</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">المورّد (اختياري)</label>
          <Input value={vendor} onChange={(e) => setVendor(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">طريقة الدفع</label>
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cash">نقداً</option>
            <option value="bank">تحويل بنكي</option>
            <option value="card">بطاقة</option>
            <option value="check">شيك</option>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button
          onClick={() => {
            if (!amount || !description) return
            onSave({
              category, amount: Number(amount), currency: 'SYP', date: new Date(date).toISOString(),
              vendor, description, paymentMethod, receiptNumber: ''
            })
          }}
        >
          حفظ
        </Button>
      </div>
    </Modal>
  )
}

function AddEntryModal({ accounts, onClose, onSave }: { accounts: any[]; onClose: () => void; onSave: (entry: any) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState([
    { id: 'l1', accountId: 'acc_1100', debit: 0, credit: 0, description: '' },
    { id: 'l2', accountId: 'acc_4100', debit: 0, credit: 0, description: '' },
  ])
  const addLine = () => setLines([...lines, { id: 'l' + Date.now(), accountId: 'acc_1100', debit: 0, credit: 0, description: '' }])
  const removeLine = (id: string) => setLines(lines.filter((l) => l.id !== id))
  const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0
  return (
    <Modal open onClose={onClose} title="قيد محاسبي جديد" size="lg">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">التاريخ</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">الوصف</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">البنود (يجب أن يتساوى المدين مع الدائن)</label>
          <div className="rounded-lg border border-[var(--border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-2)]/50">
                  <th className="p-1.5 text-start">الحساب</th>
                  <th className="p-1.5 text-end">مدين</th>
                  <th className="p-1.5 text-end">دائن</th>
                  <th className="p-1.5 text-start">الوصف</th>
                  <th className="p-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={line.id} className="border-b border-[var(--border)]">
                    <td className="p-1">
                      <Select value={line.accountId} onChange={(e) => setLines(lines.map((l, idx) => idx === i ? { ...l, accountId: e.target.value } : l))} className="!py-1 text-xs">
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="p-1">
                      <Input type="number" value={line.debit || ''} onChange={(e) => setLines(lines.map((l, idx) => idx === i ? { ...l, debit: Number(e.target.value), credit: 0 } : l))} className="!py-1 text-xs text-end" placeholder="0" />
                    </td>
                    <td className="p-1">
                      <Input type="number" value={line.credit || ''} onChange={(e) => setLines(lines.map((l, idx) => idx === i ? { ...l, credit: Number(e.target.value), debit: 0 } : l))} className="!py-1 text-xs text-end" placeholder="0" />
                    </td>
                    <td className="p-1">
                      <Input value={line.description} onChange={(e) => setLines(lines.map((l, idx) => idx === i ? { ...l, description: e.target.value } : l))} className="!py-1 text-xs" />
                    </td>
                    <td className="p-1">
                      <button onClick={() => removeLine(line.id)} className="text-rose-500 hover:text-rose-700">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--border)] bg-[var(--bg-2)]/30 font-bold">
                  <td className="p-1.5">المجموع</td>
                  <td className="p-1.5 text-end tabular-nums text-emerald-600">{totalDebit}</td>
                  <td className="p-1.5 text-end tabular-nums text-rose-600">{totalCredit}</td>
                  <td colSpan={2} className={`p-1.5 text-center text-[10px] ${balanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {balanced ? '✓ متوازن' : '⚠ غير متوازن'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <Button size="sm" variant="ghost" onClick={addLine} className="mt-2">+ إضافة بند</Button>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>إلغاء</Button>
        <Button
          disabled={!balanced || !description}
          onClick={() => {
            const num = useAccountingStore.getState().nextEntryNumber()
            onSave({
              id: 'je_' + Date.now(),
              entryNumber: num,
              date: new Date(date).toISOString(),
              description,
              lines: lines.map((l) => ({ ...l, id: l.id + '_' + Date.now() })),
              status: 'draft',
              createdBy: '',
              createdAt: new Date().toISOString(),
            })
          }}
        >
          حفظ
        </Button>
      </div>
    </Modal>
  )
}
