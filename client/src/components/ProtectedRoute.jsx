import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { roleHome } from '../utils/roleHome.js'
import { Skeleton, SkeletonCards } from './ui/Skeleton.jsx'

// `allowRoles`, when given, restricts this route to those roles — anyone
// else logged in gets sent to their own portal home instead of seeing a
// 404 or someone else's screen.
function ProtectedRoute({ children, allowRoles }) {
  const { status, user } = useAuth()

  if (status === 'loading') {
    // Shell-shaped skeleton so the layout doesn't jump once the session resolves.
    return (
      <div className="flex min-h-svh bg-canvas">
        <div className="hidden w-64 shrink-0 flex-col gap-3 border-r border-line bg-surface/60 p-4 lg:flex">
          <Skeleton className="mx-auto mb-4 mt-10 h-14 w-36" />
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-3 h-4 w-72 max-w-full" />
          <SkeletonCards className="mt-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" label="Checking your session" />
        </div>
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
