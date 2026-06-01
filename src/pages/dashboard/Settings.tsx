import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { mockBrand } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { Save, Instagram, Info, Building2, ShieldCheck, Clock, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { TikTokIcon } from '@/components/icons/TikTokIcon';
import { useEMVSettings, EMV_DEFAULTS } from '@/hooks/useEMVSettings';
import { usePriorityMetric, PriorityMetric } from '@/hooks/usePriorityMetric';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Settings() {
  const { toast } = useToast();
  const [brand, setBrand] = useState(mockBrand);
  const [isSaving, setIsSaving] = useState(false);
  const [maxCheckouts, setMaxCheckouts] = useState(1);
  const [checkoutTimeframe, setCheckoutTimeframe] = useState('30d');
  const [acceptInstagram, setAcceptInstagram] = useState(true);
  const [acceptTiktok, setAcceptTiktok] = useState(true);
  const [timeToPostHours, setTimeToPostHours] = useState(72);

  // EMV settings
  const { settings: emvSettings, saveSettings: saveEMVSettings } = useEMVSettings();
  const [instagramCPEInput, setInstagramCPEInput] = useState(emvSettings.instagramCPE.toString());
  const [tiktokCPEInput, setTiktokCPEInput] = useState(emvSettings.tiktokCPE.toString());
  const [emvErrors, setEmvErrors] = useState<{ instagram?: string; tiktok?: string }>({});

  // Priority metric
  const { priorityMetric, savePriorityMetric } = usePriorityMetric();
  const [selectedPriority, setSelectedPriority] = useState<PriorityMetric>(priorityMetric);

  const handleTimeToPostChange = (value: string) => {
    const hours = parseInt(value) || 72;
    setTimeToPostHours(Math.max(72, hours));
  };

  const validateCPE = (value: string): string | undefined => {
    const num = parseFloat(value);
    if (isNaN(num) || value.trim() === '') return 'Required';
    if (num <= 0) return 'Must be greater than $0';
    if (num > 100) return 'Cannot exceed $100';
    return undefined;
  };


  const handleSave = async () => {
    // Validate and save EMV settings
    const igErr = validateCPE(instagramCPEInput);
    const ttErr = validateCPE(tiktokCPEInput);
    if (igErr || ttErr) {
      setEmvErrors({ instagram: igErr, tiktok: ttErr });
      return;
    }
    saveEMVSettings({
      instagramCPE: parseFloat(instagramCPEInput),
      tiktokCPE: parseFloat(tiktokCPEInput),
    });
    savePriorityMetric(selectedPriority);
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: 'Settings saved',
      description: 'Your brand settings have been updated.',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-display font-medium text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-0.5 text-xs font-body">
            Update your brand information and set your checkout requirements.
          </p>
        </div>

        {/* Brand Info */}
        <Card className="border-border/50">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-sm">Brand Information</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-0.5 rounded hover:bg-muted transition-colors">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Brand Information</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <p className="text-muted-foreground">
                      Basic information about your brand displayed to influencers during checkout and on their order confirmations.
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Brand Name</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        Your brand name as it appears to influencers.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Social Handles</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        Your official social media usernames for influencers to tag in their posts.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start">
              <div className="space-y-1.5">
                <Label htmlFor="brandName" className="text-xs h-4 flex items-center">Brand Name</Label>
                <Input
                  id="brandName"
                  value={brand.name}
                  onChange={(e) => setBrand({ ...brand, name: e.target.value })}
                  className="h-8 text-xs"
                />
                <div className="h-5" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail" className="text-xs h-4 flex items-center">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={brand.contact_email || ''}
                  onChange={(e) => setBrand({ ...brand, contact_email: e.target.value })}
                  className="h-8 text-xs"
                />
                <div className="h-5" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="instagram" className="text-xs h-4 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5" />
                  Instagram
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                    @
                  </span>
                  <Input
                    id="instagram"
                    value={brand.instagram_username || ''}
                    onChange={(e) => setBrand({ ...brand, instagram_username: e.target.value })}
                    className="pl-7 h-8 text-xs"
                    placeholder="yourbrand"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <Checkbox 
                    id="acceptInstagram" 
                    checked={acceptInstagram}
                    onCheckedChange={(checked) => setAcceptInstagram(checked === true)}
                    className="rounded-none h-3.5 w-3.5"
                  />
                  <Label htmlFor="acceptInstagram" className="text-xs text-muted-foreground font-normal cursor-pointer">
                    Accept posts
                  </Label>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tiktok" className="text-xs h-4 flex items-center gap-1.5">
                  <TikTokIcon className="w-3.5 h-3.5" />
                  TikTok
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                    @
                  </span>
                  <Input
                    id="tiktok"
                    value={brand.tiktok_username || ''}
                    onChange={(e) => setBrand({ ...brand, tiktok_username: e.target.value })}
                    className="pl-7 h-8 text-xs"
                    placeholder="yourbrand"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <Checkbox 
                    id="acceptTiktok" 
                    checked={acceptTiktok}
                    onCheckedChange={(checked) => setAcceptTiktok(checked === true)}
                    className="rounded-none h-3.5 w-3.5"
                  />
                  <Label htmlFor="acceptTiktok" className="text-xs text-muted-foreground font-normal cursor-pointer">
                    Accept posts
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Requirements */}
        <Card className="border-border/50">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-sm">Checkout Requirements</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-0.5 rounded hover:bg-muted transition-colors">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Checkout Requirements</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <p className="text-muted-foreground">
                      Set minimum requirements for influencers to use Vouch checkout on your store.
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Minimum Followers</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        Influencers must have at least this many followers to qualify.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Engagement Rate</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        Minimum engagement rate ensures quality audience interaction.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Sponsored Posts Limit</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        Limits influencers with too many recent sponsored posts to maintain authenticity.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Checkout Limits</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        Limit how often an influencer can checkout from your storefront using Vouch.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Time to Post</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        How long influencers have to post after receiving their gift. Minimum 72 hours.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="minFollowers" className="text-xs">Minimum Followers</Label>
                <Input
                  id="minFollowers"
                  type="number"
                  value={brand.min_followers}
                  onChange={(e) => setBrand({ ...brand, min_followers: parseInt(e.target.value) || 0 })}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="minEngagement" className="text-xs">Min. Engagement Rate (%)</Label>
                <Input
                  id="minEngagement"
                  type="number"
                  step="0.1"
                  value={brand.min_engagement_rate}
                  onChange={(e) => setBrand({ ...brand, min_engagement_rate: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="maxSponsored" className="text-xs">Max Sponsored Posts (30d)</Label>
                <Input
                  id="maxSponsored"
                  type="number"
                  value={brand.max_sponsored_posts_30d}
                  onChange={(e) => setBrand({ ...brand, max_sponsored_posts_30d: parseInt(e.target.value) || 0 })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Max Checkouts</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={maxCheckouts}
                    onChange={(e) => setMaxCheckouts(parseInt(e.target.value) || 1)}
                    className="w-16 h-8 text-xs"
                  />
                  <span className="text-muted-foreground text-xs">per</span>
                  <Select value={checkoutTimeframe} onValueChange={setCheckoutTimeframe}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">7 days</SelectItem>
                      <SelectItem value="30d">30 days</SelectItem>
                      <SelectItem value="90d">90 days</SelectItem>
                      <SelectItem value="365d">1 year</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timeToPost" className="text-xs">Time to Post (hours)</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    id="timeToPost"
                    type="number"
                    min="72"
                    value={timeToPostHours}
                    onChange={(e) => handleTimeToPostChange(e.target.value)}
                    onBlur={() => setTimeToPostHours(Math.max(72, timeToPostHours))}
                    className="w-20 h-8 text-xs"
                  />
                  <span className="text-muted-foreground text-xs">hrs</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-md p-3">
              <h4 className="font-medium text-xs mb-1.5">Current Requirements Preview</h4>
              <p className="text-xs text-muted-foreground">
                Influencers must have at least <strong>{brand.min_followers.toLocaleString()}</strong> followers, 
                a minimum <strong>{brand.min_engagement_rate}%</strong> engagement rate, 
                no more than <strong>{brand.max_sponsored_posts_30d}</strong> sponsored posts in the last 30 days,
                and can checkout a maximum of <strong>{maxCheckouts}</strong> time{maxCheckouts !== 1 ? 's' : ''} per <strong>{checkoutTimeframe === 'lifetime' ? 'lifetime' : checkoutTimeframe.replace('d', ' days')}</strong> to use Vouch on your storefront.
                They have <strong>{timeToPostHours >= 168 ? `${Math.floor(timeToPostHours / 24)} days` : `${timeToPostHours} hours`}</strong> to post after receiving their gift.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* EMV Settings */}
        <Card className="border-border/50">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-sm">EMV Calculation</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-0.5 rounded hover:bg-muted transition-colors">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>EMV Calculation Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <p className="text-muted-foreground">
                      Earned Media Value (EMV) estimates the dollar value of organic exposure generated by a post. It is calculated as:
                    </p>
                    <div className="bg-muted/50 rounded-md px-4 py-3 font-mono text-xs">
                      EMV = (likes + comments) × CPE rate
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">CPE (Cost Per Engagement)</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        The estimated dollar value of a single like or comment. Industry benchmarks are $0.25 for Instagram and $0.20 for TikTok, but you can customise these to reflect your brand's actual ad performance or agency rates.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Why different rates per platform?</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        Engagement on Instagram and TikTok carries different commercial value depending on your audience and ad market. Setting platform-specific rates gives you more accurate cross-platform comparisons.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start">
              {/* Instagram CPE */}
              <div className="space-y-1.5">
                <Label htmlFor="instagramCPE" className="text-xs h-4 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5" />
                  Instagram CPE ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">$</span>
                  <Input
                    id="instagramCPE"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    value={instagramCPEInput}
                    onChange={(e) => {
                      setInstagramCPEInput(e.target.value);
                      setEmvErrors(prev => ({ ...prev, instagram: undefined }));
                    }}
                    className={`pl-7 h-8 text-xs ${emvErrors.instagram ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    placeholder="0.25"
                  />
                </div>
                {emvErrors.instagram ? (
                  <p className="text-xs text-destructive">{emvErrors.instagram}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Default: ${EMV_DEFAULTS.instagramCPE}</p>
                )}
              </div>

              {/* TikTok CPE */}
              <div className="space-y-1.5">
                <Label htmlFor="tiktokCPE" className="text-xs h-4 flex items-center gap-1.5">
                  <TikTokIcon className="w-3.5 h-3.5" />
                  TikTok CPE ($)
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">$</span>
                  <Input
                    id="tiktokCPE"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    value={tiktokCPEInput}
                    onChange={(e) => {
                      setTiktokCPEInput(e.target.value);
                      setEmvErrors(prev => ({ ...prev, tiktok: undefined }));
                    }}
                    className={`pl-7 h-8 text-xs ${emvErrors.tiktok ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    placeholder="0.20"
                  />
                </div>
                {emvErrors.tiktok ? (
                  <p className="text-xs text-destructive">{emvErrors.tiktok}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Default: ${EMV_DEFAULTS.tiktokCPE}</p>
                )}
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-muted/50 rounded-md p-3">
              <h4 className="font-medium text-xs mb-1.5">Example EMV Preview</h4>
              <p className="text-xs text-muted-foreground">
                A post with <strong>1,000 likes</strong> and <strong>50 comments</strong> would generate:&nbsp;
                <strong className="text-foreground">
                  ${((1000 + 50) * (parseFloat(instagramCPEInput) > 0 && !isNaN(parseFloat(instagramCPEInput)) ? parseFloat(instagramCPEInput) : EMV_DEFAULTS.instagramCPE)).toFixed(2)} EMV
                </strong> on Instagram and&nbsp;
                <strong className="text-foreground">
                  ${((1000 + 50) * (parseFloat(tiktokCPEInput) > 0 && !isNaN(parseFloat(tiktokCPEInput)) ? parseFloat(tiktokCPEInput) : EMV_DEFAULTS.tiktokCPE)).toFixed(2)} EMV
                </strong> on TikTok.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Priority Performance Metric */}
        <Card className="border-border/50">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-sm">Priority Performance Metric</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="p-0.5 rounded hover:bg-muted transition-colors">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Priority Performance Metric</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <p className="text-muted-foreground">
                      Choose which metric is highlighted in purple across the dashboard. The priority metric is emphasized on post cards, influencer cards, and analytics. All other performance metrics are shown in gray to keep the UI clean and focused.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Sales (default)</span>
                      </div>
                      <p className="text-muted-foreground pl-6">Estimated sales driven by influencer posts, based on sales spike attribution.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">CPM</span>
                      </div>
                      <p className="text-muted-foreground pl-6">Cost per 1,000 views — a measure of gifting efficiency.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">EMV</span>
                      </div>
                      <p className="text-muted-foreground pl-6">Earned Media Value — estimated dollar value of organic exposure from engagements.</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="flex gap-2">
              {(['sales', 'cpm', 'emv'] as PriorityMetric[]).map((metric) => {
                const labels = { sales: 'Sales', cpm: 'CPM', emv: 'EMV' };
                const icons = {
                  sales: <DollarSign className="w-3.5 h-3.5" />,
                  cpm: <BarChart3 className="w-3.5 h-3.5" />,
                  emv: <TrendingUp className="w-3.5 h-3.5" />,
                };
                const isSelected = selectedPriority === metric;
                return (
                  <button
                    key={metric}
                    onClick={() => setSelectedPriority(metric)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {icons[metric]}
                    {labels[metric]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              The selected metric will be highlighted in purple across all dashboard views. Save Changes to apply.
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            size="sm"
            className="vouch-gradient text-primary-foreground text-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

