import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, FileText, Stethoscope, Plus } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useExamsStore } from '@/stores/examsStore'
import { usePatientsStore } from '@/stores/patientsStore'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PatientBadge } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Stagger, StaggerItem, FadeIn } from '@/components/ui/Motion'
import { formatDate } from '@/lib/format'
import { useDebounce } from '@/hooks/useDebounce'

export function ExamsPage() {
  const { t, lang } = useTranslation()
  const navigate = useNavigate()
  const exams = useExamsStore((s) => s.exams)
  const patients = usePatientsStore((s) => s.patients)
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 200)

  const filtered = useMemo(() => {
    let list = [...exams].sort(
      (a, b) => +new Date(b.examDate) - +new Date(a.examDate)
    )
    if (debounced) {
      const lower = debounced.toLowerCase()
      list = list.filter((e) => {
        const p = patients.find((pp) => pp.id === e.patientId)
        return (
          e.diagnosis.toLowerCase().includes(lower) ||
          e.chiefComplaint.toLowerCase().includes(lower) ||
          (p?.fullName.toLowerCase().includes(lower) ?? false)
        )
      })
    }
    return list
  }, [exams, debounced, patients])

  return (
    <div className="space-y-5">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t.exams}</h1>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              {lang === 'ar' ? `${exams.length} كشف` : `${exams.length} exams`}
            </p>
          </div>
        </div>
      </FadeIn>

      <Card padding="sm" className="!p-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === 'ar' ? 'بحث بالتشخيص أو المريض...' : 'Search by diagnosis or patient...'}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          size="lg"
          tone="primary"
          title={lang === 'ar' ? 'لا توجد كشوفات' : 'No exams'}
          description={
            lang === 'ar'
              ? 'لم يتم تسجيل أي كشوفات بعد. ابدأ بزيارة ملف مريض لتسجيل كشف جديد.'
              : 'No exams recorded yet. Visit a patient file to start a new exam.'
          }
          icon={<Stethoscope />}
          action={
            <Button variant="primary" onClick={() => navigate('/patients')} leftIcon={<Plus className="h-4 w-4" />}>
              {t.patients}
            </Button>
          }
        />
      ) : (
        <Stagger className="space-y-2">
          {filtered.map((e) => {
            const p = patients.find((pp) => pp.id === e.patientId)
            if (!p) return null
            return (
              <StaggerItem key={e.id}>
                <Card hover padding="sm" className="!p-3 cursor-pointer" onClick={() => navigate(`/exams/${p.id}/${e.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-500/10 text-teal-500">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <PatientBadge name={p.fullName} size="sm" />
                        <span className="text-[11px] text-[var(--text-3)]">
                          {formatDate(e.examDate, lang)}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-sm font-semibold">{e.diagnosis}</div>
                      {e.chiefComplaint && (
                        <div className="line-clamp-1 text-[11px] text-[var(--text-2)]">
                          {e.chiefComplaint}
                        </div>
                      )}
                    </div>
                    {e.prescriptions.length > 0 && (
                      <Badge tone="subtle">
                        {e.prescriptions.length} {lang === 'ar' ? 'دواء' : 'rx'}
                      </Badge>
                    )}
                    <FileText className="h-4 w-4 text-[var(--text-3)] rtl:rotate-180" />
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
