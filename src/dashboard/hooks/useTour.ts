import { createContext, useContext } from 'react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  /** Shown instead of `description` to people who can't change what the step describes. */
  readOnlyDescription?: string;
  targetSelector: string;
  route: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const TOUR_STEPS: TourStep[] = [
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
    description: 'Track every Post to Pay order from warehouse to feed. Search by creator and filter by stage or date.',
    targetSelector: '[data-tour-nav="gifts"]',
    route: '/dashboard/orders',
    position: 'right',
  },
  {
    id: 'posts-nav',
    title: 'Posts',
    description: 'Posts creators have made for your gifts, added as Vouch detects them, with views, engagement and CPM.',
    targetSelector: '[data-tour-nav="posts"]',
    route: '/dashboard/posts',
    position: 'right',
  },
  {
    id: 'influencers-nav',
    title: 'Creators',
    description: 'Everyone who has ordered with Post to Pay, and how their posts performed.',
    targetSelector: '[data-tour-nav="influencers"]',
    route: '/dashboard/influencers',
    position: 'right',
  },
  {
    id: 'analytics-nav',
    title: 'Analytics',
    description: 'Charts of your gifts, posts and creators over time, including spend and CPM. Audience details, where available, are on each creator\'s profile.',
    targetSelector: '[data-tour-nav="analytics"]',
    route: '/dashboard/analytics',
    position: 'right',
  },
  {
    id: 'settings-nav',
    title: 'Settings',
    description: 'Set your Post to Pay rules, brand details, reporting preferences and team.',
    readOnlyDescription: 'See your brand\'s Post to Pay rules and reporting preferences. Only owners and admins can change settings.',
    targetSelector: '[data-tour-nav="settings"]',
    route: '/dashboard/settings',
    position: 'right',
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

export const TourContext = createContext<TourContextType | undefined>(undefined);

/** The step text for this viewer: people who can't manage the brand get the read-only wording. */
export function tourStepDescription(step: TourStep, canManageBrand: boolean) {
  return !canManageBrand && step.readOnlyDescription ? step.readOnlyDescription : step.description;
}

// Remembered per user in localStorage, so the welcome is offered once per person and browser rather
// than in every new tab. Storage can be unavailable (private windows, blocked site data); the
// welcome then simply shows again, which is harmless.
const WELCOME_SEEN_PREFIX = 'vouch_welcome_seen:';
export const welcomeSeenKey = (userId: string) => `${WELCOME_SEEN_PREFIX}${userId}`;

export function hasSeenWelcome(userId: string) {
  try { return localStorage.getItem(welcomeSeenKey(userId)) === 'true'; } catch { return false; }
}

export function markWelcomeSeen(userId: string) {
  try { localStorage.setItem(welcomeSeenKey(userId), 'true'); } catch { /* shown again next time */ }
}

export function forgetWelcomeSeen(userId: string) {
  try { localStorage.removeItem(welcomeSeenKey(userId)); } catch { /* nothing to forget */ }
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
