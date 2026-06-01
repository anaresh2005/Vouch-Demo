import { useEffect, useState, useRef } from 'react';
import { useTour } from '@/hooks/useTour';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

export function TourSpotlight() {
  const { 
    isTourActive, 
    currentStep, 
    totalSteps, 
    currentStepData, 
    nextStep, 
    previousStep, 
    endTour 
  } = useTour();
  
  const [spotlight, setSpotlight] = useState<SpotlightPosition | null>(null);
  const [tooltip, setTooltip] = useState<TooltipPosition | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTourActive || !currentStepData) {
      setSpotlight(null);
      setTooltip(null);
      return;
    }

    const findElement = () => {
      const element = document.querySelector(currentStepData.targetSelector);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = 8;
        
        setSpotlight({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        // Calculate tooltip position
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        const gap = 16;
        
        let tooltipTop = 0;
        let tooltipLeft = 0;
        let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

        const preferredPosition = currentStepData.position || 'bottom';

        switch (preferredPosition) {
          case 'bottom':
            tooltipTop = rect.bottom + gap + padding;
            tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
            arrowPosition = 'top';
            break;
          case 'top':
            tooltipTop = rect.top - tooltipHeight - gap - padding;
            tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
            arrowPosition = 'bottom';
            break;
          case 'right':
            tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
            tooltipLeft = rect.right + gap + padding;
            arrowPosition = 'left';
            break;
          case 'left':
            tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
            tooltipLeft = rect.left - tooltipWidth - gap - padding;
            arrowPosition = 'right';
            break;
        }

        // Keep tooltip in viewport
        tooltipLeft = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, tooltipLeft));
        tooltipTop = Math.max(16, Math.min(window.innerHeight - tooltipHeight - 16, tooltipTop));

        setTooltip({ top: tooltipTop, left: tooltipLeft, arrowPosition });
        setIsAnimating(false);
      } else {
        // Element not found yet, retry
        setSpotlight(null);
        setTooltip(null);
      }
    };

    setIsAnimating(true);
    
    // Small delay to allow page transitions
    const timer = setTimeout(findElement, 300);
    
    // Also listen for resize
    window.addEventListener('resize', findElement);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', findElement);
    };
  }, [isTourActive, currentStepData, currentStep]);

  if (!isTourActive || !currentStepData) {
    return null;
  }

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <>
      {/* Dark overlay with spotlight cutout */}
      <div className="fixed inset-0 z-[100] pointer-events-auto">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {spotlight && (
                <rect
                  x={spotlight.left}
                  y={spotlight.top}
                  width={spotlight.width}
                  height={spotlight.height}
                  rx="12"
                  fill="black"
                  className="transition-all duration-300 ease-out"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* Spotlight border glow */}
      {spotlight && (
        <div
          className="fixed z-[101] pointer-events-none rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-transparent transition-all duration-300 ease-out"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      {/* Tooltip */}
      {tooltip && !isAnimating && (
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-[102] w-80 bg-card border border-border rounded-xl shadow-2xl p-5 animate-fade-in",
          )}
          style={{
            top: tooltip.top,
            left: tooltip.left,
          }}
        >
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-3 h-3 bg-card border-border rotate-45",
              tooltip.arrowPosition === 'top' && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-t",
              tooltip.arrowPosition === 'bottom' && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-r border-b",
              tooltip.arrowPosition === 'left' && "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-b",
              tooltip.arrowPosition === 'right' && "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-r border-t",
            )}
          />

          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-medium text-primary mb-1 block">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <h3 className="text-lg font-display text-foreground">
                {currentStepData.title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={endTour}
              className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground font-body mb-4 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Progress bar */}
          <Progress value={progress} className="h-1 mb-4" />

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={endTour}
              className="text-muted-foreground hover:text-foreground font-body"
            >
              Skip tour
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousStep}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={nextStep}
                className="vouch-gradient text-primary-foreground gap-1"
              >
                {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
                {currentStep < totalSteps - 1 && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
