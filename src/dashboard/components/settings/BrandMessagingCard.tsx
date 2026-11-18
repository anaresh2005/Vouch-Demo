import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@dashboard/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dashboard/components/ui/card';
import { Input } from '@dashboard/components/ui/input';
import { Label } from '@dashboard/components/ui/label';
import { useToast } from '@dashboard/hooks/use-toast';
import { useSaveBrandMessaging } from '@dashboard/hooks/useBrandData';
import { useUnsavedChangesWarning } from '@dashboard/hooks/useUnsavedChangesWarning';
import {
  MAX_IDEA_LENGTH, MAX_MESSAGING_LENGTH, MAX_POST_IDEAS, messagingFromBrand, sameMessaging, tidyMessaging, validateMessaging,
} from '@dashboard/lib/brandMessaging';
import type { Brand } from '@dashboard/types/vouch';
import { UnsavedHint } from './UnsavedHint';

/** The post ideas and "what we'd love you to mention" line that customers get by email. */
export function BrandMessagingCard({ brand, readOnly }: { brand: Brand; readOnly: boolean }) {
  const [draft, setDraft] = useState(() => messagingFromBrand(brand));
  // What was last saved, so the form knows when it has unsaved edits.
  const [lastSaved, setLastSaved] = useState(draft);
  const dirty = !readOnly && !sameMessaging(tidyMessaging(draft), lastSaved);
  useUnsavedChangesWarning(dirty);
  const [problem, setProblem] = useState<string | null>(null);
  const save = useSaveBrandMessaging();
  const { toast } = useToast();
  const ideas = draft.post_ideas;
  const setIdeas = (next: string[]) => setDraft({ ...draft, post_ideas: next });
  // A box added with "Add an idea" takes the cursor, so typing goes straight into it.
  const [added, setAdded] = useState<number | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateMessaging(draft);
    setProblem(invalid);
    if (invalid) return;
    try {
      const saved = messagingFromBrand(await save.mutateAsync({ brandId: brand.id, messaging: draft }));
      setDraft(saved);
      setLastSaved(saved);
      toast({ title: 'Brand messaging saved', description: 'Customer emails will use it once Vouch starts sending them.' });
    } catch {
      // Shown beside the save button; the draft is kept for retry.
    }
  }

  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader><CardTitle className="text-sm">Brand messaging</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            What the emails tell customers after they order with Post to Pay, to help them make a great post. Vouch's suggestions are filled in; change them to suit your brand.
          </p>
          <fieldset disabled={readOnly || save.isPending} className="space-y-6">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Post ideas</legend>
              <p className="text-xs text-muted-foreground">Up to {MAX_POST_IDEAS}. Shown as bullet points in the delivery and reminder emails.</p>
              <ol className="space-y-2">
                {ideas.map((idea, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Input aria-label={`Post idea ${i + 1}`} value={idea} maxLength={MAX_IDEA_LENGTH} autoFocus={i === added}
                      onChange={e => setIdeas(ideas.map((old, j) => (j === i ? e.target.value : old)))} />
                    {ideas.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove post idea ${i + 1}`}
                        onClick={() => setIdeas(ideas.filter((_, j) => j !== i))}>
                        <X aria-hidden="true" />
                      </Button>
                    )}
                  </li>
                ))}
              </ol>
              {ideas.length < MAX_POST_IDEAS && (
                <Button type="button" variant="link" size="sm" className="px-0" onClick={() => { setAdded(ideas.length); setIdeas([...ideas, '']); }}>
                  <Plus aria-hidden="true" />Add an idea
                </Button>
              )}
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="postMessaging">What you'd love customers to mention</Label>
              <Input id="postMessaging" value={draft.post_messaging} maxLength={MAX_MESSAGING_LENGTH} aria-describedby="postMessagingExample"
                onChange={e => setDraft({ ...draft, post_messaging: e.target.value })} />
              {/* The email writes the start of the sentence, so brands only write how it ends. */}
              <p id="postMessagingExample" className="rounded-md bg-secondary px-3 py-2.5 text-sm text-body">
                How it reads in the email: “What {brand.name} would love you to mention: {draft.post_messaging.trim() || '…'}”
              </p>
            </div>
          </fieldset>
          {(problem || save.error) && <p role="alert" className="text-sm text-destructive">Could not save brand messaging. {problem ?? save.error?.message}</p>}
          {readOnly
            ? <p className="text-sm text-muted-foreground">You have view-only access. Ask an owner or admin to change these settings.</p>
            : <div className="flex items-center gap-3">
                <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save brand messaging'}</Button>
                <UnsavedHint show={dirty} />
              </div>}
        </CardContent>
      </Card>
    </form>
  );
}
