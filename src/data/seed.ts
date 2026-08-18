import type { User } from '@/types/user'
import type { Patient } from '@/types/patient'
import type { Appointment } from '@/types/appointment'
import type { Exam, ExamTemplate } from '@/types/exam'
import type { Invoice } from '@/types/invoice'
import type { Vaccine } from '@/types/vaccine'
import type { AuditLogEntry } from '@/types'
import { ROLE_DEFAULT_PERMISSIONS } from '@/types/permissions'

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const iso = (d: Date) => d.toISOString()
const daysAgo = (n: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d
}
const daysFromNow = (n: number, hour = 9, minute = 0) => {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  d.setHours(hour, minute, 0, 0)
  return d
}
const yearsAgo = (n: number, m = 0) => {
  const d = new Date(today)
  d.setFullYear(d.getFullYear() - n)
  d.setMonth(d.getMonth() - m)
  return d
}
function monthsAgoSafe(m: number) {
  const d = new Date(today)
  d.setMonth(d.getMonth() - m)
  return d
}
function monthsFromNow(m: number) {
  const d = new Date(today)
  d.setMonth(d.getMonth() + m)
  return d
}

const perms = (role: string) => ROLE_DEFAULT_PERMISSIONS[role] || []

export const seedUsers: User[] = [
  {
    id: 'user_admin',
    username: 'admin',
    password: 'admin',
    fullName: 'د. سامي المحمد',
    role: 'admin',
    specialty: 'مدير عام',
    avatarColor: 'from-violet-500 to-indigo-600',
    email: 'admin@synapse.clinic',
    phone: '+963 11 555 0001',
    permissions: perms('admin'),
    active: true,
    createdAt: iso(yearsAgo(3)),
  },
  {
    id: 'user_doctor',
    username: 'doctor',
    password: 'doctor',
    fullName: 'د. ليلى الخالد',
    role: 'doctor',
    specialty: 'طب أطفال',
    avatarColor: 'from-blue-500 to-cyan-600',
    email: 'laila@synapse.clinic',
    phone: '+963 11 555 0002',
    permissions: perms('doctor'),
    active: true,
    createdAt: iso(yearsAgo(3)),
  },
  {
    id: 'user_doctor2',
    username: 'rashid',
    password: 'rashid',
    fullName: 'د. خالد الرشيد',
    role: 'doctor',
    specialty: 'طب أطفال',
    avatarColor: 'from-teal-500 to-emerald-600',
    email: 'rashid@synapse.clinic',
    phone: '+963 11 555 0003',
    permissions: perms('doctor'),
    active: true,
    createdAt: iso(yearsAgo(2)),
  },
  {
    id: 'user_nurse',
    username: 'nurse',
    password: 'nurse',
    fullName: 'م. ريم العلي',
    role: 'nurse',
    avatarColor: 'from-rose-500 to-pink-600',
    permissions: perms('nurse'),
    active: true,
    createdAt: iso(yearsAgo(2)),
  },
  {
    id: 'user_recep',
    username: 'recep',
    password: 'recep',
    fullName: 'سارة الحسيني',
    role: 'receptionist',
    avatarColor: 'from-amber-500 to-orange-600',
    permissions: perms('receptionist'),
    active: true,
    createdAt: iso(yearsAgo(1)),
  },
  // حسابات المرضى للبوابة الذاتية
  {
    id: 'user_pat_001',
    username: 'pat_001',
    password: '1234',
    fullName: 'يوسف أحمد النعمة',
    role: 'patient',
    avatarColor: 'from-pink-400 to-rose-500',
    permissions: perms('patient'),
    linkedPatientId: 'pat_001',
    active: true,
    createdAt: iso(yearsAgo(2)),
  },
  {
    id: 'user_pat_005',
    username: 'pat_005',
    password: '1234',
    fullName: 'تالا محمد العبد',
    role: 'patient',
    avatarColor: 'from-fuchsia-400 to-pink-500',
    permissions: perms('patient'),
    linkedPatientId: 'pat_005',
    active: true,
    createdAt: iso(yearsAgo(2, 6)),
  },
]

/** توليد MRN فريد لكل مريض بناء على رقم تسلسلي */
let _mrnCounter = 1000
const newMRN = () => `MRN-${String(++_mrnCounter).padStart(6, '0')}`

const makePatient = (data: Partial<Patient> & Pick<Patient, 'fullName' | 'birthDate' | 'gender' | 'phone' | 'parentName' | 'parentPhone' | 'address' | 'createdAt'>): Patient => ({
  id: data.id || ('pat_' + Math.random().toString(36).slice(2, 8)),
  mrn: data.mrn || newMRN(),
  ...data,
})

export const seedPatients: Patient[] = [
  makePatient({
    id: 'pat_001',
    fullName: 'يوسف أحمد النعمة',
    birthDate: iso(yearsAgo(4, 3)),
    gender: 'male',
    phone: '+963 933 112 233',
    parentName: 'أحمد النعمة',
    parentPhone: '+963 933 112 233',
    parentEmail: 'ahmad@example.com',
    parentRelation: 'father',
    address: 'دمشق - المزة',
    nationality: 'سوري',
    identityNumber: '01234567890',
    bloodType: 'A+',
    allergies: 'البنسلين',
    chronicConditions: '',
    notes: 'طفل نشيط، يتابع بانتظام.',
    icd10Diagnoses: [
      { code: 'J45.909', description: 'ربو قصبي خفيف', date: iso(yearsAgo(1)), status: 'chronic' },
    ],
    pastMedicalHistory: {
      chronicDiseases: ['ربو قصبي خفيف'],
      previousSurgeries: [],
      previousHospitalizations: [],
      regularMedications: [
        { name: 'بيكلوميثازون بخاخ', dose: 'بختان', frequency: 'مرتين يومياً' },
      ],
    },
    familyHistory: {
      father: { conditions: ['ربو'], notes: 'تاريخ عائلي للربو' },
      mother: { conditions: [] },
      siblings: { conditions: [] },
      consanguinity: false,
    },
    birthHistory: {
      gestationalAgeWeeks: 39,
      birthWeightKg: 3.4,
      birthLengthCm: 50,
      deliveryType: 'normal',
      deliveryPlace: 'مشفى دمشق',
      apgarScore1: 9,
      apgarScore5: 10,
      breastfeedingDuration: '6 أشهر',
    },
    socialHistory: {
      schoolGrade: 'روضة 2',
      schoolPerformance: 'good',
      diet: 'متوازن',
      sleepPattern: '10 ساعات',
      exercise: 'يومي',
      pets: 'لا',
    },
    allergiesDetailed: [
      { substance: 'البنسلين', reaction: 'طفح جلدي', severity: 'moderate', onset: iso(yearsAgo(2)) },
    ],
    growthRecords: [
      { date: iso(yearsAgo(1)), ageMonths: 36, weightKg: 14, heightCm: 95, headCircumferenceCm: 49, bmi: 15.5 },
      { date: iso(monthsAgoSafe(6)), ageMonths: 45, weightKg: 15.2, heightCm: 99, bmi: 15.5 },
      { date: iso(daysAgo(3)), ageMonths: 51, weightKg: 16.5, heightCm: 102, bmi: 15.86 },
    ],
    developmentalMilestones: [
      { domain: 'motor', milestone: 'الجلوس', expectedAgeMonths: 6, achievedAt: iso(yearsAgo(3, 8)), status: 'achieved' },
      { domain: 'motor', milestone: 'المشي', expectedAgeMonths: 12, achievedAt: iso(yearsAgo(3, 2)), status: 'achieved' },
      { domain: 'language', milestone: 'كلمة أولى', expectedAgeMonths: 12, achievedAt: iso(yearsAgo(3, 1)), status: 'achieved' },
    ],
    createdAt: iso(yearsAgo(2)),
    lastVisitAt: iso(daysAgo(3)),
  }),
  makePatient({
    id: 'pat_002',
    fullName: 'مريم حسن العمر',
    birthDate: iso(yearsAgo(2, 6)),
    gender: 'female',
    phone: '+963 944 223 344',
    parentName: 'حسن العمر',
    parentPhone: '+963 944 223 344',
    parentEmail: 'hassan@example.com',
    parentRelation: 'father',
    address: 'دمشق - كفرسوسة',
    nationality: 'سوري',
    bloodType: 'O+',
    allergies: '',
    chronicConditions: 'ربو خفيف',
    notes: 'تستخدم بخاخ عند اللزوم.',
    icd10Diagnoses: [
      { code: 'J45.20', description: 'ربو خفيف متقطع', date: iso(monthsAgoSafe(6)), status: 'chronic' },
    ],
    pastMedicalHistory: {
      chronicDiseases: ['ربو خفيف'],
      previousSurgeries: [],
      previousHospitalizations: [],
      regularMedications: [],
    },
    familyHistory: {
      father: { conditions: [] },
      mother: { conditions: ['حساسية أنف'] },
      siblings: { conditions: [] },
      consanguinity: false,
    },
    birthHistory: {
      gestationalAgeWeeks: 38,
      birthWeightKg: 3.0,
      deliveryType: 'cesarean',
      deliveryPlace: 'مشفى الشامي',
      apgarScore1: 8,
      apgarScore5: 9,
      breastfeedingDuration: '4 أشهر',
    },
    socialHistory: {
      diet: 'متنوع',
      sleepPattern: '11 ساعة',
      exercise: 'خفيف',
    },
    allergiesDetailed: [],
    growthRecords: [
      { date: iso(yearsAgo(1)), ageMonths: 18, weightKg: 10.5, heightCm: 80, bmi: 16.4 },
      { date: iso(daysAgo(7)), ageMonths: 30, weightKg: 13, heightCm: 88, bmi: 16.78 },
    ],
    developmentalMilestones: [
      { domain: 'motor', milestone: 'المشي', expectedAgeMonths: 12, achievedAt: iso(yearsAgo(1, 6)), status: 'achieved' },
      { domain: 'language', milestone: 'جمل قصيرة', expectedAgeMonths: 24, achievedAt: iso(monthsAgoSafe(3)), status: 'achieved' },
    ],
    createdAt: iso(yearsAgo(1, 6)),
    lastVisitAt: iso(daysAgo(7)),
  }),
  makePatient({
    id: 'pat_003',
    fullName: 'علي محمود الجبان',
    birthDate: iso(yearsAgo(7, 0)),
    gender: 'male',
    phone: '+963 955 334 455',
    parentName: 'محمود الجبان',
    parentPhone: '+963 955 334 455',
    address: 'ريف دمشق - داريا',
    nationality: 'سوري',
    bloodType: 'B+',
    allergies: 'المكسرات',
    chronicConditions: '',
    notes: '',
    allergiesDetailed: [
      { substance: 'المكسرات', reaction: 'شرى', severity: 'severe', onset: iso(yearsAgo(2)) },
    ],
    pastMedicalHistory: { chronicDiseases: [], previousSurgeries: [], previousHospitalizations: [], regularMedications: [] },
    familyHistory: { father: { conditions: [] }, mother: { conditions: [] }, siblings: { conditions: [] }, consanguinity: true },
    birthHistory: { gestationalAgeWeeks: 40, birthWeightKg: 3.6, deliveryType: 'normal' },
    socialHistory: { schoolGrade: 'الصف الأول', schoolPerformance: 'excellent' },
    createdAt: iso(yearsAgo(3)),
    lastVisitAt: iso(daysAgo(14)),
  }),
  makePatient({
    id: 'pat_004',
    fullName: 'سلمى فيصل القاسم',
    birthDate: iso(yearsAgo(1, 2)),
    gender: 'female',
    phone: '+963 966 445 566',
    parentName: 'فيصل القاسم',
    parentPhone: '+963 966 445 566',
    address: 'دمشق - أبو رمانة',
    nationality: 'سوري',
    bloodType: 'AB+',
    notes: 'متابعتها لنمو والتغذية.',
    pastMedicalHistory: { chronicDiseases: [], previousSurgeries: [], previousHospitalizations: [], regularMedications: [] },
    familyHistory: { father: { conditions: [] }, mother: { conditions: [] }, siblings: { conditions: [] }, consanguinity: false },
    birthHistory: { gestationalAgeWeeks: 39, birthWeightKg: 3.2, deliveryType: 'normal' },
    socialHistory: { diet: 'متنوع' },
    growthRecords: [
      { date: iso(monthsAgoSafe(6)), ageMonths: 8, weightKg: 8.5, heightCm: 70, bmi: 17.3 },
      { date: iso(daysAgo(20)), ageMonths: 14, weightKg: 10, heightCm: 76, bmi: 17.3 },
    ],
    createdAt: iso(yearsAgo(1)),
    lastVisitAt: iso(daysAgo(20)),
  }),
  makePatient({
    id: 'pat_005',
    fullName: 'تالا محمد العبد',
    birthDate: iso(yearsAgo(5, 4)),
    gender: 'female',
    phone: '+963 977 556 677',
    parentName: 'محمد العبد',
    parentPhone: '+963 977 556 677',
    parentEmail: 'mohamed@example.com',
    parentRelation: 'father',
    address: 'دمشق - المالكي',
    nationality: 'سوري',
    bloodType: 'A-',
    allergies: 'غبار الطلع',
    chronicConditions: '',
    notes: '',
    icd10Diagnoses: [
      { code: 'J03.90', description: 'التهاب لوز حاد', date: iso(daysAgo(1)), status: 'active' },
    ],
    pastMedicalHistory: { chronicDiseases: [], previousSurgeries: [], previousHospitalizations: [], regularMedications: [] },
    familyHistory: { father: { conditions: [] }, mother: { conditions: ['حساسية'] }, siblings: { conditions: [] }, consanguinity: false },
    birthHistory: { gestationalAgeWeeks: 38, birthWeightKg: 3.1, deliveryType: 'normal' },
    socialHistory: { schoolGrade: 'الروضة', schoolPerformance: 'good' },
    allergiesDetailed: [
      { substance: 'غبار الطلع', reaction: 'عطاس ورشح', severity: 'mild' },
    ],
    growthRecords: [
      { date: iso(monthsAgoSafe(12)), ageMonths: 52, weightKg: 17, heightCm: 105, bmi: 15.4 },
      { date: iso(daysAgo(1)), ageMonths: 64, weightKg: 19, heightCm: 110, bmi: 15.7 },
    ],
    createdAt: iso(yearsAgo(2, 6)),
    lastVisitAt: iso(daysAgo(1)),
  }),
  makePatient({
    id: 'pat_006',
    fullName: 'كريم عمران درويش',
    birthDate: iso(yearsAgo(10, 2)),
    gender: 'male',
    phone: '+963 988 667 788',
    parentName: 'عمران درويش',
    parentPhone: '+963 988 667 788',
    address: 'حمص - الإنشاءات',
    nationality: 'سوري',
    bloodType: 'O-',
    pastMedicalHistory: { chronicDiseases: [], previousSurgeries: [], previousHospitalizations: [], regularMedications: [] },
    familyHistory: { father: { conditions: [] }, mother: { conditions: [] }, siblings: { conditions: [] }, consanguinity: false },
    birthHistory: { gestationalAgeWeeks: 40, birthWeightKg: 3.7, deliveryType: 'normal' },
    socialHistory: { schoolGrade: 'الصف الرابع', schoolPerformance: 'good', exercise: 'كرة قدم' },
    createdAt: iso(yearsAgo(4)),
    lastVisitAt: iso(daysAgo(30)),
  }),
  makePatient({
    id: 'pat_007',
    fullName: 'جود إبراهيم السعدي',
    birthDate: iso(monthsAgoSafe(8)),
    gender: 'female',
    phone: '+963 999 778 899',
    parentName: 'إبراهيم السعدي',
    parentPhone: '+963 999 778 899',
    address: 'دمشق - ركن الدين',
    nationality: 'سوري',
    bloodType: 'B-',
    allergies: 'الحليب البقري',
    notes: 'رضيع - لقاحات فقط.',
    pastMedicalHistory: { chronicDiseases: [], previousSurgeries: [], previousHospitalizations: [], regularMedications: [] },
    familyHistory: { father: { conditions: [] }, mother: { conditions: [] }, siblings: { conditions: [] }, consanguinity: false },
    birthHistory: { gestationalAgeWeeks: 39, birthWeightKg: 3.0, deliveryType: 'cesarean', breastfeedingDuration: 'حالياً' },
    allergiesDetailed: [
      { substance: 'حليب البقر', reaction: 'إقياء وإسهال', severity: 'moderate' },
    ],
    immunizations: [
      { vaccine: 'السل', dose: 1, scheduledAge: 'عند الولادة', administeredAt: iso(monthsAgoSafe(8)), status: 'given', batchNumber: 'BCG-2026-01' },
      { vaccine: 'الالتهاب الكبدي ب', dose: 1, scheduledAge: 'عند الولادة', administeredAt: iso(monthsAgoSafe(8)), status: 'given', batchNumber: 'HEPB-2026-01' },
      { vaccine: 'الخماسي', dose: 1, scheduledAge: 'شهران', administeredAt: iso(monthsAgoSafe(6)), status: 'given', batchNumber: 'PENTA-2026-02' },
      { vaccine: 'الخماسي', dose: 2, scheduledAge: '4 أشهر', administeredAt: iso(monthsAgoSafe(4)), status: 'given', batchNumber: 'PENTA-2026-04' },
      { vaccine: 'الخماسي', dose: 3, scheduledAge: '6 أشهر', status: 'pending', nextDueDate: iso(monthsFromNow(2)) },
    ],
    growthRecords: [
      { date: iso(monthsAgoSafe(4)), ageMonths: 4, weightKg: 6.5, heightCm: 62, bmi: 16.9 },
      { date: iso(daysAgo(2)), ageMonths: 8, weightKg: 8.2, heightCm: 68, bmi: 17.7 },
    ],
    developmentalMilestones: [
      { domain: 'motor', milestone: 'رفع الرأس', expectedAgeMonths: 3, achievedAt: iso(monthsAgoSafe(5)), status: 'achieved' },
      { domain: 'social', milestone: 'الابتسامة', expectedAgeMonths: 2, achievedAt: iso(monthsAgoSafe(6)), status: 'achieved' },
    ],
    createdAt: iso(monthsAgoSafe(8)),
    lastVisitAt: iso(daysAgo(2)),
  }),
  makePatient({
    id: 'pat_008',
    fullName: 'محمد ياسر الفهد',
    birthDate: iso(yearsAgo(3, 7)),
    gender: 'male',
    phone: '+963 921 889 900',
    parentName: 'ياسر الفهد',
    parentPhone: '+963 921 889 900',
    address: 'اللاذقية - الصليبة',
    nationality: 'سوري',
    bloodType: 'A+',
    pastMedicalHistory: { chronicDiseases: [], previousSurgeries: [], previousHospitalizations: [], regularMedications: [] },
    familyHistory: { father: { conditions: [] }, mother: { conditions: [] }, siblings: { conditions: [] }, consanguinity: false },
    birthHistory: { gestationalAgeWeeks: 40, birthWeightKg: 3.5, deliveryType: 'normal' },
    createdAt: iso(yearsAgo(2)),
    lastVisitAt: iso(daysAgo(45)),
  }),
  makePatient({
    id: 'pat_009',
    fullName: 'هند زياد المهايني',
    birthDate: iso(yearsAgo(6, 1)),
    gender: 'female',
    phone: '+963 932 990 011',
    parentName: 'زياد المهايني',
    parentPhone: '+963 932 990 011',
    address: 'حلب - الفيض',
    nationality: 'سوري',
    bloodType: 'O+',
    allergies: 'الفراولة',
    pastMedicalHistory: { chronicDiseases: [], previousSurgeries: [], previousHospitalizations: [], regularMedications: [] },
    familyHistory: { father: { conditions: [] }, mother: { conditions: [] }, siblings: { conditions: [] }, consanguinity: false },
    birthHistory: { gestationalAgeWeeks: 38, birthWeightKg: 3.0, deliveryType: 'normal' },
    allergiesDetailed: [
      { substance: 'الفراولة', reaction: 'طفح جلدي', severity: 'mild' },
    ],
    createdAt: iso(yearsAgo(3)),
    lastVisitAt: iso(daysAgo(10)),
  }),
  makePatient({
    id: 'pat_010',
    fullName: 'ريان طلال الكردي',
    birthDate: iso(yearsAgo(8, 5)),
    gender: 'male',
    phone: '+963 943 001 122',
    parentName: 'طلال الكردي',
    parentPhone: '+963 943 001 122',
    address: 'دمشق - المهاجرين',
    nationality: 'سوري',
    bloodType: 'AB+',
    chronicConditions: 'حساسية أنف',
    notes: 'يستخدم مضاد هيستامين موسمي.',
    icd10Diagnoses: [
      { code: 'J30.1', description: 'حساسية أنف موسمية', date: iso(monthsAgoSafe(8)), status: 'chronic' },
    ],
    pastMedicalHistory: {
      chronicDiseases: ['حساسية أنف موسمية'],
      previousSurgeries: [],
      previousHospitalizations: [],
      regularMedications: [
        { name: 'سيتريزين', dose: '5 مل', frequency: 'يومياً' },
      ],
    },
    familyHistory: { father: { conditions: ['حساسية'] }, mother: { conditions: [] }, siblings: { conditions: [] }, consanguinity: false },
    birthHistory: { gestationalAgeWeeks: 39, birthWeightKg: 3.3, deliveryType: 'normal' },
    socialHistory: { schoolGrade: 'الصف الثاني', schoolPerformance: 'good' },
    createdAt: iso(yearsAgo(4)),
    lastVisitAt: iso(daysAgo(5)),
  }),
  makePatient({
    id: 'pat_011',
    fullName: 'دانة هشام الخوري',
    birthDate: iso(yearsAgo(2, 11)),
    gender: 'female',
    phone: '+963 954 112 233',
    parentName: 'هشام الخوري',
    parentPhone: '+963 954 112 233',
    address: 'دمشق - القصور',
    nationality: 'سوري',
    bloodType: 'B+',
    pastMedicalHistory: { chronicDiseases: [], previousSurgeries: [], previousHospitalizations: [], regularMedications: [] },
    familyHistory: { father: { conditions: [] }, mother: { conditions: [] }, siblings: { conditions: [] }, consanguinity: false },
    birthHistory: { gestationalAgeWeeks: 40, birthWeightKg: 3.4, deliveryType: 'normal' },
    createdAt: iso(yearsAgo(1, 6)),
    lastVisitAt: iso(daysAgo(60)),
  }),
  makePatient({
    id: 'pat_012',
    fullName: 'آدم سامر العوض',
    birthDate: iso(monthsAgoSafe(4)),
    gender: 'male',
    phone: '+963 965 223 344',
    parentName: 'سامر العوض',
    parentPhone: '+963 965 223 344',
    address: 'دمشق - الجسر الأبيض',
    nationality: 'سوري',
    bloodType: 'A+',
    notes: 'متابعته للقاحات.',
    pastMedicalHistory: { chronicDiseases: [], previousSurgeries: [], previousHospitalizations: [], regularMedications: [] },
    familyHistory: { father: { conditions: [] }, mother: { conditions: [] }, siblings: { conditions: [] }, consanguinity: false },
    birthHistory: { gestationalAgeWeeks: 38, birthWeightKg: 3.1, deliveryType: 'cesarean', breastfeedingDuration: '4 أشهر' },
    immunizations: [
      { vaccine: 'السل', dose: 1, scheduledAge: 'عند الولادة', administeredAt: iso(monthsAgoSafe(4)), status: 'given' },
      { vaccine: 'الالتهاب الكبدي ب', dose: 1, scheduledAge: 'عند الولادة', administeredAt: iso(monthsAgoSafe(4)), status: 'given' },
      { vaccine: 'الخماسي', dose: 1, scheduledAge: 'شهران', administeredAt: iso(monthsAgoSafe(2)), status: 'given' },
    ],
    growthRecords: [
      { date: iso(daysAgo(15)), ageMonths: 3, weightKg: 6, heightCm: 60, bmi: 16.7 },
    ],
    createdAt: iso(monthsAgoSafe(4)),
    lastVisitAt: iso(daysAgo(15)),
  }),
]

export const seedAppointments: Appointment[] = [
  { id: 'apt_001', patientId: 'pat_001', doctorId: 'user_doctor', scheduledAt: iso(daysFromNow(0, 9, 0)), durationMin: 20, status: 'completed', reason: 'متابعة ربو', createdAt: iso(daysAgo(7)) },
  { id: 'apt_002', patientId: 'pat_005', doctorId: 'user_doctor', scheduledAt: iso(daysFromNow(0, 9, 30)), durationMin: 20, status: 'in_progress', reason: 'التهاب لوز', createdAt: iso(daysAgo(2)) },
  { id: 'apt_003', patientId: 'pat_007', doctorId: 'user_doctor', scheduledAt: iso(daysFromNow(0, 10, 30)), durationMin: 15, status: 'waiting', reason: 'لقاح رباعي', createdAt: iso(daysAgo(3)) },
  { id: 'apt_004', patientId: 'pat_010', doctorId: 'user_doctor2', scheduledAt: iso(daysFromNow(0, 11, 0)), durationMin: 30, status: 'scheduled', reason: 'متابعة حساسية', createdAt: iso(daysAgo(5)) },
  { id: 'apt_005', patientId: 'pat_002', doctorId: 'user_doctor', scheduledAt: iso(daysFromNow(0, 12, 0)), durationMin: 20, status: 'scheduled', reason: 'كشف دوري', createdAt: iso(daysAgo(1)) },
  { id: 'apt_006', patientId: 'pat_009', doctorId: 'user_doctor2', scheduledAt: iso(daysFromNow(0, 14, 0)), durationMin: 30, status: 'scheduled', reason: 'حساسية غذائية', createdAt: iso(daysAgo(1)) },
  { id: 'apt_007', patientId: 'pat_003', doctorId: 'user_doctor', scheduledAt: iso(daysFromNow(1, 9, 0)), durationMin: 30, status: 'scheduled', reason: 'فحص دوري', createdAt: iso(daysAgo(1)) },
  { id: 'apt_008', patientId: 'pat_008', doctorId: 'user_doctor2', scheduledAt: iso(daysFromNow(1, 10, 0)), durationMin: 30, status: 'scheduled', reason: 'متابعة', createdAt: iso(daysAgo(1)) },
  { id: 'apt_009', patientId: 'pat_012', doctorId: 'user_doctor', scheduledAt: iso(daysFromNow(1, 11, 0)), durationMin: 15, status: 'scheduled', reason: 'لقاح', createdAt: iso(daysAgo(1)) },
  { id: 'apt_010', patientId: 'pat_004', doctorId: 'user_doctor', scheduledAt: iso(daysFromNow(2, 9, 30)), durationMin: 30, status: 'scheduled', reason: 'متابعة نمو', createdAt: iso(daysAgo(2)) },
  { id: 'apt_011', patientId: 'pat_011', doctorId: 'user_doctor2', scheduledAt: iso(daysFromNow(2, 11, 0)), durationMin: 30, status: 'scheduled', reason: 'كشف', createdAt: iso(daysAgo(2)) },
  {
    id: 'apt_012',
    patientId: 'pat_006',
    doctorId: 'user_doctor',
    scheduledAt: iso(new Date(daysAgo(1).setHours(10, 0, 0, 0))),
    durationMin: 30,
    status: 'completed',
    reason: 'كشف دوري',
    createdAt: iso(daysAgo(8)),
  },
]

export const seedExamTemplates: ExamTemplate[] = [
  {
    id: 'tpl_cold',
    name: 'نزلة برد',
    category: 'general',
    diagnosis: 'نزلة برد فيروسية (Viral Upper Respiratory Tract Infection)',
    treatment: 'راحة تامة، سوائل دافئة، تغذية جيدة. مراجعة بعد 5 أيام أو عند ارتفاع الحرارة.',
    prescriptions: [
      { medicationName: 'باراسيتامول شراب', dosage: '5 مل', frequency: 'كل 6 ساعات عند اللزوم', durationDays: 5, instructions: 'بعد الطعام' },
      { medicationName: 'فيتامين C', dosage: 'قرص استحلاب', frequency: 'مرة يومياً', durationDays: 7 },
    ],
  },
  {
    id: 'tpl_tonsil',
    name: 'التهاب لوز',
    category: 'ent',
    diagnosis: 'التهاب لوز حاد (Acute Tonsillitis)',
    treatment: 'مضاد حيوي لمدة 7 أيام. مسكنات عند اللزوم. غرغرة بمحلول ملحي دافئ.',
    prescriptions: [
      { medicationName: 'أموكسيسيلين', dosage: '250 ملغ', frequency: 'كل 8 ساعات', durationDays: 7, instructions: 'بعد الطعام' },
      { medicationName: 'باراسيتامول', dosage: 'حسب الوزن', frequency: 'كل 6 ساعات', durationDays: 5, instructions: 'عند اللزوم' },
    ],
  },
  {
    id: 'tpl_asthma',
    name: 'متابعة ربو',
    category: 'respiratory',
    diagnosis: 'ربو قصبي - خفيف مستمر',
    treatment: 'متابعة العلاج الوقائي. تجنب المهيجات. بخاخ عند اللزوم.',
    prescriptions: [
      { medicationName: 'بيكلوميثازون بخاخ', dosage: 'بختان', frequency: 'مرتين يومياً', durationDays: 30, instructions: 'استخدام فاصل فموي' },
      { medicationName: 'سالبوتامول بخاخ', dosage: 'بختان', frequency: 'عند اللزوم', durationDays: 30, instructions: 'عند ضيق التنفس فقط' },
    ],
  },
  {
    id: 'tpl_flu',
    name: 'إنفلونزا',
    category: 'general',
    diagnosis: 'إنفلونزا موسمية',
    treatment: 'مضاد فيروسي في أول 48 ساعة. راحة تامة. عزل.',
    prescriptions: [
      { medicationName: 'أوسيلتاميفير', dosage: 'حسب الوزن', frequency: 'كل 12 ساعة', durationDays: 5 },
      { medicationName: 'باراسيتامول', dosage: 'حسب الوزن', frequency: 'كل 6 ساعات', durationDays: 5 },
    ],
  },
  {
    id: 'tpl_vaccine',
    name: 'لقاح دوري',
    category: 'preventive',
    diagnosis: 'تطبيق لقاح - متابعة',
    treatment: 'لا توجد إجراءات علاجية. مراقبة الأعراض الموضعية لمدة 48 ساعة.',
    prescriptions: [],
  },
]

export const seedExams: Exam[] = [
  {
    id: 'exm_001',
    patientId: 'pat_001',
    doctorId: 'user_doctor',
    appointmentId: 'apt_001',
    examDate: iso(daysAgo(3)),
    chiefComplaint: 'سعال ليلي وضيق تنفس خفيف',
    vitals: { temperature: 37.2, weightKg: 16.5, heightCm: 102, heartRate: 98, respiratoryRate: 22, oxygenSaturation: 97 },
    diagnosis: 'ربو قصبي - نوبة خفيفة',
    treatment: 'استمرار العلاج الوقائي + بخاخ عند اللزوم',
    notes: 'تحسن ملحوظ. الأسرة متعاونة.',
    prescriptions: [
      { id: 'rx_001', medicationName: 'بيكلوميثازون بخاخ', dosage: 'بختان', frequency: 'مرتين يومياً', durationDays: 30 },
      { id: 'rx_002', medicationName: 'سالبوتامول بخاخ', dosage: 'بختان', frequency: 'عند اللزوم', durationDays: 30 },
    ],
    createdAt: iso(daysAgo(3)),
  },
  {
    id: 'exm_002',
    patientId: 'pat_005',
    doctorId: 'user_doctor',
    examDate: iso(daysAgo(1)),
    chiefComplaint: 'حرارة 38.5 وألم بلع',
    vitals: { temperature: 38.5, weightKg: 19, heightCm: 110, heartRate: 105, oxygenSaturation: 98 },
    diagnosis: 'التهاب لوز حاد بكتيري',
    treatment: 'مضاد حيوي + مسكن',
    prescriptions: [
      { id: 'rx_003', medicationName: 'أموكسيسيلين', dosage: '250 ملغ', frequency: 'كل 8 ساعات', durationDays: 7 },
      { id: 'rx_004', medicationName: 'باراسيتامول', dosage: '5 مل', frequency: 'كل 6 ساعات', durationDays: 5 },
    ],
    createdAt: iso(daysAgo(1)),
  },
  {
    id: 'exm_003',
    patientId: 'pat_002',
    doctorId: 'user_doctor',
    examDate: iso(daysAgo(7)),
    chiefComplaint: 'كشف دوري',
    vitals: { temperature: 36.8, weightKg: 13, heightCm: 88, heartRate: 95, oxygenSaturation: 98 },
    diagnosis: 'حالة عامة جيدة',
    treatment: 'متابعة فقط',
    prescriptions: [],
    createdAt: iso(daysAgo(7)),
  },
]

export const seedInvoices: Invoice[] = [
  {
    id: 'inv_001',
    number: 'INV-2026-0001',
    patientId: 'pat_001',
    createdBy: 'user_recep',
    createdAt: iso(daysAgo(3)),
    currency: 'SYP',
    items: [
      { id: 'it_1', description: 'كشف', quantity: 1, unitPrice: 100000, total: 100000 },
      { id: 'it_2', description: 'بخاخ بيكلوميثازون', quantity: 1, unitPrice: 250000, total: 250000 },
    ],
    subtotal: 350000,
    discount: 0,
    tax: 0,
    total: 350000,
    status: 'paid',
    paid: 350000,
  },
  {
    id: 'inv_002',
    number: 'INV-2026-0002',
    patientId: 'pat_005',
    createdBy: 'user_recep',
    createdAt: iso(daysAgo(1)),
    currency: 'SYP',
    items: [
      { id: 'it_3', description: 'كشف', quantity: 1, unitPrice: 100000, total: 100000 },
      { id: 'it_4', description: 'أموكسيسيلين شراب', quantity: 1, unitPrice: 85000, total: 85000 },
      { id: 'it_5', description: 'باراسيتامول شراب', quantity: 1, unitPrice: 35000, total: 35000 },
    ],
    subtotal: 220000,
    discount: 20000,
    tax: 0,
    total: 200000,
    status: 'paid',
    paid: 200000,
  },
  {
    id: 'inv_003',
    number: 'INV-2026-0003',
    patientId: 'pat_007',
    createdBy: 'user_recep',
    createdAt: iso(daysAgo(2)),
    currency: 'SYP',
    items: [{ id: 'it_6', description: 'لقاح رباعي', quantity: 1, unitPrice: 180000, total: 180000 }],
    subtotal: 180000,
    discount: 0,
    tax: 0,
    total: 180000,
    status: 'pending',
    paid: 0,
  },
  {
    id: 'inv_004',
    number: 'INV-2026-0004',
    patientId: 'pat_010',
    createdBy: 'user_recep',
    createdAt: iso(daysAgo(5)),
    currency: 'SYP',
    items: [
      { id: 'it_7', description: 'كشف', quantity: 1, unitPrice: 100000, total: 100000 },
      { id: 'it_8', description: 'مضاد هيستامين', quantity: 1, unitPrice: 45000, total: 45000 },
    ],
    subtotal: 145000,
    discount: 0,
    tax: 0,
    total: 145000,
    status: 'partial',
    paid: 100000,
  },
]

export const seedVaccines: Vaccine[] = [
  { id: 'vac_001', patientId: 'pat_001', vaccineName: 'اللقاح الخماسي', administeredAt: iso(yearsAgo(3, 6)), batchNumber: 'B-2023-0451', administeredBy: 'user_nurse' },
  { id: 'vac_002', patientId: 'pat_001', vaccineName: 'اللقاح الثلاثي البكتيري', administeredAt: iso(yearsAgo(2, 0)), batchNumber: 'B-2024-0891', administeredBy: 'user_nurse' },
  { id: 'vac_003', patientId: 'pat_002', vaccineName: 'اللقاح الرباعي', administeredAt: iso(yearsAgo(1, 6)), batchNumber: 'B-2024-1012', administeredBy: 'user_nurse' },
  { id: 'vac_004', patientId: 'pat_007', vaccineName: 'اللقاح الخماسي', administeredAt: iso(monthsAgoSafe(4)), batchNumber: 'B-2026-0023', administeredBy: 'user_nurse' },
]

export const seedAuditLog: AuditLogEntry[] = [
  { id: 'log_001', userId: 'user_admin', userName: 'د. سامي المحمد', action: 'login', entityType: 'session', entityId: 'session_001', createdAt: iso(daysAgo(0)) },
  { id: 'log_002', userId: 'user_doctor', userName: 'د. ليلى الخالد', action: 'create_exam', entityType: 'exam', entityId: 'exm_001', details: { patientId: 'pat_001' }, createdAt: iso(daysAgo(3)) },
  { id: 'log_003', userId: 'user_recep', userName: 'سارة الحسيني', action: 'create_invoice', entityType: 'invoice', entityId: 'inv_001', details: { total: 350000, patientId: 'pat_001' }, createdAt: iso(daysAgo(3)) },
]
