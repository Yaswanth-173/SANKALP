import { Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'
import PlaceholderFeaturePage from './pages/PlaceholderFeaturePage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import NotesPage from './pages/NotesPage.jsx'
import MessagesPage from './pages/MessagesPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import ContractorsPage from './pages/ContractorsPage.jsx'
import ContractorDetailPage from './pages/ContractorDetailPage.jsx'
import CartPage from './pages/CartPage.jsx'
import TaskTrackerPage from './pages/TaskTrackerPage.jsx'
import MaterialsPage from './pages/MaterialsPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useTranslation } from './i18n/index.js'
import costComparisonIcon from './assets/dashboard-icons/cost-comparison-icon.png'
import progressUpdatesIcon from './assets/dashboard-icons/progress-updates-icon.png'
import budgetExpensesIcon from './assets/dashboard-icons/budget-expenses-icon.png'

function App() {
  const { t } = useTranslation()
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/notes"
        element={
          <ProtectedRoute>
            <NotesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/messages"
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/contractors"
        element={
          <ProtectedRoute>
            <ContractorsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/contractors/:slug"
        element={
          <ProtectedRoute>
            <ContractorDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/cart"
        element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/tasks"
        element={
          <ProtectedRoute>
            <TaskTrackerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/materials"
        element={
          <ProtectedRoute>
            <MaterialsPage />
          </ProtectedRoute>
        }
      />

      {[
        { path: 'cost-comparison', titleKey: 'cards.costComparison.title', descKey: 'cards.costComparison.description', icon: costComparisonIcon },
        { path: 'progress', titleKey: 'cards.progress.title', descKey: 'cards.progress.description', icon: progressUpdatesIcon },
        { path: 'budget', titleKey: 'cards.budget.title', descKey: 'cards.budget.description', icon: budgetExpensesIcon },
      ].map(({ path, titleKey, descKey, icon }) => (
        <Route
          key={path}
          path={`/dashboard/${path}`}
          element={
            <ProtectedRoute>
              <PlaceholderFeaturePage title={t(titleKey)} description={t(descKey)} icon={icon} />
            </ProtectedRoute>
          }
        />
      ))}
    </Routes>
  )
}

export default App
