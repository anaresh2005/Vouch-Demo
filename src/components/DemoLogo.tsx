import logo from '@/assets/vouch-logo-ink.svg';

// The Vouch logo (ink) with "DEMO" beside it, in all caps and Semi Bold to sit with the wordmark.
export function DemoLogo() {
  return (
    <span className="flex items-center gap-2">
      <img src={logo} alt="Vouch" className="h-5 w-auto" />
      <span className="text-[13px] font-semibold uppercase leading-none tracking-[0.08em] text-[#061b31]">Demo</span>
    </span>
  );
}
