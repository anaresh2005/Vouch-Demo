import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDemoAuth } from '@/hooks/useDemoAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logo from '@/assets/vouch-logo-ink.svg';

// The demo's password gate, in the product's sign-in layout: logo top-left, one card centered on the page.
export default function Auth() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { isDemoAuthenticated, loading, demoLogin } = useDemoAuth();
  // A page opened directly (say /dashboard) sent the visitor here; go back there after the password.
  const from = (useLocation().state as { from?: string } | null)?.from;
  const next = from && from !== '/' ? from : '/store';

  if (!loading && isDemoAuthenticated) return <Navigate to={next} replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(!demoLogin(password));
  };

  return (
    <div className="flex min-h-screen flex-col bg-card">
      <header className="mx-auto flex h-16 w-full max-w-[1080px] items-center px-4">
        <img src={logo} alt="Vouch" className="h-5 w-auto" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[520px] overflow-hidden rounded-xl bg-card shadow-edge">
          <div className="px-6 pb-8 pt-8 sm:px-10">
            <h1 className="mb-2 text-2xl font-semibold text-heading">Post to Pay Demo</h1>
            <p className="mb-6 text-sm text-body">Attention is the new currency. Now accept it at checkout.</p>
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="demo-password">Password</Label>
                <Input
                  id="demo-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={error}
                  aria-describedby={error ? 'password-error' : undefined}
                  autoFocus
                />
                {error && <p id="password-error" role="alert" className="text-sm text-destructive">Incorrect password. Try again.</p>}
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={!password}>Continue</Button>
            </form>
          </div>
        </div>
      </main>
      <footer className="mx-auto flex w-full max-w-[1080px] justify-end px-4 pb-6 text-xs text-muted-foreground">
        <span>© Vouch Commerce, Inc.</span>
      </footer>
    </div>
  );
}
