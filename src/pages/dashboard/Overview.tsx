import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { OrderStatusBadge } from '@/components/dashboard/OrderStatusBadge';
import { OrderStatusBar } from '@/components/dashboard/OrderStatusBar';
import { DeadlineProgress } from '@/components/dashboard/DeadlineProgress';
import { Sparkline } from '@/components/dashboard/Sparkline';

import { VerifiedInfluencerAvatar } from '@/components/dashboard/VerifiedInfluencerAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockOrders, mockBrand, mockPosts } from '@/lib/mockData';
import { isTopPerformer, hasPostedForVouch, calculatePostEMV, formatEMV } from '@/lib/cpmUtils';
import { calculateAllAttributions, getMockSalesData, formatAttribution, ATTRIBUTION_DEFAULTS, getInfluencerEstimatedSales } from '@/lib/attributionUtils';
import { useEMVSettings } from '@/hooks/useEMVSettings';
import { usePriorityMetric } from '@/hooks/usePriorityMetric';
import { TrendingUp, Clock, DollarSign, Instagram, Users, BarChart3, Link2, Gift, Heart, Eye, Info, ChevronRight, ShoppingCart, Zap, TrendingDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTimeframe, Timeframe } from '@/hooks/useTimeframe';

// Generate sparkline data points for a metric over time based on timeframe
const generateSparklineData = (
  orders: typeof mockOrders,
  posts: typeof mockPosts,
  metric: 'avgTimeToPost' | 'postedToChargedRatio' | 'totalGiftingSpend' | 'totalLikes' | 'totalViews' | 'totalGifts',
  timeframeDays: number | null,
  points: number = 7
): number[] => {
  const now = new Date();
  const data: number[] = [];
  
  // For lifetime, use 365 days as the span
  const totalDays = timeframeDays ?? 365;
  // Each point represents a segment of the timeframe
  const daysPerSegment = Math.max(1, Math.floor(totalDays / points));
  
  for (let i = points - 1; i >= 0; i--) {
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() - (i * daysPerSegment));
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - daysPerSegment);
    
    const periodOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate < endDate;
    });
    
    const periodPosts = posts.filter(post => {
      const postDate = new Date(post.detected_at);
      return postDate >= startDate && postDate < endDate;
    });
    
    if (metric === 'avgTimeToPost') {
      const postTimes = periodPosts.map(post => {
        const order = orders.find(o => o.id === post.order_id);
        if (order?.delivered_at) {
          const deliveredDate = new Date(order.delivered_at);
          const postedDate = new Date(post.detected_at);
          return Math.min(Math.max((postedDate.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60), 0), 72);
        }
        return 0;
      }).filter(t => t > 0);
      data.push(postTimes.length > 0 ? postTimes.reduce((a, b) => a + b, 0) / postTimes.length : 0);
    } else if (metric === 'postedToChargedRatio') {
      const posted = periodOrders.filter(o => o.status === 'post_verified').length;
      const charged = periodOrders.filter(o => o.status === 'charged').length;
      const total = posted + charged;
      data.push(total > 0 ? (posted / total) * 100 : 0);
    } else if (metric === 'totalGiftingSpend') {
      // COGS + tax + shipping for orders NOT charged
      const notChargedOrders = periodOrders.filter(o => o.status !== 'charged');
      data.push(notChargedOrders.reduce((sum, order) => sum + (order.cogs || 0) + (order.sales_tax || 0) + (order.shipping_cost || 0), 0));
    } else if (metric === 'totalLikes') {
      data.push(periodPosts.reduce((sum, post) => sum + (post.likes || 0), 0));
    } else if (metric === 'totalViews') {
      data.push(periodPosts.reduce((sum, post) => sum + (post.views || 0), 0));
    } else if (metric === 'totalGifts') {
      data.push(periodOrders.length);
    }
  }
  
  return data;
};

const getTimeframeDays = (timeframe: Timeframe): number | null => {
  switch (timeframe) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '365d': return 365;
    case 'lifetime': return null;
  }
};

export default function Overview() {
  const navigate = useNavigate();
  const { timeframe, setTimeframe } = useTimeframe();
  const [ordersToShow, setOrdersToShow] = useState(5);
  const { settings: emvSettings } = useEMVSettings();
  const { priorityMetric } = usePriorityMetric();
  
  // Map 'custom' timeframe to '7d' for Overview since it doesn't support custom ranges
  const effectiveTimeframe = timeframe === 'custom' ? '7d' : timeframe;

  // Helper to filter orders/posts by date range
  const filterByDateRange = (startDate: Date, endDate: Date) => {
    const orders = mockOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate < endDate;
    });

    const posts = mockPosts.filter(post => {
      const postDate = new Date(post.detected_at);
      return postDate >= startDate && postDate < endDate;
    });

    return { orders, posts };
  };

  // Helper to calculate stats from orders/posts
  const calculateStats = (orders: typeof mockOrders, posts: typeof mockPosts) => {
    const postedOrders = orders.filter(o => o.status === 'post_verified');
    const chargedOrders = orders.filter(o => o.status === 'charged');
    const totalPostedAndCharged = postedOrders.length + chargedOrders.length;
    const postedToChargedRatio = totalPostedAndCharged > 0 
      ? Math.round((postedOrders.length / totalPostedAndCharged) * 100)
      : 0;

    // Calculate avg time to post - max is 72h since posts must happen within deadline
    const postTimesInHours = posts.map(post => {
      const order = orders.find(o => o.id === post.order_id);
      if (order?.delivered_at) {
        const deliveredDate = new Date(order.delivered_at);
        const postedDate = new Date(post.detected_at);
        const hoursToPost = (postedDate.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60);
        return Math.min(Math.max(hoursToPost, 0), 72);
      }
      return 0;
    }).filter(time => time > 0);
    
    const avgTimeToPost = postTimesInHours.length > 0
      ? postTimesInHours.reduce((sum, time) => sum + time, 0) / postTimesInHours.length
      : 0;

    // Calculate total likes
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);

    // Calculate total views
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);

    const totalGifts = orders.length;

    // Total EMV across all posts
    const totalEMV = posts.reduce((sum, post) => sum + calculatePostEMV(post, emvSettings), 0);

    // Estimated sales driven (sum across all influencers)
    const salesData = getMockSalesData();
    const allAttributions = calculateAllAttributions(posts, mockOrders, salesData, ATTRIBUTION_DEFAULTS);
    const uniqueInfluencerIds = [...new Set(posts.map(p => p.influencer_id))];
    const totalEstimatedSales = uniqueInfluencerIds.reduce(
      (sum, id) => sum + getInfluencerEstimatedSales(id, allAttributions),
      0
    );

    return { postedToChargedRatio, avgTimeToPost, totalLikes, totalViews, totalGifts, totalEMV, totalEstimatedSales };
  };

  // Filter orders and posts based on timeframe + calculate trends
  const { filteredOrders, filteredPosts, currentStats, previousStats } = useMemo(() => {
    const days = getTimeframeDays(effectiveTimeframe);
    const now = new Date();
    
    if (days === null) {
      // Lifetime: no trend comparison
      const stats = calculateStats(mockOrders, mockPosts);
      return { 
        filteredOrders: mockOrders, 
        filteredPosts: mockPosts, 
        currentStats: stats,
        previousStats: null 
      };
    }

    // Current period
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - days);
    const { orders: currentOrders, posts: currentPosts } = filterByDateRange(currentStart, now);
    
    // Previous period (same length, immediately before current)
    const previousEnd = currentStart;
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - days);
    const { orders: prevOrders, posts: prevPosts } = filterByDateRange(previousStart, previousEnd);

    return { 
      filteredOrders: currentOrders, 
      filteredPosts: currentPosts,
      currentStats: calculateStats(currentOrders, currentPosts),
      previousStats: calculateStats(prevOrders, prevPosts)
    };
  }, [effectiveTimeframe]);

  // Calculate percentage change
  const calculateTrend = (current: number, previous: number | null): number | null => {
    if (previous === null) return null;
    if (previous === 0) {
      // If previous was 0 and current > 0, show +100% to indicate growth
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  };

  // For ratio, show absolute difference (e.g., 69% - 67% = +2%)
  const ratioTrend = previousStats ? currentStats.postedToChargedRatio - previousStats.postedToChargedRatio : null;
  const timeTrend = previousStats ? calculateTrend(currentStats.avgTimeToPost, previousStats.avgTimeToPost) : null;
  const likesTrend = previousStats ? calculateTrend(currentStats.totalLikes, previousStats.totalLikes) : null;
  const viewsTrend = previousStats ? calculateTrend(currentStats.totalViews, previousStats.totalViews) : null;
  const giftsTrend = previousStats ? calculateTrend(currentStats.totalGifts, previousStats.totalGifts) : null;
  const emvTrend = previousStats ? calculateTrend(currentStats.totalEMV, previousStats.totalEMV) : null;
  const salesTrend = previousStats ? calculateTrend(currentStats.totalEstimatedSales, previousStats.totalEstimatedSales) : null;

  // Generate sparkline data for each metric based on current timeframe
  const timeframeDays = getTimeframeDays(effectiveTimeframe);
  const sparklineData = useMemo(() => ({
    avgTimeToPost: generateSparklineData(mockOrders, mockPosts, 'avgTimeToPost', timeframeDays),
    totalLikes: generateSparklineData(mockOrders, mockPosts, 'totalLikes', timeframeDays),
    totalViews: generateSparklineData(mockOrders, mockPosts, 'totalViews', timeframeDays),
    totalGifts: generateSparklineData(mockOrders, mockPosts, 'totalGifts', timeframeDays),
  }), [timeframeDays]);

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case '7d': return 'vs last 7d';
      case '30d': return 'vs last 30d';
      case '90d': return 'vs last 90d';
      case '365d': return 'vs last year';
      default: return '';
    }
  };

  const urgentOrders = filteredOrders
    .filter(o => o.status === 'post_pending' || o.status === 'delivered')
    .filter(o => o.post_deadline)
    .sort((a, b) => {
      // Sort by deadline ascending (least time remaining first)
      if (!a.post_deadline) return 1;
      if (!b.post_deadline) return -1;
      return new Date(a.post_deadline).getTime() - new Date(b.post_deadline).getTime();
    });

  // Get next post info for status bar
  const nextPostInfo = useMemo(() => {
    const nextOrder = urgentOrders[0];
    if (!nextOrder || !nextOrder.post_deadline) return null;
    
    // Check if deadline hasn't passed
    const now = new Date();
    const deadline = new Date(nextOrder.post_deadline);
    if (deadline < now) return null;
    
    return {
      orderId: nextOrder.id,
      deadline: nextOrder.post_deadline,
      platform: nextOrder.platform,
      influencerName: nextOrder.influencer?.full_name || 'Unknown',
    };
  }, [urgentOrders]);
  
  // Calculate counts for status bar
  const awaitingShipmentCount = filteredOrders.filter(o => o.status === 'pending_delivery').length;
  const creatingContentCount = filteredOrders.filter(o => o.status === 'delivered' || o.status === 'post_pending').length;
  const postedCount = filteredOrders.filter(o => o.status === 'post_verified').length;
  const chargedCount = filteredOrders.filter(o => o.status === 'charged').length;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header with Timeframe Selector */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium text-foreground">{mockBrand.name} Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-body">
              A snapshot of your influencer gifting campaign.
            </p>
          </div>
          <ToggleGroup 
            type="single" 
            value={timeframe} 
            onValueChange={(value) => value && setTimeframe(value as Timeframe)}
            className="bg-background/90 backdrop-blur-md p-0.5 rounded-md shadow-sm border border-border flex-shrink-0 h-7"
          >
            <ToggleGroupItem 
              value="7d" 
              className="px-2.5 h-6 text-xs data-[state=on]:vouch-gradient data-[state=on]:text-white min-w-[2rem]"
            >
              7d
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="30d" 
              className="px-2.5 h-6 text-xs data-[state=on]:vouch-gradient data-[state=on]:text-white min-w-[2rem]"
            >
              30d
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="90d" 
              className="px-2.5 h-6 text-xs data-[state=on]:vouch-gradient data-[state=on]:text-white min-w-[2rem]"
            >
              90d
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="365d" 
              className="px-2.5 h-6 text-xs data-[state=on]:vouch-gradient data-[state=on]:text-white min-w-[2rem]"
            >
              365d
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="lifetime" 
              className="px-2.5 h-6 text-xs data-[state=on]:vouch-gradient data-[state=on]:text-white"
            >
              All time
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Order Status Bar */}
        <OrderStatusBar 
          awaitingShipment={awaitingShipmentCount}
          creatingContent={creatingContentCount}
          posted={postedCount}
          charged={chargedCount}
          nextPost={nextPostInfo}
        />

        {/* Key Metrics and Posting - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Key Metrics */}
          <Card className="flex flex-col animate-stagger-fade-in stagger-1">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <CardTitle>Key Metrics</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="ml-auto p-1.5 rounded-md hover:bg-muted transition-colors">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>How Metrics Are Calculated</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Total Gifts</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        Total number of gifts sent to influencers within the selected timeframe.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Total Likes</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        Sum of all likes across detected posts. Sourced from Modash influencer data.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Total Views</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        Combined view count across all detected posts. Sourced from Modash influencer data.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Total EMV</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        Earned Media Value — the estimated dollar value of all influencer posts based on engagements (likes + comments) multiplied by the platform CPE rate. Configurable in Settings.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Est. Sales Driven</span>
                      </div>
                      <p className="text-muted-foreground pl-6">
                        Estimated revenue attributed to influencer posts. Combines spike-window revenue lift with a long-tail multiplier (1.1×–1.65×) based on spike size, weighted by attribution confidence.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between py-0">
              <div className="flex items-center gap-2.5 py-1">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                  <Gift className="w-3.5 h-3.5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground leading-none">Total Gifts</p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-base font-medium text-foreground">{currentStats.totalGifts.toLocaleString()}</p>
                    {giftsTrend !== null && (
                      <span className={`text-xs font-medium ${giftsTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {giftsTrend >= 0 ? '+' : ''}{giftsTrend}%
                      </span>
                    )}
                  </div>
                </div>
                <Sparkline 
                  data={sparklineData.totalGifts} 
                  trend={giftsTrend === null ? 'neutral' : giftsTrend >= 0 ? 'positive' : 'negative'} 
                />
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                  <Eye className="w-3.5 h-3.5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground leading-none">Total Views</p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-base font-medium text-foreground">{currentStats.totalViews.toLocaleString()}</p>
                    {viewsTrend !== null && (
                      <span className={`text-xs font-medium ${viewsTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {viewsTrend >= 0 ? '+' : ''}{viewsTrend}%
                      </span>
                    )}
                  </div>
                </div>
                <Sparkline 
                  data={sparklineData.totalViews} 
                  trend={viewsTrend === null ? 'neutral' : viewsTrend >= 0 ? 'positive' : 'negative'} 
                />
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                  <Heart className="w-3.5 h-3.5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground leading-none">Total Likes</p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-base font-medium text-foreground">{currentStats.totalLikes.toLocaleString()}</p>
                    {likesTrend !== null && (
                      <span className={`text-xs font-medium ${likesTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {likesTrend >= 0 ? '+' : ''}{likesTrend}%
                      </span>
                    )}
                  </div>
                </div>
                <Sparkline 
                  data={sparklineData.totalLikes} 
                  trend={likesTrend === null ? 'neutral' : likesTrend >= 0 ? 'positive' : 'negative'} 
                />
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground leading-none">Total EMV</p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-base font-medium text-foreground">{formatEMV(currentStats.totalEMV)}</p>
                    {emvTrend !== null && (
                      <span className={`text-xs font-medium ${emvTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {emvTrend >= 0 ? '+' : ''}{emvTrend}%
                      </span>
                    )}
                  </div>
                </div>
                <Sparkline 
                  data={sparklineData.totalLikes} 
                  trend={emvTrend === null ? 'neutral' : emvTrend >= 0 ? 'positive' : 'negative'} 
                />
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground leading-none">Est. Sales Driven</p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-base font-medium text-foreground">{formatAttribution(currentStats.totalEstimatedSales)}</p>
                    {salesTrend !== null && (
                      <span className={`text-xs font-medium ${salesTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {salesTrend >= 0 ? '+' : ''}{salesTrend}%
                      </span>
                    )}
                  </div>
                </div>
                <Sparkline 
                  data={sparklineData.totalGifts} 
                  trend={salesTrend === null ? 'neutral' : salesTrend >= 0 ? 'positive' : 'negative'} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Posting */}
          <Card className="lg:col-span-2 border-l-2 border-l-warning/60 bg-gradient-to-br from-warning/10 via-warning/5 via-60% to-card animate-stagger-fade-in stagger-2">
            <CardHeader className="flex flex-row items-center gap-2 pb-4">
              <Clock className="w-4 h-4 text-warning" />
              <CardTitle>Posting</CardTitle>
            </CardHeader>
            <CardContent>
              {urgentOrders.length > 0 ? (
                <div className={`grid gap-3 ${urgentOrders.length > 3 ? 'xl:grid-cols-2' : 'grid-cols-1'}`}>
                  {urgentOrders.map(order => {
                    const influencer = order.influencer;
                    const isInstagram = order.platform === 'instagram';
                    const handle = isInstagram ? influencer?.instagram_username : influencer?.tiktok_username;
                    const followers = isInstagram ? influencer?.instagram_followers : influencer?.tiktok_followers;
                    const engagementRate = isInstagram ? influencer?.instagram_engagement_rate : influencer?.tiktok_engagement_rate;
                    const isTop = influencer ? isTopPerformer(influencer.id, mockPosts, mockOrders, priorityMetric, emvSettings) : false;
                    const isVerified = influencer ? hasPostedForVouch(influencer.id, mockPosts) : false;
                    
                    const formatFollowers = (count: number | null | undefined) => {
                      if (!count) return '—';
                      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
                      if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
                      return count.toString();
                    };

                    return (
                      <div
                        key={order.id}
                        onClick={() => navigate(`/dashboard/orders?expand=${order.id}`)}
                        className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-muted-foreground/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Link
                            to={`/dashboard/influencers?id=${order.influencer_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <VerifiedInfluencerAvatar 
                              initial={influencer?.full_name?.charAt(0) || '?'}
                              imageUrl={influencer?.profile_image_url}
                              isVerified={isVerified}
                            />
                          </Link>
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className="text-sm font-medium flex items-center gap-1.5 shrink-0">
                              <Link
                                to={`/dashboard/influencers?id=${order.influencer_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-primary transition-colors"
                              >
                                {influencer?.full_name}
                              </Link>
                              {isTop && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/10 border-primary/20 text-primary font-medium">
                                  Top 10%
                                </Badge>
                              )}
                            </span>
                            <span className="text-muted-foreground/40 shrink-0">·</span>
                            <a
                              href={isInstagram 
                                ? `https://instagram.com/${handle}` 
                                : `https://tiktok.com/@${handle}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors shrink-0"
                            >
                              {isInstagram ? (
                                <Instagram className="w-3.5 h-3.5 flex-shrink-0" />
                              ) : (
                                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                                </svg>
                              )}
                              <span className="truncate">@{handle || 'unknown'}</span>
                            </a>
                            <span className="text-muted-foreground/40 shrink-0">·</span>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                              <Users className="w-3.5 h-3.5" />
                              {formatFollowers(followers)}
                            </span>
                            <span className="text-muted-foreground/40 shrink-0">·</span>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                              <BarChart3 className="w-3.5 h-3.5" />
                              {engagementRate ? `${engagementRate.toFixed(1)}%` : '—'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center shrink-0">
                          {order.post_deadline && order.delivered_at && (
                            <DeadlineProgress 
                              deadline={order.post_deadline} 
                              deliveredAt={order.delivered_at}
                              size={28}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No orders currently posting</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Gifts */}
        <Card className="animate-stagger-fade-in stagger-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Gift className="w-5 h-5 text-foreground" />
              Recent Gifts 
              <span className="text-xs font-medium px-2 pt-1.5 pb-1 rounded-md vouch-gradient text-white leading-none capitalize">{timeframe}</span>
            </CardTitle>
            <Link 
              to="/dashboard/orders"
              className="text-sm text-primary hover:underline"
            >
              View all and filter
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...filteredOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, ordersToShow).map(order => {
                const influencer = order.influencer;
                const isInstagram = order.platform === 'instagram';
                const handle = isInstagram ? influencer?.instagram_username : influencer?.tiktok_username;
                const followers = isInstagram ? influencer?.instagram_followers : influencer?.tiktok_followers;
                const engagementRate = isInstagram ? influencer?.instagram_engagement_rate : influencer?.tiktok_engagement_rate;
                const isTop = influencer ? isTopPerformer(influencer.id, mockPosts, mockOrders, priorityMetric, emvSettings) : false;
                const isVerified = influencer ? hasPostedForVouch(influencer.id, mockPosts) : false;
                
                const formatFollowers = (count: number | null | undefined) => {
                  if (!count) return '—';
                  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
                  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
                  return count.toString();
                };

                const formatDate = (dateString: string) => {
                  const date = new Date(dateString);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                };
                
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/dashboard/orders?expand=${order.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-muted-foreground/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Link
                        to={`/dashboard/influencers?id=${order.influencer_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <VerifiedInfluencerAvatar 
                          initial={influencer?.full_name?.charAt(0) || '?'}
                          imageUrl={influencer?.profile_image_url}
                          isVerified={isVerified}
                        />
                      </Link>
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-sm font-medium flex items-center gap-1.5 shrink-0">
                          <Link
                            to={`/dashboard/influencers?id=${order.influencer_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-primary transition-colors"
                          >
                            {influencer?.full_name}
                          </Link>
                          {isTop && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/10 border-primary/20 text-primary font-medium">
                              Top 10%
                            </Badge>
                          )}
                        </span>
                        <span className="text-muted-foreground/40 shrink-0">·</span>
                        <a
                          href={isInstagram 
                            ? `https://instagram.com/${handle}` 
                            : `https://tiktok.com/@${handle}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors shrink-0"
                        >
                          {isInstagram ? (
                            <Instagram className="w-3.5 h-3.5" />
                          ) : (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                            </svg>
                          )}
                          @{handle || 'unknown'}
                        </a>
                        <span className="text-muted-foreground/40 shrink-0">·</span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                          <Users className="w-3.5 h-3.5" />
                          {formatFollowers(followers)}
                        </span>
                        <span className="text-muted-foreground/40 shrink-0">·</span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                          <BarChart3 className="w-3.5 h-3.5" />
                          {engagementRate ? `${engagementRate.toFixed(1)}%` : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-14 flex justify-center">
                        {(order.status === 'post_verified' || order.status === 'completed') ? (
                          <Link
                            to={`/dashboard/posts?order=${order.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center gap-1.5 px-3 h-[26px] text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <Link2 className="w-3 h-3" />
                            LIVE
                          </Link>
                        ) : null}
                      </div>
                      <div className="w-[100px] flex justify-center">
                        <a
                          href={`https://admin.shopify.com/store/styleco/orders/${order.shopify_order_id?.replace('SHP-', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-1.5 px-3 h-[26px] text-xs rounded-lg bg-muted hover:bg-muted-foreground/20 transition-colors whitespace-nowrap"
                        >
                          <ShoppingCart className="w-3 h-3 flex-shrink-0" />
                          {order.shopify_order_id}
                        </a>
                      </div>
                      <span className="w-[140px] text-sm text-muted-foreground whitespace-nowrap text-right">
                        {order.items_count} {order.items_count === 1 ? 'item' : 'items'} · {formatDate(order.created_at)}
                      </span>
                      <div className="w-[100px] flex justify-end">
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {ordersToShow < filteredOrders.length && (
              <button
                onClick={() => setOrdersToShow(prev => prev + 5)}
                className="w-full mt-4 text-sm text-primary hover:underline text-center"
              >
                Show more
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
