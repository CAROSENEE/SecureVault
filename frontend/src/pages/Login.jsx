import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../services/auth'

export default function Login() {
  const { login, notice, setNotice } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), password)
      setNotice('')
      nav(loc.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to open your vault." footer={<>New here? <Link to="/register" className="text-accent hover:underline">Create an account</Link></>}>
      {notice && <p role="status" className="mb-4 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{notice}</p>}
      <form onSubmit={submit} className="space-y-4">
        <div><label htmlFor="email" className="label">Email</label><input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label htmlFor="pw" className="label">Password</label><PasswordInput id="pw" required value={password} onChange={setPassword} /></div>
        {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthLayout>
  )
}
