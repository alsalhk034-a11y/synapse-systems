import { useEffect, useState, useCallback } from 'react'
import { create } from 'zustand'
import { useSettingsStore } from '@/stores/settingsStore'

/**
 * نظام المزامنة المحلية - محاكاة المزامنة بين الأجهزة في نفس الشبكة
 * يستخدم BroadcastChannel لإرسال التغييرات بين التبويبات
 */

export type SyncState = 'online' | 'offline' | 'syncing'
export type SyncEventType =
  | 'patient_created'
  | 'patient_updated'
  | 'patient_deleted'
  | 'appointment_created'
  | 'appointment_updated'
  | 'appointment_deleted'
  | 'exam_created'
  | 'exam_updated'
  | 'invoice_created'
  | 'invoice_updated'
  | 'invoice_paid'
  | 'settings_updated'
  | 'force_sync'

export interface SyncEvent {
  type: SyncEventType
  entityId?: string
  payload?: unknown
  origin: string
  timestamp: number
}

interface SyncStore {
  state: SyncState
  lastSyncAt: string | null
  pendingCount: number
  online: boolean
  setOnline: (online: boolean) => void
  setState: (state: SyncState) => void
  setLastSyncAt: (ts: string) => void
  incrementPending: () => void
  clearPending: () => void
}

const generateOriginId = () => {
  let id = sessionStorage.getItem('synapse_origin_id')
  if (!id) {
    id = 'tab_' + Math.random().toString(36).slice(2, 10)
    sessionStorage.setItem('synapse_origin_id', id)
  }
  return id
}

const originId = generateOriginId()

export const useSyncStore = create<SyncStore>((set) => ({
  state: 'online',
  lastSyncAt: null,
  pendingCount: 0,
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setOnline: (online) => set({ online }),
  setState: (state) => set({ state }),
  setLastSyncAt: (ts) => set({ lastSyncAt: ts }),
  incrementPending: () => set((s) => ({ pendingCount: s.pendingCount + 1 })),
  clearPending: () => set({ pendingCount: 0 }),
}))

let bc: BroadcastChannel | null = null
const listeners = new Set<(e: SyncEvent) => void>()

const initChannel = () => {
  if (typeof window === 'undefined' || bc) return
  if (typeof BroadcastChannel === 'undefined') return
  bc = new BroadcastChannel('synapse_sync')
  bc.onmessage = (ev) => {
    const event = ev.data as SyncEvent
    if (event.origin === originId) return
    useSyncStore.getState().setLastSyncAt(new Date().toISOString())
    listeners.forEach((l) => l(event))
  }
}

export function publishSync(event: Omit<SyncEvent, 'origin' | 'timestamp'>) {
  if (!bc) initChannel()
  const fullEvent: SyncEvent = {
    ...event,
    origin: originId,
    timestamp: Date.now(),
  }
  bc?.postMessage(fullEvent)
  const s = useSyncStore.getState()
  s.setLastSyncAt(new Date().toISOString())
}

export function subscribeSync(cb: (e: SyncEvent) => void): () => void {
  if (!bc) initChannel()
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useSyncListener() {
  useEffect(() => {
    initChannel()
    const offlineHandler = () => useSyncStore.getState().setOnline(false)
    const onlineHandler = () => useSyncStore.getState().setOnline(true)
    window.addEventListener('offline', offlineHandler)
    window.addEventListener('online', onlineHandler)
    return () => {
      window.removeEventListener('offline', offlineHandler)
      window.removeEventListener('online', onlineHandler)
    }
  }, [])
}

export function useSyncStatus() {
  const state = useSyncStore((s) => s.state)
  const online = useSyncStore((s) => s.online)
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt)
  const pendingCount = useSyncStore((s) => s.pendingCount)

  const forceSync = useCallback(() => {
    useSyncStore.getState().setState('syncing')
    publishSync({ type: 'force_sync' })
    setTimeout(() => {
      useSyncStore.getState().setState(online ? 'online' : 'offline')
      useSyncStore.getState().setLastSyncAt(new Date().toISOString())
    }, 800)
  }, [online])

  return { state, online, lastSyncAt, pendingCount, forceSync }
}

/**
 * يستخدم لتتبع التغييرات في المتاجر وإرسال إشعارات المزامنة
 */
export function useAutoSync() {
  useEffect(() => {
    // Subscribe to store changes using a polling effect on localStorage
    const checkChanges = () => {
      try {
        const stores = [
          'synapse_patients',
          'synapse_appointments',
          'synapse_exams',
          'synapse_invoices',
          'synapse_settings',
        ]
        stores.forEach((key) => {
          const current = localStorage.getItem(key)
          const prev = sessionStorage.getItem(key + '_sync')
          if (current !== prev && prev !== null) {
            // Local change made
            sessionStorage.setItem(key + '_sync', current ?? '')
          }
          if (prev === null) {
            sessionStorage.setItem(key + '_sync', current ?? '')
          }
        })
      } catch {}
    }
    const interval = setInterval(checkChanges, 1000)
    return () => clearInterval(interval)
  }, [])
}

// Helper: detect role-based display name (nurse vs doctor simulation)
export function getRoleLabel(role: string, lang: 'ar' | 'en') {
  const map: Record<string, { ar: string; en: string }> = {
    doctor: { ar: 'الطبيب', en: 'Doctor' },
    nurse: { ar: 'الممرض/ة', en: 'Nurse' },
    admin: { ar: 'المدير', en: 'Admin' },
    receptionist: { ar: 'موظف الاستقبال', en: 'Receptionist' },
  }
  return map[role]?.[lang] ?? role
}
