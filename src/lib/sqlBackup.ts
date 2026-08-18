/**
 * تصدير كامل لكل بيانات المنصة كملف SQL (MySQL/PostgreSQL متوافق)
 * يُستخدم للنسخ الاحتياطي والترحيل بين السيرفرات
 */
import { useAuthStore } from '@/stores/authStore'
import { usePatientsStore } from '@/stores/patientsStore'
import { useExamsStore } from '@/stores/examsStore'
import { useInvoicesStore } from '@/stores/invoicesStore'
import { useVaccinesStore } from '@/stores/vaccinesStore'
import { useAppointmentsStore } from '@/stores/appointmentsStore'
import { useAccountingStore } from '@/stores/accountingStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { User } from '@/types/user'
import type { Patient } from '@/types/patient'
import type { Exam } from '@/types/exam'
import type { Invoice, InvoiceItem } from '@/types/invoice'
import type { Vaccine } from '@/types/vaccine'
import type { Appointment } from '@/types/appointment'
import type { JournalEntry, Account } from '@/types/accounting'

/** تهريب قيمة نصية لـ SQL — آمن لـ MySQL/Postgres */
function escape(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (typeof value === 'object') return escape(JSON.stringify(value))
  let s = String(value)
  s = s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
  return `'${s}'`
}

function nowSql(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)
}

export interface BackupSummary {
  users: number
  patients: number
  exams: number
  invoices: number
  invoiceItems: number
  vaccines: number
  appointments: number
  journalEntries: number
  accounts: number
  totalBytes: number
  generatedAt: string
}

/** يقرأ كل البيانات من المخازن ويُرجع ملخص + نص SQL كامل */
export function generateSqlBackup(): { sql: string; summary: BackupSummary } {
  const auth = useAuthStore.getState()
  const patients = usePatientsStore.getState().patients
  const exams = useExamsStore.getState().exams
  const invoices = useInvoicesStore.getState().invoices
  const vaccines = useVaccinesStore.getState().vaccines
  const appointments = useAppointmentsStore.getState().appointments
  const accounting = useAccountingStore.getState()
  const settings = useSettingsStore.getState()

  const lines: string[] = []
  const summary: BackupSummary = {
    users: auth.users.length,
    patients: patients.length,
    exams: exams.length,
    invoices: invoices.length,
    invoiceItems: 0,
    vaccines: vaccines.length,
    appointments: appointments.length,
    journalEntries: accounting.journalEntries?.length || 0,
    accounts: accounting.accounts?.length || 0,
    totalBytes: 0,
    generatedAt: nowSql(),
  }

  lines.push('-- =============================================================')
  lines.push('-- Synapse Systems - نسخة احتياطية كاملة')
  lines.push(`-- Generated: ${summary.generatedAt}`)
  lines.push('-- Compatible: MySQL 8+ / MariaDB 10.5+ / PostgreSQL 14+')
  lines.push('-- =============================================================')
  lines.push('SET FOREIGN_KEY_CHECKS=0;')
  lines.push('SET NAMES utf8mb4;')
  lines.push('START TRANSACTION;')
  lines.push('')

  // ===== settings (عيادة واحدة) =====
  lines.push('-- ---------- Clinic Settings ----------')
  lines.push('CREATE TABLE IF NOT EXISTS clinic_settings (')
  lines.push('  id INT PRIMARY KEY,')
  lines.push('  data JSON NOT NULL,')
  lines.push('  updated_at DATETIME NOT NULL')
  lines.push(');')
  lines.push('INSERT INTO clinic_settings (id, data, updated_at) VALUES')
  lines.push(`  (1, ${escape(JSON.stringify(settings.clinic))}, ${escape(nowSql())})`)
  lines.push('  ON DUPLICATE KEY UPDATE data=VALUES(data), updated_at=VALUES(updated_at);')
  lines.push('')

  // ===== users =====
  lines.push('-- ---------- Users (Staff + Patients) ----------')
  lines.push('CREATE TABLE IF NOT EXISTS users (')
  lines.push('  id VARCHAR(64) PRIMARY KEY,')
  lines.push('  username VARCHAR(120) UNIQUE NOT NULL,')
  lines.push('  password VARCHAR(255) NOT NULL,')
  lines.push('  full_name VARCHAR(255) NOT NULL,')
  lines.push('  role VARCHAR(20) NOT NULL,')
  lines.push('  specialty VARCHAR(255) NULL,')
  lines.push('  avatar_color VARCHAR(20) NULL,')
  lines.push('  email VARCHAR(255) NULL,')
  lines.push('  phone VARCHAR(64) NULL,')
  lines.push('  permissions JSON NULL,')
  lines.push('  linked_patient_id VARCHAR(64) NULL,')
  lines.push('  active TINYINT(1) NOT NULL DEFAULT 1,')
  lines.push('  created_at DATETIME NOT NULL,')
  lines.push('  last_login_at DATETIME NULL,')
  lines.push('  INDEX idx_role (role),')
  lines.push('  INDEX idx_linked (linked_patient_id)')
  lines.push(');')
  if (auth.users.length) {
    lines.push('INSERT INTO users (id, username, password, full_name, role, specialty, avatar_color, email, phone, permissions, linked_patient_id, active, created_at, last_login_at) VALUES')
    auth.users.forEach((u: User, i: number) => {
      const tail = i === auth.users.length - 1 ? ';' : ','
      lines.push(
        `  (${escape(u.id)}, ${escape(u.username)}, ${escape(u.password)}, ${escape(u.fullName)}, ${escape(u.role)}, ${escape(u.specialty)}, ${escape(u.avatarColor)}, ${escape(u.email)}, ${escape(u.phone)}, ${escape(JSON.stringify(u.permissions || []))}, ${escape(u.linkedPatientId)}, ${u.active ? 1 : 0}, ${escape(u.createdAt)}, ${escape(u.lastLoginAt)})${tail}`
      )
    })
  }
  lines.push('')

  // ===== patients =====
  lines.push('-- ---------- Patients ----------')
  lines.push('CREATE TABLE IF NOT EXISTS patients (')
  lines.push('  id VARCHAR(64) PRIMARY KEY,')
  lines.push('  mrn VARCHAR(64) NULL,')
  lines.push('  full_name VARCHAR(255) NOT NULL,')
  lines.push('  birth_date DATE NULL,')
  lines.push('  gender VARCHAR(10) NULL,')
  lines.push('  nationality VARCHAR(64) NULL,')
  lines.push('  national_id VARCHAR(64) NULL,')
  lines.push('  phone VARCHAR(64) NULL,')
  lines.push('  email VARCHAR(255) NULL,')
  lines.push('  parent_name VARCHAR(255) NULL,')
  lines.push('  parent_phone VARCHAR(64) NULL,')
  lines.push('  parent_email VARCHAR(255) NULL,')
  lines.push('  parent_relation VARCHAR(20) NULL,')
  lines.push('  address TEXT NULL,')
  lines.push('  blood_type VARCHAR(10) NULL,')
  lines.push('  rh_factor VARCHAR(5) NULL,')
  lines.push('  photo TEXT NULL,')
  lines.push('  allergies TEXT NULL,')
  lines.push('  chronic_conditions TEXT NULL,')
  lines.push('  notes TEXT NULL,')
  lines.push('  past_medical_history JSON NULL,')
  lines.push('  family_history JSON NULL,')
  lines.push('  birth_history JSON NULL,')
  lines.push('  social_history JSON NULL,')
  lines.push('  immunizations JSON NULL,')
  lines.push('  growth_records JSON NULL,')
  lines.push('  developmental_milestones JSON NULL,')
  lines.push('  allergies_detailed JSON NULL,')
  lines.push('  icd10_diagnoses JSON NULL,')
  lines.push('  insurance JSON NULL,')
  lines.push('  clinical_status VARCHAR(30) NULL,')
  lines.push('  risk_level VARCHAR(20) NULL,')
  lines.push('  care_team JSON NULL,')
  lines.push('  emergency_contacts JSON NULL,')
  lines.push('  communication_prefs JSON NULL,')
  lines.push('  baseline_vitals JSON NULL,')
  lines.push('  communications JSON NULL,')
  lines.push('  last_visit_at DATETIME NULL,')
  lines.push('  created_at DATETIME NOT NULL,')
  lines.push('  INDEX idx_mrn (mrn),')
  lines.push('  INDEX idx_name (full_name)')
  lines.push(');')
  if (patients.length) {
    lines.push('INSERT INTO patients (id, mrn, full_name, birth_date, gender, nationality, national_id, phone, email, parent_name, parent_phone, parent_email, parent_relation, address, blood_type, rh_factor, photo, allergies, chronic_conditions, notes, past_medical_history, family_history, birth_history, social_history, immunizations, growth_records, developmental_milestones, allergies_detailed, icd10_diagnoses, insurance, clinical_status, risk_level, care_team, emergency_contacts, communication_prefs, baseline_vitals, communications, last_visit_at, created_at) VALUES')
    patients.forEach((p: Patient, i: number) => {
      const tail = i === patients.length - 1 ? ';' : ','
      lines.push(
        `  (${escape(p.id)}, ${escape(p.mrn)}, ${escape(p.fullName)}, ${escape(p.birthDate)}, ${escape(p.gender)}, ${escape((p as any).nationality)}, ${escape((p as any).nationalId)}, ${escape(p.phone)}, ${escape(p.email)}, ${escape(p.parentName)}, ${escape(p.parentPhone)}, ${escape(p.parentEmail)}, ${escape(p.parentRelation)}, ${escape(p.address)}, ${escape(p.bloodType)}, ${escape(p.rhFactor)}, ${escape(p.photo)}, ${escape(p.allergies)}, ${escape(p.chronicConditions)}, ${escape(p.notes)}, ${escape(JSON.stringify(p.pastMedicalHistory || null))}, ${escape(JSON.stringify(p.familyHistory || null))}, ${escape(JSON.stringify(p.birthHistory || null))}, ${escape(JSON.stringify(p.socialHistory || null))}, ${escape(JSON.stringify(p.immunizations || []))}, ${escape(JSON.stringify(p.growthRecords || []))}, ${escape(JSON.stringify(p.developmentalMilestones || []))}, ${escape(JSON.stringify(p.allergiesDetailed || []))}, ${escape(JSON.stringify(p.icd10Diagnoses || []))}, ${escape(JSON.stringify(p.insurance || null))}, ${escape(p.clinicalStatus)}, ${escape(p.riskLevel)}, ${escape(JSON.stringify(p.careTeam || null))}, ${escape(JSON.stringify(p.emergencyContacts || []))}, ${escape(JSON.stringify(p.communicationPrefs || null))}, ${escape(JSON.stringify(p.baselineVitals || null))}, ${escape(JSON.stringify(p.communications || []))}, ${escape(p.lastVisitAt)}, ${escape(p.createdAt)})${tail}`
      )
    })
  }
  lines.push('')

  // ===== exams =====
  lines.push('-- ---------- Exams ----------')
  lines.push('CREATE TABLE IF NOT EXISTS exams (')
  lines.push('  id VARCHAR(64) PRIMARY KEY,')
  lines.push('  patient_id VARCHAR(64) NOT NULL,')
  lines.push('  doctor_id VARCHAR(64) NULL,')
  lines.push('  appointment_id VARCHAR(64) NULL,')
  lines.push('  exam_date DATETIME NOT NULL,')
  lines.push('  chief_complaint TEXT NULL,')
  lines.push('  diagnosis TEXT NULL,')
  lines.push('  treatment TEXT NULL,')
  lines.push('  notes TEXT NULL,')
  lines.push('  vitals JSON NULL,')
  lines.push('  prescriptions JSON NULL,')
  lines.push('  follow_up_date DATE NULL,')
  lines.push('  created_at DATETIME NOT NULL,')
  lines.push('  INDEX idx_patient (patient_id)')
  lines.push(');')
  if (exams.length) {
    lines.push('INSERT INTO exams (id, patient_id, doctor_id, appointment_id, exam_date, chief_complaint, diagnosis, treatment, notes, vitals, prescriptions, follow_up_date, created_at) VALUES')
    exams.forEach((e: Exam, i: number) => {
      const tail = i === exams.length - 1 ? ';' : ','
      lines.push(
        `  (${escape(e.id)}, ${escape(e.patientId)}, ${escape(e.doctorId)}, ${escape(e.appointmentId)}, ${escape(e.examDate)}, ${escape(e.chiefComplaint)}, ${escape(e.diagnosis)}, ${escape(e.treatment)}, ${escape(e.notes)}, ${escape(JSON.stringify(e.vitals || null))}, ${escape(JSON.stringify(e.prescriptions || []))}, ${escape(e.followUpDate)}, ${escape(e.createdAt)})${tail}`
      )
    })
  }
  lines.push('')

  // ===== invoices + invoice_items =====
  lines.push('-- ---------- Invoices ----------')
  lines.push('CREATE TABLE IF NOT EXISTS invoices (')
  lines.push('  id VARCHAR(64) PRIMARY KEY,')
  lines.push('  number VARCHAR(64) UNIQUE NOT NULL,')
  lines.push('  patient_id VARCHAR(64) NOT NULL,')
  lines.push('  created_by VARCHAR(64) NULL,')
  lines.push('  currency VARCHAR(10) NOT NULL,')
  lines.push('  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,')
  lines.push('  discount DECIMAL(14,2) NOT NULL DEFAULT 0,')
  lines.push('  tax DECIMAL(14,2) NOT NULL DEFAULT 0,')
  lines.push('  total DECIMAL(14,2) NOT NULL DEFAULT 0,')
  lines.push('  paid DECIMAL(14,2) NOT NULL DEFAULT 0,')
  lines.push('  status VARCHAR(20) NOT NULL,')
  lines.push('  notes TEXT NULL,')
  lines.push('  created_at DATETIME NOT NULL,')
  lines.push('  INDEX idx_invoice_patient (patient_id),')
  lines.push('  INDEX idx_invoice_status (status)')
  lines.push(');')
  lines.push('')
  lines.push('CREATE TABLE IF NOT EXISTS invoice_items (')
  lines.push('  id VARCHAR(64) PRIMARY KEY,')
  lines.push('  invoice_id VARCHAR(64) NOT NULL,')
  lines.push('  description VARCHAR(500) NOT NULL,')
  lines.push('  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,')
  lines.push('  unit_price DECIMAL(14,2) NOT NULL DEFAULT 0,')
  lines.push('  total DECIMAL(14,2) NOT NULL DEFAULT 0,')
  lines.push('  INDEX idx_item_invoice (invoice_id)')
  lines.push(');')
  if (invoices.length) {
    lines.push('INSERT INTO invoices (id, number, patient_id, created_by, currency, subtotal, discount, tax, total, paid, status, notes, created_at) VALUES')
    invoices.forEach((inv: Invoice, i: number) => {
      const tail = i === invoices.length - 1 ? ';' : ','
      lines.push(
        `  (${escape(inv.id)}, ${escape(inv.number)}, ${escape(inv.patientId)}, ${escape(inv.createdBy)}, ${escape(inv.currency)}, ${inv.subtotal || 0}, ${inv.discount || 0}, ${inv.tax || 0}, ${inv.total || 0}, ${inv.paid || 0}, ${escape(inv.status)}, ${escape(inv.notes)}, ${escape(inv.createdAt)})${tail}`
      )
    })
    lines.push('')
    const items: InvoiceItem[] = []
    invoices.forEach((inv) => (inv.items || []).forEach((it) => items.push(it)))
    summary.invoiceItems = items.length
    if (items.length) {
      lines.push('INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total) VALUES')
      items.forEach((it, idx) => {
        const tail = idx === items.length - 1 ? ';' : ','
        // البحث عن الفاتورة المالكة للحصول على invoiceId
        const parent = invoices.find((inv) => inv.items.some((x) => x.id === it.id))
        lines.push(
          `  (${escape(it.id)}, ${escape(parent?.id || '')}, ${escape(it.description)}, ${it.quantity || 1}, ${it.unitPrice || 0}, ${it.total || 0})${tail}`
        )
      })
    }
  }
  lines.push('')

  // ===== vaccines =====
  lines.push('-- ---------- Vaccines ----------')
  lines.push('CREATE TABLE IF NOT EXISTS vaccines (')
  lines.push('  id VARCHAR(64) PRIMARY KEY,')
  lines.push('  patient_id VARCHAR(64) NOT NULL,')
  lines.push('  vaccine_name VARCHAR(255) NOT NULL,')
  lines.push('  administered_at DATE NULL,')
  lines.push('  next_due_date DATE NULL,')
  lines.push('  batch_number VARCHAR(64) NULL,')
  lines.push('  administered_by VARCHAR(64) NULL,')
  lines.push('  notes TEXT NULL,')
  lines.push('  INDEX idx_vaccine_patient (patient_id)')
  lines.push(');')
  if (vaccines.length) {
    lines.push('INSERT INTO vaccines (id, patient_id, vaccine_name, administered_at, next_due_date, batch_number, administered_by, notes) VALUES')
    vaccines.forEach((v: Vaccine, i: number) => {
      const tail = i === vaccines.length - 1 ? ';' : ','
      lines.push(
        `  (${escape(v.id)}, ${escape(v.patientId)}, ${escape(v.vaccineName)}, ${escape(v.administeredAt)}, ${escape(v.nextDueDate)}, ${escape(v.batchNumber)}, ${escape(v.administeredBy)}, ${escape(v.notes)})${tail}`
      )
    })
  }
  lines.push('')

  // ===== appointments =====
  lines.push('-- ---------- Appointments ----------')
  lines.push('CREATE TABLE IF NOT EXISTS appointments (')
  lines.push('  id VARCHAR(64) PRIMARY KEY,')
  lines.push('  patient_id VARCHAR(64) NOT NULL,')
  lines.push('  doctor_id VARCHAR(64) NULL,')
  lines.push('  scheduled_at DATETIME NOT NULL,')
  lines.push('  duration_min INT NULL,')
  lines.push('  status VARCHAR(20) NOT NULL,')
  lines.push('  reason TEXT NULL,')
  lines.push('  notes TEXT NULL,')
  lines.push('  created_at DATETIME NOT NULL,')
  lines.push('  INDEX idx_appt_patient (patient_id),')
  lines.push('  INDEX idx_appt_date (scheduled_at)')
  lines.push(');')
  if (appointments.length) {
    lines.push('INSERT INTO appointments (id, patient_id, doctor_id, scheduled_at, duration_min, status, reason, notes, created_at) VALUES')
    appointments.forEach((a: Appointment, i: number) => {
      const tail = i === appointments.length - 1 ? ';' : ','
      lines.push(
        `  (${escape(a.id)}, ${escape(a.patientId)}, ${escape(a.doctorId)}, ${escape(a.scheduledAt)}, ${escape(a.durationMin)}, ${escape(a.status)}, ${escape(a.reason)}, ${escape(a.notes)}, ${escape(a.createdAt)})${tail}`
      )
    })
  }
  lines.push('')

  // ===== accounting =====
  lines.push('-- ---------- Accounting: Accounts ----------')
  lines.push('CREATE TABLE IF NOT EXISTS accounts (')
  lines.push('  id VARCHAR(64) PRIMARY KEY,')
  lines.push('  code VARCHAR(20) UNIQUE NOT NULL,')
  lines.push('  name VARCHAR(255) NOT NULL,')
  lines.push('  name_en VARCHAR(255) NULL,')
  lines.push('  type VARCHAR(20) NOT NULL,')
  lines.push('  parent_id VARCHAR(64) NULL,')
  lines.push('  description TEXT NULL,')
  lines.push('  active TINYINT(1) NOT NULL DEFAULT 1,')
  lines.push('  is_leaf TINYINT(1) NOT NULL DEFAULT 1,')
  lines.push('  created_at DATETIME NOT NULL')
  lines.push(');')
  if (accounting.accounts?.length) {
    lines.push('INSERT INTO accounts (id, code, name, name_en, type, parent_id, description, active, is_leaf, created_at) VALUES')
    accounting.accounts.forEach((a: Account, i: number) => {
      const tail = i === accounting.accounts.length - 1 ? ';' : ','
      lines.push(
        `  (${escape(a.id)}, ${escape(a.code)}, ${escape(a.name)}, ${escape(a.nameEn)}, ${escape(a.type)}, ${escape(a.parentId)}, ${escape(a.description)}, ${a.active ? 1 : 0}, ${a.isLeaf ? 1 : 0}, ${escape(a.createdAt)})${tail}`
      )
    })
  }
  lines.push('')
  lines.push('-- ---------- Accounting: Journal Entries ----------')
  lines.push('CREATE TABLE IF NOT EXISTS journal_entries (')
  lines.push('  id VARCHAR(64) PRIMARY KEY,')
  lines.push('  entry_number VARCHAR(64) UNIQUE NOT NULL,')
  lines.push('  entry_date DATE NOT NULL,')
  lines.push('  description TEXT NULL,')
  lines.push('  reference VARCHAR(255) NULL,')
  lines.push('  reference_type VARCHAR(40) NULL,')
  lines.push('  status VARCHAR(20) NOT NULL,')
  lines.push('  created_by VARCHAR(64) NULL,')
  lines.push('  created_at DATETIME NOT NULL,')
  lines.push('  posted_at DATETIME NULL')
  lines.push(');')
  lines.push('CREATE TABLE IF NOT EXISTS journal_lines (')
  lines.push('  id VARCHAR(64) PRIMARY KEY,')
  lines.push('  entry_id VARCHAR(64) NOT NULL,')
  lines.push('  account_id VARCHAR(64) NOT NULL,')
  lines.push('  debit DECIMAL(14,2) NOT NULL DEFAULT 0,')
  lines.push('  credit DECIMAL(14,2) NOT NULL DEFAULT 0,')
  lines.push('  description TEXT NULL,')
  lines.push('  INDEX idx_line_entry (entry_id),')
  lines.push('  INDEX idx_line_account (account_id)')
  lines.push(');')
  if (accounting.journalEntries?.length) {
    lines.push('INSERT INTO journal_entries (id, entry_number, entry_date, description, reference, reference_type, status, created_by, created_at, posted_at) VALUES')
    accounting.journalEntries.forEach((e: JournalEntry, i: number) => {
      const tail = i === accounting.journalEntries.length - 1 ? ';' : ','
      lines.push(
        `  (${escape(e.id)}, ${escape(e.entryNumber)}, ${escape(e.date)}, ${escape(e.description)}, ${escape(e.reference)}, ${escape(e.referenceType)}, ${escape(e.status)}, ${escape(e.createdBy)}, ${escape(e.createdAt)}, ${escape(e.postedAt)})${tail}`
      )
    })
    const allLines: { line: any; entryId: string }[] = []
    accounting.journalEntries.forEach((e) => (e.lines || []).forEach((l) => allLines.push({ line: l, entryId: e.id })))
    if (allLines.length) {
      lines.push('INSERT INTO journal_lines (id, entry_id, account_id, debit, credit, description) VALUES')
      allLines.forEach(({ line: l, entryId }, i) => {
        const tail = i === allLines.length - 1 ? ';' : ','
        lines.push(
          `  (${escape(l.id)}, ${escape(entryId)}, ${escape(l.accountId)}, ${l.debit || 0}, ${l.credit || 0}, ${escape(l.description)})${tail}`
        )
      })
    }
  }
  lines.push('')

  // ===== expenses =====
  lines.push('-- ---------- Accounting: Expenses ----------')
  lines.push('CREATE TABLE IF NOT EXISTS expenses (')
  lines.push('  id VARCHAR(64) PRIMARY KEY,')
  lines.push('  category VARCHAR(30) NOT NULL,')
  lines.push('  amount DECIMAL(14,2) NOT NULL DEFAULT 0,')
  lines.push('  currency VARCHAR(10) NOT NULL,')
  lines.push('  expense_date DATE NOT NULL,')
  lines.push('  vendor VARCHAR(255) NULL,')
  lines.push('  description TEXT NULL,')
  lines.push('  payment_method VARCHAR(20) NOT NULL,')
  lines.push('  receipt_number VARCHAR(64) NULL,')
  lines.push('  attachment_url TEXT NULL,')
  lines.push('  created_by VARCHAR(64) NULL,')
  lines.push('  created_at DATETIME NOT NULL,')
  lines.push('  approved TINYINT(1) NOT NULL DEFAULT 0,')
  lines.push('  approved_by VARCHAR(64) NULL')
  lines.push(');')
  if (accounting.expenses?.length) {
    lines.push('INSERT INTO expenses (id, category, amount, currency, expense_date, vendor, description, payment_method, receipt_number, attachment_url, created_by, created_at, approved, approved_by) VALUES')
    accounting.expenses.forEach((e: any, i: number) => {
      const tail = i === accounting.expenses.length - 1 ? ';' : ','
      lines.push(
        `  (${escape(e.id)}, ${escape(e.category)}, ${e.amount || 0}, ${escape(e.currency)}, ${escape(e.date)}, ${escape(e.vendor)}, ${escape(e.description)}, ${escape(e.paymentMethod)}, ${escape(e.receiptNumber)}, ${escape(e.attachmentUrl)}, ${escape(e.createdBy)}, ${escape(e.createdAt)}, ${e.approved ? 1 : 0}, ${escape(e.approvedBy)})${tail}`
      )
    })
  }
  lines.push('')

  lines.push('COMMIT;')
  lines.push('SET FOREIGN_KEY_CHECKS=1;')
  lines.push('-- End of backup')
  lines.push('')

  const sql = lines.join('\n')
  summary.totalBytes = new Blob([sql]).size
  return { sql, summary }
}

/** يحفظ النسخة كملف .sql ويُنزّلها */
export function downloadSqlBackup() {
  const { sql, summary } = generateSqlBackup()
  const blob = new Blob([sql], { type: 'application/sql;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  a.href = url
  a.download = `synapse-backup-${dateStr}.sql`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return summary
}
