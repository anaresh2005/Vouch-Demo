import { useTour } from '@/hooks/useTour';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

export function WelcomeDialog() {
  const { showWelcome, startTour, dismissWelcome } = useTour();

  return (
    <Dialog open={showWelcome} onOpenChange={(open) => !open && dismissWelcome()}>
      <DialogContent 
        className="sm:max-w-md"
        hideCloseButton
        preventAutoFocus
      >
        <DialogHeader className="text-center space-y-4">
          <div>
            <DialogTitle className="text-2xl font-display">
              Welcome to Vouch
            </DialogTitle>
            <DialogDescription className="mt-3 text-base font-body">
              This is a demo of the brand dashboard. Would you like a quick tour of the key features?
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          <Button 
            onClick={startTour}
            className="w-full vouch-gradient text-primary-foreground font-display gap-2"
            size="lg"
          >
            <Compass className="w-4 h-4" />
            Take the Guided Tour
          </Button>
          <Button 
            variant="ghost" 
            onClick={dismissWelcome}
            className="w-full text-muted-foreground hover:text-foreground font-body"
          >
            I'll explore on my own
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
