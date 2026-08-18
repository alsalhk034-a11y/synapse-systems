import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export function useTheme() {
  const theme = useSettingsStore((s) => s.theme)
  const language = useSettingsStore((s) => s.language)

  useEffect(() => {
    const root = document.documentElement
    const apply = (t: 'light' | 'dark') => {
      root.classList.toggle('dark', t === 'dark')
      root.setAttribute('data-theme', t)
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches ? 'dark' : 'light')
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      apply(theme)
    }
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('lang', language)
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr')
  }, [language])

  return { theme, language }
}
