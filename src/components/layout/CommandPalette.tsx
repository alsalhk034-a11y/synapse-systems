import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Users, CalendarDays, Receipt, FileText, Plus, Settings, Home, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { useTranslation } from '@/hooks/useTranslation'
import { usePatientsStore } from '@/stores/patientsStore'
import { useAppointmentsStore } from '@/stores/appointmentsStore'
import { useInvoicesStore } from '@/stores/invoicesStore'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  label: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  group: string
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen)
  const close = useUIStore((s) => s.closeCommand)
  const { t, lang } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const patients = usePatientsStore((s) => s.patients)
  const appointments = useAppointmentsStore((s) => s.appointments)
  const invoices = useInvoicesStore((s) => s.invoices)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActive(0)
    }
  }, [open])

  const items: CommandItem[] = useMemo(() => {
    const nav: CommandItem[] = [
      { id: 'n1', label: t.dashboard, icon: Home, group: lang === 'ar' ? 'التنقل' : 'Navigation', action: () => navigate('/') },
      { id: 'n2', label: t.patients, icon: Users, group: lang === 'ar' ? 'التنقل' : 'Navigation', action: () => navigate('/patients') },
      { id: 'n3', label: t.appointments, icon: CalendarDays, group: lang === 'ar' ? 'التنقل' : 'Navigation', action: () => navigate('/appointments') },
      { id: 'n4', label: t.invoices, icon: Receipt, group: lang === 'ar' ? 'التنقل' : 'Navigation', action: () => navigate('/invoices') },
      { id: 'n5', label: t.exams, icon: FileText, group: lang === 'ar' ? 'التنقل' : 'Navigation', action: () => navigate('/exams') },
      { id: 'n6', label: t.settings, icon: Settings, group: lang === 'ar' ? 'التنقل' : 'Navigation', action: () => navigate('/settings') },
      { id: 'n7', label: t.reports, icon: Activity, group: lang === 'ar' ? 'التنقل' : 'Navigation', action: () => navigate('/reports') },
      { id: 'a1', label: t.newPatient, icon: Plus, group: lang === 'ar' ? 'إجراءات' : 'Actions', action: () => navigate('/patients/new') },
      { id: 'a2', label: t.newAppointment, icon: Plus, group: lang === 'ar' ? 'إجراءات' : 'Actions', action: () => navigate('/appointments?new=1') },
      { id: 'a3', label: t.newInvoice, icon: Plus, group: lang === 'ar' ? 'إجراءات' : 'Actions', action: () => navigate('/invoices/new') },
    ]
    const patientsItems: CommandItem[] = patients.slice(0, 50).map((p) => ({
      id: 'p_' + p.id,
      label: p.fullName,
      hint: p.phone,
      icon: Users,
      group: lang === 'ar' ? 'المرضى' : 'Patients',
      action: () => navigate('/patients/' + p.id),
    }))
    return [...nav, ...patientsItems]
  }, [navigate, t, lang, patients])

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter((i) => i.label.toLowerCase().includes(q) || (i.hint ?? '').toLowerCase().includes(q))
  }, [query, items])

  const grouped = useMemo(() => {
    const g: Record<string, CommandItem[]> = {}
    for (const it of filtered) {
      if (!g[it.group]) g[it.group] = []
      g[it.group].push(it)
    }
    return g
  }, [filtered])

  const flat = useMemo(() => Object.values(grouped).flat(), [grouped])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => Math.min(flat.length - 1, a + 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => Math.max(0, a - 1))
      }
      if (e.key === 'Enter') {
        const it = flat[active]
        if (it) {
          it.action()
          close()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, flat, active, close])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
              <Search className="h-4 w-4 text-[var(--text-3)]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث عن أي شيء...' : 'Search anything...'}
                className="h-12 flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none"
              />
              <kbd className="rounded border border-[var(--border)] bg-[var(--bg-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-3)]">
                ESC
              </kbd>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {Object.entries(grouped).map(([group, list]) => (
                <div key={group} className="mb-1">
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {group}
                  </div>
                  <ul>
                    {list.map((it) => {
                      const idx = flat.indexOf(it)
                      const isActive = idx === active
                      return (
                        <li key={it.id}>
                          <button
                            onMouseEnter={() => setActive(idx)}
                            onClick={() => {
                              it.action()
                              close()
                            }}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start text-sm transition-colors',
                              isActive ? 'bg-[var(--primary)]/10 text-[var(--text)]' : 'text-[var(--text-2)]'
                            )}
                          >
                            <it.icon className={cn('h-4 w-4', isActive ? 'text-[var(--primary-2)]' : 'text-[var(--text-3)]')} />
                            <span className="flex-1 truncate font-medium">{it.label}</span>
                            {it.hint && <span className="text-[11px] text-[var(--text-3)]">{it.hint}</span>}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
              {flat.length === 0 && (
                <div className="px-2 py-6 text-center text-sm text-[var(--text-3)]">
                  {t.noResults}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg-2)]/50 px-4 py-2 text-[10px] text-[var(--text-3)]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1">↑↓</kbd>
                  {lang === 'ar' ? 'تنقل' : 'Navigate'}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1">↵</kbd>
                  {lang === 'ar' ? 'اختيار' : 'Select'}
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Synapse
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M12 3v3M12 18v3M5 12H2M22 12h-3M6.3 6.3l-2-2M19.7 19.7l-2-2M6.3 17.7l-2 2M19.7 4.3l-2 2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
