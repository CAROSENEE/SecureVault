import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../services/auth'
import { useToast } from '../components/Toast'
import { formatDate } from '../components/EntryCard'

export default function Profile() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [name, setName] = useState(user?.full_name || '')
  const [total, setTotal] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.stats().then((s) => setTotal(s.total)).catch(() => {}) }, [])

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      setUser(await api.updateProfile({ full_name: name }))
      toast('Profile updated')
    } catch (err) { toast(err.message, 'error') }
    setBusy(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      <form onSubmit={save} className="glass space-y-5 p-6 sm:p-8">
        <div><label htmlFor="email" className="label">Email</label><input id="email" className="input opacity-70" value={user.email} disabled /></div>
        <div><label htmlFor="name" className="label">Name</label><input id="name" className="input" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="flex justify-end"><button className="btn-primary" disabled={busy || name === user.full_name}>{busy ? 'Saving…' : 'Save changes'}</button></div>
      </form>
      <dl className="glass grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
        <div><dt className="text-sm text-slate-400">Member since</dt><dd className="mt-1 font-medium text-white">{user.created_at ? formatDate(user.created_at) : '–'}</dd></div>
        <div><dt className="text-sm text-slate-400">Last login</dt><dd className="mt-1 font-medium text-white">{user.last_login_at ? formatDate(user.last_login_at) : 'This is your first session'}</dd></div>
        <div><dt className="text-sm text-slate-400">Saved accounts</dt><dd className="mt-1 font-medium text-accent">{total ?? '–'}</dd></div>
      </dl>
    </div>
  )
}
