import { Package, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

interface NextPostInfo {
  orderId: string;
  deadline: string;
  platform: 'instagram' | 'tiktok';
  influencerName: string;
}

interface OrderStatusBarProps {
  awaitingShipment: number;
  creatingContent: number;
  posted: number;
  charged: number;
  nextPost?: NextPostInfo | null;
}

export function OrderStatusBar({ awaitingShipment, creatingContent, posted, charged, nextPost }: OrderStatusBarProps) {
  const total = awaitingShipment + creatingContent + posted + charged;
  
  if (total === 0) {
    return null;
  }

  const awaitingShipmentPercent = (awaitingShipment / total) * 100;
  const creatingPercent = (creatingContent / total) * 100;
  const postedPercent = (posted / total) * 100;
  const chargedPercent = (charged / total) * 100;

  const segments = [
    {
      key: 'awaiting',
      label: 'In Transit',
      count: awaitingShipment,
      percent: awaitingShipmentPercent,
      gradient: 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      icon: Package,
    },
    {
      key: 'creating',
      label: 'Posting',
      count: creatingContent,
      percent: creatingPercent,
      gradient: 'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      icon: Clock,
    },
    {
      key: 'posted',
      label: 'Posted',
      count: posted,
      percent: postedPercent,
      gradient: 'bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle,
    },
    {
      key: 'charged',
      label: 'Charged',
      count: charged,
      percent: chargedPercent,
      gradient: 'bg-gradient-to-r from-rose-400 via-red-400 to-pink-500',
      textColor: 'text-red-600 dark:text-red-400',
      icon: DollarSign,
    },
  ];

  // Calculate cumulative percentages for positioning labels
  let cumulativePercent = 0;

  // Format deadline as countdown timer
  const formatDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return 'Overdue';
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h ${diffMins}m`;
    }
    
    return `${diffHours}h ${diffMins}m`;
  };

  // Format platform name
  const formatPlatform = (platform: 'instagram' | 'tiktok') => {
    return platform === 'instagram' ? 'Instagram' : 'TikTok';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 opacity-80">
      {/* Bar visualization */}
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted">
        {segments.map((segment) => (
          segment.percent > 0 && (
            <div
              key={segment.key}
              className={cn('h-full transition-all duration-500', segment.gradient)}
              style={{ width: `${segment.percent}%` }}
            />
          )
        ))}
      </div>

      {/* Labels positioned at segment starts */}
      <div className="relative mt-2.5">
        <div className="flex">
          {segments.map((segment) => {
            const position = cumulativePercent;
            cumulativePercent += segment.percent;
            
            if (segment.count === 0) return null;
            
            return (
              <div 
                key={segment.key} 
                className="flex items-center gap-1.5"
                style={{ width: `${segment.percent}%` }}
              >
                <segment.icon className={cn('w-3.5 h-3.5 flex-shrink-0', segment.textColor)} />
                <span className="text-sm font-medium text-foreground truncate">
                  {segment.count} {segment.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({segment.percent.toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Post Info */}
      {nextPost && (
        <>
          <Separator className="mt-4" />
          <Link 
            to={`/dashboard/orders?expand=${nextPost.orderId}`}
            className="pt-4 flex items-center gap-2 text-sm hover:text-primary transition-colors"
          >
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Next post due in </span>
            <span className="text-foreground">{formatDeadline(nextPost.deadline)}</span>
            <span className="text-muted-foreground"> on </span>
            <span className="text-foreground">{formatPlatform(nextPost.platform)}</span>
            <span className="text-muted-foreground"> by {nextPost.influencerName}</span>
          </Link>
        </>
      )}
    </div>
  );
}
