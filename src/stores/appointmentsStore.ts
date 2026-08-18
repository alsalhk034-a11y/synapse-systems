import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Appointment, AppointmentStatus } from '@/types/appointment'
import { seedAppointments } from '@/data/seed'
import { generateId } from '@/lib/utils'

interface AppointmentsState {
  appointments: Appointment[]
  addAppointment: (data: Omit<Appointment, 'id' | 'createdAt'>) => Appointment
  updateAppointment: (id: string, data: Partial<Appointment>) => void
  updateStatus: (id: string, status: AppointmentStatus) => void
  deleteAppointment: (id: string) => void
  getByDate: (date: Date) => Appointment[]
  getByPatient: (patientId: string) => Appointment[]
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const useAppointmentsStore = create<AppointmentsState>()(
  persist(
    (set, get) => ({
      appointments: seedAppointments,
      addAppointment: (data) => {
        const a: Appointment = {
          id: generateId('apt'),
          createdAt: new Date().toISOString(),
          ...data,
        }
        set((s) => ({ appointments: [a, ...s.appointments] }))
        return a
      },
      updateAppointment: (id, data) =>
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),
      updateStatus: (id, status) =>
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
        })),
      deleteAppointment: (id) =>
        set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) })),
      getByDate: (date) => get().appointments.filter((a) => sameDay(new Date(a.scheduledAt), date)),
      getByPatient: (patientId) => get().appointments.filter((a) => a.patientId === patientId),
    }),
    { name: 'synapse_appointments', storage: createJSONStorage(() => localStorage) }
  )
)
