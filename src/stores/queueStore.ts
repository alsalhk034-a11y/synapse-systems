/**
 * نظام حجز الدور (Queue / Turn Booking)
 * يتبع معايير HL7 FHIR Encounter workflow
 *
 * حالات الدور:
 *   waiting      → في الانتظار
 *   in-progress  → جارٍ الكشف
 *   paused       → متوقف مؤقتاً
 *   done         → منتهي
 *   no-show      → لم يحضر
 *   cancelled    → مُلغى
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { generateId } from '@/lib/utils'

export type QueueStatus =
  | 'waiting'
  | 'in-progress'
  | 'paused'
  | 'done'
  | 'no-show'
  | 'cancelled'

export type QueuePriority = 'normal' | 'urgent' | 'emergency'

export interface QueueEntry {
  id: string
  /** رقم الدور التسلسلي (يومي) */
  number: number
  patientId: string
  patientName: string
  doctorId?: string
  reason?: string
  status: QueueStatus
  priority: QueuePriority
  /** وقت الوصول / الحجز */
  arrivedAt: string
  /** وقت بدء الكشف */
  startedAt?: string
  /** وقت الانتهاء */
  finishedAt?: string
  /** وقت الانتظار المتوقع (دقائق) — يُحسب تلقائياً */
  estimatedWaitMin?: number
  /** ملاحظات */
  notes?: string
  /** درجة الألم 0-10 (للطب الباطني) */
  painScore?: number
  /** هل هو حجز مسبق أم دور فوري؟ */
  isAppointment?: boolean
  appointmentId?: string
  createdBy?: string
}

interface QueueState {
  /** قائمة الأدوار مرتبة حسب الرقم */
  entries: QueueEntry[]
  /** عداد يومي — يُعاد تصفيره كل يوم */
  dailyCounter: number
  lastResetDate: string
  addToQueue: (data: Omit<QueueEntry, 'id' | 'number' | 'arrivedAt' | 'status'>) => QueueEntry
  updateStatus: (id: string, status: QueueStatus) => void
  setPriority: (id: string, priority: QueuePriority) => void
  removeFromQueue: (id: string) => void
  clearFinished: () => void
  resetDay: () => void
  getByPatient: (patientId: string) => QueueEntry | undefined
  getActiveForDoctor: (doctorId?: string) => QueueEntry[]
  getCurrentlyServing: (doctorId?: string) => QueueEntry | undefined
  getWaiting: () => QueueEntry[]
  getFinished: () => QueueEntry[]
  /** الانتقال للدور التالي (ينهي الحالي ويبدأ التالي) */
  callNext: (doctorId?: string) => QueueEntry | undefined
  /** متوسط وقت الانتظار الفعلي بالدقائق */
  getAverageWaitMin: () => number
  /** متوسط مدة الكشف بالدقائق */
  getAverageConsultMin: () => number
}

const STAFF_PACE_MIN = 12 // متوسط دقائق الكشف لكل مريض

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
      entries: [],
      dailyCounter: 0,
      lastResetDate: '',

      addToQueue: (data) => {
        const today = new Date().toISOString().slice(0, 10)
        const isNewDay = get().lastResetDate !== today
        const num = isNewDay ? 1 : get().dailyCounter + 1
        // حساب وقت الانتظار المتوقع بناءً على عدد المنتظرين ومتوسط الكشف
        const waitingCount = get().entries.filter(
          (e) => e.status === 'waiting' || e.status === 'paused'
        ).length
        const entry: QueueEntry = {
          id: generateId('q'),
          number: num,
          patientId: data.patientId,
          patientName: data.patientName,
          doctorId: data.doctorId,
          reason: data.reason,
          priority: data.priority || 'normal',
          status: 'waiting',
          arrivedAt: new Date().toISOString(),
          estimatedWaitMin: waitingCount * STAFF_PACE_MIN,
          notes: data.notes,
          painScore: data.painScore,
          isAppointment: data.isAppointment,
          appointmentId: data.appointmentId,
          createdBy: data.createdBy,
        }
        set((s) => ({
          entries: [entry, ...s.entries],
          dailyCounter: num,
          lastResetDate: today,
        }))
        return entry
      },

      updateStatus: (id, status) =>
        set((s) => ({
          entries: s.entries.map((e) => {
            if (e.id !== id) return e
            const patch: Partial<QueueEntry> = { status }
            if (status === 'in-progress' && !e.startedAt) {
              patch.startedAt = new Date().toISOString()
            }
            if ((status === 'done' || status === 'no-show' || status === 'cancelled') && !e.finishedAt) {
              patch.finishedAt = new Date().toISOString()
            }
            return { ...e, ...patch }
          }),
        })),

      setPriority: (id, priority) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, priority } : e)),
        })),

      removeFromQueue: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      clearFinished: () =>
        set((s) => ({
          entries: s.entries.filter(
            (e) => e.status !== 'done' && e.status !== 'no-show' && e.status !== 'cancelled'
          ),
        })),

      resetDay: () =>
        set({ entries: [], dailyCounter: 0, lastResetDate: new Date().toISOString().slice(0, 10) }),

      getByPatient: (patientId) => {
        // أحدث دور للمريض
        return get()
          .entries.filter((e) => e.patientId === patientId)
          .sort((a, b) => b.arrivedAt.localeCompare(a.arrivedAt))[0]
      },

      getActiveForDoctor: (doctorId) => {
        if (!doctorId) return []
        return get().entries.filter(
          (e) =>
            (e.status === 'waiting' || e.status === 'in-progress' || e.status === 'paused') &&
            (!doctorId || !e.doctorId || e.doctorId === doctorId)
        )
      },

      getCurrentlyServing: (doctorId) => {
        return get().entries.find(
          (e) => e.status === 'in-progress' && (!doctorId || e.doctorId === doctorId)
        )
      },

      getWaiting: () => {
        return get()
          .entries.filter((e) => e.status === 'waiting' || e.status === 'paused')
          .sort((a, b) => {
            // الحالات الطارئة أولاً، ثم العاجلة، ثم بالرقم
            const pri = { emergency: 0, urgent: 1, normal: 2 }
            const pa = pri[a.priority]
            const pb = pri[b.priority]
            if (pa !== pb) return pa - pb
            return a.number - b.number
          })
      },

      getFinished: () => {
        return get()
          .entries.filter((e) => e.status === 'done' || e.status === 'no-show' || e.status === 'cancelled')
          .sort((a, b) => (b.finishedAt || '').localeCompare(a.finishedAt || ''))
      },

      callNext: (doctorId) => {
        // إنهاء الكشف الحالي
        const current = get().entries.find(
          (e) => e.status === 'in-progress' && (!doctorId || e.doctorId === doctorId)
        )
        if (current) {
          get().updateStatus(current.id, 'done')
        }
        // إيجاد التالي
        const waiting = get()
          .getWaiting()
          .filter((e) => !doctorId || !e.doctorId || e.doctorId === doctorId)[0]
        if (waiting) {
          get().updateStatus(waiting.id, 'in-progress')
          return waiting
        }
        return undefined
      },

      getAverageWaitMin: () => {
        const finished = get().entries.filter((e) => e.status === 'done' && e.startedAt && e.arrivedAt)
        if (finished.length === 0) return 0
        const total = finished.reduce((sum, e) => {
          const arrived = new Date(e.arrivedAt).getTime()
          const started = new Date(e.startedAt!).getTime()
          return sum + (started - arrived) / 60000
        }, 0)
        return Math.round(total / finished.length)
      },

      getAverageConsultMin: () => {
        const finished = get().entries.filter((e) => e.status === 'done' && e.startedAt && e.finishedAt)
        if (finished.length === 0) return 0
        const total = finished.reduce((sum, e) => {
          const started = new Date(e.startedAt!).getTime()
          const finishedAt = new Date(e.finishedAt!).getTime()
          return sum + (finishedAt - started) / 60000
        }, 0)
        return Math.round(total / finished.length)
      },
    }),
    {
      name: 'synapse_queue',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** حساب الموقع في الدور (1 = التالي) */
export function getQueuePosition(entries: QueueEntry[], entryId: string): number {
  const sorted = entries
    .filter((e) => e.status === 'waiting' || e.status === 'paused')
    .sort((a, b) => {
      const pri = { emergency: 0, urgent: 1, normal: 2 }
      const pa = pri[a.priority]
      const pb = pri[b.priority]
      if (pa !== pb) return pa - pb
      return a.number - b.number
    })
  return sorted.findIndex((e) => e.id === entryId) + 1
}
