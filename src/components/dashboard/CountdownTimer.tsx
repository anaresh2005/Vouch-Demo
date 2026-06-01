import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  deadline: string;
  className?: string;
}

export function CountdownTimer({ deadline, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        expired: false,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft.expired) {
    return (
      <span className={cn('text-destructive', className)}>
        Expired
      </span>
    );
  }

  const isUrgent = timeLeft.hours < 12;
  const isVeryUrgent = timeLeft.hours < 1;

  // Show hours + minutes if >= 1 hour, minutes + seconds if < 1 hour
  const getDisplayValue = () => {
    if (timeLeft.hours >= 1) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.minutes >= 1) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.seconds}s`;
    }
  };

  return (
    <span className={cn(
      'tabular-nums animate-pulse',
      isVeryUrgent ? 'text-destructive' : isUrgent ? 'text-warning' : 'text-foreground',
      className
    )}>
      {getDisplayValue()}
    </span>
  );
}
