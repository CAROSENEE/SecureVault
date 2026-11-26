import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api, tokenStore } from './api'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const IDLE_MS = 15 * 60 * 1000 // auto-lock after 15 minutes without activity

function tokenExp(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000
  } catch {
    return 0
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!tokenStore.get())
  const [notice, setNotice] = useState('')
  const [expiresAt, setExpiresAt] = useState(0)
  const idleTimer = useRef(null)
  const expiryTimer = useRef(null)

  const clear = useCallback((msg = '') => {
    tokenStore.clear()
    setUser(null)
    setExpiresAt(0)
    setNotice(msg)
  }, [])

  const logout = useCallback(async (msg = '') => {
    try { await api.logout() } catch { /* token may already be invalid */ }
    clear(msg)
  }, [clear])

  const startSession = useCallback(async () => {
    const me = await api.me()
    setUser(me)
    setExpiresAt(tokenExp(tokenStore.get()))
  }, [])

  useEffect(() => {
    if (!tokenStore.get()) return
    startSession().catch(() => clear()).finally(() => setLoading(false))
  }, [startSession, clear])

  useEffect(() => {
    const h = (e) => clear(e.detail || 'Your session has ended. Please log in again.')
    window.addEventListener('sv:unauthorized', h)
    return () => window.removeEventListener('sv:unauthorized', h)
  }, [clear])

  // session expiry + idle timeout
  useEffect(() => {
    if (!user) return
    const left = expiresAt - Date.now()
    clearTimeout(expiryTimer.current)
    expiryTimer.current = setTimeout(() => logout('Your session expired. Please log in again.'), Math.max(left, 0))
    const reset = () => {
      clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => logout('You were logged out after 15 minutes of inactivity.'), IDLE_MS)
    }
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset))
      clearTimeout(idleTimer.current)
      clearTimeout(expiryTimer.current)
    }
  }, [user, expiresAt, logout])

  const login = async (email, password) => {
    const res = await api.login({ email, password })
    tokenStore.set(res.access_token)
    setNotice('')
    await startSession()
  }

  const register = async (email, password, full_name) => {
    await api.register({ email, password, full_name })
    await login(email, password)
  }

  return (
    <AuthCtx.Provider value={{ user, setUser, loading, login, register, logout, notice, setNotice, expiresAt }}>
      {children}
    </AuthCtx.Provider>
  )
}
