import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const userIdRef = useRef(null)

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    return data
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!userIdRef.current) return
    const data = await fetchProfile(userIdRef.current)
    if (data) setProfile(data)
  }, [fetchProfile])

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (cancelled) return
      if (s) {
        userIdRef.current = s.user.id
        const p = await fetchProfile(s.user.id)
        if (cancelled) return
        setSession(s)
        setProfile(p)
      }
      setLoading(false)
    })

    // Never await supabase calls inside this callback: the auth lock is held
    // while it runs and a nested call deadlocks token refresh. Defer instead.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') {
        userIdRef.current = null
        setSession(null)
        setProfile(null)
        return
      }
      const newUser = s?.user?.id && s.user.id !== userIdRef.current
      if (s) {
        userIdRef.current = s.user.id
        if (newUser) {
          setTimeout(async () => {
            const p = await fetchProfile(s.user.id)
            if (!cancelled) {
              setProfile(p)
              setSession(s)
            }
          }, 0)
        } else {
          setSession(s)
        }
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile,
    setProfile,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
