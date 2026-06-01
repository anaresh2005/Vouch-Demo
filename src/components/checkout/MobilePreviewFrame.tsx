import { ReactNode, useRef } from 'react';
import { Smartphone } from 'lucide-react';
import iphoneFrame from '@/assets/iphone-frame.png';
import { MobileCheckoutContent } from './MobileCheckoutContent';

interface MobilePreviewFrameProps {
  children?: ReactNode;
}

export function MobilePreviewFrame({ children }: MobilePreviewFrameProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col items-center justify-start py-8 min-h-screen bg-muted/30">
      {/* Phone label */}
      <div className="flex items-center gap-2 mb-4 text-muted-foreground">
        <Smartphone className="h-4 w-4" />
        <span className="text-sm font-medium">Mobile Preview</span>
      </div>
      
      {/* Phone frame container */}
      <div className="relative w-[400px]">
        {/* iPhone frame image */}
        <img 
          src={iphoneFrame} 
          alt="iPhone frame" 
          className="w-full h-auto pointer-events-none select-none relative z-10"
          draggable={false}
        />
        
        {/* Screen content - positioned inside the frame */}
        <div 
          className="absolute bg-background"
          style={{ 
            top: '1.8%',
            left: '3.8%',
            width: '92.4%',
            height: '96.4%',
            borderRadius: '48px',
            overflow: 'hidden',
          }}
        >
          {/* Scrollable wrapper that contains scaled content */}
          <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto overflow-x-hidden"
            style={{ 
              scrollbarWidth: 'none',
            }}
          >
            {/* Scaled content container - 375px width scaled to fit ~370px container */}
            <div 
              className="origin-top-left"
              style={{ 
                width: '375px',
                transform: 'scale(0.985)',
                transformOrigin: 'top left',
              }}
            >
              {children ? children : <MobileCheckoutContent scrollContainerRef={scrollContainerRef} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
