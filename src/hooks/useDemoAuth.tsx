// Demo authentication context for client-side demo access
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface DemoAuthContextType {
  isDemoAuthenticated: boolean;
  loading: boolean;
  demoLogin: (password: string) => boolean;
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

const DEMO_PASSWORD = 'Investor';
const STORAGE_KEY = 'vouch_demo_authenticated';

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [isDemoAuthenticated, setIsDemoAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check sessionStorage for existing demo session
    const storedAuth = sessionStorage.getItem(STORAGE_KEY);
    if (storedAuth === 'true') {
      setIsDemoAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const demoLogin = (password: string): boolean => {
    if (password === DEMO_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setIsDemoAuthenticated(true);
      return true;
    }
    return false;
  };

  return (
    <DemoAuthContext.Provider value={{ isDemoAuthenticated, loading, demoLogin }}>
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext);
  if (context === undefined) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider');
  }
  return context;
}
