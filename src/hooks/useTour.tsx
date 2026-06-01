import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDemoAuth } from '@/hooks/useDemoAuth';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  route: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'overview-nav',
    title: 'Overview',
    description: 'Your campaign dashboard at a glance — key metrics, order status, and recent activity all in one place.',
    targetSelector: '[data-tour-nav="overview"]',
    route: '/dashboard',
    position: 'right',
  },
  {
    id: 'gifts-nav',
    title: 'Gifts',
    description: 'Track all gifted orders from warehouse to feed. Filter by status, influencer, or date.',
    targetSelector: '[data-tour-nav="gifts"]',
    route: '/dashboard/orders',
    position: 'right',
  },
  {
    id: 'posts-nav',
    title: 'Posts',
    description: 'Monitor influencer posts in real-time. See engagement metrics, views, and CPM performance.',
    targetSelector: '[data-tour-nav="posts"]',
    route: '/dashboard/posts',
    position: 'right',
  },
  {
    id: 'influencers-nav',
    title: 'Influencers',
    description: 'View all influencers who have received gifts. Track their performance and engagement rates.',
    targetSelector: '[data-tour-nav="influencers"]',
    route: '/dashboard/influencers',
    position: 'right',
  },
  {
    id: 'analytics-nav',
    title: 'Analytics',
    description: 'Deep dive into campaign performance with detailed charts, CPM analysis, and audience insights.',
    targetSelector: '[data-tour-nav="analytics"]',
    route: '/dashboard/analytics',
    position: 'right',
  },
  {
    id: 'settings-nav',
    title: 'Settings',
    description: 'Configure your brand requirements, eligibility criteria, and posting deadlines.',
    targetSelector: '[data-tour-nav="settings"]',
    route: '/dashboard/settings',
    position: 'right',
  },
  {
    id: 'checkout-demo',
    title: 'Checkout Demo',
    description: 'Try the influencer checkout experience! Preview how customers use "Pay with a Post" on your store.',
    targetSelector: '[data-tour="checkout-demo"]',
    route: '/dashboard',
    position: 'top',
  },
];

interface TourContextType {
  isFirstVisit: boolean;
  showWelcome: boolean;
  isTourActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TourStep | null;
  startTour: () => void;
  skipTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  endTour: () => void;
  dismissWelcome: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const TOUR_COMPLETED_KEY = 'vouch_tour_completed';
const WELCOME_DISMISSED_KEY = 'vouch_welcome_dismissed';

export function TourProvider({ children }: { children: ReactNode }) {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDemoAuthenticated } = useDemoAuth();

  // Check for first visit only once on mount
  useEffect(() => {
    const tourCompleted = sessionStorage.getItem(TOUR_COMPLETED_KEY);
    const welcomeDismissed = sessionStorage.getItem(WELCOME_DISMISSED_KEY);
    
    if (!tourCompleted && !welcomeDismissed) {
      setIsFirstVisit(true);
    }
  }, []);

  // Show welcome dialog when on dashboard for first time AND user is authenticated
  useEffect(() => {
    if (isDemoAuthenticated && isFirstVisit && !isTourActive && location.pathname.startsWith('/dashboard')) {
      const welcomeDismissed = sessionStorage.getItem(WELCOME_DISMISSED_KEY);
      if (!welcomeDismissed) {
        setShowWelcome(true);
      }
    }
  }, [isDemoAuthenticated, isFirstVisit, isTourActive, location.pathname]);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setIsTourActive(true);
    setCurrentStep(0);
    // Navigate to first step's route
    if (TOUR_STEPS[0]?.route) {
      navigate(TOUR_STEPS[0].route);
    }
  }, [navigate]);

  const skipTour = useCallback(() => {
    setShowWelcome(false);
    setIsTourActive(false);
    sessionStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    sessionStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
  }, []);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    sessionStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextStepIndex = currentStep + 1;
      const nextStepData = TOUR_STEPS[nextStepIndex];
      
      setCurrentStep(nextStepIndex);
      
      // Navigate if needed
      if (nextStepData?.route && nextStepData.route !== location.pathname) {
        navigate(nextStepData.route);
      }
    } else {
      // Tour complete
      endTour();
    }
  }, [currentStep, location.pathname, navigate]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      const prevStepData = TOUR_STEPS[prevStepIndex];
      
      setCurrentStep(prevStepIndex);
      
      // Navigate if needed
      if (prevStepData?.route && prevStepData.route !== location.pathname) {
        navigate(prevStepData.route);
      }
    }
  }, [currentStep, location.pathname, navigate]);

  const endTour = useCallback(() => {
    setIsTourActive(false);
    setCurrentStep(0);
    sessionStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    sessionStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
    navigate('/dashboard');
  }, [navigate]);

  const currentStepData = isTourActive ? TOUR_STEPS[currentStep] : null;

  return (
    <TourContext.Provider
      value={{
        isFirstVisit,
        showWelcome,
        isTourActive,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        currentStepData,
        startTour,
        skipTour,
        nextStep,
        previousStep,
        endTour,
        dismissWelcome,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
