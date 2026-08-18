import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/stores/authStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Skeleton } from '@/components/ui/Skeleton'
import { Shell } from '@/components/layout/Shell'
import { LoginPage } from '@/pages/Login'
import { DashboardPage } from '@/pages/Dashboard'

// الصفحات الثقيلة تُحمّل عند الحاجة (code splitting) لتقليل الباندل الأولي
const PatientsListPage = lazy(() => import('@/pages/PatientsList').then(m => ({ default: m.PatientsListPage })))
const PatientNewPage = lazy(() => import('@/pages/PatientNew').then(m => ({ default: m.PatientNewPage })))
const PatientDetailPage = lazy(() => import('@/pages/PatientDetail').then(m => ({ default: m.PatientDetailPage })))
const ExamWorkspacePage = lazy(() => import('@/pages/ExamWorkspace').then(m => ({ default: m.ExamWorkspacePage })))
const ExamsPage = lazy(() => import('@/pages/Exams').then(m => ({ default: m.ExamsPage })))
const AppointmentsPage = lazy(() => import('@/pages/Appointments').then(m => ({ default: m.AppointmentsPage })))
const InvoicesPage = lazy(() => import('@/pages/Invoices').then(m => ({ default: m.InvoicesPage })))
const InvoiceNewPage = lazy(() => import('@/pages/InvoiceNew').then(m => ({ default: m.InvoiceNewPage })))
const InvoiceDetailPage = lazy(() => import('@/pages/InvoiceDetail').then(m => ({ default: m.InvoiceDetailPage })))
const ReportsPage = lazy(() => import('@/pages/Reports').then(m => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('@/pages/Settings').then(m => ({ default: m.SettingsPage })))
const AuditPage = lazy(() => import('@/pages/Audit').then(m => ({ default: m.AuditPage })))
const ShortcutsPage = lazy(() => import('@/pages/Shortcuts').then(m => ({ default: m.ShortcutsPage })))
const AccountingPage = lazy(() => import('@/pages/Accounting').then(m => ({ default: m.AccountingPage })))
const UserManagementPage = lazy(() => import('@/pages/UserManagement').then(m => ({ default: m.UserManagementPage })))
const QueuePage = lazy(() => import('@/pages/Queue').then(m => ({ default: m.QueuePage })))
const PatientPortalPage = lazy(() => import('@/pages/PatientPortal').then(m => ({ default: m.PatientPortalPage })))

/** شاشة تحميل موحّدة لـ lazy routes */
function PageFallback() {
  return (
    <div className="flex min-h-[50vh] flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton lines={3} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-40" />
    </div>
  )
}

function ProtectedRoute({ children, requirePermission }: { children: React.ReactNode; requirePermission?: string }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated)
  const hasPerm = useAuthStore((s) => s.hasPermission)
  const location = useLocation()
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (requirePermission && !hasPerm(requirePermission as any)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function AppContent() {
  useTheme()
  useKeyboardShortcuts()

  return (
    <ErrorBoundary scope="App Root" variant="page">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Shell />
            </ProtectedRoute>
          }
        >
          <Route index element={<ErrorBoundary scope="Dashboard" variant="page"><DashboardPage /></ErrorBoundary>} />
          <Route path="patients" element={<ErrorBoundary scope="Patients List" variant="page"><Suspense fallback={<PageFallback />}><PatientsListPage /></Suspense></ErrorBoundary>} />
          <Route path="patients/new" element={<ErrorBoundary scope="Patient New" variant="page"><Suspense fallback={<PageFallback />}><PatientNewPage /></Suspense></ErrorBoundary>} />
          <Route path="patients/:id" element={<ErrorBoundary scope="Patient Detail" variant="page"><Suspense fallback={<PageFallback />}><PatientDetailPage /></Suspense></ErrorBoundary>} />
          <Route path="appointments" element={<ErrorBoundary scope="Appointments" variant="page"><Suspense fallback={<PageFallback />}><AppointmentsPage /></Suspense></ErrorBoundary>} />
          <Route path="exams" element={<ErrorBoundary scope="Exams" variant="page"><Suspense fallback={<PageFallback />}><ExamsPage /></Suspense></ErrorBoundary>} />
          <Route path="exams/:patientId" element={<ErrorBoundary scope="Exam Workspace" variant="page"><Suspense fallback={<PageFallback />}><ExamWorkspacePage /></Suspense></ErrorBoundary>} />
          <Route path="exams/:patientId/:examId" element={<ErrorBoundary scope="Exam Workspace" variant="page"><Suspense fallback={<PageFallback />}><ExamWorkspacePage /></Suspense></ErrorBoundary>} />
          <Route path="invoices" element={<ErrorBoundary scope="Invoices" variant="page"><Suspense fallback={<PageFallback />}><InvoicesPage /></Suspense></ErrorBoundary>} />
          <Route path="invoices/new" element={<ErrorBoundary scope="Invoice New" variant="page"><Suspense fallback={<PageFallback />}><InvoiceNewPage /></Suspense></ErrorBoundary>} />
          <Route path="invoices/:id" element={<ErrorBoundary scope="Invoice Detail" variant="page"><Suspense fallback={<PageFallback />}><InvoiceDetailPage /></Suspense></ErrorBoundary>} />
          <Route path="reports" element={<ErrorBoundary scope="Reports" variant="page"><Suspense fallback={<PageFallback />}><ReportsPage /></Suspense></ErrorBoundary>} />
          <Route path="settings" element={<ErrorBoundary scope="Settings" variant="page"><Suspense fallback={<PageFallback />}><SettingsPage /></Suspense></ErrorBoundary>} />
          <Route path="audit" element={<ErrorBoundary scope="Audit" variant="page"><Suspense fallback={<PageFallback />}><AuditPage /></Suspense></ErrorBoundary>} />
          <Route path="shortcuts" element={<ErrorBoundary scope="Shortcuts" variant="page"><Suspense fallback={<PageFallback />}><ShortcutsPage /></Suspense></ErrorBoundary>} />
          <Route path="accounting" element={<ProtectedRoute requirePermission="accounting.view"><ErrorBoundary scope="Accounting" variant="page"><Suspense fallback={<PageFallback />}><AccountingPage /></Suspense></ErrorBoundary></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute requirePermission="users.manage"><ErrorBoundary scope="User Management" variant="page"><Suspense fallback={<PageFallback />}><UserManagementPage /></Suspense></ErrorBoundary></ProtectedRoute>} />
          <Route path="queue" element={<ErrorBoundary scope="Queue" variant="page"><Suspense fallback={<PageFallback />}><QueuePage /></Suspense></ErrorBoundary>} />
          <Route path="portal" element={<ErrorBoundary scope="Patient Portal" variant="page"><Suspense fallback={<PageFallback />}><PatientPortalPage /></Suspense></ErrorBoundary>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default function App() {
  return <AppContent />
}
