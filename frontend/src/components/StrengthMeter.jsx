import { checkStrength } from '../services/passwordTools'

export default function StrengthMeter({ password, showTips = true }) {
  if (!password) return null
  const r = checkStrength(password)
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(r.score, 6)}%`, background: r.color, boxShadow: `0 0 12px ${r.color}88` }} />
        </div>
        <span className="w-14 text-right text-xs font-semibold" style={{ color: r.color }}>{r.label}</span>
      </div>
      {showTips && r.suggestions.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-slate-400">
          {r.suggestions.map((s) => <li key={s} className="flex gap-2"><span style={{ color: r.color }}>•</span>{s}</li>)}
        </ul>
      )}
    </div>
  )
}
