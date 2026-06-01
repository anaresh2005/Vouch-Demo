import { useState, useRef, useEffect, useMemo } from 'react';
import { openExternal } from '@/lib/openExternal';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { getCachedModashData } from '@/lib/modashCache';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Influencer, VouchOrder, VouchPost } from '@/types/vouch';
import { Instagram, ExternalLink, Copy, MapPin, Users, BarChart3, Eye, Heart, MessageCircle, Share2, Clock, Flame, ChevronLeft, ChevronRight, Globe, Languages, ShoppingCart, Link2, Calendar, Search, CircleUserRound, Camera, DollarSign, CheckCircle2, TrendingUp, TrendingDown, Info, X, Zap } from 'lucide-react';
import { exportInfluencerToPDF } from '@/lib/pdfExport';
import { exportInfluencerToMarkdown } from '@/lib/markdownExport';
import { ExportDropdown } from './ExportDropdown';
import vouchIcon from '@/assets/icon-periwinkle.png';
import { useNavigate, Link } from 'react-router-dom';
import { OrderStatusBadge } from './OrderStatusBadge';
import { CountdownTimer } from './CountdownTimer';
import { format } from 'date-fns';
import { TikTokIcon } from '@/components/icons/TikTokIcon';
import { VerifiedInfluencerAvatar } from './VerifiedInfluencerAvatar';

import { VouchVerifiedBadge } from './VouchVerifiedBadge';
import { isTopPerformer, hasPostedForVouch, hasPostedForBrand, getInfluencerBestCPMForBrand, formatCPM, calculatePostEMV, formatEMV } from '@/lib/cpmUtils';
import { useEMVSettings } from '@/hooks/useEMVSettings';
import { usePriorityMetric } from '@/hooks/usePriorityMetric';
import { mockBrand } from '@/lib/mockData';
import { toast } from 'sonner';
import { calculateAllAttributions, getMockSalesData, formatAttribution, ATTRIBUTION_DEFAULTS, getInfluencerAttributedRevenue, getInfluencerEstimatedSales } from '@/lib/attributionUtils';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Gradient IDs for gender chart
const GENDER_GRADIENT_IDS = ['femaleGradient', 'maleGradient', 'otherGenderGradient'];
const GENDER_COLORS = ['#ec4899', '#3b82f6', '#a855f7']; // fallback colors

// Gradient IDs for language chart
const LANGUAGE_GRADIENT_IDS = ['langPeriwinkleGradient', 'langBlueGradient', 'langGreenGradient', 'langAmberGradient', 'langRedGradient'];
const LANGUAGE_COLORS_DISTINCT = ['hsl(236, 73%, 59%)', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']; // periwinkle, blue, green, amber, red
const LANGUAGE_OTHER_GRADIENT_ID = 'langOtherGradient';
const LANGUAGE_OTHER_COLOR = 'hsl(0, 0%, 75%)'; // light grey for "Other"

// Custom tooltip for pie charts that matches app design
const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string; color?: string } }> }) => {
  if (active && payload && payload.length) {
    const fillValue = payload[0].payload.fill;
    const customColor = payload[0].payload.color;
    
    // Use custom color if provided, otherwise try to extract from gradient or use fallback
    let displayColor = customColor;
    if (!displayColor) {
      // Check if fill is a gradient URL and map to fallback color
      if (fillValue?.startsWith('url(#')) {
        const gradientId = fillValue.replace('url(#', '').replace(')', '');
        // Map gradient IDs to their fallback colors
        const gradientColorMap: Record<string, string> = {
          'femaleGradient': '#ec4899',
          'maleGradient': '#3b82f6',
          'otherGenderGradient': '#a855f7',
          'langPeriwinkleGradient': 'hsl(236, 73%, 59%)',
          'langBlueGradient': '#3b82f6',
          'langGreenGradient': '#10b981',
          'langAmberGradient': '#f59e0b',
          'langRedGradient': '#ef4444',
          'langOtherGradient': 'hsl(0, 0%, 75%)',
        };
        displayColor = gradientColorMap[gradientId] || '#888888';
      } else {
        displayColor = fillValue || '#888888';
      }
    }
    
    return (
      <div className="rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: displayColor }}
          />
          <span className="font-medium">{payload[0].name}:</span>
          <span>{payload[0].value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

// Helper to get language gradient ID - majority gets periwinkle, "Other" gets grey, rest get distinct colors
const getLanguageGradientId = (languages: { language: string; percentage: number }[], index: number): string => {
  const lang = languages[index];
  if (lang.language.toLowerCase() === 'other') {
    return LANGUAGE_OTHER_GRADIENT_ID;
  }
  // Find the majority language (highest percentage, excluding "Other")
  const nonOtherLanguages = languages.filter(l => l.language.toLowerCase() !== 'other');
  const majorityLang = nonOtherLanguages.reduce((max, l) => l.percentage > max.percentage ? l : max, nonOtherLanguages[0]);
  
  if (lang.language === majorityLang?.language) {
    return LANGUAGE_GRADIENT_IDS[0]; // Periwinkle for majority
  }
  
  // Assign distinct gradients to other languages (skip periwinkle at index 0)
  const nonMajorityNonOther = languages.filter(l => 
    l.language.toLowerCase() !== 'other' && l.language !== majorityLang?.language
  );
  const langIndex = nonMajorityNonOther.findIndex(l => l.language === lang.language);
  return LANGUAGE_GRADIENT_IDS[(langIndex % (LANGUAGE_GRADIENT_IDS.length - 1)) + 1];
};

// Helper to get language color for legend dots (fallback solid colors)
const getLanguageColor = (languages: { language: string; percentage: number }[], index: number): string => {
  const lang = languages[index];
  if (lang.language.toLowerCase() === 'other') {
    return LANGUAGE_OTHER_COLOR;
  }
  const nonOtherLanguages = languages.filter(l => l.language.toLowerCase() !== 'other');
  const majorityLang = nonOtherLanguages.reduce((max, l) => l.percentage > max.percentage ? l : max, nonOtherLanguages[0]);
  
  if (lang.language === majorityLang?.language) {
    return LANGUAGE_COLORS_DISTINCT[0];
  }
  
  const nonMajorityNonOther = languages.filter(l => 
    l.language.toLowerCase() !== 'other' && l.language !== majorityLang?.language
  );
  const langIndex = nonMajorityNonOther.findIndex(l => l.language === lang.language);
  return LANGUAGE_COLORS_DISTINCT[(langIndex % (LANGUAGE_COLORS_DISTINCT.length - 1)) + 1];
};

interface AudienceData {
  location: { country: string; percentage: number }[];
  cities: { city: string; percentage: number }[];
  languages: { language: string; percentage: number }[];
  age: { range: string; percentage: number }[];
  gender: { type: string; percentage: number }[];
  interests: string[];
  credibility: number | null;
}

interface SocialPost {
  id: string;
  platform: 'instagram' | 'tiktok';
  caption: string;
  thumbnail_url: string | null;
  post_url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  posted_at: string;
  mentions?: string[];
}

interface ModashProfileData {
  followers: number;
  engagementRate: number;
  avgLikes: number;
  avgComments: number;
  avgViews: number;
  avgShares: number;
  postsCount: number;
  postingFrequency: string | null;
  nonSponsoredPostsMedianViews?: number | null;
  nonSponsoredPostsMedianLikes?: number | null;
  sponsoredPostsMedianViews?: number | null;
  sponsoredPostsMedianLikes?: number | null;
  paidPostPerformance?: number | null;
  paidPostPerformanceViews?: number | null;
  audience: {
    countries: { country: string; percentage: number }[];
    cities: { city: string; percentage: number }[];
    languages: { language: string; percentage: number }[];
    ages: { range: string; percentage: number }[];
    genders: { type: string; percentage: number }[];
    interests: string[];
    credibility: number | null;
    notableUsers?: { userId: string; username: string; fullname: string; picture: string | null; followers: number | null; isVerified: boolean; engagementRate: number | null; url: string }[];
  };
  lookalikes?: { userId: string; username: string; fullname: string; picture: string | null; followers: number | null; isVerified: boolean; engagementRate: number | null; url: string }[];
  recentPosts: { id: string; url: string; caption: string; thumbnail: string | null; views: number; likes: number; comments: number; shares: number; created: string }[];
  popularPosts: { id: string; url: string; caption: string; thumbnail: string | null; views: number; likes: number; comments: number; shares: number; created: string }[];
  sponsoredPosts: { id: string; url: string; caption: string; thumbnail: string | null; views: number; likes: number; comments: number; shares: number; created: string; mentions?: string[] }[];
}

// Convert Modash post to SocialPost format
const toSocialPost = (p: ModashProfileData['recentPosts'][0] & { mentions?: string[] }, platform: 'instagram' | 'tiktok'): SocialPost => ({
  id: p.id,
  platform,
  caption: p.caption || '',
  thumbnail_url: p.thumbnail || null,
  post_url: p.url,
  views: p.views || 0,
  likes: p.likes || 0,
  comments: p.comments || 0,
  shares: p.shares || 0,
  posted_at: p.created || new Date().toISOString(),
  mentions: p.mentions,
});

interface InfluencerProfileDialogProps {
  influencer: Influencer;
  orders?: VouchOrder[];
  allPosts?: VouchPost[];
  allOrders?: VouchOrder[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InfluencerProfileDialog({
  influencer,
  orders = [],
  allPosts = [],
  allOrders = [],
  open,
  onOpenChange,
}: InfluencerProfileDialogProps) {
  const formatNumber = (count: number | null) => {
    if (count === null || count === undefined) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const { settings: emvSettings } = useEMVSettings();
  const { getMetricColor, priorityMetric } = usePriorityMetric();
  const influencerPosts = allPosts.filter(p => p.influencer_id === influencer.id);
  const influencerOrders = allOrders.filter(o => o.influencer_id === influencer.id);
  
  // Filter to only posts/orders for this brand with post_verified status (for Vouch Performance metrics)
  const brandVerifiedOrders = influencerOrders.filter(o => o.brand_id === mockBrand.id && o.status === 'post_verified');
  const brandVerifiedPosts = influencerPosts.filter(p => {
    if (p.brand_id !== mockBrand.id) return false;
    const order = influencerOrders.find(o => o.id === p.order_id);
    return order?.status === 'post_verified';
  });
  
  const isTop = isTopPerformer(influencer.id, allPosts, allOrders, priorityMetric, emvSettings);
  const isVerified = hasPostedForVouch(influencer.id, allPosts);

  const [contentView, setContentView] = useState<'recent' | 'popular' | 'sponsored'>('recent');
  const [modashData, setModashData] = useState<ModashProfileData | null>(null);
  const [modashLoading, setModashLoading] = useState(false);

  // Determine primary platform
  const primaryPlatform = orders.length > 0 
    ? orders[0].platform 
    : influencer.instagram_username 
      ? 'instagram' 
      : 'tiktok';

  const primaryUsername = primaryPlatform === 'instagram' 
    ? influencer.instagram_username 
    : influencer.tiktok_username;

  // Load Modash data from cache when dialog opens (no live API calls)
  useEffect(() => {
    if (!open || !primaryUsername) return;
    if (modashData) return;

    const cached = getCachedModashData(primaryPlatform, primaryUsername);
    if (cached) {
      setModashData(cached);
    }
  }, [open, primaryUsername, primaryPlatform, modashData]);

  // Convert Modash posts to SocialPost format
  const recentSocialPosts: SocialPost[] = modashData?.recentPosts
    ?.map(p => toSocialPost(p, primaryPlatform))
    .sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
    .slice(0, 5) || [];

  const popularSocialPosts: SocialPost[] = modashData?.popularPosts
    ?.map(p => toSocialPost(p, primaryPlatform))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5) || [];

  // If no separate popular posts, use recent sorted by views
  const effectivePopularPosts = popularSocialPosts.length > 0 
    ? popularSocialPosts 
    : [...recentSocialPosts].sort((a, b) => b.views - a.views);

  // Sponsored posts from Modash + Vouch posts
  const modashSponsoredPosts: SocialPost[] = modashData?.sponsoredPosts
    ?.map(p => toSocialPost(p, primaryPlatform)) || [];
  
  // Convert Vouch posts to SocialPost format and merge
  const vouchPostsAsSocial: SocialPost[] = influencerPosts.map(post => ({
    id: post.id,
    platform: post.platform,
    caption: `Sponsored post via Vouch`,
    thumbnail_url: null,
    post_url: post.post_url,
    views: post.views || 0,
    likes: post.likes || 0,
    comments: post.comments || 0,
    shares: 0,
    posted_at: post.detected_at,
  }));
  
  const allSponsoredPosts = [...modashSponsoredPosts, ...vouchPostsAsSocial];
  const sponsoredSocialPosts = [...allSponsoredPosts]
    .sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
    .slice(0, 5);
  
  const featuredPosts = contentView === 'recent' 
    ? recentSocialPosts 
    : contentView === 'popular' 
      ? effectivePopularPosts 
      : sponsoredSocialPosts;

  // Audience data from Modash (with fallback)
  const defaultAudience: AudienceData = {
    location: [{ country: 'No data available', percentage: 100 }],
    cities: [],
    languages: [{ language: 'No data available', percentage: 100 }],
    age: [{ range: '18-24', percentage: 50 }, { range: '25-34', percentage: 35 }, { range: '35-44', percentage: 15 }],
    gender: [{ type: 'Unknown', percentage: 100 }],
    interests: [],
    credibility: null,
  };

  const audienceData: AudienceData = modashData?.audience ? {
    location: modashData.audience.countries.length > 0 ? modashData.audience.countries : defaultAudience.location,
    cities: modashData.audience.cities,
    languages: modashData.audience.languages.length > 0 ? modashData.audience.languages : defaultAudience.languages,
    age: modashData.audience.ages.length > 0 ? modashData.audience.ages : defaultAudience.age,
    gender: modashData.audience.genders.length > 0 ? modashData.audience.genders : defaultAudience.gender,
    interests: modashData.audience.interests,
    credibility: modashData.audience.credibility,
  } : defaultAudience;

  // Platform stats from Modash
  const getMedian = (values: number[]) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.floor((sorted[mid - 1] + sorted[mid]) / 2);
  };

  // Calculate posting cadence from recent posts
  const getPostingCadence = (): string | null => {
    if (modashData?.postingFrequency) return modashData.postingFrequency;
    const posts = modashData?.recentPosts || [];
    if (posts.length < 2) return null;
    const sorted = [...posts].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    const newest = new Date(sorted[0].created);
    const oldest = new Date(sorted[sorted.length - 1].created);
    const days = (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24);
    const avgDays = days / (sorted.length - 1);
    const perWeek = 7 / avgDays;
    if (perWeek >= 1) return `~${Math.round(perWeek)}/wk`;
    return `~${Math.round(30 / avgDays)}/mo`;
  };

  // Calculate averages from recentPosts as fallback when Modash doesn't provide them
  const computedAvgs = (() => {
    const posts = modashData?.recentPosts || [];
    if (posts.length === 0) return { avgViews: null, avgLikes: null, avgComments: null, avgShares: null };
    const avg = (arr: number[]) => {
      const valid = arr.filter(v => v != null && v > 0);
      return valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
    };
    return {
      avgViews: avg(posts.map(p => p.views)),
      avgLikes: avg(posts.map(p => p.likes)),
      avgComments: avg(posts.map(p => p.comments)),
      avgShares: avg(posts.map(p => p.shares)),
    };
  })();

  // For Instagram, Modash provides nonSponsoredPostsMedianViews as a Reels-based avg views fallback
  const modashMedianViews = modashData?.nonSponsoredPostsMedianViews ?? null;

  // Calculate ER using Modash Discovery API methodology (fallback when Modash doesn't provide it)
  const recentEngagementRate = (() => {
    // If Modash provides a nonzero ER, use it directly
    if (modashData?.engagementRate && modashData.engagementRate > 0) return modashData.engagementRate;
    // Fallback: calculate from recentPosts using Discovery API methodology
    const posts = modashData?.recentPosts || [];
    if (posts.length === 0) return null;
    // 30-post window — matches Discovery API
    const recent = posts.slice(0, 30);
    if (primaryPlatform === 'tiktok') {
      // TikTok: per-post ER = (likes + comments) / views, averaged across posts with views
      const withViews = recent.filter(p => (p.views ?? 0) > 0);
      if (withViews.length === 0) return null;
      const totalRate = withViews.reduce((sum, p) => sum + ((p.likes ?? 0) + (p.comments ?? 0)) / p.views, 0);
      return Math.round((totalRate / withViews.length) * 1000) / 10;
    } else {
      // Instagram: (avg engagement / followers) with 3x-median outlier filter
      const followers = modashData?.followers || influencer.instagram_followers;
      if (!followers || followers === 0) return null;
      const engagements = recent.map(p => (p.likes ?? 0) + (p.comments ?? 0));
      const sorted = [...engagements].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const threshold = median * 3;
      const filtered = engagements.filter(e => e <= threshold);
      // Fallback to full sample if filter removes everything (median is 0)
      const sample = filtered.length > 0 ? filtered : engagements;
      const avgEngagement = sample.reduce((a, b) => a + b, 0) / sample.length;
      return Math.round((avgEngagement / followers) * 1000) / 10;
    }
  })();

  // Resolve avgViews: Modash direct > computed from posts > Modash median views (Instagram Reels)
  const resolvedAvgViews = (modashData?.avgViews && modashData.avgViews > 0)
    ? modashData.avgViews
    : (computedAvgs.avgViews && computedAvgs.avgViews > 0)
      ? computedAvgs.avgViews
      : modashMedianViews;

  const platformStats = {
    postCount: modashData?.postsCount || 0,
    avgViews: resolvedAvgViews,
    avgLikes: (modashData?.avgLikes && modashData.avgLikes > 0) ? modashData.avgLikes : computedAvgs.avgLikes,
    avgComments: (modashData?.avgComments && modashData.avgComments > 0) ? modashData.avgComments : computedAvgs.avgComments,
    avgShares: (modashData?.avgShares && modashData.avgShares > 0) ? modashData.avgShares : computedAvgs.avgShares,
    medianViews: getMedian(recentSocialPosts.map(p => p.views).filter(v => v > 0)),
    medianLikes: getMedian(recentSocialPosts.map(p => p.likes).filter(v => v > 0)),
    postingCadence: getPostingCadence(),
    recentEngagementRate,
  };

  const sponsoredStats = {
    medianViews: getMedian(allSponsoredPosts.map(p => p.views)),
    medianLikes: getMedian(allSponsoredPosts.map(p => p.likes)),
  };

  // Vouch Performance metrics (still from mock data)
  const brandOrders = influencerOrders.filter(o => o.brand_id === mockBrand.id);
  const totalRetailValue = brandOrders.reduce((sum, o) => sum + o.order_total, 0);
  const totalCOGS = brandOrders.reduce((sum, o) => sum + (o.cogs || 0), 0);
  const totalViews = brandVerifiedPosts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = brandVerifiedPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const hasPostedForThisBrand = hasPostedForBrand(influencer.id, mockBrand.id, allPosts, allOrders);
  const bestCPM = getInfluencerBestCPMForBrand(influencer.id, mockBrand.id, allPosts, allOrders);

  // Avg EMV across all Vouch posts for this brand
  const avgEMV = useMemo(() => {
    if (brandVerifiedPosts.length === 0) return null;
    const total = brandVerifiedPosts.reduce((sum, p) => sum + calculatePostEMV(p, emvSettings), 0);
    return total / brandVerifiedPosts.length;
  }, [brandVerifiedPosts, emvSettings]);

  // Sales attribution stats
  const attributionStats = useMemo(() => {
    const salesData = getMockSalesData();
    const allAttributions = calculateAllAttributions(influencerPosts, allOrders, salesData, ATTRIBUTION_DEFAULTS);
    const spiked = allAttributions.filter(a => a.spikeDetected);
    const totalAttributed = getInfluencerAttributedRevenue(influencer.id, allAttributions);
    const estimatedSales = getInfluencerEstimatedSales(influencer.id, allAttributions);
    const bestPost = [...spiked].sort((a, b) => b.attributedRevenue - a.attributedRevenue)[0];
    const avgConfidence = spiked.length > 0
      ? Math.round(spiked.reduce((s, a) => s + a.confidenceScore, 0) / spiked.length)
      : 0;
    return { spiked, totalAttributed, estimatedSales, bestPost, avgConfidence };
  }, [influencerPosts, allOrders, influencer.id]);

  const handleExportPDF = async () => {
    await exportInfluencerToPDF(influencer, orders, allPosts, allOrders, mockBrand.id);
  };

  const handleExportMarkdown = () => {
    exportInfluencerToMarkdown(influencer, orders, allPosts, allOrders, mockBrand.id);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setIsScrolled(el.scrollTop > 12);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden" hideCloseButton>
        <div ref={scrollRef} className="overflow-y-auto overflow-x-hidden max-h-[90vh] p-6 relative">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {influencer.full_name || 'Influencer'} Profile
          </DialogTitle>
        </DialogHeader>

        {/* Header Section */}
        <div className="pb-3 border-b border-border space-y-4">
          <div className="flex items-start gap-3">
            <VerifiedInfluencerAvatar 
              initial={influencer.full_name?.charAt(0) || influencer.email.charAt(0).toUpperCase()}
              imageUrl={influencer.profile_image_url}
              isVerified={isVerified}
              size="lg"
            />
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-medium">
                  {influencer.full_name || 'Unknown'}
                </h2>
                {isTop && (
                  <Badge variant="outline" className="text-[11px] h-5 px-2 bg-primary/10 border-primary/20 text-primary font-medium">
                    Top 10%
                  </Badge>
                )}
                <Badge variant="outline" className="text-[11px] h-5 px-2 bg-muted border-border text-muted-foreground">
                  {influencer.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {influencer.bio && (
                  <>
                    {influencer.bio}
                    <span className="mx-1.5">•</span>
                  </>
                )}
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(influencer.email);
                    toast.success('Email copied to clipboard');
                  }}
                  className="hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1 group"
                >
                  {influencer.email}
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </p>
            </div>
            {/* Action icons aligned with name row */}
            <div className={`flex items-center gap-0.5 rounded-md px-1 py-0.5 shrink-0 -mt-0.5 transition-all duration-200 ${isScrolled ? 'sticky top-0 z-[60] bg-background/90 backdrop-blur-sm' : ''}`}>
              <ExportDropdown
                onExportPDF={handleExportPDF}
                onExportMarkdown={handleExportMarkdown}
              />
              <DialogPrimitive.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none h-8 w-8 flex items-center justify-center">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>
          </div>
        </div>

        {/* Social Presence */}
        <div className="py-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-muted-foreground flex items-center gap-2">
              <CircleUserRound className="w-4 h-4" />
              Social Presence
            </h3>
            <Dialog>
              <DialogTrigger asChild>
                <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Social Presence Metrics</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Posts</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Total number of posts on the platform. Sourced from Modash.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Followers</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Current follower count on the platform. Sourced from Modash.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Engagement Rate (ER)</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Average engagement as a percentage of followers, calculated from recent posts.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Views (Avg / Organic Med / Sponsored Med)</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Average views across all posts, median views on organic content, and median views on sponsored content.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Likes (Avg / Organic Med / Sponsored Med)</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Average likes across all posts, median likes on organic content, and median likes on sponsored content.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Platform Card */}
          <div className="p-2.5 rounded-lg bg-card border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {primaryPlatform === 'instagram' ? (
                  <Instagram className="w-4 h-4" style={{ stroke: 'url(#instagram-gradient)' }} />
                ) : (
                  <TikTokIcon className="w-4 h-4" />
                )}
                {/* Instagram gradient definition */}
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f09433" />
                      <stop offset="25%" stopColor="#e6683c" />
                      <stop offset="50%" stopColor="#dc2743" />
                      <stop offset="75%" stopColor="#cc2366" />
                      <stop offset="100%" stopColor="#bc1888" />
                    </linearGradient>
                  </defs>
                </svg>
                <button
                  onClick={() => openExternal(primaryPlatform === 'instagram' 
                    ? `https://instagram.com/${influencer.instagram_username}`
                    : `https://tiktok.com/@${influencer.tiktok_username}`)}
                  className="text-xs font-medium transition-colors hover:text-primary cursor-pointer"
                >
                  @{primaryPlatform === 'instagram' ? influencer.instagram_username : influencer.tiktok_username}
                </button>
              </div>
              {/* Also On Tag - platform colored, clickable */}
              {primaryPlatform === 'instagram' && influencer.tiktok_username && (
                <button
                  onClick={() => openExternal(`https://tiktok.com/@${influencer.tiktok_username}`)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-foreground/90 text-background text-xs font-medium transition-opacity hover:opacity-80 cursor-pointer"
                >
                  Also on
                  <TikTokIcon className="w-3 h-3" />
                </button>
              )}
              {primaryPlatform === 'tiktok' && influencer.instagram_username && (
                <button
                  onClick={() => openExternal(`https://instagram.com/${influencer.instagram_username}`)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium transition-opacity hover:opacity-80 cursor-pointer"
                  style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', color: 'white' }}
                >
                  Also on
                  <Instagram className="w-3 h-3" />
                </button>
                
              )}
            </div>

            {/* Stats - organized subcards */}
            <div className="grid grid-cols-3 gap-2">
              {/* Overview */}
              <div className="rounded-md bg-muted/40 px-2.5 py-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Camera className="w-3 h-3" />
                  <span className="text-[10px] font-medium uppercase tracking-wide">Overview</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Posts</span>
                  <span className="font-medium">{platformStats.postCount}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Followers</span>
                  <span className="font-medium">{formatNumber(primaryPlatform === 'instagram' ? influencer.instagram_followers : influencer.tiktok_followers)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">ER</span>
                  <span className="font-medium">
                    {platformStats.recentEngagementRate != null && platformStats.recentEngagementRate > 0
                      ? `${platformStats.recentEngagementRate}%`
                      : (primaryPlatform === 'instagram' ? influencer.instagram_engagement_rate : influencer.tiktok_engagement_rate) 
                        ? `${primaryPlatform === 'instagram' ? influencer.instagram_engagement_rate : influencer.tiktok_engagement_rate}%`
                        : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Cadence</span>
                  <span className="font-medium">{platformStats.postingCadence || '—'}</span>
                </div>
              </div>

              {/* Averages */}
              <div className="rounded-md bg-muted/40 px-2.5 py-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <BarChart3 className="w-3 h-3" />
                  <span className="text-[10px] font-medium uppercase tracking-wide">Averages</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium">{platformStats.avgViews ? formatNumber(platformStats.avgViews) : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Likes</span>
                  <span className="font-medium">{platformStats.avgLikes ? formatNumber(platformStats.avgLikes) : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Comments</span>
                  <span className="font-medium">{platformStats.avgComments ? formatNumber(platformStats.avgComments) : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Shares</span>
                  <span className="font-medium">{platformStats.avgShares ? formatNumber(platformStats.avgShares) : '—'}</span>
                </div>
              </div>

              {/* Medians */}
              <div className="rounded-md bg-muted/40 px-2.5 py-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Eye className="w-3 h-3" />
                  <span className="text-[10px] font-medium uppercase tracking-wide">Medians</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Org Views</span>
                  <span className="font-medium">{platformStats.medianViews > 0 ? formatNumber(platformStats.medianViews) : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Org Likes</span>
                  <span className="font-medium">{platformStats.medianLikes > 0 ? formatNumber(platformStats.medianLikes) : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Spon Views</span>
                  <span className="font-medium">{sponsoredStats.medianViews > 0 ? formatNumber(sponsoredStats.medianViews) : '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Spon Likes</span>
                  <span className="font-medium">{sponsoredStats.medianLikes > 0 ? formatNumber(sponsoredStats.medianLikes) : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vouch Stats */}
        <div className="py-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-muted-foreground flex items-center gap-2">
              <img src={vouchIcon} alt="Vouch" className="w-3 h-3 opacity-50 brightness-0 dark:invert" />
              Vouch Performance
            </h3>
            <Dialog>
              <DialogTrigger asChild>
                <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Vouch Performance Metrics</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Retail</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Total retail value of products gifted through Vouch orders with verified posts.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">COGS</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Cost of goods sold for products gifted through Vouch orders with verified posts.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Views</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Total views across all Vouch posts for your brand.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Likes</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Total likes across all Vouch posts for your brand.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">CPM (Cost Per Mille)</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Cost per 1,000 views: ((COGS + tax + shipping) ÷ views) × 1,000. Lower is better.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {/* Performance Metrics - Compact Cards */}
          <div className="grid grid-cols-4 gap-1.5 mb-1.5">
            <div className="px-2 py-1.5 rounded-md bg-card border border-border/50 flex flex-col items-center justify-center">
              <span className="text-xs font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalRetailValue)}</span>
              <span className="text-[10px] text-muted-foreground">Retail</span>
            </div>
            <div className="px-2 py-1.5 rounded-md bg-card border border-border/50 flex flex-col items-center justify-center">
              <span className="text-xs font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalCOGS)}</span>
              <span className="text-[10px] text-muted-foreground">COGS</span>
            </div>
            <div className="px-2 py-1.5 rounded-md bg-card border border-border/50 flex flex-col items-center justify-center">
              <span className="text-xs font-medium">{hasPostedForThisBrand ? formatNumber(totalViews) : '—'}</span>
              <span className="text-[10px] text-muted-foreground">Views</span>
            </div>
            <div className="px-2 py-1.5 rounded-md bg-card border border-border/50 flex flex-col items-center justify-center">
              <span className="text-xs font-medium">{hasPostedForThisBrand ? formatNumber(totalLikes) : '—'}</span>
              <span className="text-[10px] text-muted-foreground">Likes</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            <div className={`px-2 py-1.5 rounded-md border ${getMetricColor('cpm').border} ${getMetricColor('cpm').gradient} flex flex-col items-center justify-center`}>
              <span className={`text-xs font-medium ${getMetricColor('cpm').text}`}>{hasPostedForThisBrand ? formatCPM(bestCPM) : '—'}</span>
              <span className="text-[10px] text-muted-foreground">CPM</span>
            </div>
            <div className={`px-2 py-1.5 rounded-md border ${getMetricColor('emv').border} ${getMetricColor('emv').gradient} flex flex-col items-center justify-center`}>
              <span className={`text-xs font-medium ${getMetricColor('emv').text}`}>{hasPostedForThisBrand && avgEMV !== null ? formatEMV(avgEMV) : '—'}</span>
              <span className="text-[10px] text-muted-foreground">Avg EMV</span>
            </div>
            <div className={`px-2 py-1.5 rounded-md border ${getMetricColor('sales').border} ${getMetricColor('sales').gradient} flex flex-col items-center justify-center`}>
              <span className={`text-xs font-medium ${getMetricColor('sales').text}`}>
                {attributionStats.estimatedSales > 0 ? formatAttribution(attributionStats.estimatedSales) : '—'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Est. Sales{attributionStats.spiked.length > 0 ? ` (${attributionStats.spiked.length} spike${attributionStats.spiked.length > 1 ? 's' : ''})` : ''}
              </span>
            </div>
            <div className="px-2 py-1.5 rounded-md bg-card border border-border/50 flex flex-col items-center justify-center">
              <span className="text-xs font-medium">{attributionStats.spiked.length > 0 ? `${attributionStats.avgConfidence}%` : '—'}</span>
              <span className="text-[10px] text-muted-foreground">Confidence</span>
            </div>
          </div>

          {/* Order Cards */}
          {orders.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground mb-1.5">Orders ({orders.length})</p>
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-card border border-border/50 text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    onOpenChange(false);
                    window.location.href = `/dashboard/orders?expand=${order.id}`;
                  }}
                >
                  <div className="flex items-center gap-3">
                    {order.shopify_order_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          openExternal(`https://admin.shopify.com/store/orders/${order.shopify_order_id}`);
                        }}
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                        {order.shopify_order_id}
                      </Button>
                    )}
                    <span className="text-muted-foreground">
                      {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
                    </span>
                    <span className="text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.status === 'pending_delivery' && order.estimated_delivery_at && (
                      <span className="text-xs text-muted-foreground">
                        Est. {format(new Date(order.estimated_delivery_at), 'MMM d')}
                      </span>
                    )}
                    {order.status === 'post_pending' && order.post_deadline && (
                      <CountdownTimer deadline={order.post_deadline} className="text-xs" />
                    )}
                    {order.status === 'charged' && (
                      <span className="text-xs text-muted-foreground">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format((order.order_total || 0) + (order.sales_tax || 0) + (order.shipping_cost || 0))}
                      </span>
                    )}
                    {order.status === 'post_verified' && (
                      <Link
                        to={`/dashboard/posts?order=${order.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChange(false);
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Link2 className="w-3 h-3" />
                        LIVE
                      </Link>
                    )}
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>


        {/* Featured Content */}
        <div className="py-3 border-b border-border overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm text-muted-foreground flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Featured Content
                </h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Featured Content</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Recent</span>
                        </div>
                        <p className="text-muted-foreground pl-6">
                          Most recently posted content, sorted by date.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Popular</span>
                        </div>
                        <p className="text-muted-foreground pl-6">
                          Top performing content sorted by view count.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Sponsored</span>
                        </div>
                        <p className="text-muted-foreground pl-6">
                          All sponsored content including #ad, paid partnerships, and Vouch posts. Posts with Vouch icon are from your brand.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center gap-2">
                <ToggleGroup 
                  type="single" 
                  value={contentView} 
                  onValueChange={(value) => value && setContentView(value as 'recent' | 'popular' | 'sponsored')}
                  className="h-8"
                >
                  <ToggleGroupItem value="recent" aria-label="Recent" className="h-7 px-3 text-xs gap-1">
                    <Clock className="w-3 h-3" />
                    Recent
                  </ToggleGroupItem>
                  <ToggleGroupItem value="popular" aria-label="Most Popular" className="h-7 px-3 text-xs gap-1">
                    <Flame className="w-3 h-3" />
                    Popular
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="sponsored" 
                    aria-label="Sponsored" 
                    className="h-7 px-3 text-xs gap-1 data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
                  >
                    <DollarSign className="w-3 h-3" />
                    Sponsored
                  </ToggleGroupItem>
                </ToggleGroup>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const container = document.getElementById('featured-content-scroll');
                      if (container) {
                        const cardWidth = 230; // width for 2.5 cards visible
                        const gap = 16; // gap-4
                        const scrollAmount = cardWidth + gap;
                        const currentScroll = container.scrollLeft;
                        const targetScroll = Math.max(0, Math.floor(currentScroll / scrollAmount) * scrollAmount - scrollAmount);
                        container.scrollTo({ left: targetScroll, behavior: 'smooth' });
                      }
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const container = document.getElementById('featured-content-scroll');
                      if (container) {
                        const cardWidth = 230; // width for 2.5 cards visible
                        const gap = 16; // gap-4
                        const scrollAmount = cardWidth + gap;
                        const currentScroll = container.scrollLeft;
                        const targetScroll = Math.ceil(currentScroll / scrollAmount) * scrollAmount + scrollAmount;
                        container.scrollTo({ left: targetScroll, behavior: 'smooth' });
                      }
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div 
              id="featured-content-scroll"
              className="flex gap-4 overflow-x-auto pb-2 scroll-smooth -mx-6"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {modashLoading && featuredPosts.length === 0 && (
                <div className="ml-6 flex items-center justify-center text-muted-foreground text-sm py-8 w-full">
                  Loading content...
                </div>
              )}
              {!modashLoading && featuredPosts.length === 0 && (
                <div className="ml-6 flex items-center justify-center text-muted-foreground text-sm py-8 w-full">
                  No content available
                </div>
              )}
              {featuredPosts.map((post, index) => (
                <Card 
                  key={post.id} 
                  className={`glass overflow-hidden group flex-shrink-0 ${index === 0 ? 'ml-6' : ''} ${index === featuredPosts.length - 1 ? 'mr-6' : ''}`}
                  style={{ width: '230px' }}
                >
                  <div className="aspect-video bg-muted/50 flex items-center justify-center relative overflow-hidden">
                    {post.thumbnail_url ? (
                      <>
                        <img 
                          src={post.thumbnail_url} 
                          alt={post.caption || 'Post thumbnail'} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="text-muted-foreground text-sm w-full h-full items-center justify-center absolute inset-0" style={{ display: 'none' }}>
                          Post Preview
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        Post Preview
                      </div>
                    )}
                    {/* Brand mention label for sponsored posts */}
                    {contentView === 'sponsored' && post.mentions && post.mentions.length > 0 && (() => {
                      const creatorHandle = primaryUsername?.toLowerCase().replace('@', '') || '';
                      const brandMention = post.mentions.find(m => m.toLowerCase() !== creatorHandle);
                      return brandMention ? (
                        <div className="absolute top-1.5 left-1.5 z-10">
                          <span className="text-[10px] font-medium bg-primary/90 backdrop-blur-sm text-primary-foreground px-1.5 py-0.5 rounded-md">
                            @{brandMention}
                          </span>
                        </div>
                      ) : null;
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <Button size="sm" variant="secondary" onClick={() => openExternal(post.post_url)}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Post
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(post.views)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {formatNumber(post.likes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {formatNumber(post.comments)}
                        </span>
                      </div>
                      {influencerPosts.some(vp => vp.post_url === post.post_url) && (
                        <img src={vouchIcon} alt="Vouch" className="w-3 h-3" />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.posted_at).toLocaleDateString()}
                      </p>
                      <div className="text-muted-foreground">
                        {post.platform === 'instagram' ? (
                          <Instagram className="w-4 h-4" />
                        ) : (
                          <TikTokIcon className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Audience Data */}
        <div className="py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Audience Insights
            </h3>
            <Dialog>
              <DialogTrigger asChild>
                <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Audience Insights</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Top Countries & Cities</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Geographic distribution of the influencer's followers.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Top Languages</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Primary languages spoken by the influencer's audience.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Gender & Age Distribution</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Demographic breakdown of the influencer's followers by gender and age range.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Credibility</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Percentage of authentic followers vs. bot/fake accounts.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">

          {/* Location & Cities - Condensed Lists */}
          <div className="grid grid-cols-2 gap-3">
            {/* Top Countries */}
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <div className="mb-2">
                <span className="text-sm">Top Countries</span>
              </div>
              <ul className="space-y-1">
                {audienceData.location.map((loc, idx) => (
                  <li key={loc.country} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{idx + 1}. {loc.country}</span>
                    <span>{loc.percentage}%</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Cities */}
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <div className="mb-2">
                <span className="text-sm">Top Cities</span>
              </div>
              <ul className="space-y-1">
                {audienceData.cities.length > 0 ? audienceData.cities.map((city, idx) => (
                  <li key={city.city} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{idx + 1}. {city.city}</span>
                    <span>{city.percentage}%</span>
                  </li>
                )) : (
                  <li className="text-sm text-muted-foreground">No city data available</li>
                )}
              </ul>
            </div>
          </div>

          {/* Languages & Gender - Pie Charts */}
          <div className="grid grid-cols-2 gap-3">
            {/* Languages Pie Chart */}
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <div className="mb-2">
                <span className="text-sm">Top Languages</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="langPeriwinkleGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(250, 85%, 75%)" />
                          <stop offset="50%" stopColor="hsl(236, 73%, 59%)" />
                          <stop offset="100%" stopColor="hsl(220, 70%, 55%)" />
                        </linearGradient>
                        <linearGradient id="langBlueGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(206, 89%, 62%)" />
                          <stop offset="50%" stopColor="hsl(217, 91%, 60%)" />
                          <stop offset="100%" stopColor="hsl(221, 83%, 53%)" />
                        </linearGradient>
                        <linearGradient id="langGreenGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(142, 71%, 55%)" />
                          <stop offset="50%" stopColor="hsl(160, 84%, 39%)" />
                          <stop offset="100%" stopColor="hsl(174, 84%, 38%)" />
                        </linearGradient>
                        <linearGradient id="langAmberGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(45, 93%, 67%)" />
                          <stop offset="50%" stopColor="hsl(43, 96%, 58%)" />
                          <stop offset="100%" stopColor="hsl(38, 92%, 50%)" />
                        </linearGradient>
                        <linearGradient id="langRedGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(351, 83%, 67%)" />
                          <stop offset="50%" stopColor="hsl(0, 84%, 65%)" />
                          <stop offset="100%" stopColor="hsl(330, 81%, 65%)" />
                        </linearGradient>
                        <linearGradient id="langOtherGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(0, 0%, 80%)" />
                          <stop offset="100%" stopColor="hsl(0, 0%, 65%)" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={audienceData.languages.map(l => ({ name: l.language, value: l.percentage }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {audienceData.languages.map((_, index) => (
                          <Cell key={`lang-cell-${index}`} fill={`url(#${getLanguageGradientId(audienceData.languages, index)})`} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-1 flex-1">
                  {audienceData.languages.map((lang, idx) => (
                    <li key={lang.language} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: getLanguageColor(audienceData.languages, idx) }}
                      />
                      <span className="text-muted-foreground">{lang.language}</span>
                      <span className="ml-auto">{lang.percentage}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Gender Pie Chart */}
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <div className="mb-2">
                <span className="text-sm">Gender Distribution</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="femaleGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(330, 81%, 75%)" />
                          <stop offset="50%" stopColor="hsl(340, 82%, 60%)" />
                          <stop offset="100%" stopColor="hsl(351, 83%, 55%)" />
                        </linearGradient>
                        <linearGradient id="maleGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(206, 89%, 62%)" />
                          <stop offset="50%" stopColor="hsl(217, 91%, 60%)" />
                          <stop offset="100%" stopColor="hsl(221, 83%, 53%)" />
                        </linearGradient>
                        <linearGradient id="otherGenderGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(280, 65%, 70%)" />
                          <stop offset="50%" stopColor="hsl(270, 60%, 60%)" />
                          <stop offset="100%" stopColor="hsl(260, 55%, 55%)" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={audienceData.gender.map(g => ({ name: g.type, value: g.percentage }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {audienceData.gender.map((g, index) => (
                          <Cell key={`gender-cell-${index}`} fill={g.type === 'Female' ? 'url(#femaleGradient)' : g.type === 'Male' ? 'url(#maleGradient)' : 'url(#otherGenderGradient)'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-1 flex-1">
                  {audienceData.gender.map((g) => (
                    <li key={g.type} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: g.type === 'Female' ? '#ec4899' : g.type === 'Male' ? '#3b82f6' : '#a855f7' }}
                      />
                      <span className="text-muted-foreground">{g.type}</span>
                      <span className="ml-auto">{g.percentage}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Age Distribution */}
          <div className="p-3 rounded-lg bg-card border border-border/50">
            <div className="mb-3">
              <span className="text-sm">Age Distribution</span>
            </div>
            <div className="space-y-2">
              {[...audienceData.age].reverse().map((ag) => (
                <div key={ag.range} className="flex items-center gap-3">
                  <span className="text-sm w-16">{ag.range}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${ag.percentage}%`,
                        background: 'linear-gradient(135deg, hsl(250, 85%, 75%) 0%, hsl(236, 73%, 59%) 50%, hsl(220, 70%, 55%) 100%)'
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-10 text-right">{ag.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interests & Credibility */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <div className="mb-2">
                <span className="text-sm">Interests</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {audienceData.interests.length > 0 ? audienceData.interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                )) : (
                  <p className="text-sm text-muted-foreground">No interest data available</p>
                )}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm">Credibility</span>
                {primaryPlatform === 'instagram' && influencer.instagram_verified && (
                  <Badge className="text-xs bg-sky-400/10 text-sky-500 dark:text-sky-400 border-sky-400/30 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Meta Verified
                  </Badge>
                )}
                {primaryPlatform === 'tiktok' && influencer.tiktok_verified && (
                  <Badge className="text-xs bg-sky-400/10 text-sky-500 dark:text-sky-400 border-sky-400/30 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    TikTok Verified
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {audienceData.credibility !== null ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Authentic</span>
                      <span className="font-medium">{Math.round(audienceData.credibility * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Suspicious</span>
                      <span className="font-medium">{Math.round((1 - audienceData.credibility) * 100)}%</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No credibility data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Notable Followers */}
          {modashData?.audience?.notableUsers && modashData.audience.notableUsers.length > 0 && (
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <div className="mb-2">
                <span className="text-sm">Notable Followers</span>
              </div>
              <div className="space-y-2">
                {modashData.audience.notableUsers.map((user: { userId: string; username: string; fullname: string; picture: string | null; followers: number | null; isVerified: boolean; url: string }) => (
                  <div
                    key={user.userId || user.username}
                    className="flex items-center gap-2.5 cursor-pointer hover:bg-muted/50 rounded-md p-1.5 -mx-1.5 transition-colors"
                    onClick={() => {
                      const profileUrl = user.url || (primaryPlatform === 'instagram'
                        ? `https://www.instagram.com/${user.username}/`
                        : `https://www.tiktok.com/@${user.username}`);
                      openExternal(profileUrl);
                    }}
                  >
                    {user.picture ? (
                      <img src={user.picture} alt={user.fullname || user.username} className="w-8 h-8 rounded-full object-cover border border-border/50" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <CircleUserRound className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 leading-tight">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium truncate">{user.fullname || user.username}</span>
                        {user.isVerified && (
                          <CheckCircle2 className="w-3 h-3 text-sky-500 flex-shrink-0" />
                        )}
                      </div>
                      <span
                        className="text-[10px] text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          const profileUrl = user.url || (primaryPlatform === 'instagram'
                            ? `https://www.instagram.com/${user.username}/`
                            : `https://www.tiktok.com/@${user.username}`);
                          openExternal(profileUrl);
                        }}
                      >@{user.username}</span>
                    </div>
                    {user.followers != null && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatNumber(user.followers)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
