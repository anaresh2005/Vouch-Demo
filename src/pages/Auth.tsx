import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoAuth } from '@/hooks/useDemoAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';
import iconRoyalPeriwinkle from '@/assets/icon-royal-periwinkle.png';

export default function Auth() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isDemoAuthenticated, demoLogin } = useDemoAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isDemoAuthenticated) {
      navigate('/dashboard');
    }
  }, [isDemoAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const success = demoLogin(password);
    if (!success) {
      toast({
        title: 'Access denied',
        description: 'Incorrect investor password. Please try again.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-primary/5 via-60% to-background">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/[0.07] rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-card/90 backdrop-blur-xl border-border/60 shadow-2xl animate-fade-in relative z-10">
        <CardHeader className="text-center space-y-5 pt-8">
          <Badge
            variant="secondary"
            className="mx-auto font-body text-xs tracking-wide px-3 py-1"
          >
            Investor Access
          </Badge>

          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 vouch-gradient rounded-2xl blur-lg opacity-30" />
            <img
              src={iconRoyalPeriwinkle}
              alt="Vouch"
              className="relative w-16 h-16 rounded-2xl shadow-lg"
            />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-[1.75rem] leading-tight font-display tracking-tight text-foreground">
              Welcome to Vouch
            </CardTitle>
            <CardDescription className="font-body text-[0.95rem] text-muted-foreground max-w-xs mx-auto">
              Attention is the new currency. Now accept it at checkout.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-8 pt-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="investor-password" className="font-body text-sm">
                Investor Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="investor-password"
                  type="password"
                  placeholder="Enter investor password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="h-11 pl-10 bg-background"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 vouch-gradient text-primary-foreground font-display text-[0.95rem] shadow-md transition-all hover:opacity-95 hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Access Demo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
