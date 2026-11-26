import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Timer, KeyRound, ShieldAlert } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../services/auth'
import PasswordInput from '../components/PasswordInput'
import StrengthMeter from '../components/StrengthMeter'
import Modal from '../components/Modal'

function useCountdown(target) {
  const [left, setLeft] = useState(Math.max(target - Date.now(), 0))
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(target - Date.now(), 0)), 1000)
    return () => clearInterval(t)
  }, [target])
  const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000)
  return `${m}m ${String(s).padStart(2, '0')}s`
}

export default function SecuritySettings() {
  const { expiresAt, logout } = useAuth()
  const nav = useNavigate()
  const remaining = useCountdown(expiresAt)
  const [f, setF] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [delPw, setDelPw] = useState('')
  const [delErr, setDelErr] = useState('')

  const change = async (e) => {
    e.preventDefault()
    setError('')
    if (f.next !== f.confirm) return setError('New passwords do not match.')
    setBusy(true)
    try {
      await api.changePassword({ current_password: f.current, new_password: f.next })
      await logout('Password changed. Please log in with your new password.')
      nav('/login')
    } catch (err) { setError(err.message); setBusy(false) }
  }

  const remove = async (e) => {
    e.preventDefault()
    setDelErr('')
    try {
      await api.deleteAccount({ password: delPw })
      await logout('Your account and all saved passwords were deleted.')
      nav('/login')
    } catch (err) { setDelErr(err.message) }
  }

  const facts = [
    { icon: Lock, title: 'Encryption', text: 'Passwords are encrypted with AES-256-GCM using a unique key for your account. That key is itself encrypted with a server master key.' },
    { icon: KeyRound, title: 'Login password', text: 'Your login password is stored only as an Argon2id hash. Nobody, including the server, can read it.' },
    { icon: Timer, title: 'Session', text: `This session ends in ${remaining}, or after 15 minutes without activity.` },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Security settings</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {facts.map(({ icon: Icon, title, text }) => (
          <div key={title} className="glass p-5"><Icon size={20} className="text-accent" /><h2 className="mt-3 font-semibold">{title}</h2><p className="mt-1 text-sm leading-relaxed text-slate-400">{text}</p></div>
        ))}
      </div>

      <form onSubmit={change} className="glass space-y-5 p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Change login password</h2>
        <p className="-mt-3 text-sm text-slate-400">Your saved passwords stay intact. You'll be logged out and asked to sign in again.</p>
        <div><label htmlFor="cur" className="label">Current password</label><PasswordInput id="cur" required value={f.current} onChange={(v) => setF({ ...f, current: v })} /></div>
        <div>
          <label htmlFor="new" className="label">New password</label>
          <PasswordInput id="new" required autoComplete="new-password" value={f.next} onChange={(v) => setF({ ...f, next: v })} />
          <StrengthMeter password={f.next} />
        </div>
        <div><label htmlFor="conf" className="label">Confirm new password</label><PasswordInput id="conf" required autoComplete="new-password" value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} /></div>
        {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <div className="flex justify-end"><button className="btn-primary" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button></div>
      </form>

      <section className="glass flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
        <div><h2 className="text-lg font-semibold">Log out of this session</h2><p className="mt-1 text-sm text-slate-400">Your token is revoked on the server immediately.</p></div>
        <button className="btn-ghost" onClick={async () => { await logout(); nav('/login') }}>Log out</button>
      </section>

      <section className="rounded-2xl border border-red-400/20 bg-red-500/[0.04] p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-red-300"><ShieldAlert size={18} />Delete account</h2>
        <p className="mt-1 text-sm text-slate-400">Permanently deletes your account and every saved password.</p>
        <button className="btn-danger mt-4" onClick={() => setDelOpen(true)}>Delete my account</button>
      </section>

      <Modal open={delOpen} onClose={() => setDelOpen(false)} title="Delete your account?">
        <form onSubmit={remove}>
          <p className="mb-4 text-sm text-slate-400">This cannot be undone. Enter your login password to confirm.</p>
          <PasswordInput required value={delPw} onChange={setDelPw} />
          {delErr && <p role="alert" className="mt-3 text-sm text-red-300">{delErr}</p>}
          <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn-ghost" onClick={() => setDelOpen(false)}>Cancel</button><button className="btn-danger">Delete account</button></div>
        </form>
      </Modal>
    </div>
  )
}
