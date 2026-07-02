import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfile(u.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      // No awaited supabase calls inside this callback: it runs while the
      // auth lock is held, and fetchProfile needs that lock to attach the
      // access token, which deadlocks the whole client on token refresh.
      // setTimeout defers the work until after the lock is released.
      setTimeout(async () => {
        if (u) {
          // profile loads before the user is exposed so the router never
          // renders an authed state with a null profile
          await fetchProfile(u.id);
          setUser(u);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = (email) =>
    supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

  const verifyOtp = (email, token) =>
    supabase.auth.verifyOtp({ email, token, type: 'email' });

  const signOut = () => {
    setUser(null);
    setProfile(null);
    return supabase.auth.signOut();
  };

  const refreshProfile = useCallback(
    () => user && fetchProfile(user.id),
    [user, fetchProfile]
  );

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, verifyOtp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
