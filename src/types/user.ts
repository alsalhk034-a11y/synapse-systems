export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient'
export type Permission =
  | 'patient.view' | 'patient.create' | 'patient.edit' | 'patient.delete'
  | 'patient.view_medical' | 'patient.edit_medical'
  | 'appointment.view' | 'appointment.create' | 'appointment.edit' | 'appointment.delete'
  | 'exam.view' | 'exam.create' | 'exam.edit' | 'exam.delete' | 'exam.print'
  | 'invoice.view' | 'invoice.create' | 'invoice.edit' | 'invoice.delete' | 'invoice.print' | 'invoice.refund'
  | 'accounting.view' | 'accounting.manage' | 'accounting.reports'
  | 'vaccine.view' | 'vaccine.create' | 'vaccine.edit'
  | 'reports.view' | 'reports.export'
  | 'settings.view' | 'settings.edit'
  | 'users.view' | 'users.manage'
  | 'audit.view'
  | 'portal.view_own'

export interface User {
  id: string
  username: string
  password: string
  fullName: string
  role: UserRole
  specialty?: string
  avatarColor: string
  email?: string
  phone?: string
  permissions: Permission[]
  /** ربط بحساب المريض في حال كان هذا المستخدم مريضاً */
  linkedPatientId?: string
  /** للحسابات الموقوفة */
  active: boolean
  createdAt: string
  lastLoginAt?: string
}

import type { Currency } from './invoice'

export interface PrintSettings {
  paperSize: 'A4' | 'A5'
  showLogo: boolean
  showSignature: boolean
  showSynapseFooter: boolean
  margins: 'normal' | 'narrow' | 'wide'
  primaryColor: string
  fontSize: 'sm' | 'md' | 'lg'
  language: 'ar' | 'en' | 'both'
}

export interface ClinicInfo {
  name: string
  nameEn: string
  logo: string
  phone: string
  whatsapp: string
  email: string
  address: string
  addressEn: string
  mapLink: string
  workingHours: string
  taxRate: number
  currency: Currency
  print: PrintSettings
  signature: string
  licenseNumber: string
  /** الرقم الضريبي للفاتورة الإلكترونية (ZATCA / similar) */
  taxId?: string
  /** رقم الحساب البنكي للعيادة */
  bankAccount?: string
  /** رقم السجل التجاري */
  commercialRegister?: string
  /** رابط تحميل تطبيق المريض على الموبايل (Android/iOS) — يُطبع QR Code في الفاتورة */
  patientAppDownloadUrl?: string
  /** اسم ملف التطبيق الذي سيظهر تحت الـ QR Code في الفاتورة */
  patientAppName?: string
}
