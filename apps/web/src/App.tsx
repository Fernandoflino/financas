import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/layouts/AdminLayout'
import LoginPage from '@/pages/auth/Login'
import SignupPage from '@/pages/auth/Signup'
import ForgotPasswordPage from '@/pages/auth/ForgotPassword'
import ResetPasswordPage from '@/pages/auth/ResetPassword'
import DashboardPage from '@/pages/Dashboard'
import AdminIndexPage from '@/pages/admin/Index'
import AdminSettingsPage from '@/pages/admin/Settings'
import AdminUsersPage from '@/pages/admin/Users'
import AdminAuditPage from '@/pages/admin/AuditLog'
import MarketDataTestPage from '@/pages/MarketDataTest'
import PortfoliosPage from '@/pages/PortfoliosIndex'
import PortfolioDetailPage from '@/pages/PortfolioDetail'

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Portfolio routes (Phase 4) */}
          <Route
            path="/portfolios"
            element={
              <ProtectedRoute>
                <PortfoliosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolios/:portfolioId"
            element={
              <ProtectedRoute>
                <PortfolioDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Test routes (Phase 3) */}
          <Route
            path="/test/market-data"
            element={
              <ProtectedRoute>
                <MarketDataTestPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredPermission="admin.settings.manage">
                <AdminLayout>
                  <AdminIndexPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requiredPermission="admin.settings.manage">
                <AdminLayout>
                  <AdminSettingsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredPermission="admin.users.manage">
                <AdminLayout>
                  <AdminUsersPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute requiredPermission="admin.view_audit">
                <AdminLayout>
                  <AdminAuditPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard (or login if not authenticated) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
