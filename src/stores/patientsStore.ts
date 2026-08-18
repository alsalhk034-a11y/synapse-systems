import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Patient } from '@/types/patient'
import { seedPatients } from '@/data/seed'
import { generateId } from '@/lib/utils'

interface PatientsState {
  patients: Patient[]
  addPatient: (data: Omit<Patient, 'id' | 'createdAt'>) => Patient
  updatePatient: (id: string, data: Partial<Patient>) => void
  deletePatient: (id: string) => void
  getPatient: (id: string) => Patient | undefined
  search: (query: string) => Patient[]
  touch: (id: string) => void
}

/**
 * توليد كلمة سر عشوائية مؤلفة من 6 أرقام يسهل حفظها على ولي الأمر
 */
export function generatePatientPassword(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * توليد اسم مستخدم فريد للمريض من اسمه + سنة الميلاد
 * مثال: ahmed-2018 — وإذا تكرر يُضاف رقم تسلسلي
 */
function generatePatientUsername(fullName: string, birthDate: string, taken: Set<string>): string {
  const latin = fullName
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '')
    .trim()
    .split(/\s+/)[0] || 'user'
  const year = birthDate ? new Date(birthDate).getFullYear() : new Date().getFullYear()
  const base = `${latin}-${year}`
  if (!taken.has(base)) {
    taken.add(base)
    return base
  }
  for (let i = 2; i < 9999; i++) {
    const candidate = `${base}-${i}`
    if (!taken.has(candidate)) {
      taken.add(candidate)
      return candidate
    }
  }
  return `${base}-${Date.now()}`
}

export const usePatientsStore = create<PatientsState>()(
  persist(
    (set, get) => ({
      patients: seedPatients,
      addPatient: (data) => {
        const p: Patient = {
          id: generateId('pat'),
          createdAt: new Date().toISOString(),
          ...data,
        }
        set((s) => ({ patients: [p, ...s.patients] }))
        return p
      },
      updatePatient: (id, data) =>
        set((s) => ({
          patients: s.patients.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deletePatient: (id) =>
        set((s) => ({ patients: s.patients.filter((p) => p.id !== id) })),
      getPatient: (id) => get().patients.find((p) => p.id === id),
      search: (q) => {
        const lower = q.toLowerCase().trim()
        if (!lower) return get().patients
        return get().patients.filter(
          (p) =>
            p.fullName.toLowerCase().includes(lower) ||
            p.phone.toLowerCase().includes(lower) ||
            p.parentPhone.toLowerCase().includes(lower) ||
            p.parentName.toLowerCase().includes(lower)
        )
      },
      touch: (id) =>
        set((s) => ({
          patients: s.patients.map((p) =>
            p.id === id ? { ...p, lastVisitAt: new Date().toISOString() } : p
          ),
        })),
    }),
    { name: 'synapse_patients', storage: createJSONStorage(() => localStorage) }
  )
)

// تصدير الـ helper للاستخدام من authStore وملف الإضافة التلقائية
export { generatePatientUsername }
