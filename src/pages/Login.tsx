import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Hexagon, LogIn, Languages, Eye, EyeOff, Sparkles, ShieldCheck, Cpu, Activity, ArrowRight, UserCircle, Stethoscope } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { useAuditStore } from '@/stores/auditStore'
import { HexagonalBackground } from '@/components/hexagonal/HexagonalBackground'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const { t, lang } = useTranslation()
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const login = useAuthStore((s) => s.login)
  const currentUser = useAuthStore((s) => s.currentUser)
  const log = useAuditStore((s) => s.log)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loginMode, setLoginMode] = useState<'staff' | 'patient'>('staff')

  // إعادة التوجيه في useEffect لتجنب re-render loop
  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'patient' ? '/portal' : '/', { replace: true })
    }
  }, [currentUser, navigate])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    const ok = login(username, password)
    if (ok) {
      const u = useAuthStore.getState().currentUser
      if (u) {
        log({ userId: u.id, userName: u.fullName, action: 'login', entityType: 'session', entityId: u.id })
        // المريض يذهب إلى البوابة مباشرة
        navigate(u.role === 'patient' ? '/portal' : '/')
      }
    } else {
      setError(t.invalidCredentials)
    }
    setLoading(false)
  }

  const fillDemo = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)]">
      <HexagonalBackground intensity={0.9} />

      {/* Gradient washes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -end-32 h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute -bottom-32 -start-32 h-96 w-96 rounded-full bg-violet-500/20 blur-[120px]" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-violet-500 shadow-glow">
            <Hexagon className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">{lang === 'ar' ? t.brand : t.brandEn}</div>
            <div className="text-[10px] text-[var(--text-3)]">
              {lang === 'ar' ? t.tagline : t.synEn}
            </div>
          </div>
        </div>
        <button
          onClick={() => setLanguage(lang === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-1.5 text-xs font-medium text-[var(--text-2)] backdrop-blur transition-colors hover:bg-[var(--surface)]"
        >
          <Languages className="h-3.5 w-3.5" />
          {lang === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col items-center justify-center px-4 lg:flex-row lg:gap-16 lg:px-6">
        {/* Hero side */}
        <motion.div
          initial={{ opacity: 0, x: lang === 'ar' ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 max-w-lg text-center lg:mb-0 lg:text-start"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-medium text-violet-600 dark:text-violet-300">
            <Sparkles className="h-3 w-3" />
            {lang === 'ar' ? 'الجيل التالي من إدارة العيادات' : 'Next-gen clinic management'}
          </div>
          <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
            <span className="text-[var(--text)]">
              {lang === 'ar' ? 'إدارة عيادتك بـ' : 'Run your clinic with'}
            </span>
            <br />
            <span className="text-gradient-brand">
              {lang === 'ar' ? 'ذكاء وأناقة' : 'Intelligence & Elegance'}
            </span>
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-[var(--text-2)]">
            {lang === 'ar'
              ? 'سينابس سيستمز نظام متكامل لإدارة عيادات الأطفال، يعمل أونلاين، بتصميم عالمي وتجربة استخدام فاخرة.'
              : 'Synapse Systems is a complete pediatric clinic OS. Online-first, beautifully designed, with a luxury feel.'}
          </p>

          <ul className="mt-6 grid gap-2.5 text-sm text-[var(--text-2)] sm:grid-cols-1">
            {[
              { icon: ShieldCheck, text: lang === 'ar' ? 'آمن ومحمي بالكامل' : 'Secure & 100% protected' },
              { icon: Cpu, text: lang === 'ar' ? 'ذكاء تفاعلي في كل تفصيلة' : 'Intelligent in every detail' },
              { icon: Activity, text: lang === 'ar' ? 'يعمل أونلاين بكفاءة' : 'Works seamlessly online' },
            ].map((f, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-center gap-2.5"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary-2)]">
                  <f.icon className="h-3.5 w-3.5" />
                </span>
                {f.text}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="glass rounded-3xl p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight">{t.welcomeBack}</h2>
              <p className="mt-1 text-sm text-[var(--text-2)]">{t.loginSubtitle}</p>
            </div>

            <form onSubmit={submit} className="space-y-3.5">
              {/* Login mode selector */}
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-2)]/40 p-1">
                <button
                  type="button"
                  onClick={() => setLoginMode('staff')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all',
                    loginMode === 'staff'
                      ? 'bg-[var(--surface)] text-[var(--text)] shadow-soft'
                      : 'text-[var(--text-2)] hover:text-[var(--text)]'
                  )}
                >
                  <Stethoscope className="h-3.5 w-3.5" />
                  {t.staffLogin}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('patient')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all',
                    loginMode === 'patient'
                      ? 'bg-[var(--surface)] text-[var(--text)] shadow-soft'
                      : 'text-[var(--text-2)] hover:text-[var(--text)]'
                  )}
                >
                  <UserCircle className="h-3.5 w-3.5" />
                  {t.patientLogin}
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                  {t.username}
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={loginMode === 'patient' ? 'pat_001 / pat_005' : 'admin / doctor / nurse / recep'}
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                  {t.password}
                </label>
                <div className="relative">
                  <Input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute inset-y-0 end-2 grid place-items-center px-1.5 text-[var(--text-3)] hover:text-[var(--text)]"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-1.5 text-[var(--text-2)]">
                  <input type="checkbox" className="rounded" defaultChecked />
                  {t.rememberMe}
                </label>
                <button type="button" className="text-[var(--primary-2)] hover:underline">
                  {t.forgotPassword}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
                rightIcon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}
              >
                {t.login}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 border-t border-[var(--border)] pt-5">
              <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                {t.demoAccounts}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(loginMode === 'staff'
                  ? [
                      { u: 'admin', p: 'admin', label: t.admin, color: 'from-violet-500 to-indigo-600' },
                      { u: 'doctor', p: 'doctor', label: t.doctor, color: 'from-blue-500 to-cyan-600' },
                      { u: 'nurse', p: 'nurse', label: t.nurse, color: 'from-rose-500 to-pink-600' },
                      { u: 'recep', p: 'recep', label: t.receptionist, color: 'from-amber-500 to-orange-600' },
                    ]
                  : [
                      { u: 'pat_001', p: '1234', label: lang === 'ar' ? 'يوسف' : 'Yousef', color: 'from-pink-500 to-rose-600' },
                      { u: 'pat_005', p: '1234', label: lang === 'ar' ? 'تالا' : 'Tala', color: 'from-fuchsia-500 to-pink-600' },
                    ]
                ).map((a) => (
                  <button
                    key={a.u}
                    type="button"
                    onClick={() => fillDemo(a.u, a.p)}
                    className="group flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/40 p-2 text-start text-xs transition-all hover:border-[var(--primary-2)]/40 hover:bg-[var(--surface)]"
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br ${a.color} text-[10px] font-bold text-white`}>
                      {a.label[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-[var(--text)]">{a.label}</div>
                      <div className="truncate text-[10px] text-[var(--text-3)]">{a.u} / {a.p}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Powered by */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[var(--text-3)]">
            <LogIn className="h-3 w-3" />
            {t.poweredBy}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
