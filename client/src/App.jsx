import { Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import NotesPage from './pages/NotesPage.jsx'
import MessagesPage from './pages/MessagesPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import ContractorsPage from './pages/ContractorsPage.jsx'
import ContractorDetailPage from './pages/ContractorDetailPage.jsx'
import CartPage from './pages/CartPage.jsx'
import TaskTrackerPage from './pages/TaskTrackerPage.jsx'
import MaterialsPage from './pages/MaterialsPage.jsx'
import CostComparisonPage from './pages/CostComparisonPage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import ProjectDetailPage from './pages/ProjectDetailPage.jsx'
import ProgressUpdatesPage from './pages/ProgressUpdatesPage.jsx'
import BudgetExpensesPage from './pages/BudgetExpensesPage.jsx'
import SupervisorDashboardPage from './pages/SupervisorDashboardPage.jsx'
import SupervisorProjectDetailPage from './pages/SupervisorProjectDetailPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
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
          <ProtectedRoute allowRoles={['customer']}>
            <ProgressUpdatesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/budget"
        element={
          <ProtectedRoute allowRoles={['customer']}>
            <BudgetExpensesPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
