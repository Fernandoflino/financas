import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user, loading, hasPermission } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false)
        return
      }

      if (requiredPermission) {
        const granted = await hasPermission(requiredPermission)
        setHasAccess(granted)
      } else {
        setHasAccess(true)
      }
    }

    if (!loading) {
      checkAccess()
    }
  }, [user, loading, requiredPermission, hasPermission])

  if (loading || hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || hasAccess === false) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}
