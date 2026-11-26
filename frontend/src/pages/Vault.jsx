import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, KeyRound } from 'lucide-react'
import { api } from '../services/api'
import EntryCard from '../components/EntryCard'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'

export default function Vault() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const category = params.get('category') || ''
  const [entries, setEntries] = useState(null)
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const toast = useToast()

  const load = useCallback(() => {
    api.listEntries({ q: q.trim(), category }).then(setEntries).catch((e) => setError(e.message))
  }, [q, category])

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t) }, [load]) // debounce search
  useEffect(() => { api.stats().then((s) => setCategories(Object.keys(s.categories))).catch(() => {}) }, [entries?.length])

  const setCategory = (c) => {
    const next = new URLSearchParams(params)
    c ? next.set('category', c) : next.delete('category')
    setParams(next, { replace: true })
  }

  const confirmDelete = async () => {
    try {
      await api.deleteEntry(toDelete.id)
      setEntries((l) => l.filter((e) => e.id !== toDelete.id))
      toast('Deleted')
    } catch (e) { toast(e.message, 'error') }
    setToDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Password vault</h1>
        <Link to="/vault/new" className="btn-primary"><Plus size={16} />Add password</Link>
      </div>

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="input py-3 pl-11" placeholder="Search by name, URL, username or category" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search accounts" />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {['', ...categories].map((c) => (
            <button key={c || 'all'} onClick={() => setCategory(c)} aria-pressed={category === c}
              className={`rounded-full border px-3.5 py-1 text-sm transition ${category === c ? 'border-accent/50 bg-accent/10 text-accent' : 'border-white/10 text-slate-400 hover:text-white'}`}>
              {c || 'All'}
            </button>
          ))}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {entries === null && !error && <p className="text-slate-500">Loading…</p>}

      {entries?.length === 0 && (
        <div className="glass grid place-items-center gap-3 px-6 py-16 text-center">
          <KeyRound className="text-accent" size={28} />
          <p className="font-display text-lg font-semibold text-white">{q || category ? 'No accounts match your search' : 'Your vault is empty'}</p>
          <p className="max-w-sm text-sm text-slate-400">{q || category ? 'Try a different word or clear the category filter.' : 'Save your first password and it will be encrypted before it is stored.'}</p>
          {!q && !category && <Link to="/vault/new" className="btn-primary mt-2"><Plus size={16} />Add password</Link>}
        </div>
      )}

      <div className="grid gap-4">
        {entries?.map((e) => <EntryCard key={e.id} entry={e} onDelete={setToDelete} />)}
      </div>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete this password?">
        <p className="text-sm text-slate-400">"{toDelete?.site_name}" will be permanently removed. This can't be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-ghost" onClick={() => setToDelete(null)}>Cancel</button>
          <button className="btn-danger" onClick={confirmDelete}>Delete password</button>
        </div>
      </Modal>
    </div>
  )
}
