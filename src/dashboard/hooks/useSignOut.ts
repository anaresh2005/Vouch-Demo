import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@dashboard/hooks/useAuth';
import { useToast } from '@dashboard/hooks/use-toast';

/** Signs out and returns to the sign-in page. Used by the dashboard's account menu and onboarding. */
export function useSignOut() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/', { replace: true, state: { signIn: true } });
    } catch (error) {
      toast({ title: 'Could not sign out', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setSigningOut(false);
    }
  }

  return { signOut: handleSignOut, signingOut };
}
