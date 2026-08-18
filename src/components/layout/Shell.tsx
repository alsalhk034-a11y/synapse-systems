import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { HexagonalBackground } from '@/components/hexagonal/HexagonalBackground'
import { useSettingsStore } from '@/stores/settingsStore'
import { CommandPalette } from './CommandPalette'
import { ToastContainer } from '@/components/notifications/Toast'
import { ConfirmContainer } from '@/components/notifications/Confirm'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export function Shell() {
  const theme = useSettingsStore((s) => s.theme)
  const location = useLocation()
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useKeyboardShortcuts()

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <HexagonalBackground intensity={dark ? 0.7 : 0.5} />

      {/* Gradient wash on top */}
      <div
        className="pointer-events-none fixed inset-0 -z-[5]"
        style={{
          background: dark
            ? 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.18) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(139, 92, 246, 0.12) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.12) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
        }}
      />

      <Sidebar />

      <div className="lg:ps-64 rtl:lg:pe-64 transition-all duration-300">
        <Topbar />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6 lg:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette />
      <ToastContainer />
      <ConfirmContainer />
    </div>
  )
}
