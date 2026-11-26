import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, Plus, Search } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../services/auth'
import PasswordGenerator from '../components/PasswordGenerator'
import { formatDate } from '../components/EntryCard'

export default function Dashboard() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => { api.stats().then(setStats).catch((e) => setError(e.message)) }, [])

  const cats = stats ? Object.entries(stats.categories).sort((a, b) => b[1] - a[1]) : []
  const max = cats[0]?.[1] || 1

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hi{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}</h1>
          <p className="mt-1 text-slate-400">Here's what's in your vault.</p>
        </div>
        <Link to="/vault/new" className="btn-primary"><Plus size={16} />Add password</Link>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); nav(`/vault?q=${encodeURIComponent(q)}`) }} className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="input py-3.5 pl-11" placeholder="Search your accounts" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search accounts" />
      </form>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="glass p-6">
          <p className="text-sm text-slate-400">Saved accounts</p>
          <p className="mt-2 font-display text-6xl font-extrabold text-accent">{stats ? stats.total : '–'}</p>
          <Link to="/vault" className="mt-4 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-accent"><KeyRound size={15} />Open vault</Link>
        </section>

        <section className="glass p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Categories</h2>
          {stats && cats.length === 0 && <p className="mt-4 text-sm text-slate-500">Categories show up here once you save your first password.</p>}
          <ul className="mt-4 space-y-3">
            {cats.map(([name, n]) => (
              <li key={name}>
                <Link to={`/vault?category=${encodeURIComponent(name)}`} className="group block">
                  <div className="mb-1 flex justify-between text-sm"><span className="text-slate-200 group-hover:text-accent">{name}</span><span className="text-slate-500">{n}</span></div>
                  <div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-accent" style={{ width: `${(n / max) * 100}%` }} /></div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Recently added</h2>
          {stats && stats.recent.length === 0 && (
            <div className="mt-4 text-sm text-slate-500">Nothing saved yet. <Link to="/vault/new" className="text-accent hover:underline">Add your first password</Link>.</div>
          )}
          <ul className="mt-3 divide-y divide-white/5">
            {stats?.recent.map((e) => (
              <li key={e.id}>
                <Link to={`/vault/${e.id}/edit`} className="flex items-center gap-3 py-3 transition hover:text-accent">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/10 font-display font-bold text-accent">{e.site_name[0]?.toUpperCase()}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">{e.site_name}</span><span className="block truncate text-xs text-slate-500">{e.username || e.category}</span></span>
                  <span className="text-xs text-slate-600">{formatDate(e.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass p-6">
          <h2 className="mb-4 text-lg font-semibold">Quick generator</h2>
          <PasswordGenerator compact />
        </section>
      </div>
    </div>
  )
}
