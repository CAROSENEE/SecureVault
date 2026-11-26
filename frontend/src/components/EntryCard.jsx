import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Pencil, Trash2, ExternalLink, User } from 'lucide-react'
import CopyButton from './CopyButton'
import { api } from '../services/api'
import { useToast } from './Toast'

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function EntryCard({ entry, onDelete }) {
  const [revealed, setRevealed] = useState(null)
  const timer = useRef(null)
  const toast = useToast()
  useEffect(() => () => clearTimeout(timer.current), [])

  const toggle = async () => {
    if (revealed !== null) { setRevealed(null); return }
    try {
      const { password } = await api.reveal(entry.id)
      setRevealed(password)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setRevealed(null), 15000) // auto-hide
    } catch (e) { toast(e.message, 'error') }
  }

  const safeUrl = /^https?:\/\//i.test(entry.site_url) ? entry.site_url : null

  return (
    <article className="glass p-5 transition hover:border-white/20">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 font-display text-lg font-bold text-accent">{entry.site_name[0]?.toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold">{entry.site_name}</h3>
            <span className="chip">{entry.category}</span>
          </div>
          {entry.username && (
            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-400"><User size={13} />{entry.username}</p>
          )}
          {safeUrl && (
            <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex max-w-full items-center gap-1.5 truncate text-sm text-slate-500 hover:text-accent">
              <ExternalLink size={13} />{entry.site_url.replace(/^https?:\/\//i, '')}
            </a>
          )}
        </div>
        <div className="flex shrink-0 items-center">
          <button onClick={toggle} className="icon-btn" aria-label={revealed !== null ? 'Hide password' : 'Show password'}>{revealed !== null ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          <CopyButton getText={async () => (await api.reveal(entry.id)).password} label="Copy password" />
          <Link to={`/vault/${entry.id}/edit`} className="icon-btn" aria-label="Edit"><Pencil size={16} /></Link>
          {onDelete && <button onClick={() => onDelete(entry)} className="icon-btn hover:!text-red-400" aria-label="Delete"><Trash2 size={16} /></button>}
        </div>
      </div>
      {revealed !== null && (
        <p className="mt-4 break-all rounded-lg border border-accent/20 bg-black/40 px-3 py-2 font-mono text-sm text-accent animate-pop">{revealed}</p>
      )}
      {entry.notes && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{entry.notes}</p>}
      <p className="mt-3 text-xs text-slate-600">Added {formatDate(entry.created_at)}</p>
    </article>
  )
}
