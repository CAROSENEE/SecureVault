import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({ value, onChange, id, placeholder, autoComplete = 'current-password', required, className = '' }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={`input pr-11 ${show ? 'font-mono' : ''} ${className}`}
      />
      <button type="button" onClick={() => setShow((s) => !s)} className="icon-btn absolute right-1 top-1/2 -translate-y-1/2" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
