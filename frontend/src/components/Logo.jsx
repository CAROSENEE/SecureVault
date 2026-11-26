import { Link } from 'react-router-dom'

export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 8 12 17v15c0 12.5 8.6 20 20 23 11.4-3 20-10.5 20-23V17z" fill="rgba(89,255,180,.08)" stroke="#59FFB4" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="32" cy="29" r="5" fill="#59FFB4" />
      <path d="M32 34v9" stroke="#59FFB4" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5 font-display text-xl font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-lg">
      <LogoMark />
      SecureVault
    </Link>
  )
}
