import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import type { AccountStats, ScannedPlatform, SocialPlatform } from '@/types/vouch';
import { AccountNotFoundError, DailyLimitError, lookupUsername } from '@/lib/accountLookup';
import { DEMO_FULL_DISCOUNT_FOLLOWERS, quote, type PostToPayQuote } from '@/lib/postToPayDiscount';
import { demoStore, money } from '@/lib/demoStore';
import { useCart, useVouchAccount } from '@/lib/storeState';
import terms from '@/content/post-to-pay-terms.txt?raw';
import logo from '@/assets/vouch-logo-gradient.svg';
import { PlatformMark } from './platformMarks';
import './post-to-pay.css';

// The Post to Pay button and panel as redesigned in Figma ("Vouch Branding (Revamped)", Post to Pay
// page, November 2026): gradient button with the platform icons cycling, gradient logo header,
// 3-by-3 platform picker, "You're in" price box, the shorter How it works, and "Claimed" with the
// email note. This is ahead of the live block (Vouch-MVP-Production), which still has the October
// design. Demo differences (roadmap mocks): nine platforms, cart and checkout placements and
// ambassador codes; the discount follows the demo curve, the account scan is the only live call,
// and the demo stops where the live product hands off to Shopify checkout.

type Step = 'platform' | 'username' | 'approval' | 'offer' | 'added';
const PROGRESS: Step[] = ['platform', 'username', 'approval', 'offer'];

// Every platform on the roadmap, in the button's cycle order. Only Instagram and TikTok are scanned
// (through Modash); the others accept any username at 100% off and say so (Henry, November 2, 2026).
// `create` is what the shopper posts, shown in the posting condition on "You're in".
export const PLATFORMS: Record<SocialPlatform, { name: string; create: string; scanned: boolean }> = {
  instagram: { name: 'Instagram', create: 'a post, Reel, or Story', scanned: true },
  tiktok: { name: 'TikTok', create: 'a TikTok video', scanned: true },
  snapchat: { name: 'Snapchat', create: 'a Snapchat Story', scanned: false },
  youtube: { name: 'YouTube', create: 'a YouTube video or Short', scanned: false },
  x: { name: 'X', create: 'a post on X', scanned: false },
  facebook: { name: 'Facebook', create: 'a Facebook post or Reel', scanned: false },
  pinterest: { name: 'Pinterest', create: 'a Pin', scanned: false },
  linkedin: { name: 'LinkedIn', create: 'a LinkedIn post', scanned: false },
  substack: { name: 'Substack', create: 'a Substack post or Note', scanned: false },
};
export const PLATFORM_ORDER = Object.keys(PLATFORMS) as SocialPlatform[];

// Demo ambassador (affiliate) program: anyone who uses the shopper's code gets 10% off, and the
// shopper earns 10% of those sales. The code is emailed after checkout, never shown before it.
const AFFILIATE_PERCENT = 10;

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

interface Props {
  /** Product page: the item is added to the cart. Cart and checkout pages (roadmap): the offer covers the whole order. */
  placement: 'product' | 'cart' | 'checkout';
  priceCents: number;
  /** On a product page: what "Add to cart" adds. */
  item?: { handle: string; variantId: string };
  /** On the cart page: one row per item in "You're in", in place of "Regular price". */
  lines?: { label: string; cents: number }[];
  /** In the popup: the panel alone, open from the start, with no launch button. */
  embedded?: { step: Step; platform?: SocialPlatform; onClose: () => void };
}

export function PostToPay({ placement, priceCents, item, lines, embedded }: Props) {
  const wholeOrder = placement !== 'product';
  const { account: sharedAccount, setAccount: setSharedAccount } = useVouchAccount();
  const cart = useCart();
  const [open, setOpenState] = useState(!!embedded);
  // A shopper who already qualified (here or in another surface) starts at their result.
  const [step, setStep] = useState<Step>(() => (embedded?.platform ? 'username' : sharedAccount && !embedded ? 'approval' : embedded?.step ?? 'platform'));
  const [platform, setPlatform] = useState<SocialPlatform>(embedded?.platform ?? sharedAccount?.platform ?? 'instagram');
  const chosen = !!sharedAccount;
  const [username, setUsername] = useState(embedded?.platform && embedded.platform !== sharedAccount?.platform ? '' : sharedAccount?.username ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const account = sharedAccount && sharedAccount.platform === platform ? sharedAccount : null;
  const setAccount = (next: { username: string; stats: AccountStats | null } | null) => setSharedAccount(next && { platform, ...next });
  const setOpen = (value: boolean) => {
    if (!value && embedded) embedded.onClose();
    else setOpenState(value);
  };
  const [addedCount, setAddedCount] = useState(0);
  const [codeRequested, setCodeRequested] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // Unscanned platforms get the full discount.
  const followers = account ? (account.stats?.followers ?? DEMO_FULL_DISCOUNT_FOLLOWERS) : 0;
  const offer: PostToPayQuote | null = account ? quote(followers, priceCents) : null;
  const added = offer && addedCount ? quote(followers, priceCents * addedCount) : null;
  const shippingCents = demoStore.freeExpressShipping ? demoStore.expressShippingCents : 0;
  const info = PLATFORMS[platform];
  const handle = `@${demoStore.handle}`;

  // Each step moves focus to its title (or the username field), as the live block does. Elements
  // can't take focus while their entrance animation still hides them, so wait for it to finish.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => (step === 'username' ? input.current : heading.current)?.focus(), 300);
    return () => clearTimeout(timer);
  }, [open, step]);

  const go = (next: Step) => {
    setError('');
    setStep(next);
  };

  const choose = (next: SocialPlatform) => {
    if (next !== sharedAccount?.platform) setUsername('');
    else setUsername(sharedAccount.username);
    setPlatform(next);
    go('username');
  };

  const check = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const name = username.replace(/^@/, '').trim();
    if (!info.scanned) {
      setAccount({ username: name.toLowerCase(), stats: null });
      go('approval');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const stats = await lookupUsername(name, platform as ScannedPlatform);
      setAccount({ username: name.toLowerCase(), stats });
      go('approval');
    } catch (failure) {
      setError(failure instanceof AccountNotFoundError
        ? `Hmm, we can’t find @${name}. Could there be a typo?`
        : failure instanceof DailyLimitError
          ? 'You’ve reached today’s limit for account checks. Please try again later.'
          : 'Something went wrong. Please try again later.');
    } finally {
      setBusy(false);
    }
  };

  // Only the product page adds to the cart here; the cart and checkout pages end at the Shopify hand-off.
  const accept = (event: FormEvent) => {
    event.preventDefault();
    if (item) cart.add(item.handle, item.variantId);
    setAddedCount((count) => count + 1);
    go('added');
  };

  // The express tile is half width, so it keeps the label short.
  const launchLabel = !offer ? 'Post to Pay' : placement === 'checkout' ? `${offer.percent}% OFF` : `${offer.percent}% OFF with Post to Pay`;

  // The demo ends where the live product hands off to Shopify checkout for the card (Aneesh's review and
  // Henry, November 3): the button stays in view but can't be clicked, and this note says why.
  const handoffNote = (
    <p className="vouch-proof__demo-note" role="note">
      <strong>Demo only:</strong>{' '}
      {placement === 'checkout'
        ? 'in the live product, the shopper enters their card in the payment form below to place the order. The demo ends here.'
        : 'in the live product, “Check out” opens checkout, where the shopper enters their card and places the order. The demo ends here.'}
    </p>
  );

  const emails = (
    <><strong>Check your email</strong> after checkout for post ideas, reminders, and your optional affiliate code.</>
  );

  const eligibility = (
    <div className="vouch-proof__footnote">
      <span>Applies to all eligible items in cart</span>
      <Tip label="What's eligible" id="vouch-eligible">
        Post to Pay covers one-time purchases. Subscriptions and backorders aren’t eligible.
      </Tip>
    </div>
  );

  const profile = account && (
    <p className="vouch-proof__stats">
      <span data-profile-name>@{account.username}</span>
      {account.stats ? (
        <>
          <span title="Followers"><FollowersIcon /><span className="vouch-proof__sr-only">Followers: </span>{compact.format(account.stats.followers)}</span>
          {account.stats.engagementRate > 0 && (
            <span title="Engagement rate"><HeartIcon /><span className="vouch-proof__sr-only">Engagement rate: </span>{account.stats.engagementRate}%</span>
          )}
        </>
      ) : (
        <span>Not scanned in this demo</span>
      )}
    </p>
  );

  return (
    <div className={embedded ? 'vouch-proof vouch-proof--embedded' : placement === 'checkout' ? 'vouch-proof vouch-proof--express' : 'vouch-proof'}>
      {!embedded && <>
      <button
        type="button"
        className="vouch-proof__button vouch-proof__launch"
        hidden={open}
        aria-expanded={open}
        onClick={() => {
          // Qualified elsewhere in the store (another page, the popup): open at the result.
          if (sharedAccount && step === 'platform') {
            setPlatform(sharedAccount.platform);
            setUsername(sharedAccount.username);
            setStep('approval');
          }
          setOpen(true);
        }}
      >
        <CyclingMark platforms={chosen ? [platform] : PLATFORM_ORDER} />
        <span>{launchLabel}</span>
      </button>
      <p className="vouch-proof__tagline">
        {!offer && <><strong>Up to 100% off.</strong> </>}Terms apply. Powered by Vouch
      </p>
      </>}

      {open && (
        <section className="vouch-proof__panel" aria-label="Post to Pay">
          <header className="vouch-proof__header">
            <img className="vouch-proof__logo" src={logo} alt="Vouch" width={84} height={18} />
            <button type="button" aria-label="Close Post to Pay" onClick={() => setOpen(false)}>×</button>
          </header>
          <div className="vouch-proof__body">
            {step !== 'added' && (
              <ol className="vouch-proof__progress" aria-label="Your progress">
                {PROGRESS.map((item, index) => (
                  <li
                    key={item}
                    style={{ '--i': index } as CSSProperties}
                    data-complete={PROGRESS.indexOf(step) >= index ? '' : undefined}
                    aria-current={item === step ? 'step' : undefined}
                  />
                ))}
              </ol>
            )}

            {step === 'platform' && (
              <div data-step="platform">
                <p className="vouch-proof__intro">Select where you'll post about your purchase</p>
                <div className="vouch-proof__platforms">
                  {PLATFORM_ORDER.map((id) => (
                    <button key={id} type="button" className="vouch-proof__platform" onClick={() => choose(id)}>
                      <span className="vouch-proof__platform-icon"><PlatformMark platform={id} /></span>
                      <span>{PLATFORMS[id].name}</span>
                    </button>
                  ))}
                </div>
                <div className="vouch-proof__footnote vouch-proof__footnote--split">
                  <span className="vouch-proof__footnote-terms">
                    <span>Terms apply</span>
                    <Tip label="Key terms" id="vouch-key-terms">
                      <strong>Key terms</strong>
                      <ol>
                        <li>Pay the discounted price today.</li>
                        <li>Post the product on your account before the deadline.</li>
                        <li>If you don’t post in time, the discount is dropped and the rest of your order total is charged.</li>
                        <li>You’ll see the full terms before you pay.</li>
                      </ol>
                    </Tip>
                  </span>
                  <Tip label="What is Vouch?" id="vouch-about" text>
                    Vouch lets you pay less by posting about what you buy. Pay the discounted price today, then post before the deadline to keep your discount.
                  </Tip>
                </div>
              </div>
            )}

            {step === 'username' && (
              <div data-step="username">
                <div className="vouch-proof__heading">
                  <PlatformMark platform={platform} />
                  <div><h3>Enter your {info.name} username</h3><p>See your discount in seconds. Up to 100% off.</p></div>
                </div>
                <form onSubmit={check}>
                  <label className="vouch-proof__sr-only" htmlFor="vouch-username">{info.name} username</label>
                  <div className="vouch-proof__input-wrap">
                    <span aria-hidden="true">@</span>
                    <input
                      ref={input}
                      id="vouch-username"
                      name="username"
                      type="text"
                      placeholder="your_username"
                      maxLength={31}
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      disabled={busy}
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                    />
                  </div>
                  <p className="vouch-proof__requirements-label" id="vouch-checks">What Vouch checks:</p>
                  <div className="vouch-proof__requirements" aria-labelledby="vouch-checks">
                    <span>Followers</span>
                    <span>Engagement</span>
                    <span>Public profile</span>
                    <span>Human account</span>
                  </div>
                  {!info.scanned && (
                    <p className="vouch-proof__demo-note" role="note">
                      <strong>Demo only:</strong> {info.name} accounts aren’t scanned in this demo. Any username continues with 100% off.
                    </p>
                  )}
                  <div className="vouch-proof__actions">
                    <button type="button" className="vouch-proof__secondary" disabled={busy} onClick={() => go('platform')}>← Back</button>
                    <button type="submit" className="vouch-proof__primary" data-check disabled={busy}>{info.scanned ? 'Check account' : 'Continue'}</button>
                  </div>
                  <p className="vouch-proof__sr-only" role="status">{busy ? `Checking your ${info.name} account…` : ''}</p>
                </form>
                {error && <p className="vouch-proof__error" role="alert">{error}</p>}
              </div>
            )}

            {step === 'approval' && account && offer && (
              <div data-step="approval">
                <div className="vouch-proof__heading vouch-proof__heading--profile">
                  <Avatar stats={account.stats} />
                  <div>
                    <h3 tabIndex={-1} ref={heading}>You’re in: {offer.percent}% off for one post</h3>
                    {profile}
                  </div>
                </div>
                <div className="vouch-proof__card">
                  <PlatformMark platform={platform} />
                  <p>Create {info.create} within <strong>{demoStore.postingWindowDays} days of delivery</strong> to keep your discount</p>
                </div>
                <dl className="vouch-proof__deal">
                  {lines?.length ? <LineRows lines={lines} /> : <div><dt>Regular price</dt><dd>{money(offer.priceCents)}</dd></div>}
                  {shippingCents > 0 && <div><dt>Express shipping</dt><dd>{money(shippingCents)}</dd></div>}
                  <div className="vouch-proof__discount vouch-proof__group">
                    <dt>Vouch discount <span className="vouch-proof__badge">{offer.percent}% off</span></dt>
                    <dd>−{money(offer.balanceCents)}</dd>
                  </div>
                  {shippingCents > 0 && (
                    <div className="vouch-proof__discount">
                      <dt>Express shipping <span className="vouch-proof__badge">Free</span></dt>
                      <dd>−{money(shippingCents)}</dd>
                    </div>
                  )}
                  <div className="vouch-proof__total vouch-proof__group">
                    <dt>Your price</dt>
                    <dd><s>{money(offer.priceCents + shippingCents)}</s>{money(offer.depositCents)}</dd>
                  </div>
                </dl>
                <div className="vouch-proof__ambassador">
                  <GiftIcon />
                  <span className={codeRequested ? 'vouch-proof__ambassador-sent' : undefined}>
                    {codeRequested ? 'You’ll receive your code via email after checkout' : `Friends get ${AFFILIATE_PERCENT}% off, you earn ${AFFILIATE_PERCENT}%`}
                  </span>
                  <Tip label="About ambassador codes" id="vouch-ambassador">
                    <strong>Become a {demoStore.name} ambassador</strong>
                    Anyone who uses your code gets {AFFILIATE_PERCENT}% off, and you earn {AFFILIATE_PERCENT}% of those sales. We’ll email your code after checkout.
                  </Tip>
                  {!codeRequested && <button type="button" onClick={() => setCodeRequested(true)}>Reveal code</button>}
                </div>
                <div className="vouch-proof__actions">
                  <button type="button" className="vouch-proof__secondary" onClick={() => go('username')}>← Back</button>
                  <button type="button" className="vouch-proof__primary" onClick={() => go('offer')}>Continue</button>
                </div>
              </div>
            )}

            {step === 'offer' && offer && (
              <div data-step="offer">
                <div className="vouch-proof__pay">
                  <h3 tabIndex={-1} ref={heading}>Pay {money(offer.depositCents)} today</h3>
                  <p>Tax is added at checkout.</p>
                </div>
                {wholeOrder && <p className="vouch-proof__emails"><MailIcon size={16} /><span>{emails}</span></p>}
                <div className="vouch-proof__card">
                  <PlatformMark platform={platform} />
                  <p>Post within <strong>{demoStore.postingWindowDays} days of delivery</strong> and tag <strong className="vouch-proof__handle">{handle}</strong></p>
                </div>
                <div className="vouch-proof__outcomes">
                  <div data-outcome="kept"><span>Post in time</span><strong>Keep your discount</strong></div>
                  <div data-outcome="charged"><span>Don’t post</span><strong>Pay {money(offer.balanceCents)} + tax</strong></div>
                </div>
                <form onSubmit={accept}>
                  <div className="vouch-proof__agreements">
                    <label className="vouch-proof__consent">
                      <input type="checkbox" name="accepted" required />
                      <span>
                        I agree to the{' '}
                        <button
                          type="button"
                          className="vouch-proof__terms-link"
                          aria-expanded={termsOpen}
                          aria-controls="vouch-terms"
                          onClick={(event) => { event.preventDefault(); setTermsOpen((value) => !value); }}
                        >
                          Post to Pay Terms
                        </button>{' '}
                        <span className="vouch-proof__required" aria-hidden="true">*</span>
                      </span>
                    </label>
                    {termsOpen && <p className="vouch-proof__terms" id="vouch-terms">{terms}</p>}
                    <label className="vouch-proof__consent">
                      <input type="checkbox" name="contentRights" defaultChecked />
                      <span>{demoStore.name} can reshare and promote my post.</span>
                    </label>
                  </div>
                  {wholeOrder && handoffNote}
                  <div className="vouch-proof__actions">
                    <button type="button" className="vouch-proof__secondary" onClick={() => go('approval')}>← Back</button>
                    <button type="submit" className="vouch-proof__primary" disabled={wholeOrder}>{{ product: 'Add to cart', cart: 'Check out', checkout: 'Continue to payment' }[placement]}</button>
                  </div>
                </form>
                {wholeOrder && eligibility}
              </div>
            )}

            {step === 'added' && added && account && (
              <div data-step="added">
                <div className="vouch-proof__heading vouch-proof__heading--profile">
                  <Avatar stats={account.stats} />
                  <div>
                    <h3 tabIndex={-1} ref={heading}>Claimed: {added.percent}% off for one post</h3>
                    {profile}
                  </div>
                </div>
                <dl className="vouch-proof__deal">
                  <div><dt>Regular total</dt><dd><s>{money(added.priceCents + shippingCents)}</s></dd></div>
                  <div className="vouch-proof__discount vouch-proof__group"><dt>Vouch savings</dt><dd>−{money(added.balanceCents + shippingCents)}</dd></div>
                  <div className="vouch-proof__total vouch-proof__group"><dt>Your total</dt><dd>{money(added.depositCents)}</dd></div>
                </dl>
                <div className="vouch-proof__card vouch-proof__card--mail">
                  <MailIcon size={22} />
                  <p>{emails}</p>
                </div>
                {handoffNote}
                <div className="vouch-proof__actions">
                  <button type="button" className="vouch-proof__secondary" onClick={() => setOpen(false)}>Keep shopping</button>
                  <button type="button" className="vouch-proof__primary" disabled>Check out</button>
                </div>
                {eligibility}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// Cart items in "You're in": the first three, then "+ N more items" with their total, which expands.
function LineRows({ lines }: { lines: { label: string; cents: number }[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded || lines.length <= 3 ? lines : lines.slice(0, 3);
  const rest = lines.slice(3);
  return (
    <>
      {shown.map((line, index) => <div key={index}><dt>{line.label}</dt><dd>{money(line.cents)}</dd></div>)}
      {!expanded && rest.length > 0 && (
        <div>
          <dt><button type="button" className="vouch-proof__more" onClick={() => setExpanded(true)}>+ {rest.length} more {rest.length === 1 ? 'item' : 'items'}</button></dt>
          <dd>{money(rest.reduce((sum, line) => sum + line.cents, 0))}</dd>
        </div>
      )}
    </>
  );
}

// An info icon (or a text link) that shows a short note in place, on hover or tap, so it never takes
// the shopper off the page (Aneesh's question about "What is Vouch?", November 15).
function Tip({ label, id, text = false, children }: { label: string; id: string; text?: boolean; children: ReactNode }) {
  return (
    <span className="vouch-proof__tip">
      <details className={text ? 'vouch-proof__info vouch-proof__info--text' : 'vouch-proof__info'}>
        <summary aria-label={text ? undefined : label} aria-controls={id}>{text ? label : <InfoIcon />}</summary>
      </details>
      <span className="vouch-proof__popover" id={id} role="note">{children}</span>
    </span>
  );
}

function Avatar({ stats }: { stats: AccountStats | null }) {
  return (
    <span className="vouch-proof__avatar" aria-hidden="true">
      <PersonIcon />
      {stats?.profileImageUrl && (
        <img src={stats.profileImageUrl} alt="" width={40} height={40} onError={(event) => event.currentTarget.removeAttribute('src')} />
      )}
    </span>
  );
}

// The launch button's icon: the accepted platforms take turns, each sliding in on a slight arc
// (Henry's timing, November 15: hold 2.5 s, swap 450 ms, 3 px arc). It keeps cycling on hover.
// Once a platform is chosen, only that one shows. Reduced motion shows the first icon, still.
const HOLD_MS = 2500;
const SWAP_MS = 450;
const ARC_PX = 3;
const TRAVEL_PX = 30;

function CyclingMark({ platforms }: { platforms: SocialPlatform[] }) {
  // Each tick moves to the next platform; tick 0 shows the first with nothing leaving.
  const [tick, setTick] = useState(0);
  const incoming = useRef<HTMLSpanElement>(null);
  const outgoing = useRef<HTMLSpanElement>(null);
  const count = platforms.length;
  const index = tick % count;
  const previous = tick > 0 ? (tick - 1) % count : null;

  useEffect(() => {
    setTick(0);
    if (count < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setTick((value) => value + 1), HOLD_MS + SWAP_MS);
    return () => clearInterval(timer);
  }, [count]);

  useEffect(() => {
    if (previous === null) return;
    const timing = { duration: SWAP_MS, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' as const };
    outgoing.current?.animate([
      { transform: 'translate(0,0)', opacity: 1 },
      { transform: `translate(${-ARC_PX * 0.6}px, ${TRAVEL_PX * 0.45}px)`, opacity: 0.6, offset: 0.5 },
      { transform: `translate(${-ARC_PX}px, ${TRAVEL_PX}px)`, opacity: 0 },
    ], timing);
    incoming.current?.animate([
      { transform: `translate(${-ARC_PX}px, ${-TRAVEL_PX}px)`, opacity: 0 },
      { transform: `translate(${-ARC_PX * 0.6}px, ${-TRAVEL_PX * 0.45}px)`, opacity: 0.6, offset: 0.5 },
      { transform: 'translate(0,0)', opacity: 1 },
    ], timing);
  }, [tick, previous]);

  return (
    <span className="vouch-proof__slot" aria-hidden="true">
      {previous !== null && (
        <span key={`out-${tick}`} ref={outgoing}><PlatformMark platform={platforms[previous]} size={18} white /></span>
      )}
      <span key={`in-${tick}`} ref={incoming}><PlatformMark platform={platforms[index]} size={18} white /></span>
    </span>
  );
}

// Icons (Lucide), drawn at 2px on a 24px grid and scaled with the icon.
const Svg = ({ size, children }: { size: number; children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const FollowersIcon = () => <Svg size={14}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>;
const HeartIcon = () => <Svg size={14}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></Svg>;
const GiftIcon = () => <Svg size={16}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" /></Svg>;
const MailIcon = ({ size }: { size: number }) => <Svg size={size}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></Svg>;
const InfoIcon = () => <Svg size={16}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></Svg>;
const PersonIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><circle cx="20" cy="15" r="7" /><path d="M6 36c1.5-7 7.2-11 14-11s12.5 4 14 11a19.9 19.9 0 0 1-28 0Z" /></svg>
);
