import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useDemoAuth } from '@/hooks/useDemoAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isDemoAuthenticated, loading } = useDemoAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isDemoAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
