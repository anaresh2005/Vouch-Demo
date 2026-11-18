import { useState, type FormEvent } from 'react';
import { DashboardLayout } from '@dashboard/components/dashboard/DashboardLayout';
import { ShopifyConnectionCard } from '@dashboard/components/dashboard/ShopifyConnectionCard';
import { TeamCard } from '@dashboard/components/dashboard/TeamCard';
import { SectionBoundary } from '@dashboard/components/dashboard/SectionBoundary';
import { BrandMessagingCard } from '@dashboard/components/settings/BrandMessagingCard';
import { PostToPaySettingsCard } from '@dashboard/components/settings/PostToPaySettingsCard';
import { StorefrontButtonCard } from '@dashboard/components/settings/StorefrontButtonCard';
import { ProfileCard } from '@dashboard/components/settings/ProfileCard';
import { TermsCard } from '@dashboard/components/settings/TermsCard';
import { UnsavedHint } from '@dashboard/components/settings/UnsavedHint';
import { useUnsavedChangesWarning } from '@dashboard/hooks/useUnsavedChangesWarning';
import { useBrandRole } from '@dashboard/hooks/useBrandInvites';
import { Card, CardContent, CardHeader, CardTitle } from '@dashboard/components/ui/card';
import { Input } from '@dashboard/components/ui/input';
import { Button } from '@dashboard/components/ui/button';
import { RequiredLabel } from '@dashboard/components/ui/required-label';
import { Label } from '@dashboard/components/ui/label';
import { useBrand, useSaveBrand } from '@dashboard/hooks/useBrandData';
import { useToast } from '@dashboard/hooks/use-toast';
import { useEMVSettings } from '@dashboard/hooks/useEMVSettings';
import { usePriorityMetric, type PriorityMetric } from '@dashboard/hooks/usePriorityMetric';
import type { Brand } from '@dashboard/types/vouch';
import { PageHeader } from '@dashboard/components/dashboard/PageHeader';
import { nativeSelectClass } from '@dashboard/components/ui/native-select';
import { cn } from '@dashboard/lib/utils';

function BrandSettings({ brand, readOnly }: { brand: Brand; readOnly: boolean }) {
  const [draft, setDraft] = useState(brand);
  // What was last saved, so the form knows when it has unsaved edits.
  const [lastSaved, setLastSaved] = useState(brand);
  const dirty = !readOnly && (draft.name !== lastSaved.name || (draft.contact_email ?? '') !== (lastSaved.contact_email ?? ''));
  useUnsavedChangesWarning(dirty);
  const save = useSaveBrand();
  const { toast } = useToast();

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await save.mutateAsync(draft);
      setLastSaved(draft);
      toast({ title: 'Brand settings saved', description: 'Your brand information has been saved.' });
    } catch {
      // The mutation error is displayed beside the save button; keep the draft for retry.
    }
  }

  return (
    <form onSubmit={handleSave}>
      <Card>
        <CardHeader><CardTitle className="text-sm">Brand details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <fieldset disabled={save.isPending || readOnly} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="brandName">Brand name</RequiredLabel>
              <Input id="brandName" required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Email for notices from Vouch</Label>
              <Input id="contactEmail" type="email" value={draft.contact_email ?? ''} onChange={e => setDraft({ ...draft, contact_email: e.target.value })} />
              <p className="text-xs text-muted-foreground">Where we send terms changes and account and billing notices. Not shown to customers.</p>
            </div>
          </fieldset>
          {save.error && <p role="alert" className="text-sm text-destructive">Could not save brand settings. {save.error.message}</p>}
          {readOnly
            ? <p className="text-sm text-muted-foreground">You have view-only access. Ask an owner or admin to change these settings.</p>
            : <div className="flex items-center gap-3">
                <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save brand settings'}</Button>
                <UnsavedHint show={dirty} />
              </div>}
        </CardContent>
      </Card>
    </form>
  );
}

function ReportingPreferences() {
  const { settings, saveSettings } = useEMVSettings();
  const { priorityMetric, savePriorityMetric } = usePriorityMetric();
  const [instagramCPE, setInstagramCPE] = useState(settings.instagramCPE.toString());
  const [tiktokCPE, setTiktokCPE] = useState(settings.tiktokCPE.toString());
  const [priority, setPriority] = useState<PriorityMetric>(priorityMetric);
  const [error, setError] = useState('');
  const { toast } = useToast();
  // Compared as numbers, so "0.50" and the saved 0.5 count as the same rate.
  const dirty = Number(instagramCPE) !== settings.instagramCPE || Number(tiktokCPE) !== settings.tiktokCPE || priority !== priorityMetric;
  useUnsavedChangesWarning(dirty);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      saveSettings({ instagramCPE: Number(instagramCPE), tiktokCPE: Number(tiktokCPE) });
      savePriorityMetric(priority);
      toast({ title: 'Reporting preferences saved', description: 'These preferences are saved in this browser only.' });
    } catch {
      setError('Could not save all preferences in this browser. Check your browser storage settings and try again.');
    }
  }

  return (
    <form onSubmit={handleSave}>
      <Card>
        <CardHeader><CardTitle className="text-sm">Reporting preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Saved in this browser only. Earned Media Value (EMV) estimates what the attention from posts is worth to you: (likes + comments) × your value per engagement. A common benchmark is what you'd pay for that engagement in ads. These rates are your assumptions, not measured revenue.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="instagramCPE">Instagram value per engagement ($)</Label>
              <Input id="instagramCPE" type="number" min="0.01" max="100" step="0.01" required value={instagramCPE} onChange={e => setInstagramCPE(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tiktokCPE">TikTok value per engagement ($)</Label>
              <Input id="tiktokCPE" type="number" min="0.01" max="100" step="0.01" required value={tiktokCPE} onChange={e => setTiktokCPE(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priorityMetric">Priority performance metric</Label>
            <select id="priorityMetric" className={cn(nativeSelectClass, 'block')} value={priority} onChange={e => setPriority(e.target.value as PriorityMetric)}>
              <option value="cpm">CPM — cost per 1,000 views</option>
              <option value="emv">EMV — earned media value</option>
            </select>
            <p className="text-xs text-muted-foreground">Sales attribution is unavailable until product sales data is connected.</p>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit">Save reporting preferences</Button>
            <UnsavedHint show={dirty} />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

const SECTIONS = [
  { id: 'profile', label: 'User profile' },
  { id: 'brand', label: 'Brand details', needsBrand: true },
  { id: 'team', label: 'Team' },
  { id: 'shopify', label: 'Shopify connection', managersOnly: true },
  { id: 'post-to-pay', label: 'Post to Pay', needsBrand: true },
  { id: 'display', label: 'Display settings', needsBrand: true },
  { id: 'brand-messaging', label: 'Brand messaging', needsBrand: true },
  { id: 'reporting', label: 'Reporting preferences' },
  { id: 'terms', label: 'Terms and privacy' },
];

export default function Settings() {
  const { brand, isLoading, error } = useBrand();
  const { canManageBrand } = useBrandRole();
  const sections = SECTIONS.filter(section => (canManageBrand || !section.managersOnly) && (!section.needsBrand || !!brand));
  // Brand details now sit second, ahead of Team, so the loading, error and missing-brand notice
  // shows in that slot; the other brand cards appear only once the brand has loaded.
  const brandState = isLoading ? <p role="status">Loading brand settings…</p>
    : error ? <p role="alert">Could not load your brand settings. Please reload to try again.</p>
    : !brand ? <p>No brand is available for this account.</p> : null;
  return (
    <DashboardLayout>
      <PageHeader title="Settings" description="Your profile, brand, team and preferences." />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[180px_minmax(0,760px)]">
        {/* Every section one click away, as in Stripe's settings. */}
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-8 space-y-0.5">
            {sections.map(section => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="block rounded-md px-2 py-1.5 text-sm font-medium text-subdued transition-colors hover:bg-accent hover:text-foreground">{section.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-6 [&>section]:scroll-mt-8">
          {/* Each card fails on its own, so one broken card never hides the others. */}
          <section id="profile"><SectionBoundary><ProfileCard /></SectionBoundary></section>
          {brandState ?? <section id="brand"><SectionBoundary><BrandSettings key={brand!.id} brand={brand!} readOnly={!canManageBrand} /></SectionBoundary></section>}
          <section id="team"><SectionBoundary><TeamCard /></SectionBoundary></section>
          {canManageBrand && <section id="shopify"><SectionBoundary><ShopifyConnectionCard /></SectionBoundary></section>}
          {brand && !brandState && <>
            <section id="post-to-pay"><SectionBoundary><PostToPaySettingsCard key={`p2p-${brand.id}`} brand={brand} readOnly={!canManageBrand} /></SectionBoundary></section>
            <section id="display"><SectionBoundary><StorefrontButtonCard key={`store-${brand.id}`} brand={brand} readOnly={!canManageBrand} /></SectionBoundary></section>
            <section id="brand-messaging"><SectionBoundary><BrandMessagingCard key={`messaging-${brand.id}`} brand={brand} readOnly={!canManageBrand} /></SectionBoundary></section>
          </>}
          <section id="reporting"><SectionBoundary><ReportingPreferences /></SectionBoundary></section>
          <section id="terms"><SectionBoundary><TermsCard /></SectionBoundary></section>
        </div>
      </div>
    </DashboardLayout>
  );
}
