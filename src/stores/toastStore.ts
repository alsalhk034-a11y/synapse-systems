import { create } from 'zustand'
import { generateId } from '@/lib/utils'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  description?: string
  tone: ToastTone
  duration: number
}

interface ToastState {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => string
  dismiss: (id: string) => void
  clear: () => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = generateId('toast')
    const t: Toast = {
      id,
      message: toast.message,
      description: toast.description,
      tone: toast.tone,
      duration: toast.duration ?? 3500,
    }
    set((s) => ({ toasts: [...s.toasts, t] }))
    if (t.duration > 0) {
      setTimeout(() => get().dismiss(id), t.duration)
    }
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}))

export const toast = {
  success: (message: string, description?: string) =>
    useToastStore.getState().push({ message, description, tone: 'success' }),
  error: (message: string, description?: string) =>
    useToastStore.getState().push({ message, description, tone: 'error' }),
  info: (message: string, description?: string) =>
    useToastStore.getState().push({ message, description, tone: 'info' }),
  warning: (message: string, description?: string) =>
    useToastStore.getState().push({ message, description, tone: 'warning' }),
}
