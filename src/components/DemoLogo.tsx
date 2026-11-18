import logo from '@/assets/vouch-logo-ink.svg';

// The Vouch logo (ink) with "DEMO" beside it, in all caps and Semi Bold to sit with the wordmark.
export function DemoLogo() {
  return (
    <span className="flex items-center gap-1.5">
      <img src={logo} alt="Vouch" className="h-4 w-auto" />
      <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-[#061b31]">Demo</span>
    </span>
  );
}
