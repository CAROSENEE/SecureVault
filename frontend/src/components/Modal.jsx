import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-label={title} className="glass-strong animate-pop w-full max-w-md p-6" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}
