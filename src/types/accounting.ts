/**
 * نظام محاسبة متكامل وفق معايير IFRS / محاسبية القيد المزدوج
 */

/** الحسابات (Chart of Accounts) - مبنية على المعايير الدولية */
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export interface Account {
  id: string
  code: string // 1xxx أصول، 2xx التزامات، 3xx حقوق ملكية، 4xx إيرادات، 5xx مصروفات
  name: string
  nameEn?: string
  type: AccountType
  parentId?: string
  description?: string
  active: boolean
  /** هل يسمح بالإدخال المباشر أم فقط من قيود */
  isLeaf: boolean
  createdAt: string
}

/** حركة مالية (Journal Entry) - القيد المزدوج */
export interface JournalEntry {
  id: string
  entryNumber: string // JE-2026-0001
  date: string
  description: string
  reference?: string // مرجع خارجي مثل رقم الفاتورة
  referenceType?: 'invoice' | 'expense' | 'payroll' | 'transfer' | 'adjustment' | 'opening'
  /** قيود محاسبية (مدين/دائن) - يجب أن يتساوى المجموع */
  lines: JournalLine[]
  status: 'draft' | 'posted' | 'reversed'
  createdBy: string
  createdAt: string
  postedAt?: string
  attachments?: string[]
}

export interface JournalLine {
  id: string
  accountId: string
  /** مدين */
  debit: number
  /** دائن */
  credit: number
  description?: string
}

/** المصروفات (Expenses) */
export interface Expense {
  id: string
  category: 'rent' | 'utilities' | 'salary' | 'supplies' | 'medication' | 'equipment' | 'maintenance' | 'marketing' | 'insurance' | 'tax' | 'other'
  amount: number
  currency: string
  date: string
  vendor?: string
  description: string
  paymentMethod: 'cash' | 'bank' | 'card' | 'check'
  receiptNumber?: string
  attachmentUrl?: string
  createdBy: string
  createdAt: string
  approved: boolean
  approvedBy?: string
}

/** الفئات الافتراضية للمصروفات (Chart of Accounts) */
export const DEFAULT_ACCOUNTS: Account[] = [
  // الأصول
  { id: 'acc_1000', code: '1000', name: 'الأصول', type: 'asset', isLeaf: false, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_1100', code: '1100', name: 'الصندوق (النقدية)', nameEn: 'Cash on Hand', type: 'asset', parentId: 'acc_1000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_1200', code: '1200', name: 'البنك', nameEn: 'Bank', type: 'asset', parentId: 'acc_1000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_1300', code: '1300', name: 'المدينون (ذمم المرضى)', nameEn: 'Accounts Receivable', type: 'asset', parentId: 'acc_1000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_1400', code: '1400', name: 'المخزون (أدوية ومستلزمات)', nameEn: 'Inventory', type: 'asset', parentId: 'acc_1000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_1500', code: '1500', name: 'أثاث ومعدات', nameEn: 'Furniture & Equipment', type: 'asset', parentId: 'acc_1000', isLeaf: true, active: true, createdAt: new Date().toISOString() },

  // الالتزامات
  { id: 'acc_2000', code: '2000', name: 'الالتزامات', type: 'liability', isLeaf: false, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_2100', code: '2100', name: 'الدائنون', nameEn: 'Accounts Payable', type: 'liability', parentId: 'acc_2000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_2200', code: '2200', name: 'الضرائب المستحقة', nameEn: 'Taxes Payable', type: 'liability', parentId: 'acc_2000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_2300', code: '2300', name: 'الرواتب المستحقة', nameEn: 'Salaries Payable', type: 'liability', parentId: 'acc_2000', isLeaf: true, active: true, createdAt: new Date().toISOString() },

  // حقوق الملكية
  { id: 'acc_3000', code: '3000', name: 'حقوق الملكية', type: 'equity', isLeaf: false, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_3100', code: '3100', name: 'رأس المال', nameEn: 'Capital', type: 'equity', parentId: 'acc_3000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_3200', code: '3200', name: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: 'equity', parentId: 'acc_3000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_3300', code: '3300', name: 'أرباح السنة', nameEn: 'Current Year Earnings', type: 'equity', parentId: 'acc_3000', isLeaf: true, active: true, createdAt: new Date().toISOString() },

  // الإيرادات
  { id: 'acc_4000', code: '4000', name: 'الإيرادات', type: 'revenue', isLeaf: false, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_4100', code: '4100', name: 'إيرادات الكشوفات', nameEn: 'Consultation Revenue', type: 'revenue', parentId: 'acc_4000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_4200', code: '4200', name: 'إيرادات بيع الأدوية', nameEn: 'Pharmacy Revenue', type: 'revenue', parentId: 'acc_4000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_4300', code: '4300', name: 'إيرادات اللقاحات', nameEn: 'Vaccines Revenue', type: 'revenue', parentId: 'acc_4000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_4400', code: '4400', name: 'إيرادات الخدمات (مختبر، أشعة)', nameEn: 'Services Revenue', type: 'revenue', parentId: 'acc_4000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_4900', code: '4900', name: 'إيرادات أخرى', nameEn: 'Other Revenue', type: 'revenue', parentId: 'acc_4000', isLeaf: true, active: true, createdAt: new Date().toISOString() },

  // المصروفات
  { id: 'acc_5000', code: '5000', name: 'المصروفات', type: 'expense', isLeaf: false, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_5100', code: '5100', name: 'رواتب ومزايا', nameEn: 'Salaries & Benefits', type: 'expense', parentId: 'acc_5000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_5200', code: '5200', name: 'إيجار', nameEn: 'Rent', type: 'expense', parentId: 'acc_5000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_5300', code: '5300', name: 'كهرباء وماء', nameEn: 'Utilities', type: 'expense', parentId: 'acc_5000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_5400', code: '5400', name: 'شراء بضاعة (أدوية)', nameEn: 'Cost of Goods Sold', type: 'expense', parentId: 'acc_5000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_5500', code: '5500', name: 'مستلزمات طبية', nameEn: 'Medical Supplies', type: 'expense', parentId: 'acc_5000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_5600', code: '5600', name: 'صيانة وتشغيل', nameEn: 'Maintenance', type: 'expense', parentId: 'acc_5000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_5700', code: '5700', name: 'تسويق وإعلان', nameEn: 'Marketing', type: 'expense', parentId: 'acc_5000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_5800', code: '5800', name: 'تأمينات', nameEn: 'Insurance', type: 'expense', parentId: 'acc_5000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
  { id: 'acc_5900', code: '5900', name: 'مصروفات أخرى', nameEn: 'Other Expenses', type: 'expense', parentId: 'acc_5000', isLeaf: true, active: true, createdAt: new Date().toISOString() },
]
