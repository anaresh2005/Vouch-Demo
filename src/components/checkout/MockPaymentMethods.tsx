import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MockPaymentMethodsProps {
  className?: string;
}

export function MockPaymentMethods({ className }: MockPaymentMethodsProps) {
  const methods = [
    {
      name: 'PayPal',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082h-2.19a1.77 1.77 0 0 0-1.748 1.499l-1.187 7.527a.47.47 0 0 0 .464.54h3.372l.847-5.373a.47.47 0 0 1 .464-.402h1.433c3.767 0 6.712-1.53 7.572-5.955.287-1.474.112-2.682-.821-3.631z" />
        </svg>
      ),
      bgClass: 'bg-[#003087] text-white',
    },
    {
      name: 'Apple Pay',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
        </svg>
      ),
      bgClass: 'bg-black text-white',
    },
    {
      name: 'Credit Card',
      icon: <CreditCard className="h-5 w-5" />,
      bgClass: 'bg-muted text-foreground',
    },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      {methods.map((method) => (
        <button
          key={method.name}
          className={cn(
            'w-full h-12 flex items-center justify-center gap-2 rounded-lg',
            'font-semibold text-base',
            'cursor-not-allowed opacity-50',
            method.bgClass
          )}
          disabled
        >
          {method.icon}
          <span>{method.name}</span>
        </button>
      ))}
    </div>
  );
}
