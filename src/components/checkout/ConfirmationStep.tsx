import { CheckCircle2, Package, Clock, Tag, Camera, CalendarPlus } from 'lucide-react';
import { Instagram } from 'lucide-react';
import { TikTokIcon } from '@/components/icons/TikTokIcon';
import { Button } from '@/components/ui/button';
import { SocialPlatform, CheckoutBrand } from '@/types/vouch';
import { toast } from 'sonner';

interface ConfirmationStepProps {
  orderId: string;
  platform: SocialPlatform;
  username: string;
  brand: CheckoutBrand;
  onClose: () => void;
}

export function ConfirmationStep({
  orderId,
  platform,
  username,
  brand,
  onClose,
}: ConfirmationStepProps) {
  const brandHandle = platform === 'instagram' ? brand.instagramUsername : brand.tiktokUsername;
  const PlatformIcon = platform === 'instagram' ? Instagram : TikTokIcon;

  const handleAddToCalendar = () => {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 72);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const startDate = formatDate(deadline);
    const endDate = formatDate(new Date(deadline.getTime() + 60 * 60 * 1000)); // 1 hour event
    
    const title = `Post for ${brand.name} - Order #${orderId}`;
    const description = `Remember to post on ${platform === 'instagram' ? 'Instagram' : 'TikTok'} and tag @${brandHandle}!\\n\\nOrder #${orderId}`;
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vouch-reminder-${orderId}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Calendar reminder downloaded!');
  };

  return (
    <div className="space-y-3 text-center">
      <div>
        <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
          <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Order Confirmed!</h3>
        <p className="text-xs text-muted-foreground">
          Order #{orderId}
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 text-left space-y-2.5">
        <div>
          <h4 className="text-sm font-semibold text-foreground">It's on the house.</h4>
          <p className="text-[10px] text-muted-foreground">Here's what happens next</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-primary">1</span>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Package className="h-3 w-3 text-muted-foreground" />
                Receive your order
              </p>
              <p className="text-[10px] text-muted-foreground">
                We'll email you tracking info
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-primary">2</span>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                Post in 72h
              </p>
              <p className="text-[10px] text-muted-foreground">
                After delivery
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-primary">3</span>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-muted-foreground" />
                Tag @{brandHandle}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {platform === 'instagram' ? 'Instagram post/reel' : 'TikTok video'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-primary">4</span>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Camera className="h-3 w-3 text-muted-foreground" />
                Feature your purchase
              </p>
              <p className="text-[10px] text-muted-foreground">
                Photo or video of your order
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-2.5">
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <PlatformIcon className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-foreground">@{username}</p>
            <p className="text-[10px] text-muted-foreground">
              We'll detect your post automatically
            </p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        We'll send reminders before the deadline.
      </p>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleAddToCalendar} className="flex-1 h-8 text-xs">
          <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
          Reminder
        </Button>
        <Button onClick={onClose} className="flex-1 h-8 text-xs">
          Done
        </Button>
      </div>
    </div>
  );
}
