import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { demoLogout, demoSession } from '../utils/demoApi.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055'
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | authenticated | unauthenticated

  const refresh = useCallback(async () => {
    try {
      if (DEMO_MODE) {
        const data = await demoSession()
        setUser(data.user)
        setStatus('authenticated')
        return
      }
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('not authenticated')
      const data = await res.json()
      setUser(data.user)
      setStatus('authenticated')
    } catch {
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setSession = (nextUser) => {
    setUser(nextUser)
    setStatus('authenticated')
  }

  const logout = async () => {
    if (DEMO_MODE) {
      await demoLogout()
      setUser(null)
      setStatus('unauthenticated')
      return
    }
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // best-effort; clear client state regardless
    }
    setUser(null)
    setStatus('unauthenticated')
  }

  return (
    <AuthContext.Provider value={{ user, status, setSession, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
