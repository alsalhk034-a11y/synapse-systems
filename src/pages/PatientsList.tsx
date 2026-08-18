import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Search, Users, ArrowUpRight, Cake, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { usePatientsStore } from '@/stores/patientsStore'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar, PatientBadge } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Stagger, StaggerItem, FadeIn } from '@/components/ui/Motion'
import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { formatAge, formatRelative } from '@/lib/format'

export function PatientsListPage() {
  const { t, lang } = useTranslation()
  const navigate = useNavigate()
  const patients = usePatientsStore((s) => s.patients)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [pageSize, setPageSize] = useState(24)
  const debounced = useDebounce(query, 200)

  const filtered = useMemo(() => {
    let list = patients
    const lower = debounced.toLowerCase().trim()
    if (lower) {
      list = list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(lower) ||
          p.phone.toLowerCase().includes(lower) ||
          p.parentName.toLowerCase().includes(lower) ||
          p.parentPhone.toLowerCase().includes(lower)
      )
    }
    if (filter !== 'all') {
      const now = Date.now()
      const ranges = { today: 86_400_000, week: 7 * 86_400_000, month: 30 * 86_400_000 }
      list = list.filter((p) => {
        if (!p.lastVisitAt) return false
        const dt = now - +new Date(p.lastVisitAt)
        return dt < ranges[filter]
      })
    }
    return list
  }, [patients, debounced, filter])

  const stats = useMemo(
    () => ({
      total: patients.length,
      male: patients.filter((p) => p.gender === 'male').length,
      female: patients.filter((p) => p.gender === 'female').length,
      allergies: patients.filter((p) => p.allergies && p.allergies.trim()).length,
    }),
    [patients]
  )

  const pagination = usePagination(filtered, pageSize)

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t.patients}</h1>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              {lang === 'ar'
                ? pagination.total > 0
                  ? `عرض ${(pagination.page - 1) * pagination.pageSize + 1}–${Math.min(pagination.page * pagination.pageSize, pagination.total)} من أصل ${pagination.total} مريض`
                  : 'لا يوجد مرضى'
                : pagination.total > 0
                ? `Showing ${(pagination.page - 1) * pagination.pageSize + 1}–${Math.min(pagination.page * pagination.pageSize, pagination.total)} of ${pagination.total} patients`
                : 'No patients'}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/patients/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            {t.addPatient}
          </Button>
        </div>
      </FadeIn>

      {/* Filters + Search */}
      <Card padding="sm" className="!p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPatients}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-0.5">
            {(
              [
                { v: 'all', l: lang === 'ar' ? 'الكل' : 'All' },
                { v: 'today', l: t.today },
                { v: 'week', l: t.thisWeek },
                { v: 'month', l: t.thisMonth },
              ] as const
            ).map((f) => (
              <button
                key={f.v}
                onClick={() => setFilter(f.v)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === f.v
                    ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                    : 'text-[var(--text-2)] hover:text-[var(--text)]'
                }`}
              >
                {f.l}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: t.totalPatients, value: stats.total, color: 'from-blue-500 to-cyan-500' },
          { label: t.male, value: stats.male, color: 'from-sky-500 to-blue-600' },
          { label: t.female, value: stats.female, color: 'from-rose-500 to-pink-600' },
          { label: t.allergies, value: stats.allergies, color: 'from-amber-500 to-orange-500' },
        ].map((s) => (
          <Card key={s.label} padding="sm" className="!p-4">
            <div className="flex items-center gap-3">
              <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${s.color}`} />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-3)]">{s.label}</div>
                <div className="text-lg font-bold">{s.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          size="lg"
          tone="primary"
          title={query ? (lang === 'ar' ? 'لا توجد نتائج للبحث' : 'No search results') : t.noPatients || (lang === 'ar' ? 'لا يوجد مرضى بعد' : 'No patients yet')}
          description={
            query
              ? lang === 'ar' ? `لم نعثر على نتائج لـ "${query}". جرب البحث بكلمات أخرى.` : `No results for "${query}". Try different keywords.`
              : lang === 'ar' ? 'ابدأ بإضافة أول مريض للعيادة. ستجد كل بياناته ومواعيده في مكان واحد.' : 'Start by adding the first patient. All their data and visits will be organized here.'
          }
          icon={<Users />}
          action={
            <Button variant="primary" onClick={() => navigate('/patients/new')} leftIcon={<Plus className="h-4 w-4" />}>
              {t.addPatient}
            </Button>
          }
        />
      ) : (
        <>
          <Stagger className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pagination.pagedItems.map((p) => (
              <StaggerItem key={p.id}>
                <Link
                  to={`/patients/${p.id}`}
                  className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  style={{ textDecoration: 'none' }}
                >
                  <Card
                    hover
                    className="cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={p.fullName} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-[var(--text)]">
                              {p.fullName}
                            </h3>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--text-2)]">
                              <Cake className="h-3 w-3" />
                              {formatAge(p.birthDate, lang)} • {p.gender === 'male' ? t.male : t.female}
                            </div>
                          </div>
                          <ArrowUpRight className="h-3.5 w-3.5 text-[var(--text-3)] opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.bloodType && <Badge tone="info">{p.bloodType}</Badge>}
                          {p.allergies && p.allergies.trim() && (
                            <Badge tone="warning">{t.allergies}</Badge>
                          )}
                          {p.chronicConditions && p.chronicConditions.trim() && (
                            <Badge tone="danger">{t.chronicConditions}</Badge>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5 text-[11px] text-[var(--text-3)]">
                          <span className="truncate">{p.phone}</span>
                          <span>
                            {p.lastVisitAt
                              ? formatRelative(p.lastVisitAt, lang)
                              : t.neverVisited}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>

          {/* Pagination footer */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-2)]">
                <span>{lang === 'ar' ? 'لكل صفحة:' : 'Per page:'}</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-medium"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={96}>96</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!pagination.hasPrev}
                  onClick={() => pagination.setPage(pagination.page - 1)}
                  aria-label="Previous page"
                >
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      const current = pagination.page
                      return p === 1 || p === pagination.totalPages || Math.abs(p - current) <= 1
                    })
                    .map((p, i, arr) => {
                      const prev = arr[i - 1]
                      const showGap = prev && p - prev > 1
                      return (
                        <div key={p} className="flex items-center gap-1">
                          {showGap && <span className="px-1 text-xs text-[var(--text-3)]">…</span>}
                          <button
                            onClick={() => pagination.setPage(p)}
                            className={`h-8 min-w-[2rem] rounded-md px-2 text-xs font-semibold transition-all ${
                              p === pagination.page
                                ? 'bg-[var(--primary)] text-white shadow-sm'
                                : 'text-[var(--text-2)] hover:bg-[var(--bg-2)] hover:text-[var(--text)]'
                            }`}
                          >
                            {p}
                          </button>
                        </div>
                      )
                    })}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!pagination.hasNext}
                  onClick={() => pagination.setPage(pagination.page + 1)}
                  aria-label="Next page"
                >
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
