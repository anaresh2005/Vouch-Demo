import { useState, type FormEvent } from 'react';
import { Button } from '@dashboard/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dashboard/components/ui/card';
import { useToast } from '@dashboard/hooks/use-toast';
import { useSavePostToPaySettings } from '@dashboard/hooks/useBrandData';
import { MonthlyOrderUsage } from './MonthlyOrderUsage';
import { useUnsavedChangesWarning } from '@dashboard/hooks/useUnsavedChangesWarning';
import { settingsFromBrand, validateSettings, type PostToPaySettings } from '@dashboard/lib/postToPaySettings';
import type { Brand } from '@dashboard/types/vouch';
import { PostToPaySettingsFields } from './PostToPaySettingsFields';
import { UnsavedHint } from './UnsavedHint';

// Checkout uses every Post to Pay setting except the TikTok handle (Instagram only); placed orders keep theirs.
const CHECKOUT_NOTE = 'New offers use these settings once saved, except the TikTok handle.';

// A cleared handle box may hold '' where the brand has none stored; both mean "no handle".
const blankAsNull = <T,>(value: T) => (value === '' ? null : value);
const same = (a: PostToPaySettings, b: PostToPaySettings) =>
  (Object.keys(a) as (keyof PostToPaySettings)[]).every(key => Object.is(blankAsNull(a[key]), blankAsNull(b[key])));

export function PostToPaySettingsCard({ brand, readOnly }: { brand: Brand; readOnly: boolean }) {
  const [settings, setSettings] = useState(() => settingsFromBrand(brand));
  // What was last saved, so the form knows when it has unsaved edits.
  const [lastSaved, setLastSaved] = useState(settings);
  const dirty = !readOnly && !same(settings, lastSaved);
  useUnsavedChangesWarning(dirty);
  const [problem, setProblem] = useState<string | null>(null);
  const save = useSavePostToPaySettings();
  const { toast } = useToast();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateSettings(settings);
    setProblem(invalid);
    if (invalid) return;
    try {
      const saved = await save.mutateAsync({ brandId: brand.id, settings });
      // Show what was stored, e.g. the handle taken from a pasted profile link.
      setSettings(settingsFromBrand(saved));
      setLastSaved(settingsFromBrand(saved));
      toast({ title: 'Post to Pay settings saved', description: CHECKOUT_NOTE });
    } catch {
      // Shown beside the save button; the draft is kept for retry.
    }
  }

  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader><CardTitle className="text-sm">Post to Pay settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Enforced at checkout: the per-customer limit (owner decision, October 8) and, since Lane A item 8, minimum followers and engagement and the posting window. The rest is saved for setup. */}
          <p role="note" className="text-sm text-muted-foreground">{CHECKOUT_NOTE}</p>
          <MonthlyOrderUsage />
          <PostToPaySettingsFields value={settings} onChange={setSettings} disabled={readOnly || save.isPending} />
          {(problem || save.error) && <p role="alert" className="text-sm text-destructive">Could not save Post to Pay settings. {problem ?? save.error?.message}</p>}
          {readOnly
            ? <p className="text-sm text-muted-foreground">You have view-only access. Ask an owner or admin to change these settings.</p>
            : <div className="flex items-center gap-3">
                <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save Post to Pay settings'}</Button>
                <UnsavedHint show={dirty} />
              </div>}
        </CardContent>
      </Card>
    </form>
  );
}
