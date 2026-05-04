import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import DashboardPage from './pages/DashboardPage'
import ChatDetailPage from './pages/ChatDetailPage'
import LeadsPage from './pages/LeadsPage'
import AdminPage from './pages/AdminPage'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Users only → /chat */}
        <Route path="/chat" element={
          <ProtectedRoute allowedRoles={['user']}>
            <ChatPage />
          </ProtectedRoute>
        } />

        {/* Agents + Admins → /admin (chat dashboard) */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['agent', 'admin']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/chat/:chatId" element={
          <ProtectedRoute allowedRoles={['agent', 'admin']}>
            <ChatDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/leads" element={
          <ProtectedRoute allowedRoles={['agent', 'admin']}>
            <LeadsPage />
          </ProtectedRoute>
        } />

        {/* Admin only → /admin/manage */}
        <Route path="/admin/manage" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}
