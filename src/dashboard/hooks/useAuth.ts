import { createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string, jobTitle?: string, brandName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  /** Emails a password reset link that returns to /reset-password. */
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  /** Sets a new password for the signed-in account, including one signed in from a reset link. */
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  /** True after arriving from a password reset link, until a new password is set or the user signs out. */
  passwordRecovery: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
