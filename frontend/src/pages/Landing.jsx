import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dices, KeyRound, Lock, ShieldCheck, Gauge, Search } from 'lucide-react'
import Logo from '../components/Logo'
import PasswordGenerator from '../components/PasswordGenerator'
import { useAuth } from '../services/auth'

const FEATURES = [
  { icon: Lock, title: 'AES-256-GCM encryption', text: 'Every password is encrypted with its own per-user key before it reaches the database.' },
  { icon: KeyRound, title: 'Your vault, organized', text: 'Save logins with URLs, categories and notes. Copy, edit or delete in one click.' },
  { icon: Dices, title: 'Generator built in', text: 'Create strong passwords with the length and characters you choose. Generated in your browser.' },
  { icon: Gauge, title: 'Strength feedback', text: 'See if a password is weak, medium or strong, and what to change to improve it.' },
  { icon: Search, title: 'Instant search', text: 'Find any account by name, URL, username or category.' },
  { icon: ShieldCheck, title: 'Locks itself', text: 'Sessions expire, idle tabs log out, and the clipboard is cleared after you copy.' },
]

export default function Landing() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard" className="btn-primary">Open vault</Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary">Create account</Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div className="animate-rise">
          <h1 className="text-5xl font-extrabold leading-[1.05] sm:text-6xl">
            Passwords you never have to remember. Or trust anyone with.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
            SecureVault is a personal password manager that runs on your own machine. Everything you save is encrypted with AES-256-GCM, and there is no paid service behind it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={user ? '/dashboard' : '/register'} className="btn-primary px-6 py-3">Create your vault</Link>
            <a href="#features" className="btn-ghost px-6 py-3">See what's inside</a>
          </div>
        </div>
        <div className="glass-strong p-6 shadow-[0_0_80px_-20px_rgba(89,255,180,.35)] sm:p-7">
          <p className="mb-4 text-sm text-slate-400">Try the generator. This one never leaves your browser.</p>
          <PasswordGenerator compact />
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="max-w-xl text-3xl font-bold">Everything a vault needs, nothing it doesn't</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="glass p-6">
              <Icon className="text-accent" size={22} />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">SecureVault. Self-hosted and open source.</footer>
    </div>
  )
}
