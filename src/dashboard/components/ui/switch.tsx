import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@dashboard/lib/utils';

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/** An on/off toggle: a button with the switch role, so screen readers announce "on" or "off". */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(({ checked, onCheckedChange, className, ...props }, ref) => (
  <button ref={ref} type="button" role="switch" aria-checked={checked} onClick={() => onCheckedChange(!checked)}
    className={cn(
      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50',
      checked ? 'bg-primary' : 'bg-border',
      className,
    )} {...props}>
    <span aria-hidden="true" className={cn('block h-4 w-4 rounded-full bg-white shadow transition-transform duration-150', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
  </button>
));
Switch.displayName = 'Switch';
