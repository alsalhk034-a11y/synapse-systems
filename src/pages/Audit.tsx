import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Activity, Trash2 } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuditStore } from '@/stores/auditStore'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { FadeIn } from '@/components/ui/Motion'
import { formatDateTime, formatRelative } from '@/lib/format'
import { useDebounce } from '@/hooks/useDebounce'
import { useConfirm } from '@/components/notifications/Confirm'

export function AuditPage() {
  const { t, lang } = useTranslation()
  const entries = useAuditStore((s) => s.entries)
  const clear = useAuditStore((s) => s.clear)
  const confirm = useConfirm()
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 200)

  const filtered = useMemo(() => {
    if (!debounced) return entries
    const lower = debounced.toLowerCase()
    return entries.filter(
      (e) =>
        e.userName.toLowerCase().includes(lower) ||
        e.action.toLowerCase().includes(lower) ||
        e.entityType.toLowerCase().includes(lower)
    )
  }, [entries, debounced])

  return (
    <div className="space-y-5">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t.auditLog}</h1>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              {lang === 'ar' ? `${entries.length} عملية مسجلة` : `${entries.length} logged operations`}
            </p>
          </div>
          <button
            onClick={async () => {
              const ok = await confirm({
                title: lang === 'ar' ? 'مسح سجل التدقيق؟' : 'Clear audit log?',
                description: lang === 'ar'
                  ? `سيتم حذف ${entries.length} عملية مسجلة. هذا الإجراء لا يمكن التراجع عنه.`
                  : `This will delete ${entries.length} logged operations. This action cannot be undone.`,
                confirmText: lang === 'ar' ? 'مسح' : 'Clear',
                cancelText: t.cancel,
                tone: 'danger',
              })
              if (ok) clear()
            }}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:border-rose-500/60 dark:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {lang === 'ar' ? 'مسح السجل' : 'Clear log'}
          </button>
        </div>
      </FadeIn>

      <Card padding="sm" className="!p-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === 'ar' ? 'بحث في السجل...' : 'Search audit log...'}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          size="lg"
          tone="default"
          title={t.noLogs}
          description={
            lang === 'ar'
              ? 'سيتم تسجيل كل الإجراءات تلقائياً هنا. ابدأ باستخدام النظام لرؤية السجل.'
              : 'All actions are automatically logged here. Start using the system to see the log.'
          }
          icon={<Activity />}
        />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-3.5 transition-colors hover:bg-[var(--bg-2)]/40"
              >
                <Avatar name={e.userName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text)]">{e.userName}</span>
                    <Badge tone="primary">{e.action}</Badge>
                    <Badge tone="neutral">{e.entityType}</Badge>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--text-3)]" title={formatDateTime(e.createdAt, lang)}>
                    {formatRelative(e.createdAt, lang)}
                  </div>
                </div>
                <div className="text-end text-[10px] font-mono text-[var(--text-3)]">
                  {e.entityId.slice(0, 12)}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
