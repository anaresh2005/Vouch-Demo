import { useState, type ReactNode } from 'react';
import { Input } from '@dashboard/components/ui/input';
import { Label } from '@dashboard/components/ui/label';
import { RequiredLabel } from '@dashboard/components/ui/required-label';
import { InfoTip } from '@dashboard/components/ui/info-tip';
import { nativeSelectClass } from '@dashboard/components/ui/native-select';
import { cn } from '@dashboard/lib/utils';
import {
  SUGGESTED_SETTINGS, USES_PERIODS, discountForFollowers, type PostToPaySettings, type UsesPeriod,
} from '@dashboard/lib/postToPaySettings';

type Props = { value: PostToPaySettings; onChange: (value: PostToPaySettings) => void; disabled?: boolean };
type SectionProps = Omit<Props, 'disabled'>;

const checkboxClass = 'mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]';
const PERIOD_LABELS: Record<UsesPeriod, string> = { week: 'per week', month: 'per month', year: 'per year', lifetime: 'ever' };
const RECOMMENDED_FLOOR = 10;
const RECOMMENDED_ENGAGEMENT = 2;

// An empty box is NaN, so the recommendation shows through as a grayed-out placeholder.
const shown = (n: number) => (Number.isNaN(n) ? '' : n);
const numberFrom = (event: React.ChangeEvent<HTMLInputElement>) => event.target.valueAsNumber;
const roundNicely = (n: number) => (n >= 1000 ? Math.round(n / 100) * 100 : Math.round(n));

function Field({ id, label, required = true, hint, info, children }: { id: string; label: string; required?: boolean; hint?: string; info?: string; children: ReactNode }) {
  const LabelTag = required ? RequiredLabel : Label;
  return (
    <div className="space-y-2">
      <div className="leading-5">
        <LabelTag htmlFor={id} className="inline">{label}</LabelTag>
        {info && <InfoTip label="Why we ask">{info}</InfoTip>}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** A checkbox presented as a selectable card: a title, one line of explanation, and any follow-up field inside. */
function ChoiceCard({ id, title, description, checked, onChange, children }: {
  id: string; title: string; description: string; checked: boolean; onChange: (checked: boolean) => void; children?: ReactNode;
}) {
  return (
    <div className={cn('rounded-lg p-4 transition-shadow', checked ? 'shadow-[0_0_0_1.5px_hsl(var(--primary))]' : 'shadow-edge')}>
      {/* The checkbox is named by its title (id/htmlFor) and described by the line below it. */}
      <div className="flex items-start gap-3">
        <input id={id} type="checkbox" className={checkboxClass} checked={checked} aria-describedby={`${id}-description`} onChange={e => onChange(e.target.checked)} />
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-foreground">{title}</label>
      </div>
      <p id={`${id}-description`} className="ml-7 mt-0.5 text-sm text-muted-foreground">{description}</p>
      {checked && children && <div className="ml-7 mt-3">{children}</div>}
    </div>
  );
}

function Handle({ id, label, required, value, onChange, info }: { id: string; label: string; required: boolean; value: string | null; onChange: (v: string) => void; info?: string }) {
  return (
    <Field id={id} label={label} required={required} info={info}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
        <Input id={id} className="pl-7" required={required} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder="yourbrand" />
      </div>
    </Field>
  );
}

// What customers get, worked out from whatever has been typed so far (recommended values fill any
// blanks), so the example follows the brand's numbers as they change.
function discountExample(value: PostToPaySettings) {
  const pick = (n: number, fallback: number) => (Number.isFinite(n) ? n : fallback);
  const settings = {
    ...value,
    min_followers: pick(value.min_followers, SUGGESTED_SETTINGS.min_followers),
    discount_at_min_percent: pick(value.discount_at_min_percent, SUGGESTED_SETTINGS.discount_at_min_percent),
    full_discount_followers: pick(value.full_discount_followers, SUGGESTED_SETTINGS.full_discount_followers),
    floor_discount_percent: value.floor_discount_percent === null ? null : pick(value.floor_discount_percent, RECOMMENDED_FLOOR),
  };
  const { min_followers: min, full_discount_followers: full } = settings;
  if (full < min) return 'Followers needed for 100% off must be at least the minimum.';
  const cap = value.max_discount_amount !== null && Number.isFinite(value.max_discount_amount) && value.max_discount_amount > 0
    ? ` No order saves more than ${value.max_discount_amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}.` : '';
  const below = (settings.floor_discount_percent === null
    ? `Accounts under ${min.toLocaleString()} followers can't use Post to Pay.`
    : `Accounts under ${min.toLocaleString()} followers get ${settings.floor_discount_percent}% off.`) + cap;
  if (full - min < 3) return `${min.toLocaleString()}+ followers get ${discountForFollowers(settings, min)}% off. ${below}`;
  const [a, b] = [roundNicely(min + (full - min) / 3), roundNicely(min + (2 * (full - min)) / 3)];
  return `For example, ${min.toLocaleString()} followers get ${discountForFollowers(settings, min)}% off, `
    + `${a.toLocaleString()} get ${discountForFollowers(settings, a)}%, ${b.toLocaleString()} get ${discountForFollowers(settings, b)}% `
    + `and ${full.toLocaleString()}+ get 100% off. ${below}`;
}

export function RecommendationNote() {
  return (
    <p className="text-sm text-muted-foreground">
      Fields marked <span className="text-destructive">*</span> are required. The grayed-out numbers are Vouch's recommendations.
    </p>
  );
}

/** The accounts customers tag when they post. */
export function HandleFields({ value, onChange }: SectionProps) {
  const set = <K extends keyof PostToPaySettings>(key: K, next: PostToPaySettings[K]) => onChange({ ...value, [key]: next });
  return (
    <div className="grid grid-cols-1 gap-5">
      <Handle id="tagHandle" label="Instagram handle customers should tag" required value={value.instagram_username} onChange={v => set('instagram_username', v)}
        info="Customers tag this account when they post, which is how Vouch finds and checks the post." />
      <Handle id="tiktokHandle" label="TikTok handle customers should tag" required={false} value={value.tiktok_username} onChange={v => set('tiktok_username', v)} />
    </div>
  );
}

/** Who qualifies and how the discount rises with their following. */
export function DiscountFields({ value, onChange }: SectionProps) {
  const set = <K extends keyof PostToPaySettings>(key: K, next: PostToPaySettings[K]) => onChange({ ...value, [key]: next });
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5">
        <Field id="minFollowers" label="Minimum followers to use Post to Pay" info="Accounts below this can't pay with a post, unless you give everyone a minimum discount below.">
          <Input id="minFollowers" className="max-w-[200px]" type="number" min="0" step="1" required placeholder={String(SUGGESTED_SETTINGS.min_followers)}
            value={shown(value.min_followers)} onChange={e => set('min_followers', numberFrom(e))} />
        </Field>
        <Field id="discountAtMin" label="Discount at that minimum (%)">
          <Input id="discountAtMin" className="max-w-[200px]" type="number" min="0" max="100" step="1" required placeholder={String(SUGGESTED_SETTINGS.discount_at_min_percent)}
            value={shown(value.discount_at_min_percent)} onChange={e => set('discount_at_min_percent', numberFrom(e))} />
        </Field>
        <Field id="fullDiscountFollowers" label="Followers needed for 100% off">
          <Input id="fullDiscountFollowers" className="max-w-[200px]" type="number" min="0" step="1" required placeholder={String(SUGGESTED_SETTINGS.full_discount_followers)}
            value={shown(value.full_discount_followers)} onChange={e => set('full_discount_followers', numberFrom(e))} />
        </Field>
      </div>
      <p className="rounded-md bg-secondary px-3 py-2.5 text-sm text-body" aria-live="polite">
        Anyone in between gets a discount scaled to their follower count. {discountExample(value)}
      </p>
      <ChoiceCard id="floorDiscount" title="Minimum discount for everyone"
        description="Give every real, brand-safe account a minimum discount, whatever their follower count."
        checked={value.floor_discount_percent !== null} onChange={checked => set('floor_discount_percent', checked ? NaN : null)}>
        <Field id="floorDiscountPercent" label="Minimum discount for all accounts (%)">
          <Input id="floorDiscountPercent" className="max-w-[160px]" type="number" min="0" max="100" step="1" required placeholder={String(RECOMMENDED_FLOOR)}
            value={shown(value.floor_discount_percent ?? NaN)} onChange={e => set('floor_discount_percent', numberFrom(e))} />
        </Field>
      </ChoiceCard>
      <ChoiceCard id="maxDiscount" title="Discount cap"
        description="Set the most any one Post to Pay order can save, regardless of follower count."
        checked={value.max_discount_amount !== null} onChange={checked => set('max_discount_amount', checked ? NaN : null)}>
        <Field id="maxDiscountAmount" label="Maximum discount per order ($)">
          <Input id="maxDiscountAmount" className="max-w-[160px]" type="number" min="0.01" step="0.01" required
            value={shown(value.max_discount_amount ?? NaN)} onChange={e => set('max_discount_amount', numberFrom(e))} />
        </Field>
      </ChoiceCard>
      <ChoiceCard id="combineDiscounts" title="Discount stacking"
        description="Let customers use your other Shopify discount codes and automatic discounts on a Post to Pay order. When off, Post to Pay can't be combined with any other discount."
        checked={value.combine_with_other_discounts} onChange={checked => set('combine_with_other_discounts', checked)} />
    </div>
  );
}

/** Posting deadline, how often a customer can use Post to Pay, engagement and shipping. */
export function RuleFields({ value, onChange }: SectionProps) {
  // 0 is stored as "no minimum", so the checkbox tracks intent while a number is being edited
  // (a blank box is NaN, which still means a minimum is wanted).
  const [requireEngagement, setRequireEngagement] = useState(value.min_engagement_rate > 0 || Number.isNaN(value.min_engagement_rate));
  const set = <K extends keyof PostToPaySettings>(key: K, next: PostToPaySettings[K]) => onChange({ ...value, [key]: next });
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5">
        <Field id="postingWindow" label="Days a customer has to post after delivery" info="The clock starts when the order is delivered. Customers who don't post in time are charged the remaining balance.">
          <Input id="postingWindow" className="max-w-[200px]" type="number" min="1" max="30" step="1" required placeholder={String(SUGGESTED_SETTINGS.posting_window_days)}
            value={shown(value.posting_window_days)} onChange={e => set('posting_window_days', numberFrom(e))} />
        </Field>
        <div className="space-y-2">
          <div className="leading-5">
            <RequiredLabel htmlFor="maxUses" className="inline">How often each customer can Post to Pay</RequiredLabel>
            <InfoTip label="Why we ask">Counted by Instagram handle, from each order&apos;s date. An order counts once its post is up, and a customer with an order still in progress can&apos;t start another.</InfoTip>
          </div>
          <div className="flex items-center gap-2">
            <Input id="maxUses" className="w-20" type="number" min="1" max="100" step="1" required placeholder={String(SUGGESTED_SETTINGS.max_uses_per_customer)}
              value={shown(value.max_uses_per_customer)} onChange={e => set('max_uses_per_customer', numberFrom(e))} />
            {/* Follows the number shown, including the grayed-out recommendation in an empty box. */}
            <span className="text-sm text-muted-foreground">{(Number.isNaN(value.max_uses_per_customer) ? SUGGESTED_SETTINGS.max_uses_per_customer : value.max_uses_per_customer) === 1 ? 'time' : 'times'}</span>
            <select aria-label="Usage period" required className={cn(nativeSelectClass, !value.uses_period && 'text-faint')}
              value={value.uses_period} onChange={e => set('uses_period', e.target.value as UsesPeriod)}>
              {/* A select can't show a grayed-out recommendation like the number boxes, so it asks for a choice. */}
              <option value="" disabled>Choose…</option>
              {USES_PERIODS.map(period => <option key={period} value={period}>{PERIOD_LABELS[period]}</option>)}
            </select>
          </div>
        </div>
      </div>
      <ChoiceCard id="engagement" title="Require a minimum engagement rate"
        description="Only accounts whose audience actively likes and comments can use Post to Pay."
        checked={requireEngagement} onChange={checked => {
          setRequireEngagement(checked);
          set('min_engagement_rate', checked ? NaN : 0);
        }}>
        <Field id="minEngagement" label="Minimum engagement rate (%)">
          <Input id="minEngagement" className="max-w-[160px]" type="number" min="0" max="100" step="0.1" required placeholder={String(RECOMMENDED_ENGAGEMENT)}
            value={shown(value.min_engagement_rate)} onChange={e => set('min_engagement_rate', numberFrom(e))} />
        </Field>
      </ChoiceCard>
      <ChoiceCard id="expressShipping" title="Free express shipping on Post to Pay orders"
        description="Faster delivery means customers can post sooner."
        checked={value.free_express_shipping} onChange={checked => set('free_express_shipping', checked)} />
    </div>
  );
}

/** Every Post to Pay setting on one form, as used in Settings. */
export function PostToPaySettingsFields({ value, onChange, disabled }: Props) {
  return (
    <fieldset disabled={disabled} className="space-y-8">
      <RecommendationNote />
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Accounts to tag</h4>
        <HandleFields value={value} onChange={onChange} />
      </section>
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Discounts</h4>
        <DiscountFields value={value} onChange={onChange} />
      </section>
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Posting rules</h4>
        <RuleFields value={value} onChange={onChange} />
      </section>
    </fieldset>
  );
}
