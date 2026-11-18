import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SETTING_GROUPS, showSocialPopupNow, useVouchSettings } from '@/lib/demoSettings';
import { resetDemoState } from '@/lib/demoState';

// The demo's settings: switch each place Post to Pay appears in the store on or off.
export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [settings, set] = useVouchSettings();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="Demo settings"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'grid h-8 w-8 place-items-center rounded-md bg-card text-secondary-foreground shadow-edge hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25',
          open && 'bg-secondary',
        )}
      >
        <Settings className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 max-h-[calc(100vh-72px)] w-[320px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-lg bg-card shadow-float ring-1 ring-border animate-fade-in" role="dialog" aria-label="Demo settings">
          <div className="border-b border-divider px-4 py-3">
            <p className="text-base font-semibold text-heading">Where Vouch appears</p>
            <p className="text-xs text-muted-foreground">Turn each placement on or off in the store.</p>
          </div>
          {SETTING_GROUPS.map((group) => (
            <div key={group.title} role="group" aria-label={group.title} className="border-b border-divider px-4 py-3 last:border-b-0">
              <p className="mb-1 text-xs font-medium text-muted-foreground">{group.title}</p>
              {group.items.map((item) => (
                <label key={item.key} className="flex cursor-pointer items-start gap-3 py-1.5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">{item.hint}</span>
                  </span>
                  <Switch checked={settings[item.key]} onChange={(value) => set(item.key, value)} />
                </label>
              ))}
              {group.items.some((item) => item.key === 'socialPopup') && (
                <button type="button" onClick={() => { showSocialPopupNow(); setOpen(false); }} className="mt-1 text-sm font-medium text-primary hover:underline">
                  Show the popup now
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between bg-secondary px-4 py-3">
            <span className="text-xs text-muted-foreground">Resets the cart, settings and Post to Pay.</span>
            <button
              type="button"
              onClick={() => { resetDemoState(); setOpen(false); }}
              className="flex h-7 items-center gap-1.5 rounded-md bg-card px-2.5 text-sm font-medium text-secondary-foreground shadow-edge hover:bg-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <span className="relative mt-0.5 inline-flex shrink-0">
      <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <span className="h-5 w-9 rounded-full bg-[#d4dee9] transition-colors peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/25" aria-hidden="true" />
      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" aria-hidden="true" />
    </span>
  );
}
