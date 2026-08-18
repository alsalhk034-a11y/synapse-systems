import { useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

export function useFocusMode() {
  const focusMode = useUIStore((s) => s.focusMode)

  useEffect(() => {
    document.documentElement.classList.toggle('focus-mode', focusMode)
  }, [focusMode])
}
