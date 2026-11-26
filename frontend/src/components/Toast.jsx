import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID()
    setItems((i) => [...i, { id, message, type }])
    setTimeout(() => setItems((i) => i.filter((t) => t.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-24 md:bottom-6 right-4 z-[100] flex flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="glass-strong animate-pop flex items-center gap-2.5 px-4 py-3 text-sm text-white shadow-2xl">
            {t.type === 'error' ? <AlertTriangle size={16} className="text-red-400" /> : <CheckCircle2 size={16} className="text-accent" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
