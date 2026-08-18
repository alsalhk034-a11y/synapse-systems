import { useTranslation } from '@/hooks/useTranslation'
import { Keyboard, Command, Search, FilePlus, Stethoscope, Printer, Save, RefreshCw, Home, Users, CalendarDays, Receipt, FileText, BarChart3, Settings as SettingsIcon, ArrowRight } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/Motion'

export function ShortcutsPage() {
  const { lang } = useTranslation()
  const isAr = lang === 'ar'
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 shadow-glow">
            <Keyboard className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {isAr ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
            </h1>
            <p className="text-sm text-[var(--text-2)]">
              {isAr
                ? 'استخدم هذه الاختصارات لتسريع عملك اليومي'
                : 'Use these shortcuts to speed up your daily work'}
            </p>
          </div>
        </div>
      </FadeIn>

      <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StaggerItem>
          <Card padding="md">
            <CardHeader
              title={isAr ? 'إجراءات سريعة' : 'Quick actions'}
              icon={<Command className="h-4 w-4" />}
            />
            <div className="mt-3 space-y-2">
              <ShortcutItem
                keys={['Ctrl', 'K']}
                label={isAr ? 'فتح لوحة الأوامر' : 'Open command palette'}
                icon={<Search className="h-3.5 w-3.5" />}
              />
              <ShortcutItem
                keys={['Ctrl', 'N']}
                label={isAr ? 'مريض جديد' : 'New patient'}
                icon={<FilePlus className="h-3.5 w-3.5" />}
              />
              <ShortcutItem
                keys={['Ctrl', 'E']}
                label={isAr ? 'بدء كشف' : 'New exam'}
                icon={<Stethoscope className="h-3.5 w-3.5" />}
              />
              <ShortcutItem
                keys={['Ctrl', 'I']}
                label={isAr ? 'فاتورة جديدة' : 'New invoice'}
                icon={<Receipt className="h-3.5 w-3.5" />}
              />
              <ShortcutItem
                keys={['Ctrl', 'S']}
                label={isAr ? 'حفظ' : 'Save'}
                icon={<Save className="h-3.5 w-3.5" />}
              />
              <ShortcutItem
                keys={['Ctrl', 'P']}
                label={isAr ? 'طباعة' : 'Print'}
                icon={<Printer className="h-3.5 w-3.5" />}
              />
              <ShortcutItem
                keys={['Ctrl', 'Shift', 'S']}
                label={isAr ? 'مزامنة يدوية' : 'Manual sync'}
                icon={<RefreshCw className="h-3.5 w-3.5" />}
              />
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card padding="md">
            <CardHeader
              title={isAr ? 'التنقل السريع' : 'Quick navigation'}
              icon={<ArrowRight className="h-4 w-4" />}
              description={isAr ? 'اضغط G ثم الحرف' : 'Press G then key'}
            />
            <div className="mt-3 space-y-2">
              <NavItem keys={['G', 'D']} label={isAr ? 'لوحة التحكم' : 'Dashboard'} icon={<Home className="h-3.5 w-3.5" />} />
              <NavItem keys={['G', 'P']} label={isAr ? 'المرضى' : 'Patients'} icon={<Users className="h-3.5 w-3.5" />} />
              <NavItem keys={['G', 'A']} label={isAr ? 'المواعيد' : 'Appointments'} icon={<CalendarDays className="h-3.5 w-3.5" />} />
              <NavItem keys={['G', 'E']} label={isAr ? 'الكشوفات' : 'Exams'} icon={<Stethoscope className="h-3.5 w-3.5" />} />
              <NavItem keys={['G', 'I']} label={isAr ? 'الفواتير' : 'Invoices'} icon={<Receipt className="h-3.5 w-3.5" />} />
              <NavItem keys={['G', 'R']} label={isAr ? 'التقارير' : 'Reports'} icon={<BarChart3 className="h-3.5 w-3.5" />} />
              <NavItem keys={['G', 'S']} label={isAr ? 'الإعدادات' : 'Settings'} icon={<SettingsIcon className="h-3.5 w-3.5" />} />
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem className="md:col-span-2">
          <Card padding="md">
            <CardHeader
              title={isAr ? 'نصائح للاستخدام السريع' : 'Productivity tips'}
              icon={<Sparkles />}
            />
            <ul className="mt-3 space-y-2 text-sm text-[var(--text-2)]">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {isAr
                  ? 'استخدم Ctrl+K من أي مكان للبحث السريع، والتنقل، وتنفيذ الإجراءات'
                  : 'Use Ctrl+K from anywhere to search, navigate, and execute actions quickly'}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                {isAr
                  ? 'في صفحة الكشف، اضغط Ctrl+S لحفظ الكشف الحالي'
                  : 'In the exam page, press Ctrl+S to save the current exam'}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                {isAr
                  ? 'افتح تبويبين أو أكثر لمشاركة البيانات بين الممرض/ة والطبيب (محاكاة المزامنة)'
                  : 'Open two or more tabs to share data between nurse and doctor (sync simulation)'}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {isAr
                  ? 'اضغط Esc لإغلاق النوافذ والوحات المفتوحة'
                  : 'Press Esc to close open modals and panels'}
              </li>
            </ul>
          </Card>
        </StaggerItem>
      </Stagger>
    </div>
  )
}

function ShortcutItem({
  keys,
  label,
  icon,
}: {
  keys: string[]
  label: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5">
      <div className="flex items-center gap-2 text-sm">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary-2)]">
          {icon}
        </div>
        <span className="text-[var(--text)]">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            <Kbd>{k}</Kbd>
            {i < keys.length - 1 && <span className="text-[10px] text-[var(--text-3)]">+</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

function NavItem({
  keys,
  label,
  icon,
}: {
  keys: string[]
  label: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5">
      <div className="flex items-center gap-2 text-sm">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/10 text-violet-500">
          {icon}
        </div>
        <span className="text-[var(--text)]">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            <Kbd>{k}</Kbd>
            {i < keys.length - 1 && <span className="text-[10px] text-[var(--text-3)]">then</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-2)] px-1.5 font-mono text-[10px] font-semibold text-[var(--text-2)] shadow-[0_1px_0_var(--border-strong)]">
      {children}
    </kbd>
  )
}

function Sparkles() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
