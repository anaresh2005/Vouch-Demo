import { VouchOrder } from '@/types/vouch';
import { Package, Truck, Clock, CheckCircle2, CreditCard, AlertCircle, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CountdownTimer } from './CountdownTimer';

interface OrderTimelineProps {
  order: VouchOrder;
}

interface TimelineStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  date: string | null;
  status: 'completed' | 'current' | 'upcoming' | 'failed';
}

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const formatDuration = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  
  if (diffMs < 0) return null;
  
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

const formatCurrency = (amount: number | null, currency: string = 'USD') => {
  if (amount === null) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Carrier tracking URLs
const carrierTrackingUrls: Record<string, { name: string; url: string }> = {
  ups: { name: 'UPS', url: 'https://www.ups.com/track' },
  fedex: { name: 'FedEx', url: 'https://www.fedex.com/fedextrack' },
  usps: { name: 'USPS', url: 'https://tools.usps.com/go/TrackConfirmAction_input' },
  dhl: { name: 'DHL', url: 'https://www.dhl.com/us-en/home/tracking.html' },
};

// Data chip component - label above line, value below, line runs through middle
function DataChip({ label, value, onCopy, muted }: { label: string; value: string; onCopy?: (e: React.MouseEvent) => void; muted?: boolean }) {
  return (
    <div className="flex flex-col items-center px-3 -mt-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">{label}</span>
      {onCopy ? (
        <button
          onClick={onCopy}
          className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded hover:bg-muted-foreground/20 transition-colors mt-2"
        >
          {value}
          <Copy className="w-3 h-3 text-muted-foreground" />
        </button>
      ) : (
        <span className={cn("text-xs mt-2", muted ? "text-muted-foreground" : "font-medium")}>{value}</span>
      )}
    </div>
  );
}

// Tracking chip component with carrier link
function TrackingChip({ 
  trackingNumber, 
  carrier, 
  onCopy 
}: { 
  trackingNumber: string | null; 
  carrier: 'ups' | 'fedex' | 'usps' | 'dhl' | null; 
  onCopy?: (e: React.MouseEvent) => void;
}) {
  const carrierInfo = carrier ? carrierTrackingUrls[carrier] : null;
  const hasTracking = !!trackingNumber;

  return (
    <div className="flex flex-col items-center px-3 -mt-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
        {carrierInfo ? (
          <>
            Shipped with{' '}
            <a
              href={carrierInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              {carrierInfo.name}
            </a>
          </>
        ) : (
          'Tracking'
        )}
      </span>
      {hasTracking && onCopy ? (
        <button
          onClick={onCopy}
          className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded hover:bg-muted-foreground/20 transition-colors mt-2"
        >
          {trackingNumber}
          <Copy className="w-3 h-3 text-muted-foreground" />
        </button>
      ) : (
        <span className="text-xs mt-2 text-muted-foreground">UNAVAILABLE</span>
      )}
    </div>
  );
}

// Countdown chip component - label above line, value below
function CountdownChip({ deadline }: { deadline: string }) {
  return (
    <div className="flex flex-col items-center px-3 -mt-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Time Left</span>
      <CountdownTimer deadline={deadline} className="text-xs font-medium mt-1" />
    </div>
  );
}

// Check if step is in the shipping phase (should use blue)
const isShippingPhaseStep = (stepId: string) => {
  return ['created', 'shipped', 'delivered'].includes(stepId);
};

// Check if step is in the posting phase (should use amber/yellow)
const isPostingPhaseStep = (stepId: string) => {
  return stepId === 'awaiting_post';
};

// Check if step is in the posted/verified phase (should use green)
const isPostedPhaseStep = (stepId: string) => {
  return stepId === 'posted';
};

// Check if step is in the charged phase (should use red)
const isChargedPhaseStep = (stepId: string) => {
  return stepId === 'charged';
};

// Step component
function TimelineStepNode({ step }: { step: TimelineStep }) {
  const useBlue = isShippingPhaseStep(step.id);
  const useAmber = isPostingPhaseStep(step.id);
  const useGreen = isPostedPhaseStep(step.id);
  const useRed = isChargedPhaseStep(step.id);
  
  return (
    <div className="flex flex-col items-center">
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          step.status === 'completed' && useBlue && "bg-blue-500/20 text-blue-600 dark:text-blue-400",
          step.status === 'completed' && useAmber && "bg-amber-500/20 text-amber-600 dark:text-amber-400",
          step.status === 'completed' && useGreen && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          step.status === 'completed' && useRed && "bg-rose-500/20 text-rose-600 dark:text-rose-400",
          step.status === 'completed' && !useBlue && !useAmber && !useGreen && !useRed && "bg-primary/20 text-primary",
          step.status === 'current' && useBlue && "bg-blue-500 text-white",
          step.status === 'current' && useAmber && "bg-amber-500 text-white",
          step.status === 'current' && useGreen && "bg-emerald-500 text-white",
          step.status === 'current' && useRed && "bg-rose-500 text-white",
          step.status === 'current' && !useBlue && !useAmber && !useGreen && !useRed && "bg-primary text-primary-foreground",
          step.status === 'upcoming' && "bg-muted text-muted-foreground",
          step.status === 'failed' && "bg-destructive/20 text-destructive"
        )}
      >
        {step.icon}
      </div>
      <div className="mt-2 text-center">
        <p 
          className={cn(
            "text-xs font-medium",
            step.status === 'upcoming' && "text-muted-foreground",
            step.status === 'failed' && "text-destructive"
          )}
        >
          {step.label}
        </p>
        {step.date && (
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
            {typeof step.date === 'string' && (step.date.startsWith('Due:') || step.date.startsWith('Est:'))
              ? step.date 
              : formatDateTime(step.date)}
          </p>
        )}
      </div>
    </div>
  );
}

// Connector line component
function ConnectorLine({ completed }: { completed: boolean }) {
  return (
    <div className={cn(
      "flex-1 h-0.5 mt-4 min-w-4",
      completed ? 'bg-primary/40' : 'bg-border'
    )} />
  );
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const copyTrackingNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      toast.success('Tracking number copied');
    }
  };

  const isInTransit = order.status === 'pending_delivery';

  // Calculate estimated delivery date based on brand shipping settings or use Shopify's estimate
  const getEstimatedDeliveryDate = () => {
    // Use Shopify's estimated delivery if available
    if (order.estimated_delivery_at) {
      const date = new Date(order.estimated_delivery_at);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Otherwise calculate based on brand's standard shipping days (default 3)
    const shippingDays = order.brand?.estimated_shipping_days ?? 3;
    const created = new Date(order.created_at);
    let businessDays = 0;
    const result = new Date(created);
    while (businessDays < shippingDays) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
    }
    return result.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [];
    
    // Step 1: Order Created
    steps.push({
      id: 'created',
      label: 'Order Created',
      icon: <Package className="w-4 h-4" />,
      date: order.created_at,
      status: 'completed'
    });

    // Step 2: In Transit
    const isDelivered = order.status !== 'pending_delivery';
    steps.push({
      id: 'shipped',
      label: 'In Transit',
      icon: <Truck className="w-4 h-4" />,
      date: order.created_at,
      status: order.status === 'pending_delivery' ? 'current' : 'completed',
    });

    // Step 3: Delivered - show ETA for in-transit orders
    const getDeliveredDate = () => {
      if (order.delivered_at) return order.delivered_at;
      if (order.status === 'pending_delivery') {
        // Show estimated delivery date
        return `Est: ${getEstimatedDeliveryDate()}`;
      }
      return null;
    };
    
    steps.push({
      id: 'delivered',
      label: 'Delivered',
      icon: <CheckCircle2 className="w-4 h-4" />,
      date: getDeliveredDate(),
      status: !isDelivered ? 'upcoming' : 'completed'
    });

    // Step 4: Awaiting Post / Post Verified / Charged
    if (order.status === 'post_pending' || order.status === 'delivered') {
      steps.push({
        id: 'awaiting_post',
        label: 'Awaiting Post',
        icon: <Clock className="w-4 h-4" />,
        date: order.post_deadline ? `Due: ${formatDateTime(order.post_deadline)}` : null,
        status: 'current'
      });
    } else if (order.status === 'post_verified' || order.status === 'completed') {
      steps.push({
        id: 'posted',
        label: 'Post Verified',
        icon: <CheckCircle2 className="w-4 h-4" />,
        date: order.updated_at,
        status: order.status === 'post_verified' ? 'current' : 'completed'
      });
    } else if (order.status === 'charged') {
      steps.push({
        id: 'charged',
        label: 'Charged',
        icon: <CreditCard className="w-4 h-4" />,
        date: order.charged_at,
        status: 'current'
      });
    }

    // Step 5: Completed (if applicable)
    if (order.status === 'completed') {
      steps.push({
        id: 'completed',
        label: 'Completed',
        icon: <CheckCircle2 className="w-4 h-4" />,
        date: order.updated_at,
        status: 'current'
      });
    }

    return steps;
  };

  const steps = getTimelineSteps();

  // Determine which data chips to show between which steps
  const showCostChips = true; // Between created and shipped
  const showCountdownChip = order.post_deadline && 
    (order.status === 'delivered' || order.status === 'post_pending'); // Between delivered and awaiting_post

  return (
    <div className="pt-4 pb-2">
      <div className="flex items-start w-full">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const stepCompleted = step.status === 'completed';

          // Determine what data to show after this step
          let dataChipContent: React.ReactNode = null;
          
          if (step.id === 'created' && showCostChips) {
            dataChipContent = (
              <div className="flex items-center gap-4">
                <DataChip label="Retail" value={formatCurrency(order.order_total, order.currency) || '—'} />
                {order.cogs !== null && (
                  <DataChip label="COGS" value={formatCurrency(order.cogs, order.currency) || '—'} />
                )}
              </div>
            );
          } else if (step.id === 'shipped') {
            // Show tracking chip with carrier link
            dataChipContent = (
              <TrackingChip 
                trackingNumber={order.tracking_number}
                carrier={order.shipping_carrier}
                onCopy={order.tracking_number ? copyTrackingNumber : undefined}
              />
            );
          } else if (step.id === 'delivered') {
            // For in-transit orders, ETA is shown under the step label, so no data chip needed
            // For delivered orders, show countdown, time-to-post, or deadline missed
            if (showCountdownChip && order.post_deadline) {
              dataChipContent = <CountdownChip deadline={order.post_deadline} />;
            } else if ((order.status === 'post_verified' || order.status === 'completed') && order.delivered_at && order.updated_at) {
              const timeToPost = formatDuration(order.delivered_at, order.updated_at);
              if (timeToPost) {
                dataChipContent = <DataChip label="Time to Post" value={timeToPost} />;
              }
            } else if (order.status === 'charged') {
              const chargedTotal = (order.order_total || 0) + (order.sales_tax || 0) + (order.shipping_cost || 0);
              dataChipContent = <DataChip label="Retail + Tax + Shipping" value={formatCurrency(chargedTotal, order.currency) || '—'} />;
            }
          }

          // Get the next step to determine line color
          const nextStep = steps[index + 1];
          
          // Determine line color based on what the line leads TO
          const getLineColor = () => {
            if (!(stepCompleted || step.status === 'failed')) return 'bg-border';
            if (nextStep && isChargedPhaseStep(nextStep.id)) return 'bg-rose-500/40';
            if (nextStep && isPostedPhaseStep(nextStep.id)) return 'bg-emerald-500/40';
            if (nextStep && isPostingPhaseStep(nextStep.id)) return 'bg-amber-500/40';
            if (isShippingPhaseStep(step.id)) return 'bg-blue-500/40';
            return 'bg-primary/40';
          };

          return (
            <div key={step.id} className={cn("flex items-start", isLast ? "" : "flex-1")}>
              <TimelineStepNode step={step} />
              
              {!isLast && (
                <div className="flex-1 flex items-start relative">
                  {/* Continuous line */}
                  <div className={cn(
                    "absolute left-0 right-0 h-0.5 top-4",
                    getLineColor()
                  )} />
                  {/* Data chip overlay */}
                  {dataChipContent && (
                    <div className="flex-1 flex justify-center z-10">
                      {dataChipContent}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
