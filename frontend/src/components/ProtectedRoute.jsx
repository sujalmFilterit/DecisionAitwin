import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * allowedRoles: array of roles that can access this route.
 * If omitted, any logged-in user can access.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Wrong role — redirect to their correct home
    if (user.role === 'agent' || user.role === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/chat" replace />
  }

  return children
}
