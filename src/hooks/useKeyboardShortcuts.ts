import { useEffect, useRef } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

interface Shortcuts {
  [key: string]: () => void
}

/**
 * نظام اختصارات لوحة المفاتيح الشامل
 * - Ctrl+K: لوحة الأوامر
 * - Ctrl+N: مريض جديد
 * - Ctrl+E: بدء كشف
 * - Ctrl+P: طباعة
 * - Ctrl+S: حفظ
 * - Ctrl+/: صفحة الاختصارات
 * - Ctrl+Shift+S: المزامنة اليدوية
 * - Escape: إغلاق نوافذ
 * - g + d/p/a/i/e: تنقل سريع (Go to Dashboard/Patients/...)
 */
export function useKeyboardShortcuts(extra: Shortcuts = {}) {
  const openCommand = useUIStore((s) => s.openCommand)
  const closeCommand = useUIStore((s) => s.closeCommand)
  const commandOpen = useUIStore((s) => s.commandOpen)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const extraRef = useRef(extra)
  extraRef.current = extra

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // لا تعترض الاختصارات في حقول الإدخال إلا Ctrl+K و Ctrl+P
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      const meta = e.ctrlKey || e.metaKey

      // Ctrl+K -> command palette
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        commandOpen ? closeCommand() : openCommand()
        return
      }

      // Ctrl+/ -> shortcuts help
      if (meta && e.key === '/') {
        e.preventDefault()
        navigate('/shortcuts')
        return
      }

      // Ctrl+N -> new patient
      if (meta && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault()
        navigate('/patients/new')
        return
      }

      // Ctrl+E -> new exam
      if (meta && e.key.toLowerCase() === 'e' && !e.shiftKey) {
        e.preventDefault()
        navigate('/exams')
        return
      }

      // Ctrl+I -> new invoice
      if (meta && e.key.toLowerCase() === 'i' && !e.shiftKey) {
        e.preventDefault()
        navigate('/invoices/new')
        return
      }

      // Ctrl+P -> print
      if (meta && e.key.toLowerCase() === 'p') {
        // نسمح بالسلوك الافتراضي في الإدخال، ونضيف سلوك طباعة مخصص
        if (!isInput) {
          e.preventDefault()
          window.print()
        }
        return
      }

      // Ctrl+S -> save (dispatch event for pages to handle)
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('synapse:save'))
        return
      }

      // Ctrl+Shift+S -> manual sync
      if (meta && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('synapse:sync'))
        return
      }

      // Escape -> close command palette
      if (e.key === 'Escape' && commandOpen) {
        e.preventDefault()
        closeCommand()
        return
      }

      // Go to navigation with 'g' + key (not in input)
      if (!isInput && e.key === 'g' && !meta) {
        const next = (k: string) => {
          if (e.shiftKey) return
          document.removeEventListener('keydown', next as any, { capture: true } as any)
          const routes: Record<string, string> = {
            d: '/',
            p: '/patients',
            a: '/appointments',
            i: '/invoices',
            e: '/exams',
            r: '/reports',
            s: '/settings',
          }
          const route = routes[k]
          if (route) navigate(route)
        }
        document.addEventListener('keydown', next as any, { capture: true } as any)
        setTimeout(
          () => document.removeEventListener('keydown', next as any, { capture: true } as any),
          1200
        )
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openCommand, closeCommand, commandOpen, logout, navigate])
}
