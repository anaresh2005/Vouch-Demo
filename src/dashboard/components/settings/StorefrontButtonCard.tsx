import { useState, type FormEvent } from 'react';
import { AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { Button } from '@dashboard/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dashboard/components/ui/card';
import { Input } from '@dashboard/components/ui/input';
import { Switch } from '@dashboard/components/ui/switch';
import { useToast } from '@dashboard/hooks/use-toast';
import { useSaveStorefrontButton } from '@dashboard/hooks/useBrandData';
import { useShopifyConnection } from '@dashboard/hooks/useShopifyConnection';
import { checkoutRequest } from '@dashboard/lib/checkoutApi';
import { useUnsavedChangesWarning } from '@dashboard/hooks/useUnsavedChangesWarning';
import {
  BUTTON_CORNERS, BUTTON_PAGES, BUTTON_SIZES, buttonFromBrand, buttonSize, cornerRadius, hardToSeeOnWhite, MAX_RADIUS, normalizeHex, sameButton, TEXT_COLORS,
  textHardToRead, tidyButton, usesVouchColor, validateButton, VOUCH_COLOR, type ButtonCorners, type ButtonPage, type ButtonText,
} from '@dashboard/lib/storefrontButton';
import { activateCartEmbedUrl, addPostToPayBlockUrl } from '@dashboard/lib/storefrontDeepLink';
import type { Brand } from '@dashboard/types/vouch';
// The storefront button's own icon, so the preview shows exactly what shoppers see.
import vouchIcon from '@dashboard/assets/vouch-icon-white.svg';
import vouchLogo from '@dashboard/assets/vouch-icon-periwinkle.svg';
import { UnsavedHint } from './UnsavedHint';

// Everything saved here reaches the storefront: the on/off switch (admin switches, October 8), the look
// (October 8) and the Product pages box (October 12). The cart page isn't built yet and says so.
const SAVED_NOTE = 'Your store uses these settings once saved.';

const checkboxClass = 'mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]';

/** Whether Post to Pay takes orders, where its button appears, and how the button and checkout flow look. */
export function StorefrontButtonCard({ brand, readOnly }: { brand: Brand; readOnly: boolean }) {
  const [draft, setDraft] = useState(() => buttonFromBrand(brand));
  // What was last saved, so the form knows when it has unsaved edits.
  const [lastSaved, setLastSaved] = useState(draft);
  const dirty = !readOnly && !sameButton(tidyButton(draft), lastSaved);
  useUnsavedChangesWarning(dirty);
  const [problem, setProblem] = useState<string | null>(null);
  const save = useSaveStorefrontButton();
  const { toast } = useToast();
  // A failed button update is retried on the next save, even one with no changes.
  const [syncPending, setSyncPending] = useState(false);
  // Managers get a link that adds the block to the product page, through the app the store connected with.
  const { data: shopify } = useShopifyConnection(!readOnly);
  const addBlockUrl = shopify?.state === 'connected' ? addPostToPayBlockUrl(shopify.connection?.shop_domain, shopify.connection?.app_client_id) : null;
  const cartEmbedUrl = shopify?.state === 'connected' ? activateCartEmbedUrl(shopify.connection?.shop_domain, shopify.connection?.app_client_id) : null;

  // While a hex code is half typed, the preview keeps the last complete colour.
  const color = normalizeHex(draft.button_color);
  const [shown, setShown] = useState(color ?? VOUCH_COLOR);
  const previewColor = color ?? shown;
  const radius = cornerRadius(draft);
  const size = buttonSize(draft.button_size);
  // Custom starts from the 6px the button falls back to today, ready to adjust.
  const setCorners = (value: ButtonCorners) => setDraft({ ...draft, button_corners: value, button_radius: value === 'custom' ? draft.button_radius ?? 6 : null });
  const setColor = (value: string) => {
    setDraft({ ...draft, button_color: value });
    const next = normalizeHex(value);
    if (next) setShown(next);
  };
  const togglePage = (page: ButtonPage, on: boolean) =>
    setDraft({ ...draft, button_pages: on ? [...draft.button_pages, page] : draft.button_pages.filter(p => p !== page) });

  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateButton(draft);
    setProblem(invalid);
    if (invalid) return;
    try {
      const saved = buttonFromBrand(await save.mutateAsync({ brandId: brand.id, button: draft }));
      // The on/off switch, the pages and the button's look are sent to the storefront.
      const switched = (['accepting_orders', 'button_color', 'button_text', 'button_corners', 'button_radius', 'button_size'] as const)
        .some(key => saved[key] !== lastSaved[key]) || saved.button_pages.join() !== lastSaved.button_pages.join();
      setDraft(saved);
      setLastSaved(saved);
      // Checkout follows the saved on/off switch even if the storefront button can't be updated right away.
      let buttonUpdated = true;
      if (switched || syncPending) buttonUpdated = await checkoutRequest('sync_storefront').then(() => true, () => false);
      setSyncPending(!buttonUpdated);
      toast(buttonUpdated
        ? { title: 'Button settings saved', description: SAVED_NOTE }
        : { title: 'Button settings saved', description: 'Your store’s button couldn’t be updated yet. Checkout already follows your on/off choice.' });
    } catch {
      // Shown beside the save button; the draft is kept for retry.
    }
  }

  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader><CardTitle className="text-sm">Display settings</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <p role="note" className="text-sm text-muted-foreground">{SAVED_NOTE}</p>
          <fieldset disabled={readOnly || save.isPending} className="space-y-8">
            <div className="flex items-start justify-between gap-4 rounded-lg p-4 shadow-edge">
              <div>
                <label htmlFor="acceptingOrders" className="cursor-pointer text-sm font-medium text-foreground">Accept Post to Pay orders</label>
                <p id="acceptingOrders-description" className="mt-0.5 text-sm text-muted-foreground">
                  When off, the Post to Pay button is hidden everywhere and new Post to Pay orders can’t be placed. Orders already placed continue as agreed.
                </p>
              </div>
              <Switch id="acceptingOrders" checked={draft.accepting_orders} aria-describedby="acceptingOrders-description"
                onCheckedChange={on => setDraft({ ...draft, accepting_orders: on })} />
            </div>

            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-medium text-foreground">Where the button appears</legend>
              {BUTTON_PAGES.map(page => (
                <div key={page.value} className="flex items-start gap-3">
                  <input id={`buttonPage-${page.value}`} type="checkbox" className={checkboxClass} checked={draft.button_pages.includes(page.value)}
                    aria-describedby={page.note ? `buttonPage-${page.value}-note` : undefined} onChange={e => togglePage(page.value, e.target.checked)} />
                  <div>
                    <label htmlFor={`buttonPage-${page.value}`} className="cursor-pointer text-sm font-medium text-foreground">{page.label}</label>
                    {page.note && <p id={`buttonPage-${page.value}-note`} className="text-sm text-muted-foreground">{page.note}</p>}
                    {/* The theme editor link (owner decision, October 12). Vouch can't tell whether the block was saved. */}
                    {page.value === 'product' && addBlockUrl && draft.button_pages.includes('product') && <>
                      <a href={addBlockUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
                        Add to product page<ExternalLink aria-hidden="true" className="h-3 w-3" />
                      </a>
                      <p className="text-sm text-muted-foreground">Opens Shopify’s theme editor with the button added. Click Save there to publish it.</p>
                    </>}
                    {/* The cart watcher app embed (owner decision, October 14). Vouch can't tell whether it was saved. */}
                    {page.value === 'product' && cartEmbedUrl && draft.button_pages.includes('product') && <>
                      <a href={cartEmbedUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
                        Turn on cart updates<ExternalLink aria-hidden="true" className="h-3 w-3" />
                      </a>
                      <p className="text-sm text-muted-foreground">Keeps Post to Pay prices correct when shoppers change their cart. Click Save in Shopify to turn it on.</p>
                    </>}
                  </div>
                </div>
              ))}
              {draft.button_pages.length === 0 && <p className="text-sm text-destructive">Choose at least one page.</p>}
            </fieldset>

            <div className="space-y-2">
              <label htmlFor="buttonColor" className="text-sm font-medium text-foreground">Button color</label>
              <p id="buttonColorHint" className="text-sm text-muted-foreground">Also the accent color of the Post to Pay checkout flow on your product pages. Any hex code works.</p>
              <div className="flex items-center gap-2">
                <input type="color" aria-label="Pick a button color" value={previewColor.toLowerCase()} onChange={e => setColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-md bg-card p-1 shadow-edge" />
                <Input id="buttonColor" className="w-32 font-mono uppercase" value={draft.button_color} maxLength={7} spellCheck={false}
                  aria-describedby="buttonColorHint" onChange={e => setColor(e.target.value)} />
                <Button type="button" variant="link" size="sm" onClick={() => setColor(VOUCH_COLOR)}>Use Vouch’s color</Button>
              </div>
              {color && hardToSeeOnWhite(color) && (
                <p className="flex items-start gap-1.5 text-sm text-warning">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  This color is light, so links, outlines and progress bars in the checkout flow may be hard to see on white.
                </p>
              )}
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-foreground">Button text</legend>
              <div className="flex gap-6">
                {(['white', 'black'] as ButtonText[]).map(option => (
                  <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                    <input type="radio" name="buttonText" value={option} checked={draft.button_text === option}
                      onChange={() => setDraft({ ...draft, button_text: option })} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                    {option === 'white' ? 'White' : 'Black'}
                  </label>
                ))}
              </div>
              {textHardToRead(previewColor, draft.button_text) && (
                <p className="flex items-start gap-1.5 text-sm text-warning">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {draft.button_text === 'white' ? 'White' : 'Black'} text may be hard to read on this color. Shoppers on phones or in bright light may struggle to see it.
                </p>
              )}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-foreground">Button corners</legend>
              {BUTTON_CORNERS.map(option => (
                <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input type="radio" name="buttonCorners" value={option.value} checked={draft.button_corners === option.value}
                    onChange={() => setCorners(option.value)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                  {option.label}
                  {option.value === 'theme' && <span className="text-muted-foreground">(automatic)</span>}
                </label>
              ))}
              {draft.button_corners === 'custom' && (
                <div className="ml-6 flex items-center gap-2">
                  <Input id="buttonRadius" aria-label="Custom corner size in pixels" className="w-20" type="number" min="0" max={MAX_RADIUS} step="1" required
                    value={Number.isNaN(draft.button_radius) ? '' : draft.button_radius ?? ''} onChange={e => setDraft({ ...draft, button_radius: e.target.valueAsNumber })} />
                  <span className="text-sm text-muted-foreground">px, from 0 (square) to {MAX_RADIUS}</span>
                </div>
              )}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-foreground">Button size</legend>
              {BUTTON_SIZES.map(option => (
                <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input type="radio" name="buttonSize" value={option.value} checked={draft.button_size === option.value}
                    onChange={() => setDraft({ ...draft, button_size: option.value })} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                  {option.label}
                  {option.value === 'standard' && <span className="text-muted-foreground">(recommended)</span>}
                </label>
              ))}
            </fieldset>
          </fieldset>

          {/* A stand-in for the storefront button and checkout accents, not the store itself. */}
          <section aria-label="Preview" className="space-y-3 rounded-lg bg-secondary p-4">
            <p className="text-xs font-medium text-subdued">Preview on product pages</p>
            <div className="max-w-sm space-y-2 rounded-md bg-card p-4">
              <div data-testid="button-preview" className="mx-auto flex items-center justify-center gap-2 font-medium"
                style={{ background: previewColor, color: TEXT_COLORS[draft.button_text], borderRadius: radius ?? '6px', height: size.height, width: size.width, fontSize: size.fontSize }}>
                {/* The icon is white; with black text it turns black too. */}
                <img src={vouchIcon} alt="" width={size.icon} height={size.icon} data-testid="button-preview-icon"
                  style={{ filter: draft.button_text === 'white' ? undefined : 'brightness(0)' }} />
                Post to Pay
              </div>
              {/* Centered for every brand and scaled with the button (Henry, October 8). */}
              <p className="text-center leading-4 text-muted-foreground" style={{ fontSize: size.tagline }}><strong className="font-medium text-foreground">Up to 100% off.</strong> Terms apply. Powered by Vouch</p>
              <div aria-hidden="true" className="flex gap-1 pt-2">
                {[0, 1, 2, 3].map(i => <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i < 2 ? previewColor : 'hsl(var(--divider))' }} />)}
              </div>
              {/* Inside the checkout flow, before the agreement step: the key terms open from the info icon. */}
              <p className="flex items-center gap-1 text-xs text-muted-foreground">Terms apply. Powered by Vouch
                <Info aria-hidden="true" className="h-3.5 w-3.5" /></p>
              {/* The checkout panel's header: Vouch's logo stays periwinkle only with Vouch's colour. */}
              <div className="flex items-center gap-2 pt-2 text-sm font-medium text-foreground">
                <img src={vouchLogo} alt="" width={20} height={20} data-testid="panel-logo-preview" className="rounded-[22%]"
                  style={{ filter: usesVouchColor(previewColor) ? undefined : 'brightness(0)' }} />
                Post to Pay
              </div>
            </div>
            <p className="text-xs text-muted-foreground">On your store, the button is {size.note}.</p>
            {draft.button_corners === 'theme' && <p className="text-xs text-muted-foreground">Shown with 6px corners. On your store, the button copies your theme’s button corners where the theme publishes them.</p>}
            {!draft.accepting_orders
              ? <p className="text-xs text-muted-foreground">While orders are off, customers won’t see the button.</p>
              : !draft.button_pages.includes('product') && <p className="text-xs text-muted-foreground">With Product pages unticked, customers won’t see the button.</p>}
          </section>

          {(problem || save.error) && <p role="alert" className="text-sm text-destructive">Could not save button settings. {problem ?? save.error?.message}</p>}
          {readOnly
            ? <p className="text-sm text-muted-foreground">You have view-only access. Ask an owner or admin to change these settings.</p>
            : <div className="flex items-center gap-3">
                <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save button settings'}</Button>
                <UnsavedHint show={dirty} />
              </div>}
        </CardContent>
      </Card>
    </form>
  );
}
