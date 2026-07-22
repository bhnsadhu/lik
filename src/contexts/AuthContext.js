import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase, withTimeout } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // the profile fetch failed (offline, backend unreachable, request timed
  // out). Distinct from "no profile row", which is a broken account instead.
  const [profileError, setProfileError] = useState(false)
  const [profileRetrying, setProfileRetrying] = useState(false)
  const userIdRef = useRef(null)

  const fetchProfile = useCallback(async (userId) => {
    const read = () =>
      // maybeSingle so a genuinely missing row comes back as data:null with no
      // error, which is a different problem from the request failing
      withTimeout(supabase.from('profiles').select('*').eq('id', userId).maybeSingle())

    const res = await read()
    // a brand-new signup can arrive here a beat before the handle_new_user
    // trigger's row is readable - give it one grace retry before deciding
    // the account has no profile at all
    if (!res.error && !res.data) {
      await new Promise((r) => setTimeout(r, 700))
      return read()
    }
    return res
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!userIdRef.current) return
    const { data } = await fetchProfile(userIdRef.current)
    if (data) setProfile(data)
  }, [fetchProfile])

  // Re-run the fetch behind the "try again" button on the load-error screen.
  const retryProfile = useCallback(async () => {
    if (!userIdRef.current || profileRetrying) return
    setProfileRetrying(true)
    const { data, error } = await fetchProfile(userIdRef.current)
    setProfileRetrying(false)
    if (error) {
      setProfileError(true)
      return
    }
    setProfileError(false)
    setProfile(data ?? null)
  }, [fetchProfile, profileRetrying])

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (cancelled) return
      if (s) {
        userIdRef.current = s.user.id
        const { data, error } = await fetchProfile(s.user.id)
        if (cancelled) return
        setSession(s)
        setProfile(data ?? null)
        setProfileError(!!error)
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
        setProfileError(false)
        return
      }
      const newUser = s?.user?.id && s.user.id !== userIdRef.current
      if (s) {
        userIdRef.current = s.user.id
        if (newUser) {
          setTimeout(async () => {
            const { data, error } = await fetchProfile(s.user.id)
            if (!cancelled) {
              setProfile(data ?? null)
              setProfileError(!!error)
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
    profileError,
    profileRetrying,
    retryProfile,
    refreshProfile,
    setProfile,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
