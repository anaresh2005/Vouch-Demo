import { useState, type FormEvent } from 'react';
import { Button } from '@dashboard/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dashboard/components/ui/card';
import { Input } from '@dashboard/components/ui/input';
import { Label } from '@dashboard/components/ui/label';
import { RequiredLabel } from '@dashboard/components/ui/required-label';
import { useToast } from '@dashboard/hooks/use-toast';
import { useAuth } from '@dashboard/hooks/useAuth';
import { useBrandProfile, useSaveProfile } from '@dashboard/hooks/useBrandData';
import { useUnsavedChangesWarning } from '@dashboard/hooks/useUnsavedChangesWarning';
import { MIN_PASSWORD, newPasswordProblem } from '@dashboard/lib/password';
import type { Profile } from '@dashboard/types/vouch';
import { UnsavedHint } from './UnsavedHint';

// The personal details given at sign-up. Changing the sign-in email is not supported in the app yet.
function ProfileForm({ profile, email }: { profile: Profile; email: string | undefined }) {
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [jobTitle, setJobTitle] = useState(profile.job_title ?? '');
  // What was last saved, so the form knows when it has unsaved edits.
  const [saved, setSaved] = useState({ fullName, jobTitle });
  const dirty = fullName !== saved.fullName || jobTitle !== saved.jobTitle;
  useUnsavedChangesWarning(dirty);
  const save = useSaveProfile();
  const { toast } = useToast();

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await save.mutateAsync({ id: profile.id, fullName, jobTitle });
      setSaved({ fullName, jobTitle });
      toast({ title: 'Profile saved', description: 'Your name and title have been updated.' });
    } catch {
      // Shown beside the save button; the edits are kept for retry.
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={save.isPending} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <RequiredLabel htmlFor="profileName">Full name</RequiredLabel>
          <Input id="profileName" required value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <RequiredLabel htmlFor="profileTitle">Title</RequiredLabel>
          <Input id="profileTitle" required value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="profileEmail">Sign-in email</Label>
          <Input id="profileEmail" readOnly disabled value={email ?? ''} />
          <p className="text-xs text-muted-foreground">To change your sign-in email, contact support@vouch.so.</p>
        </div>
      </fieldset>
      {save.error && <p role="alert" className="text-sm text-destructive">Could not save your profile. {save.error.message}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save profile'}</Button>
        <UnsavedHint show={dirty} />
      </div>
    </form>
  );
}

// A separate form, so a half-typed password never goes out with a profile save.
function PasswordForm() {
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useUnsavedChangesWarning(!!(password || confirmation));

  function close() {
    setOpen(false);
    setPassword('');
    setConfirmation('');
    setError('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const problem = newPasswordProblem(password, confirmation);
    setError(problem ?? '');
    if (problem) return;
    setSaving(true);
    const { error } = await updatePassword(password);
    setSaving(false);
    if (error) {
      setError(`Could not change your password. ${error.message}`);
      return;
    }
    close();
    toast({ title: 'Password changed', description: 'Use your new password the next time you sign in.' });
  }

  if (!open) {
    return <Button type="button" variant="outline" onClick={() => setOpen(true)}>Change password</Button>;
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <fieldset disabled={saving} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <RequiredLabel htmlFor="profileNewPassword">New password</RequiredLabel>
          <Input id="profileNewPassword" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={password}
            onChange={e => setPassword(e.target.value)} aria-describedby="profileNewPasswordHint" autoFocus />
          <p id="profileNewPasswordHint" className="text-xs text-muted-foreground">At least {MIN_PASSWORD} characters.</p>
        </div>
        <div className="space-y-1.5">
          <RequiredLabel htmlFor="profileConfirmPassword">Confirm new password</RequiredLabel>
          <Input id="profileConfirmPassword" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} />
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !password || !confirmation}>{saving ? 'Saving…' : 'Save new password'}</Button>
        <Button type="button" variant="outline" onClick={close} disabled={saving}>Cancel</Button>
      </div>
    </form>
  );
}

export function ProfileCard() {
  const { user } = useAuth();
  const { profile, isLoading, error } = useBrandProfile();
  if (isLoading) return <p role="status" className="text-sm text-muted-foreground">Loading your profile…</p>;
  if (error || !profile) return <p role="alert" className="text-sm text-destructive">Could not load your profile. Please reload to try again.</p>;
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">User profile</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <ProfileForm key={profile.id} profile={profile} email={user?.email} />
        <div className="space-y-3 pt-6 shadow-[inset_0_1px_0_hsl(var(--divider))]">
          <h4 className="text-sm font-semibold text-foreground">Password</h4>
          <PasswordForm />
        </div>
      </CardContent>
    </Card>
  );
}
