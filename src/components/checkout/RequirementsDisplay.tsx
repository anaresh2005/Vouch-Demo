import { Users } from 'lucide-react';
import { BrandRequirements } from '@/types/vouch';

interface RequirementsDisplayProps {
  requirements: BrandRequirements;
  compact?: boolean;
}

export function RequirementsDisplay({ requirements, compact = false }: RequirementsDisplayProps) {
  const items = [
    {
      icon: Users,
      label: 'Followers',
      shortLabel: 'Followers',
      value: `${requirements.min_followers.toLocaleString()}+`,
    },
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {items.map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <item.icon className="h-3 w-3" />
            <span className="text-muted-foreground">{item.shortLabel}</span>
            <span className="font-medium text-foreground">{item.value}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Requirements
      </p>
      <div className="grid grid-cols-1 gap-2">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <item.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
            <p className="text-xs font-semibold text-foreground">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
