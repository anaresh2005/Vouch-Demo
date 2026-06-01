import { CheckCircle2, XCircle, ArrowLeft, Users, TrendingUp, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AccountStats, SocialPlatform } from '@/types/vouch';
import { cn } from '@/lib/utils';

interface EligibilityCheckProps {
  platform: SocialPlatform;
  username: string;
  stats: AccountStats;
  isEligible: boolean;
  reasons: string[];
  onContinue: () => void;
  onTryDifferent: () => void;
  onUseOtherPayment: () => void;
}

export function EligibilityCheck({
  platform,
  username,
  stats,
  isEligible,
  reasons,
  onContinue,
  onTryDifferent,
  onUseOtherPayment,
}: EligibilityCheckProps) {
  if (isEligible) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">You qualify!</h3>
            <p className="text-[10px] text-muted-foreground">Your account meets all requirements</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={stats.profileImageUrl || undefined} alt={username} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground truncate">@{username}</span>
                {stats.verified && (
                  <BadgeCheck className="h-3.5 w-3.5 text-primary fill-primary/20 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.followers.toLocaleString()} followers • {stats.engagementRate}% eng.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onTryDifferent} className="flex-1 h-9 text-sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back
          </Button>
          <Button onClick={onContinue} className="flex-1 h-9 text-sm">
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Not eligible
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
          <XCircle className="h-4 w-4 text-destructive" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Account doesn't qualify</h3>
          <p className="text-[10px] text-muted-foreground">@{username} doesn't meet requirements</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={stats.profileImageUrl || undefined} alt={username} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-foreground truncate">@{username}</span>
              {stats.verified && (
                <BadgeCheck className="h-3 w-3 text-primary fill-primary/20 flex-shrink-0" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {stats.followers.toLocaleString()} followers • {stats.engagementRate}%
            </p>
          </div>
        </div>

        {reasons.map((reason, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg',
              'bg-destructive/5 text-destructive dark:bg-destructive/10'
            )}
          >
            <XCircle className="h-3 w-3 flex-shrink-0" />
            <span>{reason}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={onTryDifferent} className="flex-1 h-9 text-sm">
          Try Different
        </Button>
        <Button variant="outline" onClick={onUseOtherPayment} className="flex-1 h-9 text-sm">
          Other Payment
        </Button>
      </div>
    </div>
  );
}
