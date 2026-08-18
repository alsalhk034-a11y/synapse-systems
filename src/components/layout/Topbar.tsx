import { Menu, Search, Sun, Moon, Languages, Wifi, WifiOff, Plus, Sparkles, RefreshCw, Check, Users } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useSettingsStore } from '@/stores/settingsStore'
import { useUIStore } from '@/stores/uiStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useSyncStatus, useSyncListener } from '@/lib/sync'
import { toast } from '@/stores/toastStore'
import { cn } from '@/lib/utils'

export function Topbar() {
  const { t, lang } = useTranslation()
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const openCommand = useUIStore((s) => s.openCommand)
  const navigate = useNavigate()
  const { state, online, lastSyncAt, forceSync } = useSyncStatus()
  const [activeTabs, setActiveTabs] = useState(1)
  const [showSyncMenu, setShowSyncMenu] = useState(false)

  useSyncListener()

  useEffect(() => {
    // Count active tabs to show "doctor + nurse" simulation
    const channel = 'synapse_bc_check_' + Date.now()
    const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channel) : null
    if (!bc) return
    let count = 1
    const onMsg = () => {
      count++
      setActiveTabs(count)
    }
    bc.addEventListener('message', onMsg)
    bc.postMessage('ping')
    const interval = setInterval(() => setActiveTabs((c) => Math.max(1, c)), 3000)
    return () => {
      clearInterval(interval)
      bc.close()
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      forceSync()
      toast.info(lang === 'ar' ? 'تمت المزامنة' : 'Sync complete', lang === 'ar' ? 'تم تحديث البيانات' : 'Data updated')
    }
    window.addEventListener('synapse:sync', handler)
    return () => window.removeEventListener('synapse:sync', handler)
  }, [forceSync, lang])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)]/80 px-4 backdrop-blur-xl lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="lg:flex"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Search / command palette trigger */}
      <button
        onClick={openCommand}
        className="group flex h-9 flex-1 items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-start text-sm transition-all hover:border-[var(--border-strong)] hover:shadow-soft max-w-md"
      >
        <Search className="h-4 w-4 text-[var(--text-3)]" />
        <span className="flex-1 truncate text-[var(--text-3)]">
          {lang === 'ar' ? 'ابحث عن مريض، موعد، فاتورة...' : 'Search patient, appointment, invoice...'}
        </span>
        <kbd className="hidden items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--bg-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-3)] md:inline-flex">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      <div className="flex items-center gap-1.5">
        {/* Active tabs indicator (sync simulation) */}
        {activeTabs > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400 md:flex"
            title={lang === 'ar' ? `يعمل الآن على ${activeTabs} أجهزة` : `${activeTabs} active sessions`}
          >
            <Users className="h-3 w-3" />
            <span>{activeTabs}</span>
          </motion.div>
        )}

        {/* Sync status with menu */}
        <div className="relative">
          <button
            onClick={() => {
              if (state === 'online') {
                forceSync()
                toast.success(lang === 'ar' ? 'تمت المزامنة' : 'Synced', lang === 'ar' ? 'كل البيانات محدّثة' : 'All data is up to date')
              } else {
                setShowSyncMenu(!showSyncMenu)
              }
            }}
            onMouseEnter={() => setShowSyncMenu(true)}
            onMouseLeave={() => setTimeout(() => setShowSyncMenu(false), 300)}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-all',
              state === 'syncing'
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : online
                ? 'border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
            )}
            title={lang === 'ar' ? 'حالة المزامنة' : 'Sync status'}
          >
            {state === 'syncing' ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : online ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            <span className="hidden md:inline">
              {state === 'syncing'
                ? lang === 'ar' ? 'مزامنة' : 'Syncing'
                : online
                ? lang === 'ar' ? 'متزامن' : 'Synced'
                : lang === 'ar' ? 'غير متصل' : 'Offline'}
            </span>
          </button>
          <AnimatePresence>
            {showSyncMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                onMouseEnter={() => setShowSyncMenu(true)}
                onMouseLeave={() => setShowSyncMenu(false)}
                className="absolute end-0 top-full mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-soft"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold text-[var(--text)]">
                    {lang === 'ar' ? 'حالة المزامنة' : 'Sync status'}
                  </div>
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      online ? 'bg-teal-500' : 'bg-amber-500'
                    )}
                  />
                </div>
                <div className="space-y-1.5 text-[11px] text-[var(--text-2)]">
                  <div className="flex items-center justify-between">
                    <span>{lang === 'ar' ? 'الاتصال' : 'Connection'}</span>
                    <span className="font-semibold text-[var(--text)]">
                      {online ? (lang === 'ar' ? 'نشط' : 'Online') : (lang === 'ar' ? 'محلي' : 'Local')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{lang === 'ar' ? 'جلسات نشطة' : 'Active sessions'}</span>
                    <span className="font-semibold text-[var(--text)]">{activeTabs}</span>
                  </div>
                  {lastSyncAt && (
                    <div className="flex items-center justify-between">
                      <span>{lang === 'ar' ? 'آخر مزامنة' : 'Last sync'}</span>
                      <span className="font-semibold text-[var(--text)]">
                        {new Date(lastSyncAt).toLocaleTimeString(lang === 'ar' ? 'ar-SY' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-2)]/50 p-2 text-[10px] text-[var(--text-3)]">
                  {lang === 'ar'
                    ? 'البيانات تُحفظ محلياً وتُزامن بين الجلسات فوراً. عند العودة للإنترنت، تكتمل المزامنة مع السيرفر تلقائياً.'
                    : 'Data is stored locally and synced between sessions instantly. When you reconnect, sync completes with the server automatically.'}
                </div>
                <button
                  onClick={() => {
                    forceSync()
                    setShowSyncMenu(false)
                    toast.success(lang === 'ar' ? 'تمت المزامنة' : 'Synced')
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)]/10 py-1.5 text-[11px] font-semibold text-[var(--primary-2)] transition-colors hover:bg-[var(--primary)]/15"
                >
                  <RefreshCw className="h-3 w-3" />
                  {lang === 'ar' ? 'مزامنة الآن' : 'Sync now'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Language */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(lang === 'ar' ? 'en' : 'ar')}
          leftIcon={<Languages className="h-3.5 w-3.5" />}
          className="hidden md:inline-flex"
        >
          {lang === 'ar' ? 'EN' : 'عر'}
        </Button>

        {/* Theme */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === 'dark' ? (
              <motion.span
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="h-4 w-4" />
              </motion.span>
            ) : (
              <motion.span
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        {/* New patient quick */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/patients/new')}
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          className="hidden md:inline-flex"
        >
          {t.newPatient}
        </Button>

        {/* AI hint */}
        <Button
          variant="subtle"
          size="icon"
          className="hidden md:inline-flex"
          aria-label="AI"
          title={lang === 'ar' ? 'الذكاء الاصطناعي قريباً' : 'AI coming soon'}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
