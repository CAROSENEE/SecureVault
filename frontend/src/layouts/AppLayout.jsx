import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Dices, KeyRound, LayoutDashboard, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../services/auth'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vault', label: 'Vault', icon: KeyRound },
  { to: '/generator', label: 'Generator', icon: Dices },
  { to: '/security', label: 'Security', icon: ShieldCheck },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

const linkCls = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${isActive ? 'bg-accent/10 text-accent shadow-[inset_2px_0_0_#59FFB4]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`

export default function AppLayout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const doLogout = async () => { await logout(); nav('/login') }
  const initial = (user?.full_name || user?.email || '?')[0].toUpperCase()

  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-black/20 p-5 backdrop-blur-xl md:flex">
        <Logo to="/dashboard" />
        <nav className="mt-10 flex flex-1 flex-col gap-1" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkCls}><Icon size={18} />{label}</NavLink>
          ))}
        </nav>
        <div className="glass flex items-center gap-3 p-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/15 font-display font-bold text-accent">{initial}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.full_name || 'Your account'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button onClick={doLogout} className="icon-btn" aria-label="Log out" title="Log out"><LogOut size={16} /></button>
        </div>
      </aside>

      <div className="min-w-0 pb-24 md:pb-0">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:hidden">
          <Logo to="/dashboard" />
          <button onClick={doLogout} className="icon-btn" aria-label="Log out"><LogOut size={18} /></button>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 md:py-12"><Outlet /></main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-ink-900/90 px-2 py-1.5 backdrop-blur-xl md:hidden" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] ${isActive ? 'text-accent' : 'text-slate-500'}`}>
            <Icon size={20} />{label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
