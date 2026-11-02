import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useDemoAuth } from '@/hooks/useDemoAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logo from '@/assets/vouch-logo-periwinkle.png';

// The investor password gate, in the product's sign-in layout: logo top-left, one centered card.
export default function Auth() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { isDemoAuthenticated, loading, demoLogin } = useDemoAuth();

  if (!loading && isDemoAuthenticated) return <Navigate to="/checkout" replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(!demoLogin(password));
  };

  return (
    <div className="flex min-h-screen flex-col bg-card">
      <header className="mx-auto flex h-16 w-full max-w-[1080px] items-center px-4">
        <img src={logo} alt="Vouch" className="h-6 w-auto" />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:pt-10">
        <div className="w-full max-w-[440px] overflow-hidden rounded-xl bg-card shadow-edge">
          <div className="px-6 pb-8 pt-8 sm:px-10">
            <h1 className="mb-2 text-2xl font-semibold text-heading">View the Vouch demo</h1>
            <p className="mb-6 text-sm text-body">Attention is the new currency. Now accept it at checkout.</p>
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="investor-password">Investor password</Label>
                <Input
                  id="investor-password"
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
