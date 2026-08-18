-- ================================================================
-- Synapse Systems - Initial Database Schema
-- ================================================================
-- Schema يدعم المعايير الدولية:
-- - HL7 FHIR-inspired (clinical_status, encounter workflow)
-- - WHO growth percentiles
-- - ICD-10 / SNOMED medical coding
-- - IFRS double-entry accounting
-- - Full audit log
-- ================================================================

-- ============== 1. Users & Auth ==============
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  full_name TEXT NOT NULL,
  full_name_ar TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'receptionist', 'patient')),
  permissions TEXT, -- JSON array of permission strings
  linked_patient_id TEXT, -- للمرضى فقط
  phone TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  failed_login_count INTEGER DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (linked_patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_linked_patient ON users(linked_patient_id);
CREATE INDEX idx_users_role ON users(role);

-- ============== 2. Sessions & Refresh Tokens ==============
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ============== 3. Patients (FHIR-inspired) ==============
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  file_number TEXT UNIQUE NOT NULL, -- رقم الملف: PAT-YYYY-####
  full_name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  phone TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  address TEXT,
  blood_type TEXT,
  allergies TEXT,
  chronic_conditions TEXT,
  -- HL7 FHIR-inspired fields
  clinical_status TEXT DEFAULT 'active' CHECK (clinical_status IN ('active', 'inactive', 'resolved', 'entered-in-error')),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  care_team TEXT, -- JSON array of user IDs
  emergency_contacts TEXT, -- JSON
  vital_signs TEXT, -- JSON: {weight, height, headCircumference, ...}
  -- Encryption-at-rest fields (PII encrypted with AES-256-GCM)
  notes_encrypted TEXT,
  past_medical_history_encrypted TEXT,
  family_history_encrypted TEXT,
  -- Meta
  notes TEXT,
  last_visit_at TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_patients_name ON patients(full_name);
CREATE INDEX idx_patients_file_number ON patients(file_number);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_birth ON patients(birth_date);
CREATE INDEX idx_patients_last_visit ON patients(last_visit_at);

-- ============== 4. Appointments (Encounter) ==============
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  appointment_date TEXT NOT NULL, -- YYYY-MM-DD
  start_time TEXT NOT NULL,       -- HH:MM
  duration_min INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
  reason TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_appts_date ON appointments(appointment_date);
CREATE INDEX idx_appts_patient ON appointments(patient_id);
CREATE INDEX idx_appts_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appts_status ON appointments(status);

-- ============== 5. Exams (Clinical Encounter - FHIR) ==============
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  appointment_id TEXT,
  exam_date TEXT NOT NULL DEFAULT (datetime('now')),
  -- HL7 FHIR Encounter.status
  status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('planned', 'in-progress', 'finished', 'cancelled')),
  -- Clinical data (encrypted)
  chief_complaint_encrypted TEXT,
  history_present_illness_encrypted TEXT,
  physical_exam_encrypted TEXT,
  diagnosis_codes TEXT, -- JSON: [{system: 'ICD-10', code: 'J45.909', display: '...'}]
  diagnosis_text_encrypted TEXT,
  treatment_plan_encrypted TEXT,
  -- Vitals
  weight_kg REAL,
  height_cm REAL,
  head_circumference_cm REAL,
  bmi REAL,
  temperature_c REAL,
  heart_rate_bpm INTEGER,
  respiratory_rate INTEGER,
  blood_pressure TEXT,
  oxygen_saturation REAL,
  -- Sick leave
  sick_leave_start TEXT,
  sick_leave_end TEXT,
  sick_leave_days INTEGER,
  sick_leave_reason TEXT,
  -- Follow up
  follow_up_date TEXT,
  -- Meta
  attachments TEXT, -- JSON: [{r2_key, name, type, size}]
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

CREATE INDEX idx_exams_patient ON exams(patient_id);
CREATE INDEX idx_exams_doctor ON exams(doctor_id);
CREATE INDEX idx_exams_date ON exams(exam_date);
CREATE INDEX idx_exams_status ON exams(status);

-- ============== 6. Prescriptions (FHIR MedicationRequest) ==============
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT,
  route TEXT DEFAULT 'oral',
  instructions TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_prescriptions_exam ON prescriptions(exam_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);

-- ============== 7. Lab Requests ==============
CREATE TABLE IF NOT EXISTS lab_requests (
  id TEXT PRIMARY KEY,
  exam_id TEXT,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  tests TEXT NOT NULL, -- JSON array of test names/codes
  clinical_info TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'stat')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  result_notes TEXT,
  result_files TEXT, -- JSON: [{r2_key, name, type, size}]
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_lab_requests_patient ON lab_requests(patient_id);
CREATE INDEX idx_lab_requests_status ON lab_requests(status);

-- ============== 8. Imaging Requests (X-Ray, Ultrasound...) ==============
CREATE TABLE IF NOT EXISTS imaging_requests (
  id TEXT PRIMARY KEY,
  exam_id TEXT,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  modality TEXT NOT NULL, -- X-Ray, Ultrasound, CT, MRI
  body_part TEXT NOT NULL,
  clinical_info TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'stat')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  findings TEXT,
  impression TEXT,
  image_files TEXT, -- JSON: [{r2_key, name, type, size}]
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_imaging_patient ON imaging_requests(patient_id);
CREATE INDEX idx_imaging_status ON imaging_requests(status);

-- ============== 9. Vaccines (FHIR Immunization) ==============
CREATE TABLE IF NOT EXISTS vaccines (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  administered_by TEXT,
  vaccine_name TEXT NOT NULL,
  vaccine_code TEXT, -- CVX code
  batch_number TEXT,
  manufacturer TEXT,
  site TEXT,
  dose_number INTEGER,
  next_dose_date TEXT,
  administered_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (administered_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_vaccines_patient ON vaccines(patient_id);
CREATE INDEX idx_vaccines_date ON vaccines(administered_at);

-- ============== 10. Invoices ==============
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL, -- INV-YYYY-####
  patient_id TEXT NOT NULL,
  doctor_id TEXT,
  visit_id TEXT,
  issue_date TEXT NOT NULL DEFAULT (date('now')),
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'partially_paid', 'cancelled', 'refunded')),
  currency TEXT NOT NULL DEFAULT 'SYP',
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  paid REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (visit_id) REFERENCES exams(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(issue_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- ============== 11. Invoice Items ==============
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  service_code TEXT,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ============== 12. Payments ==============
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'insurance', 'other')),
  reference TEXT,
  paid_at TEXT NOT NULL DEFAULT (datetime('now')),
  received_by TEXT,
  notes TEXT,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(paid_at);

-- ============== 13. Accounting - Chart of Accounts (IFRS) ==============
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id TEXT,
  is_leaf INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

CREATE INDEX idx_accounts_code ON accounts(code);
CREATE INDEX idx_accounts_type ON accounts(type);

-- ============== 14. Accounting - Journal Entries (IFRS Double-Entry) ==============
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  entry_number TEXT UNIQUE NOT NULL,
  entry_date TEXT NOT NULL DEFAULT (date('now')),
  reference TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'reversed')),
  total_debit REAL NOT NULL DEFAULT 0,
  total_credit REAL NOT NULL DEFAULT 0,
  created_by TEXT,
  posted_at TEXT,
  reversed_at TEXT,
  reversal_of TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reversal_of) REFERENCES journal_entries(id) ON DELETE SET NULL
);

CREATE INDEX idx_journal_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_status ON journal_entries(status);
CREATE INDEX idx_journal_reference ON journal_entries(reference);

-- ============== 15. Accounting - Journal Lines ==============
CREATE TABLE IF NOT EXISTS journal_lines (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  debit REAL NOT NULL DEFAULT 0,
  credit REAL NOT NULL DEFAULT 0,
  description TEXT,
  FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

CREATE INDEX idx_journal_lines_entry ON journal_lines(entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- ============== 16. Expenses ==============
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SYP',
  expense_date TEXT NOT NULL DEFAULT (date('now')),
  vendor TEXT,
  receipt_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  approved_by TEXT,
  paid_by TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_status ON expenses(status);

-- ============== 17. Queue (Encounter Workflow) ==============
CREATE TABLE IF NOT EXISTS queue_entries (
  id TEXT PRIMARY KEY,
  queue_number INTEGER NOT NULL,
  queue_date TEXT NOT NULL DEFAULT (date('now')),
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_consultation', 'completed', 'no_show', 'cancelled')),
  reason TEXT,
  pain_score INTEGER DEFAULT 0,
  arrived_at TEXT NOT NULL DEFAULT (datetime('now')),
  called_at TEXT,
  consultation_started_at TEXT,
  completed_at TEXT,
  notes TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_queue_date ON queue_entries(queue_date);
CREATE INDEX idx_queue_patient ON queue_entries(patient_id);
CREATE INDEX idx_queue_doctor_date ON queue_entries(doctor_id, queue_date);
CREATE INDEX idx_queue_status ON queue_entries(status);

-- ============== 18. Audit Log (Immutable) ==============
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT NOT NULL,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_date ON audit_log(created_at);

-- ============== 19. Services (Price List) ==============
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  category TEXT,
  default_price REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SYP',
  active INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_services_code ON services(code);
CREATE INDEX idx_services_active ON services(active);

-- ============== 20. Settings (Singleton) ==============
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============== 21. Medical Files (R2 references) ==============
CREATE TABLE IF NOT EXISTS medical_files (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  exam_id TEXT,
  r2_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  category TEXT, -- 'lab_result', 'imaging', 'prescription', 'report', 'other'
  uploaded_by TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_medical_files_patient ON medical_files(patient_id);
CREATE INDEX idx_medical_files_exam ON medical_files(exam_id);
CREATE INDEX idx_medical_files_category ON medical_files(category);

-- ============== 22. Notifications ==============
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at);
CREATE INDEX idx_notifications_created ON notifications(created_at);
