export type Gender = 'male' | 'female'

/** السوابق المرضية (Past Medical History) - معايير HIMSS */
export interface PastMedicalHistory {
  chronicDiseases: string[]
  previousSurgeries: { name: string; date: string; notes?: string }[]
  previousHospitalizations: { reason: string; date: string; duration?: string }[]
  regularMedications: { name: string; dose: string; frequency: string }[]
}

/** التاريخ العائلي (Family History) */
export interface FamilyHistory {
  father: { conditions: string[]; notes?: string }
  mother: { conditions: string[]; notes?: string }
  siblings: { conditions: string[]; notes?: string }
  consanguinity: boolean
}

/** السوابق الولادية (Birth History) */
export interface BirthHistory {
  gestationalAgeWeeks?: number
  birthWeightKg?: number
  birthLengthCm?: number
  deliveryType?: 'normal' | 'cesarean' | 'vacuum' | 'forceps'
  deliveryPlace?: string
  complications?: string
  apgarScore1?: number
  apgarScore5?: number
  breastfeedingDuration?: string
  neonatalIssues?: string
}

/** السوابق الاجتماعية (Social History) */
export interface SocialHistory {
  schoolGrade?: string
  schoolPerformance?: 'excellent' | 'good' | 'average' | 'poor'
  diet?: string
  sleepPattern?: string
  exercise?: string
  smokingExposure?: boolean
  pets?: string
  travelHistory?: string
}

/** التحصينات (Immunizations) - معايير WHO */
export type VaccineStatus = 'given' | 'pending' | 'overdue' | 'skipped' | 'contraindicated'
export interface ImmunizationRecord {
  vaccine: string
  dose: number
  scheduledAge: string
  administeredAt?: string
  batchNumber?: string
  manufacturer?: string
  site?: 'IM' | 'SC' | 'Oral' | 'ID'
  administeredBy?: string
  status: VaccineStatus
  nextDueDate?: string
  notes?: string
}

/** نمو الطفل (Growth) - WHO Percentiles */
export interface GrowthRecord {
  date: string
  ageMonths: number
  weightKg: number
  heightCm: number
  headCircumferenceCm?: number
  bmi?: number
  weightPercentile?: number
  heightPercentile?: number
  bmiPercentile?: number
  notes?: string
}

/** تطورات الطفل (Developmental Milestones) */
export interface DevelopmentalMilestone {
  domain: 'motor' | 'cognitive' | 'language' | 'social'
  milestone: string
  expectedAgeMonths: number
  achievedAt?: string
  status: 'achieved' | 'delayed' | 'not-achieved'
  notes?: string
}

/** الحساسية (Allergy) - معايير SNOMED */
export interface Allergy {
  substance: string
  reaction: string
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening'
  onset?: string
  notes?: string
}

export interface Patient {
  id: string
  /** رقم الملف (MRN) - مميز فريد */
  mrn: string
  fullName: string
  birthDate: string
  gender: Gender
  nationality?: string
  nationalId?: string
  /** الرقم الوطني / الهوية */
  identityNumber?: string
  phone: string
  email?: string
  parentName: string
  parentPhone: string
  parentEmail?: string
  parentRelation?: 'father' | 'mother' | 'guardian' | 'other'
  address: string
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
  rhFactor?: '+' | '-'
  photo?: string
  /** الشكاوى والتاريخ */
  allergies?: string
  chronicConditions?: string
  notes?: string
  /** السوابق المفصلة */
  pastMedicalHistory?: PastMedicalHistory
  familyHistory?: FamilyHistory
  birthHistory?: BirthHistory
  socialHistory?: SocialHistory
  immunizations?: ImmunizationRecord[]
  growthRecords?: GrowthRecord[]
  developmentalMilestones?: DevelopmentalMilestone[]
  allergiesDetailed?: Allergy[]
  /** تشخيصات ICD-10 */
  icd10Diagnoses?: { code: string; description: string; date: string; status: 'active' | 'resolved' | 'chronic' }[]
  /** التأمين (اختياري) */
  insurance?: {
    provider: string
    policyNumber: string
    validUntil: string
    coveragePercent: number
  }
  /** حالة المريض السريرية (Patient Status) — معايير HL7/FHIR */
  clinicalStatus?:
    | 'active'
    | 'inactive'
    | 'in-treatment'
    | 'follow-up'
    | 'discharged'
    | 'referred'
    | 'deceased'
  /** مستوى الخطورة الإجمالي (Risk Level) */
  riskLevel?: 'low' | 'moderate' | 'high' | 'critical'
  /** فريق الرعاية (Care Team) — معرفات المستخدمين */
  careTeam?: {
    primaryDoctorId?: string
    nursesIds?: string[]
    referringDoctor?: { name: string; phone?: string; clinic?: string }
  }
  /** جهات اتصال الطوارئ (Emergency Contacts) */
  emergencyContacts?: {
    name: string
    relation: string
    phone: string
    isPrimary?: boolean
  }[]
  /** تفضيلات التواصل (Communication Preferences) */
  communicationPrefs?: {
    preferredChannel: 'phone' | 'sms' | 'whatsapp' | 'email'
    preferredLanguage: 'ar' | 'en'
    allowSmsReminders: boolean
    allowWhatsapp: boolean
  }
  /** العلامات الحيوية الأساسية (Baseline Vitals) */
  baselineVitals?: {
    temperatureC?: number
    heartRateBpm?: number
    respiratoryRate?: number
    systolicBP?: number
    diastolicBP?: number
    oxygenSaturation?: number
    measuredAt?: string
  }
  /** ملاحظات التواصل (Communication Log) */
  communications?: {
    id: string
    at: string
    by: string
    channel: 'phone' | 'sms' | 'whatsapp' | 'in-person' | 'email'
    direction: 'incoming' | 'outgoing'
    summary: string
    followUpNeeded?: boolean
  }[]
  createdAt: string
  lastVisitAt?: string
}
