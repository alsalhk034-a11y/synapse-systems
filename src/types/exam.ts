export interface VitalSigns {
  temperature?: number // °C
  weightKg?: number
  heightCm?: number
  headCircumferenceCm?: number
  heartRate?: number
  respiratoryRate?: number
  oxygenSaturation?: number
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
}

export interface Prescription {
  id: string
  medicationName: string
  dosage: string
  frequency: string
  durationDays: number
  instructions?: string
}

export interface ExamTemplate {
  id: string
  name: string
  category: string
  diagnosis: string
  treatment: string
  prescriptions: Omit<Prescription, 'id'>[]
}

export interface Exam {
  id: string
  patientId: string
  doctorId: string
  appointmentId?: string
  examDate: string
  chiefComplaint: string
  vitals: VitalSigns
  diagnosis: string
  treatment: string
  notes?: string
  followUpDate?: string
  prescriptions: Prescription[]
  createdAt: string
}
