import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import LandingPage from './pages/LandingPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import RouteFallback from './components/RouteFallback.jsx'
import { contractorNavItems } from './utils/supervisorNav.js'

// Every route except the landing page is code-split, so first-time
// visitors never download the dashboard (or Leaflet) up front.
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const SignUpPage = lazy(() => import('./pages/SignUpPage.jsx'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'))
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard.jsx'))
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'))
const NotesPage = lazy(() => import('./pages/NotesPage.jsx'))
const MessagesPage = lazy(() => import('./pages/MessagesPage.jsx'))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))
const ContractorsPage = lazy(() => import('./pages/ContractorsPage.jsx'))
const ContractorDetailPage = lazy(() => import('./pages/ContractorDetailPage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const TaskTrackerPage = lazy(() => import('./pages/TaskTrackerPage.jsx'))
const MaterialsPage = lazy(() => import('./pages/MaterialsPage.jsx'))
const SupplierDetailPage = lazy(() => import('./pages/SupplierDetailPage.jsx'))
const BecomeSupplierPage = lazy(() => import('./pages/BecomeSupplierPage.jsx'))
const CostComparisonPage = lazy(() => import('./pages/CostComparisonPage.jsx'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage.jsx'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage.jsx'))
const ProgressUpdatesPage = lazy(() => import('./pages/ProgressUpdatesPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))
const BudgetExpensesPage = lazy(() => import('./pages/BudgetExpensesPage.jsx'))
const SupervisorDashboardPage = lazy(() => import('./pages/SupervisorDashboardPage.jsx'))
const SupervisorProjectDetailPage = lazy(() => import('./pages/SupervisorProjectDetailPage.jsx'))

function App() {
  return (
    // reducedMotion="user": Framer skips transform/layout animations when the
    // OS asks for reduced motion (CSS alone cannot stop JS-driven animation).
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/projects"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/projects/:id"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <ProjectDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/calendar"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/notes"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <NotesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/messages"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/settings"
              element={
                // Shared across every role — profile/password/preferences aren't customer-specific.
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/contractors"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <ContractorsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/contractors/:slug"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <ContractorDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/cart"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <CartPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/tasks"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <TaskTrackerPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/materials"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <MaterialsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/materials/suppliers/:id"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <SupplierDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/materials/become-a-supplier"
              element={
                // Any authenticated role can register a supplier business — it's
                // independent of the customer/contractor/supervisor project roles.
                <ProtectedRoute>
                  <BecomeSupplierPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/supervisor"
              element={
                <ProtectedRoute allowRoles={['supervisor']}>
                  <SupervisorDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/supervisor/projects/:id"
              element={
                <ProtectedRoute allowRoles={['supervisor']}>
                  <SupervisorProjectDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/contractor"
              element={
                <ProtectedRoute allowRoles={['contractor']}>
                  <SupervisorDashboardPage basePath="/contractor" navItems={contractorNavItems} subtitle="Projects you've been assigned to." />
                </ProtectedRoute>
              }
            />

            <Route
              path="/contractor/projects/:id"
              element={
                <ProtectedRoute allowRoles={['contractor']}>
                  <SupervisorProjectDetailPage basePath="/contractor" navItems={contractorNavItems} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/cost-comparison"
              element={
                <ProtectedRoute allowRoles={['customer']}>
                  <CostComparisonPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/progress"
              element={
                <ProtectedRoute allowRoles={['customer', 'supervisor', 'contractor']}>
                  <ProgressUpdatesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/budget"
              element={
                <ProtectedRoute allowRoles={['customer', 'supervisor']}>
                  <BudgetExpensesPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </MotionConfig>
  )
}

export default App
