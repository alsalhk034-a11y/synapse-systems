export interface Vaccine {
  id: string
  patientId: string
  vaccineName: string
  administeredAt: string
  nextDueDate?: string
  batchNumber?: string
  administeredBy: string
  notes?: string
}
