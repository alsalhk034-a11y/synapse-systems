import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Receipt,
  Settings,
  Activity,
  Hexagon,
  LogOut,
  Calculator,
  Shield,
  UserCircle,
  Activity as ActivityIcon,
  ListOrdered,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import type { Permission } from '@/types/user'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  /** تظهر فقط لمن لديه هذه الصلاحية */
  perm?: Permission
  /** تظهر فقط لهذه الأدوار كحل بديل */
  roles?: Array<'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient'>
  badge?: string
}

export function Sidebar() {
  const { t, lang } = useTranslation()
  const { currentUser, logout, hasRole, hasPermission } = useAuthStore()
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebar = useUIStore((s) => s.setSidebar)

  const isPatient = currentUser?.role === 'patient'

  const items: NavItem[] = [
    // للمرضى: بوابة فقط
    ...(isPatient
      ? [
          { to: '/portal', label: t.myPortal || 'بوابتي', icon: UserCircle } as NavItem,
        ]
      : ([
          { to: '/', label: t.dashboard, icon: LayoutDashboard },
          { to: '/queue', label: lang === 'ar' ? 'لوحة الدور' : 'Queue', icon: ListOrdered, badge: 'LIVE' },
          { to: '/patients', label: t.patients, icon: Users },
          { to: '/appointments', label: t.appointments, icon: CalendarDays },
          { to: '/exams', label: t.exams, icon: FileText, perm: 'exam.view' as Permission },
          { to: '/invoices', label: t.invoices, icon: Receipt },
          { to: '/accounting', label: t.accounting, icon: Calculator, perm: 'accounting.view' as Permission },
          { to: '/reports', label: t.reports, icon: Activity, perm: 'reports.view' as Permission },
          { to: '/users', label: t.userManagement, icon: Shield, perm: 'users.manage' as Permission },
          { to: '/audit', label: t.audit, icon: ActivityIcon, perm: 'audit.view' as Permission },
          { to: '/settings', label: t.settings, icon: Settings, perm: 'settings.view' as Permission },
        ] as NavItem[])),
  ]

  const visible = items.filter((it) => {
    if (it.perm) return hasPermission(it.perm)
    if (it.roles) return hasRole(...it.roles)
    return true
  })

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside
        className={cn(
          'fixed top-0 z-40 h-full border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl transition-all duration-300',
          lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r',
          sidebarOpen ? 'w-64' : 'w-[68px]',
          'max-lg:translate-x-0',
          !sidebarOpen && 'max-lg:-translate-x-full rtl:max-lg:translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-violet-500 shadow-glow">
              <Hexagon className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: lang === 'ar' ? 8 : -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="min-w-0"
              >
                <div className="truncate text-sm font-bold text-[var(--text)]">
                  {lang === 'ar' ? t.brand : t.brandEn}
                </div>
                <div className="truncate text-[10px] text-[var(--text-3)]">
                  {lang === 'ar' ? t.tagline : t.synEn}
                </div>
              </motion.div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-0.5">
              {visible.map((it) => (
                <li key={it.to}>
                  <NavLink
                    to={it.to}
                    end={it.to === '/'}
                    onClick={() => { if (window.innerWidth < 1024) setSidebar(false) }}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                        isActive
                          ? 'bg-[var(--primary)]/10 text-[var(--primary-2)] font-medium'
                          : 'text-[var(--text-2)] hover:bg-[var(--bg-2)] hover:text-[var(--text)]'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="nav-indicator"
                            className="absolute inset-y-2 w-0.5 rounded-full bg-gradient-to-b from-blue-500 to-violet-500"
                            style={lang === 'ar' ? { right: -12 } : { left: -12 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                        <it.icon className="h-[18px] w-[18px] shrink-0" />
                        {sidebarOpen && <span className="truncate">{it.label}</span>}
                        {it.badge && sidebarOpen && (
                          <span className="ms-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {it.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-[var(--border)] p-3">
            {currentUser && (
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg p-2',
                  sidebarOpen && 'bg-[var(--bg-2)]'
                )}
              >
                <Avatar name={currentUser.fullName} size="sm" />
                {sidebarOpen && (
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-[var(--text)]">
                      {currentUser.fullName}
                    </div>
                    <div className="truncate text-[10px] text-[var(--text-3)] capitalize">
                      {String(t[currentUser.role as keyof typeof t] ?? currentUser.role)}
                    </div>
                  </div>
                )}
                {sidebarOpen && (
                  <button
                    onClick={logout}
                    title={t.logout}
                    className="rounded-md p-1.5 text-[var(--text-3)] hover:bg-[var(--surface)] hover:text-rose-500"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
