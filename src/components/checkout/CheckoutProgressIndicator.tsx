import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckoutStep = 'platform' | 'username' | 'verify' | 'details' | 'confirm';

interface CheckoutProgressIndicatorProps {
  currentStep: CheckoutStep;
}

const steps: CheckoutStep[] = ['platform', 'username', 'verify', 'details', 'confirm'];

export function CheckoutProgressIndicator({ currentStep }: CheckoutProgressIndicatorProps) {
  const currentIndex = steps.findIndex(s => s === currentStep);

  return (
    <div className="flex items-center justify-center gap-1.5 mb-3">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div
            key={step}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              isCompleted && 'bg-primary',
              isCurrent && 'bg-primary ring-2 ring-primary/30',
              index > currentIndex && 'bg-muted'
            )}
          />
        );
      })}
    </div>
  );
}
