import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Vaccine } from '@/types/vaccine'
import { seedVaccines } from '@/data/seed'
import { generateId } from '@/lib/utils'

interface VaccinesState {
  vaccines: Vaccine[]
  addVaccine: (data: Omit<Vaccine, 'id'>) => Vaccine
  deleteVaccine: (id: string) => void
  getByPatient: (patientId: string) => Vaccine[]
}

export const useVaccinesStore = create<VaccinesState>()(
  persist(
    (set, get) => ({
      vaccines: seedVaccines,
      addVaccine: (data) => {
        const v: Vaccine = { id: generateId('vac'), ...data }
        set((s) => ({ vaccines: [v, ...s.vaccines] }))
        return v
      },
      deleteVaccine: (id) =>
        set((s) => ({ vaccines: s.vaccines.filter((v) => v.id !== id) })),
      getByPatient: (patientId) => get().vaccines.filter((v) => v.patientId === patientId),
    }),
    { name: 'synapse_vaccines', storage: createJSONStorage(() => localStorage) }
  )
)
