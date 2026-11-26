import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute, { GuestRoute } from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Vault from './pages/Vault'
import AddPassword from './pages/AddPassword'
import EditPassword from './pages/EditPassword'
import Generator from './pages/Generator'
import SecuritySettings from './pages/SecuritySettings'
import Profile from './pages/Profile'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/vault/new" element={<AddPassword />} />
          <Route path="/vault/:id/edit" element={<EditPassword />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/security" element={<SecuritySettings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
