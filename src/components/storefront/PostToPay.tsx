import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { AccountStats, ScannedPlatform, SocialPlatform } from '@/types/vouch';
import { AccountNotFoundError, DailyLimitError, lookupUsername } from '@/lib/accountLookup';
import { DEMO_FULL_DISCOUNT_FOLLOWERS, quote, type PostToPayQuote } from '@/lib/postToPayDiscount';
import { demoStore, money } from '@/lib/demoStore';
import terms from '@/content/post-to-pay-terms.txt?raw';
import iconWhite from '@/assets/vouch-icon-white.png';
import iconPeriwinkle from '@/assets/vouch-icon-periwinkle.png';
import './post-to-pay.css';
import './post-to-pay-demo.css';

// A React port of the live storefront block (Vouch-MVP-Production:
// extensions/vouch-post-to-pay/blocks/post-to-pay.liquid and assets/post-to-pay.css, copied
// verbatim). Markup, class names and wording follow the block so the shared stylesheet applies
// unchanged. Demo differences (roadmap mocks): more platforms, cart and checkout placements, ambassador codes;
// the discount follows the demo curve, and the account scan is the only live call. Checkout is simulated.

type Step = 'platform' | 'username' | 'approval' | 'offer' | 'added';
const PROGRESS: Step[] = ['platform', 'username', 'approval', 'offer'];

// Every platform on the roadmap. Only Instagram and TikTok are scanned (through Modash); the others
// accept any username at 100% off and say so (Henry, November 2, 2026).
const PLATFORMS: Record<SocialPlatform, { name: string; format: string; content: string; scanned: boolean }> = {
  instagram: { name: 'Instagram', format: 'Post or Reel', content: 'an Instagram post or Reel', scanned: true },
  tiktok: { name: 'TikTok', format: 'Video', content: 'a TikTok video', scanned: true },
  snapchat: { name: 'Snapchat', format: 'Story', content: 'a Snapchat Story', scanned: false },
  substack: { name: 'Substack', format: 'Post or Note', content: 'a Substack post or Note', scanned: false },
  x: { name: 'X', format: 'Post', content: 'a post on X', scanned: false },
  linkedin: { name: 'LinkedIn', format: 'Post', content: 'a LinkedIn post', scanned: false },
};

// Demo ambassador (affiliate) program: the shopper's followers get 10% off with their code, and they earn 10% of each order.
const AFFILIATE_PERCENT = 10;
const affiliateCode = (username: string) => `${username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)}${AFFILIATE_PERCENT}`;

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

interface Props {
  /** Product page: the item is added to the cart. Cart and checkout pages (roadmap): the offer covers the whole order. */
  placement: 'product' | 'cart' | 'checkout';
  /** What the offer covers, e.g. "Everyday Bottle · Slate · Quantity 1". */
  summary: string;
  priceCents: number;
}

interface Account {
  username: string;
  /** Null for platforms the demo doesn't scan. */
  stats: AccountStats | null;
}

export function PostToPay({ placement, summary, priceCents }: Props) {
  const wholeOrder = placement !== 'product';
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('platform');
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // Unscanned platforms get the full discount.
  const followers = account ? (account.stats?.followers ?? DEMO_FULL_DISCOUNT_FOLLOWERS) : 0;
  const offer: PostToPayQuote | null = account ? quote(followers, priceCents) : null;
  const added = offer && addedCount ? quote(followers, priceCents * addedCount) : null;
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
    if (next !== platform) {
      setAccount(null);
      setUsername('');
    }
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
        ? `We couldn’t find @${name} on ${info.name}. Check the username and try again.`
        : failure instanceof DailyLimitError
          ? 'Today’s demo account scans are used up. Try again tomorrow.'
          : 'Vouch is unavailable. Try again.');
    } finally {
      setBusy(false);
    }
  };

  // Only the product page adds to the cart here; the cart and checkout pages end at the Shopify hand-off.
  const accept = (event: FormEvent) => {
    event.preventDefault();
    setAddedCount((count) => count + 1);
    go('added');
  };

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard access can be refused; the code stays on screen to copy by hand.
    }
  };

  const qualified = !!offer && !addedCount;
  const launchLabel = !qualified ? 'Post to Pay' : {
    product: 'Add to cart with Post to Pay',
    cart: 'Check out with Post to Pay',
    checkout: 'Pay with Post to Pay',
  }[placement];
  const createCode = () => account && setCode(affiliateCode(account.username));

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

  // Ambassador code (roadmap): one compact, optional line on "You qualify!". The info tip explains the
  // terms (shown on hover or tap, like the block's key terms).
  const ambassador = (
    <div className="vouch-proof__ambassador">
      <PercentIcon size={16} />
      <span>
        {code ? <>Code <strong>{code}</strong> · emailed to you</> : <strong>Earn {AFFILIATE_PERCENT}% commission</strong>}
      </span>
      <details className="vouch-proof__info">
        <summary aria-label="About ambassador codes" aria-controls="vouch-ambassador"><InfoIcon /></summary>
      </details>
      <div className="vouch-proof__ambassador-tip" id="vouch-ambassador" role="note">
        <strong>Become a {demoStore.name} ambassador</strong>
        Anyone who uses your code gets {AFFILIATE_PERCENT}% off, and you earn {AFFILIATE_PERCENT}% of the resulting sales. We’ll email you your code.
      </div>
      <button type="button" onClick={code ? copyCode : createCode}>{code ? (copied ? 'Copied' : 'Copy') : 'Get code'}</button>
    </div>
  );

  return (
    <div
      className={placement === 'checkout' ? 'vouch-proof vouch-proof--express' : 'vouch-proof'}
      data-platform={platform}
      data-free-shipping={demoStore.freeExpressShipping ? '' : undefined}
    >
      <button
        type="button"
        className="vouch-proof__button vouch-proof__launch"
        hidden={open}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <img src={iconWhite} alt="" width={20} height={20} />
        <span>{launchLabel}</span>
      </button>
      <p className="vouch-proof__tagline">
        <strong>{qualified ? `Your discount: ${offer.percent}% off.` : 'Up to 100% off.'}</strong> Terms apply. Powered by Vouch
      </p>

      {open && (
        <section className="vouch-proof__panel" aria-label="Post to Pay">
          <header className="vouch-proof__header">
            <img className="vouch-proof__logo" src={iconPeriwinkle} alt="" width={20} height={20} />
            <span>Post to Pay</span>
            <button type="button" aria-label="Close Post to Pay" onClick={() => setOpen(false)}>×</button>
          </header>
          <div className="vouch-proof__body">
            <ol className="vouch-proof__progress" aria-label="Your progress">
              {PROGRESS.map((item, index) => (
                <li
                  key={item}
                  data-complete={PROGRESS.indexOf(step) > index ? '' : undefined}
                  aria-current={item === step ? 'step' : undefined}
                />
              ))}
            </ol>

            {step === 'platform' && (
              <div data-step="platform">
                <p className="vouch-proof__intro">Select where you'll post about your purchase</p>
                <div className="vouch-proof__platforms">
                  {(Object.keys(PLATFORMS) as SocialPlatform[]).map((id) => (
                    <button key={id} type="button" className="vouch-proof__platform" onClick={() => choose(id)}>
                      <PlatformIcon platform={id} />
                      <span><strong>{PLATFORMS[id].name}</strong><small>{PLATFORMS[id].format}</small></span>
                      <span className="vouch-proof__chevron" aria-hidden="true">›</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'username' && (
              <div data-step="username">
                <div className="vouch-proof__heading">
                  <PlatformIcon platform={platform} account />
                  <div><h3>Enter your {info.name} username</h3><p>We’ll do a quick scan of your profile</p></div>
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
              </div>
            )}

            {step === 'approval' && account && offer && (
              <div data-step="approval">
                <div className="vouch-proof__heading">
                  <span className="vouch-proof__avatar" aria-hidden="true">
                    <span>{account.username[0]}</span>
                    {account.stats?.profileImageUrl && (
                      <img src={account.stats.profileImageUrl} alt="" width={40} height={40} onError={(event) => event.currentTarget.removeAttribute('src')} />
                    )}
                  </span>
                  <div>
                    <h3 tabIndex={-1} ref={heading}>You qualify!</h3>
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
                  </div>
                </div>
                <Deal quote={offer} />
                <p className="vouch-proof__shipping vouch-proof__if-free-shipping"><TruckIcon />Includes free express shipping</p>
                <p className="vouch-proof__condition">Post about it on {info.name} within <strong>{demoStore.postingWindowDays} days of delivery</strong> to keep your discount.</p>
                {ambassador}
                <div className="vouch-proof__actions">
                  <button type="button" className="vouch-proof__secondary" onClick={() => go('username')}>← Back</button>
                  <button type="button" className="vouch-proof__primary" onClick={() => go('offer')}>Continue</button>
                </div>
              </div>
            )}

            {step === 'offer' && offer && (
              <div data-step="offer">
                <h3 tabIndex={-1} ref={heading}>How it works</h3>
                <p className="vouch-proof__explanation">{summary}. {{ product: 'This agreement covers every item you add with Post to Pay.', cart: 'This agreement covers your whole cart.', checkout: 'This agreement covers your whole order.' }[placement]}</p>
                <ol className="vouch-proof__steps">
                  <li>
                    <span className="vouch-proof__step-icon" aria-hidden="true"><CardIcon /></span>
                    <strong>Pay {money(offer.depositCents)} today</strong>
                    <span>
                      <span className="vouch-proof__if-free-shipping">Tax is calculated at Shopify checkout and isn’t charged today. Express shipping is included.</span>
                      <span className="vouch-proof__if-paid-shipping">Tax and shipping are calculated at Shopify checkout and aren’t charged today.</span>
                    </span>
                  </li>
                  <li>
                    <span className="vouch-proof__step-icon" aria-hidden="true"><CameraIcon /></span>
                    <strong>Post within {demoStore.postingWindowDays} days of delivery</strong>
                    <span>Show the product in {info.content} and tag <strong className="vouch-proof__handle">{handle}</strong> in the caption. We’ll email you how and when to post.</span>
                  </li>
                  <li>
                    <span className="vouch-proof__step-icon" aria-hidden="true"><TagIcon /></span>
                    <strong>Keep your {money(offer.balanceCents)} discount</strong>
                    <span>If you don’t post within {demoStore.postingWindowDays} days of delivery, {money(offer.balanceCents)} plus tax is charged.</span>
                  </li>
                </ol>
                <form onSubmit={accept}>
                  <label className="vouch-proof__consent">
                    <input type="checkbox" name="accepted" required />
                    <span>I agree to the Post to Pay Terms and confirm that I control the account I entered and can post from it. <span className="vouch-proof__required" aria-hidden="true">*</span></span>
                  </label>
                  <details className="vouch-proof__terms"><summary>Read the full purchase agreement</summary><p>{terms}</p></details>
                  <label className="vouch-proof__consent">
                    <input type="checkbox" name="contentRights" defaultChecked />
                    <span>I grant {demoStore.name} the rights to publish and promote the content I create for this order.</span>
                  </label>
                  {wholeOrder && handoffNote}
                  <div className="vouch-proof__actions">
                    <button type="button" className="vouch-proof__secondary" onClick={() => go('approval')}>← Back</button>
                    <button type="submit" className="vouch-proof__primary" disabled={wholeOrder}>{{ product: 'Add to cart', cart: 'Check out', checkout: 'Continue to payment' }[placement]}</button>
                  </div>
                </form>
              </div>
            )}

            {step === 'added' && added && (
              <div data-step="added">
                <div className="vouch-proof__heading">
                  <span className="vouch-proof__status-icon" aria-hidden="true" />
                  <div><h3 tabIndex={-1} ref={heading}>Added to your cart</h3><p>Your Post to Pay items</p></div>
                </div>
                <Deal quote={added} items={addedCount} />
                <p className="vouch-proof__explanation">Other items are full price.</p>
                {handoffNote}
                <div className="vouch-proof__actions">
                  <button type="button" className="vouch-proof__secondary" onClick={() => setOpen(false)}>Keep shopping</button>
                  <button type="button" className="vouch-proof__primary" disabled>Check out</button>
                </div>
              </div>
            )}

            {error && <p className="vouch-proof__error" role="alert">{error}</p>}

            <div className="vouch-proof__footnote">
              <span>Terms apply. Powered by Vouch</span>
              <details className="vouch-proof__info">
                <summary aria-label="Key terms" aria-controls="vouch-key-terms"><InfoIcon /></summary>
              </details>
              <div className="vouch-proof__key-terms" id="vouch-key-terms" role="note">
                <strong>Key terms</strong>
                <ol>
                  <li>Pay the discounted price today.</li>
                  <li>Post the product on your account before the deadline.</li>
                  <li>If you don’t post in time, the discount is dropped and the rest of your order total is charged.</li>
                  <li>You’ll see the full terms before you pay.</li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Deal({ quote: deal, items }: { quote: PostToPayQuote; items?: number }) {
  return (
    <dl className="vouch-proof__deal">
      <div><dt>Regular price{items ? ` (${items} item${items > 1 ? 's' : ''})` : ''}</dt><dd><s>{money(deal.priceCents)}</s></dd></div>
      <div className="vouch-proof__discount">
        <dt>Vouch discount <span className="vouch-proof__badge">{deal.percent}% off</span></dt>
        <dd>−{money(deal.balanceCents)}</dd>
      </div>
      <div className="vouch-proof__total"><dt>Your price</dt><dd>{money(deal.depositCents)}</dd></div>
    </dl>
  );
}

// The block's Instagram tile; post-to-pay-demo.css recolours it per platform through data-platform.
function PlatformIcon({ platform, account = false }: { platform: SocialPlatform; account?: boolean }) {
  const Icon = PLATFORM_ICONS[platform];
  return (
    <span className={account ? 'vouch-proof__account-icon' : 'vouch-proof__instagram'} data-platform={platform} aria-hidden="true">
      <Icon />
    </span>
  );
}

// Icons copied from the block's inline SVGs (Lucide), plus the other platforms' marks for the demo.
const Svg = ({ size, children, width = 2 }: { size: number; children: ReactNode; width?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const InstagramIcon = () => <Svg size={18} width={1.8}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></Svg>;
const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
);
const Mark = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
);
const XIcon = () => <Mark d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />;
const LinkedInIcon = () => <Mark d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452z" />;
const SubstackIcon = () => <Mark d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />;
const SnapchatIcon = () => <Svg size={18} width={1.8}><path d="M12 3a5 5 0 0 0-5 5v2.5l-1.8.6a.6.6 0 0 0 0 1.1l1.6.7c-.5 1.6-1.7 3-3.3 3.6.4.8 1.5 1 2.4 1.2l.4 1.3c1-.2 2-.2 2.9.3.9.5 1.7 1.2 2.8 1.2s1.9-.7 2.8-1.2c.9-.5 1.9-.5 2.9-.3l.4-1.3c.9-.2 2-.4 2.4-1.2-1.6-.6-2.8-2-3.3-3.6l1.6-.7a.6.6 0 0 0 0-1.1l-1.8-.6V8a5 5 0 0 0-5-5Z" /></Svg>;
const PLATFORM_ICONS: Record<SocialPlatform, () => JSX.Element> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  snapchat: SnapchatIcon,
  substack: SubstackIcon,
  x: XIcon,
  linkedin: LinkedInIcon,
};
const PercentIcon = ({ size = 20 }: { size?: number }) => <Svg size={size}><line x1="19" x2="5" y1="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></Svg>;
const FollowersIcon = () => <Svg size={14}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>;
const HeartIcon = () => <Svg size={14}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></Svg>;
const TruckIcon = () => <Svg size={16}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></Svg>;
const CardIcon = () => <Svg size={20}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></Svg>;
const CameraIcon = () => <Svg size={20}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></Svg>;
const TagIcon = () => <Svg size={20}><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /></Svg>;
const InfoIcon = () => <Svg size={16}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></Svg>;
