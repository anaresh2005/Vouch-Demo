import { useLocation } from 'react-router-dom';
import { SCENARIOS } from './scenarios';
import { previewScenario } from './fakeSupabase';

// Shown on every screen of the design preview so sample data is never mistaken for real data.
export default function PreviewBadge() {
  const { pathname } = useLocation();
  if (pathname === '/preview') return null;
  const scenario = SCENARIOS.find(s => s.id === previewScenario());
  return (
    <a
      href="/preview"
      className="fixed left-1/2 top-2 z-[100] md:bottom-3 md:top-auto max-w-[60vw] -translate-x-1/2 truncate rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background shadow-float"
    >
      Preview · sample data{scenario ? ` · ${scenario.label}` : ''} · All screens
    </a>
  );
}
