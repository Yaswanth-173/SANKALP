import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { roleHome } from '../utils/roleHome.js'

// `allowRoles`, when given, restricts this route to those roles — anyone
// else logged in gets sent to their own portal home instead of seeing a
// 404 or someone else's screen.
function ProtectedRoute({ children, allowRoles }) {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-gold-400" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (allowRoles && !allowRoles.includes(user?.role)) {
    return <Navigate to={roleHome(user?.role)} replace />
  }

  return children
}

export default ProtectedRoute
