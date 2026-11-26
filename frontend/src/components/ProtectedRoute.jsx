import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../services/auth'

export function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" role="status" aria-label="Loading" />
    </div>
  )
}

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
