import { useState } from 'react';
import { Instagram, Loader2, ArrowLeft } from 'lucide-react';
import { TikTokIcon } from '@/components/icons/TikTokIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SocialPlatform, BrandRequirements } from '@/types/vouch';
import { RequirementsDisplay } from './RequirementsDisplay';

interface UsernameInputProps {
  platform: SocialPlatform;
  requirements: BrandRequirements;
  onSubmit: (username: string) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function UsernameInput({
  platform,
  requirements,
  onSubmit,
  onBack,
  isLoading,
}: UsernameInputProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  const PlatformIcon = platform === 'instagram' ? Instagram : TikTokIcon;
  const platformName = platform === 'instagram' ? 'Instagram' : 'TikTok';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <PlatformIcon className="h-4 w-4 text-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Enter your {platformName} username</h3>
          <p className="text-[10px] text-muted-foreground">We'll check if your account qualifies</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
          <Input
            type="text"
            placeholder="your_username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
            className="pl-7 h-9 text-sm"
            disabled={isLoading}
            autoFocus
          />
        </div>

        <RequirementsDisplay requirements={requirements} compact />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1 h-9 text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={!username.trim() || isLoading}
            className="flex-1 h-9 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Account'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
