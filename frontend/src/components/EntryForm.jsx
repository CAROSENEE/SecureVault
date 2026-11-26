import { useState } from 'react'
import { Dices } from 'lucide-react'
import PasswordInput from './PasswordInput'
import StrengthMeter from './StrengthMeter'
import PasswordGenerator from './PasswordGenerator'
import Modal from './Modal'
import { CATEGORIES } from '../services/passwordTools'

export default function EntryForm({ initial, editing = false, onSubmit, onCancel, submitLabel }) {
  const [f, setF] = useState({ site_name: '', site_url: '', username: '', password: '', category: 'General', notes: '', ...initial })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [genOpen, setGenOpen] = useState(false)
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const bind = (k) => ({ value: f[k], onChange: (e) => set(k)(e.target.value) })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    let url = f.site_url.trim()
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`
    const payload = { ...f, site_url: url }
    if (editing && !f.password) delete payload.password
    setBusy(true)
    try { await onSubmit(payload) } catch (err) { setError(err.message); setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="glass space-y-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="site_name" className="label">Website name</label>
          <input id="site_name" className="input" placeholder="GitHub" required maxLength={120} {...bind('site_name')} />
        </div>
        <div>
          <label htmlFor="site_url" className="label">Website URL</label>
          <input id="site_url" className="input" placeholder="github.com" maxLength={500} {...bind('site_url')} />
        </div>
        <div>
          <label htmlFor="username" className="label">Username or email</label>
          <input id="username" className="input" placeholder="you@example.com" autoComplete="off" maxLength={255} {...bind('username')} />
        </div>
        <div>
          <label htmlFor="category" className="label">Category</label>
          <input id="category" className="input" list="cats" maxLength={60} required {...bind('category')} />
          <datalist id="cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="label !mb-0">{editing ? 'New password' : 'Password'}</label>
          <button type="button" onClick={() => setGenOpen(true)} className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"><Dices size={15} />Generate</button>
        </div>
        <PasswordInput id="password" value={f.password} onChange={set('password')} autoComplete="new-password" required={!editing} placeholder={editing ? 'Leave blank to keep the current password' : ''} />
        <StrengthMeter password={f.password} />
      </div>

      <div>
        <label htmlFor="notes" className="label">Notes</label>
        <textarea id="notes" rows={3} className="input resize-y" maxLength={5000} placeholder="Recovery hints, 2FA info… (stored unencrypted, so no secrets here)" {...bind('notes')} />
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving…' : submitLabel}</button>
      </div>

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate a password">
        <PasswordGenerator compact onUse={(p) => { set('password')(p); setGenOpen(false) }} />
      </Modal>
    </form>
  )
}
