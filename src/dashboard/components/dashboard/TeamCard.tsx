import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Badge } from '@dashboard/components/ui/badge';
import { Button } from '@dashboard/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dashboard/components/ui/card';
import { Input } from '@dashboard/components/ui/input';
import { Label } from '@dashboard/components/ui/label';
import { nativeSelectClass } from '@dashboard/components/ui/native-select';
import { cn } from '@dashboard/lib/utils';
import {
  useBrandInvites, useBrandMembers, useBrandRole, type BrandMember, type BrandRole, type InviteRole,
} from '@dashboard/hooks/useBrandInvites';

const ROLE_LABELS: Record<BrandRole, string> = { owner: 'Owner', admin: 'Admin', viewer: 'Viewer' };
const ROLE_HELP = 'Admins can change settings, connect Shopify and invite people. Viewers can only view the dashboard.';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });


function MemberRow({ member, isYou, isOwner }: { member: BrandMember; isYou: boolean; isOwner: boolean }) {
  const { setRole, remove, transfer } = useBrandMembers();
  const name = member.full_name || member.email || 'Unnamed member';
  const manageable = isOwner && !isYou && member.brand_role !== 'owner';

  function makeOwner() {
    if (window.confirm(`Make ${name} the owner of this brand? You will become an admin, and only they will be able to manage members.`)) {
      transfer.mutate(member.user_id);
    }
  }
  function removeMember() {
    if (window.confirm(`Remove ${name} from this brand? They will lose access to the dashboard.`)) {
      remove.mutate(member.user_id);
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm shadow-[inset_0_-1px_0_hsl(var(--divider))]">
      <div className="min-w-0">
        <p className="font-medium truncate">{name}{isYou && <span className="text-muted-foreground font-normal"> (you)</span>}</p>
        {member.full_name && member.email && <p className="text-xs text-muted-foreground truncate">{member.email}</p>}
      </div>
      {manageable ? (
        <div className="flex items-center gap-1.5">
          <select
            aria-label={`Role for ${name}`}
            // h-7 matches the small Make owner and Remove buttons on the same row.
            className={cn(nativeSelectClass, 'h-7')}
            value={member.brand_role}
            disabled={setRole.isPending}
            onChange={e => setRole.mutate({ userId: member.user_id, role: e.target.value as InviteRole })}
          >
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button type="button" variant="ghost" size="sm" onClick={makeOwner} disabled={transfer.isPending}>Make owner</Button>
          <Button type="button" variant="ghost" size="sm" onClick={removeMember} disabled={remove.isPending}>Remove</Button>
        </div>
      ) : (
        <Badge>{ROLE_LABELS[member.brand_role]}</Badge>
      )}
      {[setRole.error, remove.error, transfer.error].filter(Boolean).map(err => (
        <p key={err!.message} role="alert" className="w-full text-xs text-destructive">{err!.message}</p>
      ))}
    </li>
  );
}

function Invites() {
  const { invites, create, revoke } = useBrandInvites();
  const [role, setRole] = useState<InviteRole>('viewer');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  function createLink() {
    setCopied(false);
    setCopyFailed(false);
    setLink('');
    // Failures are shown from create.error below.
    create.mutate(role, { onSuccess: setLink });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      // Clipboard access can be blocked; the link stays selectable in the field.
      setCopied(false);
      setCopyFailed(true);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Invite someone</h3>
      <p className="text-sm text-muted-foreground">
        Each link works once and expires after 7 days. Anyone with the link can join, so send it only to the person it's for.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="inviteRole" className="text-sm">Invite as</Label>
        {/* h-9 matches the default-size Create invite link button beside it (selects default to h-10, like inputs). */}
        <select id="inviteRole" className={cn(nativeSelectClass, 'h-9')} value={role} onChange={e => setRole(e.target.value as InviteRole)}>
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>
        <Button type="button" onClick={createLink} disabled={create.isPending}>
          {create.isPending ? 'Creating…' : 'Create invite link'}
        </Button>
      </div>
      {create.error && <p role="alert" className="text-sm text-destructive">Could not create an invite. {create.error.message}</p>}
      {link && (
        <div className="flex gap-2">
          <Input aria-label="Invite link" readOnly value={link} onFocus={e => e.target.select()} />
          <Button type="button" variant="outline" size="lg" onClick={copy} aria-label="Copy invite link">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      )}
      {link && copyFailed && <p role="alert" className="text-sm text-destructive">Could not copy the link. Select it above and copy it yourself.</p>}
      <h3 className="text-sm font-semibold text-foreground">Open invites</h3>
      {invites.isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">Loading invites…</p>
      ) : invites.error ? (
        <p role="alert" className="text-sm text-destructive">Could not load invites.</p>
      ) : invites.data && invites.data.length > 0 ? (
        <ul>
          {invites.data.map(invite => (
            <li key={invite.id} className="flex items-center justify-between py-2 text-sm shadow-[inset_0_-1px_0_hsl(var(--divider))]">
              <span className="text-muted-foreground">
                {ROLE_LABELS[invite.brand_role]} · created {formatDate(invite.created_at)} · expires {formatDate(invite.expires_at)}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => revoke.mutate(invite.id)} disabled={revoke.isPending}>
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No open invites.</p>
      )}
      {revoke.error && <p role="alert" className="text-sm text-destructive">Could not revoke the invite. {revoke.error.message}</p>}
    </div>
  );
}

export function TeamCard() {
  const { members, currentUserId } = useBrandMembers();
  const { isOwner, canManageBrand } = useBrandRole();

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Team</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {ROLE_HELP} {isOwner ? 'As the owner, you can change roles, remove people and transfer ownership.' : 'Only the owner can change roles.'}
          </p>
          {members.isLoading ? (
            <p role="status" className="text-sm text-muted-foreground">Loading team…</p>
          ) : members.error ? (
            <p role="alert" className="text-sm text-destructive">Could not load your team.</p>
          ) : (
            <ul>
              {members.data?.map(member => (
                <MemberRow key={member.user_id} member={member} isYou={member.user_id === currentUserId} isOwner={isOwner} />
              ))}
            </ul>
          )}
        </div>
        {canManageBrand && <Invites />}
      </CardContent>
    </Card>
  );
}
