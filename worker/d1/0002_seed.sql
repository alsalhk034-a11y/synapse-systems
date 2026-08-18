-- ================================================================
-- Synapse Systems - Initial Seed Data
-- ================================================================
-- يجب تشغيله بعد Migrations
-- يحوي:
-- - دليل الحسابات (IFRS)
-- - قائمة الخدمات
-- - مستخدم Admin افتراضي (غيّر كلمة السر فوراً!)
-- ================================================================

-- ============== Chart of Accounts (IFRS) ==============
-- الأصول
INSERT INTO accounts (id, code, name, name_ar, type, is_leaf) VALUES
  ('acc_1000', '1000', 'Assets', 'الأصول', 'asset', 0),
  ('acc_1100', '1100', 'Cash on Hand', 'النقدية في الصندوق', 'asset', 1),
  ('acc_1200', '1200', 'Bank Account', 'الحساب البنكي', 'asset', 1),
  ('acc_1300', '1300', 'Accounts Receivable', 'المدينون', 'asset', 1),
  ('acc_1400', '1400', 'Inventory', 'المخزون', 'asset', 1),
  ('acc_1500', '1500', 'Fixed Assets', 'الأصول الثابتة', 'asset', 0),
  ('acc_1510', '1510', 'Medical Equipment', 'المعدات الطبية', 'asset', 1),
  ('acc_1520', '1520', 'Office Equipment', 'معدات المكتب', 'asset', 1);

-- الالتزامات
INSERT INTO accounts (id, code, name, name_ar, type, is_leaf) VALUES
  ('acc_2000', '2000', 'Liabilities', 'الالتزامات', 'liability', 0),
  ('acc_2100', '2100', 'Accounts Payable', 'الدائنون', 'liability', 1),
  ('acc_2200', '2200', 'Salaries Payable', 'رواتب مستحقة', 'liability', 1),
  ('acc_2300', '2300', 'Taxes Payable', 'ضرائب مستحقة', 'liability', 1);

-- حقوق الملكية
INSERT INTO accounts (id, code, name, name_ar, type, is_leaf) VALUES
  ('acc_3000', '3000', 'Equity', 'حقوق الملكية', 'equity', 0),
  ('acc_3100', '3100', 'Owner Capital', 'رأس مال المالك', 'equity', 1),
  ('acc_3200', '3200', 'Retained Earnings', 'أرباح محتجزة', 'equity', 1);

-- الإيرادات
INSERT INTO accounts (id, code, name, name_ar, type, is_leaf) VALUES
  ('acc_4000', '4000', 'Revenue', 'الإيرادات', 'revenue', 0),
  ('acc_4100', '4100', 'Consultation Revenue', 'إيرادات الاستشارات', 'revenue', 1),
  ('acc_4200', '4200', 'Lab Tests Revenue', 'إيرادات التحاليل', 'revenue', 1),
  ('acc_4300', '4300', 'Imaging Revenue', 'إيرادات الأشعة', 'revenue', 1),
  ('acc_4400', '4400', 'Vaccination Revenue', 'إيرادات اللقاحات', 'revenue', 1),
  ('acc_4900', '4900', 'Other Revenue', 'إيرادات أخرى', 'revenue', 1);

-- المصروفات
INSERT INTO accounts (id, code, name, name_ar, type, is_leaf) VALUES
  ('acc_5000', '5000', 'Expenses', 'المصروفات', 'expense', 0),
  ('acc_5100', '5100', 'Salaries Expense', 'مصروف الرواتب', 'expense', 1),
  ('acc_5200', '5200', 'Rent Expense', 'مصروف الإيجار', 'expense', 1),
  ('acc_5300', '5300', 'Utilities', 'فواتير خدمات', 'expense', 1),
  ('acc_5400', '5400', 'Medical Supplies', 'مستلزمات طبية', 'expense', 1),
  ('acc_5500', '5500', 'Office Supplies', 'مستلزمات مكتبية', 'expense', 1),
  ('acc_5900', '5900', 'Other Expenses', 'مصروفات أخرى', 'expense', 1);

-- ============== Services (Price List) ==============
INSERT INTO services (id, code, name, name_ar, category, default_price) VALUES
  ('svc_001', 'CONS-STD', 'Standard Consultation', 'استشارة عادية', 'consultation', 25000),
  ('svc_002', 'CONS-FU', 'Follow-up Visit', 'زيارة متابعة', 'consultation', 15000),
  ('svc_003', 'CONS-EMG', 'Emergency Visit', 'زيارة طوارئ', 'consultation', 50000),
  ('svc_010', 'VAC-BCG', 'BCG Vaccine', 'لقاح السل', 'vaccine', 30000),
  ('svc_011', 'VAC-HEPB', 'Hepatitis B Vaccine', 'لقاح التهاب الكبد ب', 'vaccine', 35000),
  ('svc_012', 'VAC-DPT', 'DPT Vaccine', 'لقاح الثلاثي', 'vaccine', 30000),
  ('svc_013', 'VAC-MMR', 'MMR Vaccine', 'لقاح الحصبة', 'vaccine', 40000),
  ('svc_020', 'LAB-CBC', 'Complete Blood Count', 'تعداد الدم الكامل', 'lab', 15000),
  ('svc_021', 'LAB-URINE', 'Urinalysis', 'تحليل البول', 'lab', 10000),
  ('svc_030', 'IMG-CXR', 'Chest X-Ray', 'أشعة صدر', 'imaging', 25000),
  ('svc_031', 'IMG-US', 'Abdominal Ultrasound', 'سونار بطن', 'imaging', 40000);

-- ============== Default Settings ==============
INSERT INTO settings (key, value) VALUES
  ('clinic.name', 'عيادة النور للأطفال'),
  ('clinic.name_en', 'Al-Noor Pediatric Clinic'),
  ('clinic.phone', '+963 11 123 4567'),
  ('clinic.address', 'دمشق، سوريا'),
  ('clinic.logo_url', ''),
  ('invoice.prefix', 'INV'),
  ('patient.prefix', 'PAT'),
  ('currency', 'SYP'),
  ('tax.rate', '0'),
  ('features.patient_portal', '1'),
  ('features.online_booking', '0'),
  ('print.footer', 'شكراً لثقتكم بنا | Thank you for your trust');

-- ============== Default Admin User ==============
-- كلمة السر الافتراضية: ChangeMe123!
-- غيّرها فوراً بعد أول تسجيل دخول!
-- Bcrypt hash for 'ChangeMe123!' (cost 10):
--   $2a$10$dqQdmVttPssZegeylVQH6O4p7xaunekrn79tUyODNjecWKVwjyyj6
INSERT INTO users (id, username, email, full_name, full_name_ar, password_hash, role, permissions, active) VALUES
  ('usr_admin_001', 'admin', 'admin@synapse.local', 'System Administrator', 'مدير النظام',
   '$2a$10$dqQdmVttPssZegeylVQH6O4p7xaunekrn79tUyODNjecWKVwjyyj6',
   'admin', '["*"]', 1);

-- مستخدم طبيب تجريبي (غيّر كلمة السر!)
INSERT INTO users (id, username, email, full_name, full_name_ar, password_hash, role, permissions, active) VALUES
  ('usr_doctor_001', 'doctor', 'doctor@synapse.local', 'Dr. Demo', 'د. تجريبي',
   '$2a$10$dqQdmVttPssZegeylVQH6O4p7xaunekrn79tUyODNjecWKVwjyyj6',
   'doctor', '["patients.view","patients.edit","exams.*","prescriptions.*","invoices.view","appointments.*"]', 1);

-- مستخدم ممرضة تجريبي
INSERT INTO users (id, username, email, full_name, full_name_ar, password_hash, role, permissions, active) VALUES
  ('usr_nurse_001', 'nurse', 'nurse@synapse.local', 'Demo Nurse', 'ممرضة تجريبية',
   '$2a$10$dqQdmVttPssZegeylVQH6O4p7xaunekrn79tUyODNjecWKVwjyyj6',
   'nurse', '["patients.view","patients.create","patients.edit","vaccines.*","appointments.*","queue.*"]', 1);
