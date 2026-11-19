import { useState, useEffect, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@dashboard/integrations/supabase/client';
import { AuthContext } from '@dashboard/hooks/useAuth';
import { clearPendingInvite } from '@dashboard/hooks/useBrandInvites';

// Routing state only: no credentials or tokens. Scope it to this tab and account.
const RECOVERY_KEY = 'vouch.passwordRecoveryUser';
function readRecoveryUser(): string | null {
  try { return sessionStorage.getItem(RECOVERY_KEY); } catch { return null; }
}
function rememberRecoveryUser(id: string | null) {
  try {
    if (id) sessionStorage.setItem(RECOVERY_KEY, id);
    else sessionStorage.removeItem(RECOVERY_KEY);
  } catch { /* Recovery still works in memory when browser storage is unavailable. */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const recoveryUser = useRef<string | null>(readRecoveryUser());

  useEffect(() => {
    let authEventReceived = false;
    const acceptSession = (session: Session | null, recovering = false) => {
      if (recovering) recoveryUser.current = session?.user.id ?? null;
      if (recoveryUser.current !== session?.user.id) recoveryUser.current = null;
      rememberRecoveryUser(recoveryUser.current);
      setPasswordRecovery(recoveryUser.current !== null);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    // Listen before reading the session, and don't let a stale initial read replace a newer event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      authEventReceived = true;
      acceptSession(session, event === 'PASSWORD_RECOVERY');
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!authEventReceived) acceptSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName?: string, jobTitle?: string, brandName?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          job_title: jobTitle,
          // Used to create the brand when setup starts (after any email confirmation).
          brand_name: brandName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // A team invite opened in this browser belongs to whoever was signed in, not the next person.
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    clearPendingInvite();
    recoveryUser.current = null;
    rememberRecoveryUser(null);
    setPasswordRecovery(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      recoveryUser.current = null;
      rememberRecoveryUser(null);
      setPasswordRecovery(false);
    }
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetPassword, updatePassword, passwordRecovery }}>
      {children}
    </AuthContext.Provider>
  );
}
