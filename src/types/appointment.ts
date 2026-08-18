export type AppointmentStatus = 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  scheduledAt: string // ISO
  durationMin: number
  status: AppointmentStatus
  reason: string
  notes?: string
  createdAt: string
}
