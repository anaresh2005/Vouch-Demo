import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import iconWhite from '@/assets/icon-white.png';

interface PayWithPostButtonProps {
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export function PayWithPostButton({ onClick, className, disabled }: PayWithPostButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative w-full h-12 vouch-gradient hover:opacity-90 transition-all duration-200',
        'text-white font-semibold text-base',
        'flex items-center justify-center gap-2',
        className
      )}
    >
      <img src={iconWhite} alt="Vouch" className="h-5 w-5" />
      <span>Post to Pay</span>
    </Button>
  );
}
