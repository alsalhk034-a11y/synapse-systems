import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useInvoicesStore } from '@/stores/invoicesStore'
import { usePatientsStore } from '@/stores/patientsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Stagger, StaggerItem, FadeIn } from '@/components/ui/Motion'
import { formatCurrency, formatDate } from '@/lib/format'
import { CURRENCY_SYMBOLS, type InvoiceStatus } from '@/types/invoice'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

export function InvoicesPage() {
  const { t, lang } = useTranslation()
  const navigate = useNavigate()
  const invoices = useInvoicesStore((s) => s.invoices)
  const patients = usePatientsStore((s) => s.patients)
  const clinicCurrency = useSettingsStore((s) => s.clinic.currency)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const debounced = useDebounce(query, 200)

  const filtered = useMemo(() => {
    let list = invoices
    if (debounced) {
      const lower = debounced.toLowerCase()
      list = list.filter((i) => {
        const p = patients.find((pp) => pp.id === i.patientId)
        return (
          i.number.toLowerCase().includes(lower) ||
          (p?.fullName.toLowerCase().includes(lower) ?? false)
        )
      })
    }
    if (statusFilter !== 'all') {
      list = list.filter((i) => i.status === statusFilter)
    }
    return list
  }, [invoices, debounced, statusFilter, patients])

  const stats = useMemo(() => {
    const total = invoices.reduce((s, i) => s + i.total, 0)
    const paid = invoices.reduce((s, i) => s + i.paid, 0)
    const pending = invoices.reduce((s, i) => s + (i.total - i.paid), 0)
    return { total, paid, pending, count: invoices.length }
  }, [invoices])

  return (
    <div className="space-y-5">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t.invoices}</h1>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              {lang === 'ar' ? `${stats.count} فاتورة` : `${stats.count} invoices`}
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/invoices/new')}
          >
            {t.newInvoiceTitle}
          </Button>
        </div>
      </FadeIn>

      {/* Stat Cards */}
      <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: t.totalRevenue,
            value: stats.total,
            icon: TrendingUp,
            color: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-500/10 text-blue-500',
          },
          {
            label: t.paid,
            value: stats.paid,
            icon: CheckCircle2,
            color: 'from-teal-500 to-emerald-500',
            bg: 'bg-teal-500/10 text-teal-500',
          },
          {
            label: t.remaining,
            value: stats.pending,
            icon: Clock,
            color: 'from-amber-500 to-orange-500',
            bg: 'bg-amber-500/10 text-amber-500',
          },
        ].map((s, i) => (
          <StaggerItem key={i}>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className={cn('grid h-10 w-10 place-items-center rounded-xl', s.bg)}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {s.label}
                  </div>
                  <div className="text-lg font-bold">
                    <AnimatedNumber value={s.value} />{' '}
                    <span className="text-xs font-normal text-[var(--text-3)]">
                      {CURRENCY_SYMBOLS[clinicCurrency]}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      {/* Search + Filters */}
      <Card padding="sm" className="!p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث برقم الفاتورة أو اسم المريض...' : 'Search by invoice # or patient...'}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-0.5">
            {(
              [
                { v: 'all' as const, l: lang === 'ar' ? 'الكل' : 'All' },
                { v: 'paid' as InvoiceStatus, l: t.invoiceStatusPaid },
                { v: 'pending' as InvoiceStatus, l: t.invoiceStatusPending },
                { v: 'partial' as InvoiceStatus, l: t.invoiceStatusPartial },
              ]
            ).map((f) => (
              <button
                key={f.v}
                onClick={() => setStatusFilter(f.v as any)}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
                  statusFilter === f.v
                    ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                    : 'text-[var(--text-2)] hover:text-[var(--text)]'
                )}
              >
                {f.l}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          size="lg"
          tone="success"
          title={t.noInvoices}
          description={
            lang === 'ar'
              ? 'لم يتم إنشاء أي فواتير بعد. أنشئ فاتورة جديدة لمتابعة المدفوعات.'
              : 'No invoices created yet. Create a new invoice to track payments.'
          }
          icon={<Receipt />}
          action={
            <Button variant="primary" onClick={() => navigate('/invoices/new')} leftIcon={<Plus className="h-4 w-4" />}>
              {t.newInvoiceTitle}
            </Button>
          }
        />
      ) : (
        <Stagger className="space-y-2">
          {filtered.map((inv) => {
            const p = patients.find((pp) => pp.id === inv.patientId)
            const tone = {
              paid: 'success' as const,
              pending: 'warning' as const,
              partial: 'info' as const,
              draft: 'neutral' as const,
              cancelled: 'danger' as const,
            }[inv.status]
            return (
              <StaggerItem key={inv.id}>
                <Card hover padding="sm" className="!p-3 cursor-pointer" onClick={() => navigate('/invoices/' + inv.id)}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--text)]">{inv.number}</span>
                        <Badge tone={tone}>
                          {t[`invoiceStatus${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}` as keyof typeof t] as string}
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--text-3)]">
                        {p?.fullName ?? '—'} • {formatDate(inv.createdAt, lang)} • {inv.items.length} {lang === 'ar' ? 'بند' : 'items'}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-sm font-bold text-[var(--text)]">
                        {formatCurrency(inv.total, inv.currency, lang)}
                      </div>
                      {inv.paid > 0 && inv.paid < inv.total && (
                        <div className="text-[10px] text-amber-600">
                          {formatCurrency(inv.paid, inv.currency, lang)} {lang === 'ar' ? 'من' : 'of'}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}
    </div>
  )
}
