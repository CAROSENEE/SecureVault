import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import PasswordInput from '../components/PasswordInput'
import StrengthMeter from '../components/StrengthMeter'
import { useAuth } from '../services/auth'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (f.password !== f.confirm) return setError('Passwords do not match.')
    setBusy(true)
    try {
      await register(f.email.trim(), f.password, f.full_name.trim())
      nav('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Create your vault" subtitle="Use a long, unique password. It protects everything else." footer={<>Already have an account? <Link to="/login" className="text-accent hover:underline">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label htmlFor="name" className="label">Name</label><input id="name" className="input" autoComplete="name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
        <div><label htmlFor="email" className="label">Email</label><input id="email" type="email" required className="input" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div>
          <label htmlFor="pw" className="label">Password</label>
          <PasswordInput id="pw" required autoComplete="new-password" value={f.password} onChange={(v) => setF({ ...f, password: v })} />
          <StrengthMeter password={f.password} />
          <p className="mt-2 text-xs text-slate-500">At least 10 characters with uppercase, lowercase and a number.</p>
        </div>
        <div><label htmlFor="pw2" className="label">Confirm password</label><PasswordInput id="pw2" required autoComplete="new-password" value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} /></div>
        {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthLayout>
  )
}
