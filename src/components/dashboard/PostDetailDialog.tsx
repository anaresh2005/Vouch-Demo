import { useState, useMemo } from 'react';
import { openExternal } from '@/lib/openExternal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { VouchPost, VouchOrder } from '@/types/vouch';
import { Instagram, Clock, ThumbsUp, Calendar, Flame, FileText, TrendingUp, MessageCircle, Image, Users, BarChart3, Eye, Heart, DollarSign, Info, Rocket, ShieldCheck, ShieldOff, Zap, ShoppingCart, Camera } from 'lucide-react';
import { exportPostToPDF } from '@/lib/pdfExport';
import { exportPostToMarkdown } from '@/lib/markdownExport';
import { ExportDropdown } from './ExportDropdown';
import { format, differenceInHours } from 'date-fns';
import { TikTokIcon } from '@/components/icons/TikTokIcon';
import { VerifiedInfluencerAvatar } from './VerifiedInfluencerAvatar';

import { isTopPerformer, hasPostedForVouch, calculatePostCPM, formatCPM, calculatePostEMV, formatEMV } from '@/lib/cpmUtils';
import { useEMVSettings } from '@/hooks/useEMVSettings';
import { usePriorityMetric } from '@/hooks/usePriorityMetric';
import { Link } from 'react-router-dom';
import { calculateAttribution, getMockSalesData, formatAttribution, ATTRIBUTION_DEFAULTS, getProductSalesTimeline } from '@/lib/attributionUtils';
import { mockOrderItems } from '@/lib/mockData';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

interface Comment {
  id: string;
  username: string;
  text: string;
  likes: number;
  postedAt: string;
}

// Generate mock comments based on post ID for consistency
const generateMockComments = (postId: string, totalComments: number): Comment[] => {
  const baseComments = [
    { username: 'fashionlover22', text: 'Omg this is stunning! 😍', likes: 234 },
    { username: 'style_queen', text: 'Need this in my life rn!!', likes: 189 },
    { username: 'trendsetter_x', text: 'Where can I get this?? Link please! 🙏', likes: 156 },
    { username: 'vibes.only', text: 'This is everything! You always have the best finds', likes: 145 },
    { username: 'aesthetic_dreams', text: 'Your content is always so fire 🔥🔥', likes: 132 },
    { username: 'shoppingaddict', text: 'Added to cart immediately 😂', likes: 98 },
    { username: 'minimal.life', text: 'Love the aesthetic of this brand!', likes: 87 },
    { username: 'daily_inspo', text: 'Goals!! 💕', likes: 76 },
    { username: 'new_follower_101', text: 'Just discovered your page, love it!', likes: 45 },
    { username: 'curious_cat', text: 'How long did shipping take?', likes: 23 },
  ];

  // Create a deterministic shuffle based on postId
  const hash = postId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const shuffled = [...baseComments].sort((a, b) => {
    const aHash = (a.username.charCodeAt(0) + hash) % 10;
    const bHash = (b.username.charCodeAt(0) + hash) % 10;
    return aHash - bHash;
  });

  const now = new Date();
  return shuffled.slice(0, Math.min(10, totalComments)).map((comment, i) => ({
    id: `${postId}-comment-${i}`,
    ...comment,
    likes: Math.floor(comment.likes * (1 + (hash % 50) / 100)),
    postedAt: new Date(now.getTime() - (i + 1) * 3 * 60 * 60 * 1000).toISOString(),
  }));
};

// Generate mock performance data
// - Available after 6 hours
// - Measured every 6 hours until 48 hours
// - Then measured every 24 hours
const generatePerformanceData = (post: VouchPost) => {
  const detectedDate = new Date(post.detected_at);
  const now = new Date();
  const hoursSinceDetection = differenceInHours(now, detectedDate);
  
  // Only show data after 6 hours
  if (hoursSinceDetection < 6) {
    return [];
  }

  const dataPoints = [];
  
  // Starting values at 6 hours (roughly 10% of current values)
  const startViews = Math.floor(post.views * 0.1);
  const startLikes = Math.floor(post.likes * 0.1);
  
  // Generate data points based on time elapsed
  // First 48 hours: every 6 hours (8 data points max)
  // After 48 hours: every 24 hours
  
  if (hoursSinceDetection <= 48) {
    // Every 6 hours for first 48 hours
    const intervals = Math.floor(hoursSinceDetection / 6);
    for (let i = 1; i <= intervals; i++) {
      const hoursElapsed = i * 6;
      const progress = hoursElapsed / Math.max(hoursSinceDetection, 48);
      const growthFactor = Math.log(1 + progress * 2) / Math.log(3);
      
      dataPoints.push({
        time: `${hoursElapsed}h`,
        views: Math.floor(startViews + (post.views - startViews) * growthFactor),
        likes: Math.floor(startLikes + (post.likes - startLikes) * growthFactor),
      });
    }
  } else {
    // First 48 hours: 6-hour intervals (8 points)
    for (let i = 1; i <= 8; i++) {
      const hoursElapsed = i * 6;
      const progress = hoursElapsed / hoursSinceDetection;
      const growthFactor = Math.log(1 + progress * 2) / Math.log(3);
      
      dataPoints.push({
        time: `${hoursElapsed}h`,
        views: Math.floor(startViews + (post.views - startViews) * growthFactor),
        likes: Math.floor(startLikes + (post.likes - startLikes) * growthFactor),
      });
    }
    
    // After 48 hours: 24-hour intervals
    const daysAfter48h = Math.floor((hoursSinceDetection - 48) / 24);
    for (let day = 1; day <= Math.min(daysAfter48h, 14); day++) {
      const hoursElapsed = 48 + (day * 24);
      const progress = hoursElapsed / hoursSinceDetection;
      const growthFactor = Math.log(1 + progress * 2) / Math.log(3);
      
      dataPoints.push({
        time: `Day ${Math.floor(hoursElapsed / 24)}`,
        views: Math.floor(startViews + (post.views - startViews) * growthFactor),
        likes: Math.floor(startLikes + (post.likes - startLikes) * growthFactor),
      });
    }
  }
  
  return dataPoints;
};

// Mock caption based on influencer
const generateCaption = (post: VouchPost): string => {
  const captions: Record<string, string> = {
    'inf-2': "Faith + mindset + style 🙏 @styleco_official really understood the assignment with this one. Quality is unmatched! #ad #styleco #fashion #mindset",
    'inf-3': "Vancouver fits check ✈️🇨🇦 @styleco_official coming through with the heat! These pieces are perfect for content days. Link in bio! #gifted #styleco #contentcreator",
  };
  
  return captions[post.influencer_id] || "Loving my new pieces from @styleco_official! 💕 The quality is incredible and I can't stop wearing them. Check out my stories for more details! #styleco #fashion #sponsored";
};

interface PostDetailDialogProps {
  post: VouchPost;
  order?: VouchOrder;
  allPosts: VouchPost[];
  allOrders: VouchOrder[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostDetailDialog({
  post,
  order,
  allPosts,
  allOrders,
  open,
  onOpenChange,
}: PostDetailDialogProps) {
  const [commentTab, setCommentTab] = useState<'recent' | 'popular'>('recent');
  const [graphMetric, setGraphMetric] = useState<'views' | 'likes'>('views');
  const { settings: emvSettings } = useEMVSettings();
  const { getMetricColor, priorityMetric } = usePriorityMetric();
  const salesData = useMemo(() => getMockSalesData(), []);
  const attribution = useMemo(
    () => post ? calculateAttribution(post, allOrders, salesData, ATTRIBUTION_DEFAULTS) : null,
    [post, allOrders, salesData]
  );
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Early return if no post is selected
  if (!post) {
    return null;
  }

  const isTop = isTopPerformer(post.influencer_id, allPosts, allOrders, priorityMetric, emvSettings);
  const isVerified = hasPostedForVouch(post.influencer_id, allPosts);
  const cpm = calculatePostCPM(post, order);
  const emv = calculatePostEMV(post, emvSettings);
  
  const performanceData = generatePerformanceData(post);
  const hasPerformanceData = performanceData.length > 0;
  const hoursSinceDetection = differenceInHours(new Date(), new Date(post.detected_at));
  
  const allComments = generateMockComments(post.id, post.comments);
  const recentComments = [...allComments].slice(0, 5);
  const popularComments = [...allComments].sort((a, b) => b.likes - a.likes).slice(0, 5);
  
  const caption = generateCaption(post);

  const handleExportPDF = async () => {
    await exportPostToPDF(post, order, allPosts, allOrders);
  };

  const handleExportMarkdown = () => {
    exportPostToMarkdown(post, order, allPosts, allOrders);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="absolute right-12 top-4">
          <ExportDropdown
            onExportPDF={handleExportPDF}
            onExportMarkdown={handleExportMarkdown}
          />
        </div>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4 font-normal">
            <Link
              to={`/dashboard/influencers?id=${post.influencer_id}`}
              className="hover:opacity-80 transition-opacity"
              onClick={() => onOpenChange(false)}
            >
              <VerifiedInfluencerAvatar 
                initial={post.influencer?.full_name?.charAt(0) || '?'}
                imageUrl={post.influencer?.profile_image_url}
                isVerified={isVerified}
                size="lg"
                className="font-normal"
              />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/dashboard/influencers?id=${post.influencer_id}`}
                  className="hover:text-primary transition-colors font-normal"
                  onClick={() => onOpenChange(false)}
                >
                  {post.influencer?.full_name}
                </Link>
                
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-normal">
                <button
                  onClick={() => openExternal(post.platform === 'instagram' 
                    ? `https://instagram.com/${post.influencer?.instagram_username}` 
                    : `https://tiktok.com/@${post.influencer?.tiktok_username}`)}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
                >
                  {post.platform === 'instagram' ? (
                    <Instagram className="w-3.5 h-3.5" />
                  ) : (
                    <TikTokIcon className="w-3.5 h-3.5" />
                  )}
                  @{post.platform === 'instagram' 
                    ? post.influencer?.instagram_username 
                    : post.influencer?.tiktok_username}
                </button>
                <span className="text-muted-foreground/50">·</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {formatNumber(post.platform === 'instagram' 
                    ? post.influencer?.instagram_followers 
                    : post.influencer?.tiktok_followers)}
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  {(post.platform === 'instagram' 
                    ? post.influencer?.instagram_engagement_rate 
                    : post.influencer?.tiktok_engagement_rate)?.toFixed(1) || '—'}%
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Left Column - Post Preview & Caption */}
          <div className="space-y-4">
            {/* Post Preview */}
            <div>
              <h3 className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <Image className="w-4 h-4" />
                Post Preview
              </h3>
              <Card className="overflow-hidden">
                <div className="aspect-square bg-muted/50 flex items-center justify-center">
                  <div className="text-muted-foreground text-sm">
                    Post Preview
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(post.detected_at), 'MMM d, yyyy')} at {format(new Date(post.detected_at), 'h:mm a')}
                    </span>
                    <div className="flex items-center gap-2">
                      {post.boosting_rights_granted ? (
                        <Button size="sm" variant="outline" onClick={() => openExternal(post.platform === 'instagram'
                          ? 'https://adsmanager.facebook.com/adsmanager/manage/campaigns'
                          : 'https://ads.tiktok.com/i18n/home')} className="gap-1.5">
                            <Rocket className="w-3.5 h-3.5" />
                            Boost
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => openExternal(post.post_url)} className="gap-1.5">
                          {post.platform === 'instagram' ? (
                            <Instagram className="w-3.5 h-3.5" />
                          ) : (
                            <TikTokIcon className="w-3.5 h-3.5" />
                          )}
                          View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Boosting Rights Status */}
              <div className={`mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs ${
                post.boosting_rights_granted 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-muted/80 text-muted-foreground border border-border'
              }`}>
                {post.boosting_rights_granted ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>This influencer has granted rights to boost and/or repost this content.</span>
                  </>
                ) : (
                  <>
                    <ShieldOff className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>This influencer has not granted rights to boost or repost this content.</span>
                  </>
                )}
              </div>
            </div>

            {/* Caption */}
            <div>
              <h3 className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                Caption
              </h3>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {caption}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Comments (moved under caption) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-muted-foreground flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Comments
                </h3>
                <ToggleGroup 
                  type="single" 
                  value={commentTab} 
                  onValueChange={(value) => value && setCommentTab(value as 'recent' | 'popular')}
                  className="h-8"
                >
                  <ToggleGroupItem value="recent" aria-label="Recent" className="h-7 px-3 text-xs gap-1">
                    <Clock className="w-3 h-3" />
                    Recent
                  </ToggleGroupItem>
                  <ToggleGroupItem value="popular" aria-label="Most Liked" className="h-7 px-3 text-xs gap-1">
                    <Flame className="w-3 h-3" />
                    Most Liked
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <Card>
                <CardContent className="p-4 space-y-4">
                {(commentTab === 'recent' ? recentComments : popularComments).map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3 text-sm">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs">
                      {comment.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">@{comment.username}</span>
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {comment.likes}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5 break-words">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
                {allComments.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No comments yet
                  </p>
                )}
              </CardContent>
            </Card>
            </div>
          </div>


          {/* Right Column - Metrics & Comments */}
          <div className="space-y-4">
            {/* Key Metrics */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Metrics
                </h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="p-0.5 rounded hover:bg-muted transition-colors">
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Post Metrics</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      <p className="text-muted-foreground">
                        Key performance indicators for this post, updated regularly from the platform.
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Views</span>
                        </div>
                        <p className="text-muted-foreground pl-6">
                          Total number of times this post has been viewed.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Likes</span>
                        </div>
                        <p className="text-muted-foreground pl-6">
                          Total likes received on this post.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Comments</span>
                        </div>
                        <p className="text-muted-foreground pl-6">
                          Total number of comments on this post.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Engagement Rate (E.R.)</span>
                        </div>
                        <p className="text-muted-foreground pl-6">
                          Percentage of viewers who engaged with the post ((likes + comments) ÷ views).
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">CPM (Cost Per Mille)</span>
                        </div>
                        <p className="text-muted-foreground pl-6">
                          Cost per 1,000 views: ((COGS + tax + shipping) ÷ views) × 1,000. Lower is better.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">EMV (Earned Media Value)</span>
                        </div>
                        <p className="text-muted-foreground pl-6">
                          Estimated dollar value of organic exposure: (likes + comments) × platform CPE rate ($0.25 for Instagram, $0.20 for TikTok). Higher is better.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{formatNumber(post.views)}</p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50">
                    <Heart className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{formatNumber(post.likes)}</p>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{formatNumber(post.comments)}</p>
                      <p className="text-xs text-muted-foreground">Comments</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{post.engagement_rate || 0}%</p>
                      <p className="text-xs text-muted-foreground">E.R.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CPM + EMV + Spike Cards */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {cpm !== null && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getMetricColor('cpm').border} ${getMetricColor('cpm').gradient}`}>
                    <DollarSign className={`w-4 h-4 ${getMetricColor('cpm').icon}`} />
                    <div>
                      <p className={`text-sm font-medium ${getMetricColor('cpm').text}`}>{formatCPM(cpm)}</p>
                      <p className="text-xs text-muted-foreground">CPM</p>
                    </div>
                  </div>
                )}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getMetricColor('emv').border} ${getMetricColor('emv').gradient}`}>
                  <TrendingUp className={`w-4 h-4 ${getMetricColor('emv').icon}`} />
                  <div>
                    <p className={`text-sm font-medium ${getMetricColor('emv').text}`}>{formatEMV(emv)}</p>
                    <p className="text-xs text-muted-foreground">EMV</p>
                  </div>
                </div>
                {attribution?.spikeDetected && (
                  <div className={`col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg border ${getMetricColor('sales').border} ${getMetricColor('sales').gradient}`}>
                    <DollarSign className={`w-4 h-4 ${getMetricColor('sales').icon}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${getMetricColor('sales').text}`}>+{formatAttribution(attribution.attributedRevenue)} Sales Spike</p>
                      <p className="text-xs text-muted-foreground">+{Math.round(attribution.liftPercent)}% above baseline · {attribution.confidenceScore}% confidence · {attribution.productNames.slice(0, 2).join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sales Spike Chart — shown when a spike is detected */}
            {attribution?.spikeDetected && attribution.productIds.length > 0 && (() => {
              const primaryProductId = attribution.productIds[0];
              const primaryProductName = attribution.productNames[0];
              const timeline = getProductSalesTimeline(primaryProductId, salesData, 21);
              const postDateStr = new Date(post.detected_at).toISOString().slice(0, 10);
              const postIndex = timeline.findIndex(d => d.date === postDateStr);
              const postLabel = postIndex >= 0 ? timeline[postIndex].label : null;

              // Find shopify_product_id from order items
              const orderItems = order ? (mockOrderItems[order.id] || []) : [];
              const matchedItem = orderItems.find(item => item.shopify_product_id === primaryProductId);
              const shopifyProductId = matchedItem?.shopify_product_id;
              const shopifyProductUrl = shopifyProductId
                ? `https://admin.shopify.com/store/products/${shopifyProductId}`
                : null;

              return (
                <div>
                  <h3 className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4" />
                    Sales Impact ·{' '}
                    {shopifyProductUrl ? (
                      <button
                        onClick={() => openExternal(shopifyProductUrl)}
                        className="text-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                      >
                        {primaryProductName}
                        <ShoppingCart className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                      </button>
                    ) : (
                      <span className="text-foreground">{primaryProductName}</span>
                    )}
                  </h3>
                  <Card>
                    <CardContent className="p-3">
                      <div className="h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                              <linearGradient id="salesSpikeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 9, fontFamily: 'Inter, sans-serif' }}
                              stroke="hsl(var(--muted-foreground))"
                              tickLine={false}
                              axisLine={false}
                              interval="preserveStartEnd"
                              tickMargin={6}
                            />
                            <YAxis
                              tick={{ fontSize: 9, fontFamily: 'Inter, sans-serif' }}
                              stroke="hsl(var(--muted-foreground))"
                              tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${Math.round(v)}`}
                              tickLine={false}
                              axisLine={false}
                              width={42}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '12px',
                              }}
                              formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, 'Revenue']}
                              labelStyle={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, marginBottom: 4 }}
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              fill="url(#salesSpikeGradient)"
                              dot={false}
                              activeDot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                            />
                            {postLabel && (
                              <ReferenceLine
                                x={postLabel}
                                stroke="hsl(var(--primary))"
                                strokeWidth={1.5}
                                strokeDasharray="4 3"
                                label={({ viewBox }: { viewBox?: { x?: number; y?: number; height?: number } }) => {
                                  const x = viewBox?.x ?? 0;
                                  const chartBottom = (viewBox?.y ?? 0) + (viewBox?.height ?? 120);
                                  // Pin label near bottom so the green trend line never covers it
                                  const y = chartBottom - 20;
                                  return (
                                    <g>
                                      <rect x={x + 4} y={y} width={52} height={16} rx={3} fill="hsl(var(--primary))" fillOpacity={0.12} />
                                      <svg x={x + 7} y={y + 2} width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                        <circle cx="12" cy="13" r="3" />
                                      </svg>
                                      <text x={x + 22} y={y + 11} fontSize={9} fontFamily="Inter, sans-serif" fill="hsl(var(--primary))" fontWeight={500}>Post</text>
                                    </g>
                                  );
                                }}
                              />
                            )}
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center mt-1">
                        Daily revenue · last 21 days · dashed line = post detected
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Performance Graph */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Performance History
                  {!hasPerformanceData && (
                    <Badge variant="outline" className="text-xs font-normal">
                      Available after 6 hours
                    </Badge>
                  )}
                </h3>
                {hasPerformanceData && (
                  <ToggleGroup 
                    type="single" 
                    value={graphMetric} 
                    onValueChange={(value) => value && setGraphMetric(value as 'views' | 'likes')}
                    className="h-8"
                  >
                    <ToggleGroupItem value="views" aria-label="Views" className="h-7 px-3 text-xs gap-1.5">
                      <Eye className="w-3 h-3" />
                      Views
                    </ToggleGroupItem>
                    <ToggleGroupItem value="likes" aria-label="Likes" className="h-7 px-3 text-xs gap-1.5">
                      <Heart className="w-3 h-3" />
                      Likes
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
              </div>
              <Card>
                <CardContent className="p-3">
                  {hasPerformanceData ? (
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={performanceData} margin={{ top: 15, right: 15, left: 5, bottom: 10 }}>
                          <defs>
                            <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                          <XAxis 
                            dataKey="time" 
                            tick={{ fontSize: 10, fontFamily: 'Inter, sans-serif' }} 
                            stroke="hsl(var(--muted-foreground))"
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                            tickMargin={8}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fontFamily: 'Inter, sans-serif' }} 
                            stroke="hsl(var(--muted-foreground))"
                            tickFormatter={(value) => {
                              if (value >= 1000000) return `${Math.round(value / 1000000)}M`;
                              if (value >= 1000) return `${Math.round(value / 1000)}K`;
                              return Math.round(value).toString();
                            }}
                            tickLine={false}
                            axisLine={false}
                            width={40}
                            domain={[0, (() => {
                              const data = performanceData.map(d => graphMetric === 'views' ? d.views : d.likes);
                              const maxVal = Math.max(...data);
                              const intervals = [500, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
                              let interval = 500;
                              for (const int of intervals) {
                                if (maxVal <= int * 4) {
                                  interval = int;
                                  break;
                                }
                                interval = int;
                              }
                              return (Math.ceil(maxVal / interval) + 1) * interval;
                            })()]}
                            ticks={(() => {
                              const data = performanceData.map(d => graphMetric === 'views' ? d.views : d.likes);
                              const maxVal = Math.max(...data);
                              const intervals = [500, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
                              let interval = 500;
                              for (const int of intervals) {
                                if (maxVal <= int * 4) {
                                  interval = int;
                                  break;
                                }
                                interval = int;
                              }
                              const maxTick = (Math.ceil(maxVal / interval) + 1) * interval;
                              const tickCount = Math.min(Math.floor(maxTick / interval) + 1, 7);
                              const ticks = Array.from({ length: tickCount }, (_, i) => i * interval);
                              if (ticks[ticks.length - 1] !== maxTick) ticks.push(maxTick);
                              return ticks;
                            })()}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '12px',
                            }}
                            formatter={(value: number, name: string) => [formatNumber(value), name]}
                            labelStyle={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, marginBottom: 4 }}
                          />
                          {graphMetric === 'views' && (
                            <Area 
                              type="monotone" 
                              dataKey="views" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              fill="url(#metricGradient)"
                              name="Views"
                              dot={false}
                              activeDot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                            />
                          )}
                          {graphMetric === 'likes' && (
                            <Area 
                              type="monotone" 
                              dataKey="likes" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              fill="url(#metricGradient)"
                              name="Likes"
                              dot={false}
                              activeDot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                            />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      <div className="text-center">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Performance tracking starts after 6 hours</p>
                        <p className="text-xs mt-1">
                          {6 - hoursSinceDetection > 0 
                            ? `${6 - hoursSinceDetection} hours remaining`
                            : 'Data coming soon...'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
