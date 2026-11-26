import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useToast } from './Toast'

// Copies text, then clears the clipboard after 30s so secrets don't linger.
export async function copyText(text, clearAfterMs = 30000) {
  await navigator.clipboard.writeText(text)
  if (clearAfterMs) setTimeout(() => navigator.clipboard.writeText('').catch(() => {}), clearAfterMs)
}

export default function CopyButton({ getText, label = 'Copy', className = 'icon-btn', children, clear = true }) {
  const [done, setDone] = useState(false)
  const toast = useToast()
  const onClick = async () => {
    try {
      const text = typeof getText === 'function' ? await getText() : getText
      if (!text) return
      await copyText(text, clear ? 30000 : 0)
      setDone(true)
      toast(clear ? 'Copied. Clipboard clears in 30 seconds.' : 'Copied.')
      setTimeout(() => setDone(false), 1500)
    } catch (e) {
      toast(e?.message || 'Could not copy', 'error')
    }
  }
  return (
    <button type="button" onClick={onClick} className={className} aria-label={label} title={label}>
      {done ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
      {children}
    </button>
  )
}
