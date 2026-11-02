import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROADMAP } from '@/lib/roadmap';
import { cn } from '@/lib/utils';
import logo from '@/assets/vouch-logo-periwinkle.png';

// The development timeline: what's live, what the demo shows, and what comes next.
export default function Roadmap() {
  return (
    <div className="min-h-screen bg-card">
      <header className="sticky top-0 z-30 bg-card shadow-[inset_0_-1px_0_hsl(var(--divider))]">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-3 px-4">
          <img src={logo} alt="Vouch" className="h-5 w-auto" />
          <Link
            to="/checkout"
            className="ml-auto flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-secondary-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to demo
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-4 pb-16 pt-8 sm:pt-10">
        <h1 className="text-title text-heading">Development timeline</h1>
        <p className="mt-2 text-sm text-body">What Vouch does today, what the shopper demo shows, and what comes next.</p>

        <ol className="mt-8">
          {ROADMAP.map((phase, index) => (
            <li key={phase.title} className="relative pb-8 pl-8 last:pb-0">
              {index < ROADMAP.length - 1 && <span className="absolute bottom-0 left-[7px] top-5 w-0.5 bg-divider" aria-hidden="true" />}
              <span
                className={cn(
                  'absolute left-0 top-1 h-4 w-4 rounded-full ring-4 ring-card',
                  phase.live ? 'bg-success' : 'bg-card shadow-[inset_0_0_0_2px_hsl(var(--primary))]',
                )}
                aria-hidden="true"
              />
              <h2 className="text-base font-semibold text-heading">{phase.title}</h2>
              <ul className="mt-3 divide-y divide-divider overflow-hidden rounded-lg shadow-edge">
                {phase.items.map((item) => (
                  <li key={item.title} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <span
                        className={cn(
                          'inline-flex h-5 items-center rounded-sm px-1.5 text-xs font-semibold',
                          item.inDemo ? 'bg-info-bg text-info shadow-[0_0_0_1px_hsl(var(--info-border))]' : 'bg-neutral-bg text-neutral shadow-[0_0_0_1px_hsl(var(--neutral-border))]',
                        )}
                      >
                        {item.inDemo ? 'In the demo' : 'Not in the demo'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
