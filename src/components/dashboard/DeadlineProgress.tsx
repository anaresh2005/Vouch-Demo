import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DeadlineProgressProps {
  deadline: string;
  deliveredAt: string;
  size?: number;
  className?: string;
}

export function DeadlineProgress({ deadline, deliveredAt, size = 56, className }: DeadlineProgressProps) {
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const deliveredTime = new Date(deliveredAt).getTime();
      
      const totalDuration = deadlineTime - deliveredTime;
      const remaining = deadlineTime - now;
      
      if (remaining <= 0) {
        return { 
          progress: 0, 
          timeLeft: { hours: 0, minutes: 0, seconds: 0, expired: true } 
        };
      }
      
      return {
        progress: Math.max(0, Math.min(100, (remaining / totalDuration) * 100)),
        timeLeft: {
          hours: Math.floor(remaining / (1000 * 60 * 60)),
          minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((remaining % (1000 * 60)) / 1000),
          expired: false,
        }
      };
    };

    const result = calculate();
    setProgress(result.progress);
    setTimeLeft(result.timeLeft);

    const timer = setInterval(() => {
      const result = calculate();
      setProgress(result.progress);
      setTimeLeft(result.timeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, deliveredAt]);

  const getColor = () => {
    if (progress > 66.67) {
      return 'hsl(142, 76%, 36%)'; // Green
    } else if (progress > 33.33) {
      return 'hsl(45, 93%, 47%)'; // Yellow/Amber
    } else {
      return 'hsl(0, 84%, 60%)'; // Red
    }
  };

  const getDisplayValue = () => {
    if (timeLeft.expired) return '0s';
    if (timeLeft.hours >= 1) return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    if (timeLeft.minutes >= 1) return `${timeLeft.minutes}m`;
    return `${timeLeft.seconds}s`;
  };

  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span 
        className={cn(
          'text-xs tabular-nums whitespace-nowrap',
          timeLeft.expired ? 'text-destructive' : 'text-muted-foreground'
        )}
      >
        {getDisplayValue()}
      </span>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          className="absolute transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>
      </div>
    </div>
  );
}
