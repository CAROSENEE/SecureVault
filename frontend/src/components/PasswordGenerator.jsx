import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { generatePassword } from '../services/passwordTools'
import CopyButton from './CopyButton'
import StrengthMeter from './StrengthMeter'

const OPTIONS = [
  ['uppercase', 'Uppercase (A–Z)'],
  ['lowercase', 'Lowercase (a–z)'],
  ['numbers', 'Numbers (0–9)'],
  ['symbols', 'Special characters (!@#$)'],
]

export default function PasswordGenerator({ onUse, compact = false }) {
  const [opts, setOpts] = useState({ length: 18, uppercase: true, lowercase: true, numbers: true, symbols: true })
  const [password, setPassword] = useState('')
  const anyOn = opts.uppercase || opts.lowercase || opts.numbers || opts.symbols

  const regenerate = (o = opts) => setPassword(generatePassword(o))
  useEffect(() => { regenerate() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (k) => {
    const next = { ...opts, [k]: !opts[k] }
    if (!(next.uppercase || next.lowercase || next.numbers || next.symbols)) return // keep at least one
    setOpts(next)
    regenerate(next)
  }
  const setLength = (n) => {
    const next = { ...opts, length: n }
    setOpts(next)
    regenerate(next)
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2 pl-4">
        <output className="min-w-0 flex-1 break-all font-mono text-lg tracking-wide text-accent" aria-label="Generated password">{password}</output>
        <button type="button" className="icon-btn" onClick={() => regenerate()} aria-label="Generate new password" title="Generate new"><RefreshCw size={16} /></button>
        <CopyButton getText={() => password} label="Copy password" />
      </div>
      <StrengthMeter password={password} showTips={false} />

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <label htmlFor="gen-length" className="font-medium text-slate-300">Length</label>
          <span className="font-mono text-accent">{opts.length}</span>
        </div>
        <input id="gen-length" type="range" min="8" max="64" value={opts.length} onChange={(e) => setLength(+e.target.value)} className="w-full accent-[#59FFB4]" />
      </div>

      <div className={`mt-4 grid gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
        {OPTIONS.map(([k, label]) => (
          <label key={k} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-200 transition hover:border-white/20 has-[:checked]:border-accent/40 has-[:checked]:bg-accent/5">
            <input type="checkbox" checked={opts[k]} onChange={() => toggle(k)} className="h-4 w-4 accent-[#59FFB4]" />
            {label}
          </label>
        ))}
      </div>
      {!anyOn && <p className="mt-2 text-xs text-red-400">Select at least one character type.</p>}
      {onUse && (
        <button type="button" onClick={() => onUse(password)} className="btn-primary mt-5 w-full">Use this password</button>
      )}
    </div>
  )
}
