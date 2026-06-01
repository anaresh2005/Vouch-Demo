import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { mockPosts, mockOrders } from '@/lib/mockData';
import { Instagram, Music2, ExternalLink, Heart, MessageCircle, Eye, BarChart3, Rocket, ShieldOff, TrendingUp, Zap } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

import { VerifiedInfluencerAvatar } from '@/components/dashboard/VerifiedInfluencerAvatar';
import { calculatePostCPM, formatCPM, isTopPerformer, hasPostedForVouch, calculatePostEMV, formatEMV } from '@/lib/cpmUtils';
import { PostDetailDialog } from '@/components/dashboard/PostDetailDialog';
import { PostFilters, PostFiltersState, defaultPostFilters, countActivePostFilters, parseNumericInput } from '@/components/dashboard/PostFilters';
import { VouchPost } from '@/types/vouch';
import { useEMVSettings } from '@/hooks/useEMVSettings';
import { usePriorityMetric } from '@/hooks/usePriorityMetric';
import { calculateAttribution, getMockSalesData, formatAttribution, ATTRIBUTION_DEFAULTS } from '@/lib/attributionUtils';


export default function Posts() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightedOrderId = searchParams.get('order');
  const [showHighlight, setShowHighlight] = useState(true);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [selectedPost, setSelectedPost] = useState<VouchPost | null>(null);
  const [filters, setFilters] = useState<PostFiltersState>(defaultPostFilters);
  const { settings: emvSettings } = useEMVSettings();
  const { getMetricColor, priorityMetric } = usePriorityMetric();
  const salesData = useMemo(() => getMockSalesData(), []);

  // Find the post that matches the order ID
  const highlightedPost = highlightedOrderId 
    ? mockPosts.find(post => post.order_id === highlightedOrderId)
    : null;

  // Scroll to highlighted post when page loads with order param
  useEffect(() => {
    if (highlightedPost && cardRefs.current[highlightedPost.id]) {
      setTimeout(() => {
        cardRefs.current[highlightedPost.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightedPost]);

  // Fade out highlight after 1 second
  useEffect(() => {
    if (highlightedOrderId) {
      setShowHighlight(true);
      const timer = setTimeout(() => {
        setShowHighlight(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedOrderId]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const activeFilterCount = countActivePostFilters(filters);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let result = mockPosts.filter(post => {
      const order = mockOrders.find(o => o.id === post.order_id);
      const cpm = calculatePostCPM(post, order);
      const isTop = isTopPerformer(post.influencer_id, mockPosts, mockOrders);
      const isVerified = hasPostedForVouch(post.influencer_id, mockPosts);

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = post.influencer?.full_name?.toLowerCase().includes(searchLower);
        const matchesInstagram = post.influencer?.instagram_username?.toLowerCase().includes(searchLower);
        const matchesTiktok = post.influencer?.tiktok_username?.toLowerCase().includes(searchLower);
        const matchesUrl = post.post_url.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesInstagram && !matchesTiktok && !matchesUrl) {
          return false;
        }
      }

      // Platform filter
      if (filters.platforms.length > 0 && !filters.platforms.includes(post.platform)) {
        return false;
      }

      // Date filters
      if (filters.dateFrom) {
        const postDate = new Date(post.detected_at);
        if (isBefore(postDate, startOfDay(filters.dateFrom))) {
          return false;
        }
      }
      if (filters.dateTo) {
        const postDate = new Date(post.detected_at);
        if (isAfter(postDate, endOfDay(filters.dateTo))) {
          return false;
        }
      }

      // Vouch verified filter
      if (filters.vouchVerified === 'verified' && !isVerified) return false;
      if (filters.vouchVerified === 'unverified' && isVerified) return false;

      // Top performer filter
      if (filters.topPerformer === 'top' && !isTop) return false;
      if (filters.topPerformer === 'other' && isTop) return false;

      // Views filter
      const viewsMin = parseNumericInput(filters.viewsMin);
      const viewsMax = parseNumericInput(filters.viewsMax);
      if (viewsMin !== null && post.views < viewsMin) return false;
      if (viewsMax !== null && post.views > viewsMax) return false;

      // Likes filter
      const likesMin = parseNumericInput(filters.likesMin);
      const likesMax = parseNumericInput(filters.likesMax);
      if (likesMin !== null && post.likes < likesMin) return false;
      if (likesMax !== null && post.likes > likesMax) return false;

      // Engagement filter
      const engagementMin = filters.engagementMin ? parseFloat(filters.engagementMin) : null;
      const engagementMax = filters.engagementMax ? parseFloat(filters.engagementMax) : null;
      if (engagementMin !== null && (post.engagement_rate === null || post.engagement_rate < engagementMin)) return false;
      if (engagementMax !== null && (post.engagement_rate === null || post.engagement_rate > engagementMax)) return false;

      // CPM filter
      const cpmMin = filters.cpmMin ? parseFloat(filters.cpmMin) : null;
      const cpmMax = filters.cpmMax ? parseFloat(filters.cpmMax) : null;
      if (cpmMin !== null && (cpm === null || cpm < cpmMin)) return false;
      if (cpmMax !== null && (cpm === null || cpm > cpmMax)) return false;

      // EMV filter
      const emv = calculatePostEMV(post, emvSettings);
      const emvMin = filters.emvMin ? parseFloat(filters.emvMin) : null;
      const emvMax = filters.emvMax ? parseFloat(filters.emvMax) : null;
      if (emvMin !== null && emv < emvMin) return false;
      if (emvMax !== null && emv > emvMax) return false;

      // Sales Impact filter
      const attribution = calculateAttribution(post, mockOrders, salesData, ATTRIBUTION_DEFAULTS);
      const salesImpact = attribution.spikeDetected ? attribution.attributedRevenue : 0;
      const salesMin = filters.salesMin ? parseFloat(filters.salesMin) : null;
      const salesMax = filters.salesMax ? parseFloat(filters.salesMax) : null;
      if (salesMin !== null && salesImpact < salesMin) return false;
      if (salesMax !== null && salesImpact > salesMax) return false;

      return true;
    });

    // Sort
    if (filters.sort) {
      result = [...result].sort((a, b) => {
        const orderA = mockOrders.find(o => o.id === a.order_id);
        const orderB = mockOrders.find(o => o.id === b.order_id);
        
        let valueA: number | null = 0;
        let valueB: number | null = 0;

        switch (filters.sort!.field) {
          case 'detected_at':
            valueA = new Date(a.detected_at).getTime();
            valueB = new Date(b.detected_at).getTime();
            break;
          case 'views':
            valueA = a.views;
            valueB = b.views;
            break;
          case 'likes':
            valueA = a.likes;
            valueB = b.likes;
            break;
          case 'engagement_rate':
            valueA = a.engagement_rate ?? 0;
            valueB = b.engagement_rate ?? 0;
            break;
          case 'cpm':
            valueA = calculatePostCPM(a, orderA) ?? Infinity;
            valueB = calculatePostCPM(b, orderB) ?? Infinity;
            break;
          case 'emv':
            valueA = calculatePostEMV(a, emvSettings);
            valueB = calculatePostEMV(b, emvSettings);
            break;
          case 'sales': {
            const attrA = calculateAttribution(a, mockOrders, salesData, ATTRIBUTION_DEFAULTS);
            const attrB = calculateAttribution(b, mockOrders, salesData, ATTRIBUTION_DEFAULTS);
            valueA = attrA.spikeDetected ? attrA.attributedRevenue : 0;
            valueB = attrB.spikeDetected ? attrB.attributedRevenue : 0;
            break;
          }
        }

        if (filters.sort!.direction === 'asc') {
          return (valueA ?? 0) - (valueB ?? 0);
        } else {
          return (valueB ?? 0) - (valueA ?? 0);
        }
      });
    }

    return result;
  }, [filters, emvSettings, salesData]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-display font-medium text-foreground">Posts</h1>
            <p className="text-muted-foreground mt-0.5 text-xs font-body">
              Evaluate influencer posts and performance metrics.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/dashboard/analytics')} 
            variant="ghost" 
            size="icon"
            className="hover:bg-primary/10 hover:text-primary"
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters */}
        <PostFilters
          filters={filters}
          onFiltersChange={setFilters}
          activeFilterCount={activeFilterCount}
        />

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => {
            const order = mockOrders.find(o => o.id === post.order_id);
            const cpm = calculatePostCPM(post, order);
            const emv = calculatePostEMV(post, emvSettings);
            const isTop = isTopPerformer(post.influencer_id, mockPosts, mockOrders);
            const isVerified = hasPostedForVouch(post.influencer_id, mockPosts);
            const attribution = calculateAttribution(post, mockOrders, salesData, ATTRIBUTION_DEFAULTS);

            return (
              <div
                key={post.id}
                ref={(el) => { cardRefs.current[post.id] = el; }}
                className={`transition-all duration-700 rounded-lg ${
                  highlightedPost?.id === post.id && showHighlight 
                    ? 'ring-2 ring-primary' 
                    : ''
                }`}
              >
                <Card className="glass overflow-hidden group h-full hover:shadow-lg transition-all duration-300">
                <div className="aspect-video bg-muted/50 flex items-center justify-center relative">
                  {post.boosting_rights_granted ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-3 left-3 z-10 h-7 px-2.5 text-xs backdrop-blur-sm"
                      asChild
                    >
                      <a
                        href={post.platform === 'instagram'
                          ? 'https://adsmanager.facebook.com/adsmanager/manage/campaigns'
                          : 'https://ads.tiktok.com/i18n/home'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Rocket className="w-3.5 h-3.5 mr-1" />
                        Boost
                      </a>
                    </Button>
                  ) : (
                    <Badge variant="outline" className="absolute top-3 left-3 z-10 h-7 px-2.5 text-xs backdrop-blur-sm bg-muted/80 text-muted-foreground border-muted-foreground/20">
                      <ShieldOff className="w-3.5 h-3.5 mr-1" />
                      No Boosting Rights
                    </Badge>
                  )}
                  {/* Priority metric — top right */}
                  {priorityMetric === 'cpm' ? (
                    <Badge variant="outline" className={`absolute top-3 right-3 text-xs h-6 px-2 backdrop-blur-sm ${getMetricColor('cpm').badgeBg}`}>
                      {cpm !== null ? formatCPM(cpm) : '—'} CPM
                    </Badge>
                  ) : priorityMetric === 'emv' ? (
                    <Badge variant="outline" className={`absolute top-3 right-3 text-xs h-6 px-2 backdrop-blur-sm ${getMetricColor('emv').badgeBg}`}>
                      {formatEMV(emv)} EMV
                    </Badge>
                  ) : attribution.spikeDetected ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={`absolute top-3 right-3 text-xs h-6 px-2 backdrop-blur-sm cursor-help ${getMetricColor('sales').badgeBg}`}>
                          +{formatAttribution(attribution.attributedRevenue)} Sales
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] text-xs">
                        <p className="font-medium mb-1">Sales Spike Detected</p>
                        <p className="text-muted-foreground">+{Math.round(attribution.liftPercent)}% above 7-day baseline · {attribution.confidenceScore}% confidence</p>
                        <p className="text-muted-foreground mt-1">{attribution.productNames.slice(0, 2).join(', ')}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : null}

                  {/* Bottom-left: first non-priority metric */}
                  {priorityMetric === 'sales' ? (
                    <Badge variant="outline" className={`absolute bottom-3 left-3 text-xs h-6 px-2 backdrop-blur-sm ${getMetricColor('cpm').badgeBg}`}>
                      {cpm !== null ? formatCPM(cpm) : '—'} CPM
                    </Badge>
                  ) : priorityMetric === 'cpm' ? (
                    <Badge variant="outline" className={`absolute bottom-3 left-3 text-xs h-6 px-2 backdrop-blur-sm ${getMetricColor('emv').badgeBg}`}>
                      {formatEMV(emv)} EMV
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={`absolute bottom-3 left-3 text-xs h-6 px-2 backdrop-blur-sm ${getMetricColor('cpm').badgeBg}`}>
                      {cpm !== null ? formatCPM(cpm) : '—'} CPM
                    </Badge>
                  )}

                  {/* Bottom-right: second non-priority metric */}
                  {priorityMetric === 'sales' ? (
                    <Badge variant="outline" className={`absolute bottom-3 right-3 text-xs h-6 px-2 backdrop-blur-sm ${getMetricColor('emv').badgeBg}`}>
                      {formatEMV(emv)} EMV
                    </Badge>
                  ) : priorityMetric === 'cpm' ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={`absolute bottom-3 right-3 text-xs h-6 px-2 backdrop-blur-sm cursor-help ${getMetricColor('sales').badgeBg}`}>
                          {attribution.spikeDetected ? `+${formatAttribution(attribution.attributedRevenue)} Sales` : '— Sales'}
                        </Badge>
                      </TooltipTrigger>
                      {attribution.spikeDetected && (
                        <TooltipContent side="top" className="max-w-[200px] text-xs">
                          <p className="font-medium mb-1">Sales Spike Detected</p>
                          <p className="text-muted-foreground">+{Math.round(attribution.liftPercent)}% above 7-day baseline · {attribution.confidenceScore}% confidence</p>
                          <p className="text-muted-foreground mt-1">{attribution.productNames.slice(0, 2).join(', ')}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={`absolute bottom-3 right-3 text-xs h-6 px-2 backdrop-blur-sm cursor-help ${getMetricColor('sales').badgeBg}`}>
                          {attribution.spikeDetected ? `+${formatAttribution(attribution.attributedRevenue)} Sales` : '— Sales'}
                        </Badge>
                      </TooltipTrigger>
                      {attribution.spikeDetected && (
                        <TooltipContent side="top" className="max-w-[200px] text-xs">
                          <p className="font-medium mb-1">Sales Spike Detected</p>
                          <p className="text-muted-foreground">+{Math.round(attribution.liftPercent)}% above 7-day baseline · {attribution.confidenceScore}% confidence</p>
                          <p className="text-muted-foreground mt-1">{attribution.productNames.slice(0, 2).join(', ')}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )}
                  <div className="text-muted-foreground text-sm">
                    Post Preview
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <Button size="sm" variant="secondary" asChild>
                      <a href={post.post_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Post
                      </a>
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <Link
                        to={`/dashboard/influencers?id=${post.influencer_id}`}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <VerifiedInfluencerAvatar 
                          initial={post.influencer?.full_name?.charAt(0) || '?'}
                          imageUrl={post.influencer?.profile_image_url}
                          isVerified={isVerified}
                        />
                      </Link>
                      <div>
                        <p className="text-base flex items-center gap-1.5">
                          <Link
                            to={`/dashboard/influencers?id=${post.influencer_id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {post.influencer?.full_name}
                          </Link>
                          
                        </p>
                        <a
                          href={post.platform === 'instagram' 
                            ? `https://instagram.com/${post.influencer?.instagram_username}` 
                            : `https://tiktok.com/@${post.influencer?.tiktok_username}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          @{post.platform === 'instagram' 
                            ? post.influencer?.instagram_username 
                            : post.influencer?.tiktok_username}
                        </a>
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      {post.platform === 'instagram' ? (
                        <Instagram className="w-4 h-4" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatNumber(post.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {formatNumber(post.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {formatNumber(post.comments)}
                    </span>
                    {post.engagement_rate && (
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {post.engagement_rate}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Detected {format(new Date(post.detected_at), 'MMM d, yyyy h:mm a')}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setSelectedPost(post)}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Full View
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            );
          })}

          {filteredPosts.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center text-muted-foreground">
                {activeFilterCount > 0 
                  ? 'No posts match your filters. Try adjusting your search criteria.'
                  : 'No posts detected yet. Posts will appear here once influencers tag your brand.'}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Post Detail Dialog */}
        <PostDetailDialog
          post={selectedPost!}
          order={selectedPost ? mockOrders.find(o => o.id === selectedPost.order_id) : undefined}
          allPosts={mockPosts}
          allOrders={mockOrders}
          open={!!selectedPost}
          onOpenChange={(open) => !open && setSelectedPost(null)}
        />
      </div>
    </DashboardLayout>
  );
}