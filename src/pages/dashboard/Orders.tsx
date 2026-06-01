import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { OrderStatusBadge } from '@/components/dashboard/OrderStatusBadge';
import { OrderTimeline } from '@/components/dashboard/OrderTimeline';

import { VerifiedInfluencerAvatar } from '@/components/dashboard/VerifiedInfluencerAvatar';

import { 
  OrderFilters, 
  OrderFiltersState, 
  defaultFilters, 
  countActiveFilters,
  parseFollowersInput,
  SortField,
  SortConfig
} from '@/components/dashboard/OrderFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockOrders, mockPosts } from '@/lib/mockData';
import { isTopPerformer, hasPostedForVouch } from '@/lib/cpmUtils';
import { Instagram, Users, BarChart3, Link2, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Orders() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<OrderFiltersState>(defaultFilters);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showHighlight, setShowHighlight] = useState(true);
  const orderRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightedId = searchParams.get('expand');

  // Auto-expand and scroll to order from URL param
  useEffect(() => {
    if (highlightedId) {
      setExpandedOrderId(highlightedId);
      setShowHighlight(true);
      // Scroll to the order after a brief delay to allow render
      setTimeout(() => {
        const element = orderRefs.current[highlightedId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightedId]);

  // Fade out highlight after 2 seconds
  useEffect(() => {
    if (highlightedId) {
      const timer = setTimeout(() => {
        setShowHighlight(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedId]);

  // Memoize filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let result = mockOrders.filter(order => {
      const influencer = order.influencer;
      const isInstagram = order.platform === 'instagram';
      const followers = isInstagram ? influencer?.instagram_followers : influencer?.tiktok_followers;
      const engagementRate = isInstagram ? influencer?.instagram_engagement_rate : influencer?.tiktok_engagement_rate;

      // Search filter
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !searchLower || 
        order.influencer?.full_name?.toLowerCase().includes(searchLower) ||
        order.influencer?.email?.toLowerCase().includes(searchLower) ||
        order.influencer?.instagram_username?.toLowerCase().includes(searchLower) ||
        order.influencer?.tiktok_username?.toLowerCase().includes(searchLower) ||
        order.shopify_order_id?.toLowerCase().includes(searchLower) ||
        order.id?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;

      // Status filter (multi-select: empty array means all)
      const matchesStatus = filters.statuses.length === 0 || 
        filters.statuses.includes(order.status) || 
        (filters.statuses.includes('delivered') && order.status === 'post_pending');
      
      if (!matchesStatus) return false;

      // Date filter
      if (filters.dateType) {
        let dateToCheck: Date | null = null;
        
        if (filters.dateType === 'created') {
          dateToCheck = new Date(order.created_at);
        } else if (filters.dateType === 'delivered' && order.delivered_at) {
          dateToCheck = new Date(order.delivered_at);
        } else if (filters.dateType === 'posted_charged') {
          // Check post detected_at or charged_at
          const post = mockPosts.find(p => p.order_id === order.id);
          if (post) {
            dateToCheck = new Date(post.detected_at);
          } else if (order.charged_at) {
            dateToCheck = new Date(order.charged_at);
          }
        }

        if (dateToCheck) {
          if (filters.dateFrom && dateToCheck < filters.dateFrom) return false;
          if (filters.dateTo) {
            const endOfDay = new Date(filters.dateTo);
            endOfDay.setHours(23, 59, 59, 999);
            if (dateToCheck > endOfDay) return false;
          }
        } else if (filters.dateFrom || filters.dateTo) {
          // If date type is selected but no date exists for this order, exclude it
          return false;
        }
      }

      // Vouch verified filter
      if (filters.vouchVerified !== 'all') {
        const isVerified = influencer ? hasPostedForVouch(influencer.id, mockPosts) : false;
        if (filters.vouchVerified === 'verified' && !isVerified) return false;
        if (filters.vouchVerified === 'unverified' && isVerified) return false;
      }

      // Top performer filter
      if (filters.topPerformer !== 'all') {
        const isTop = influencer ? isTopPerformer(influencer.id, mockPosts, mockOrders) : false;
        if (filters.topPerformer === 'top' && !isTop) return false;
        if (filters.topPerformer === 'other' && isTop) return false;
      }

      // Platform filter (multi-select: empty array means all)
      if (filters.platforms.length > 0) {
        if (!filters.platforms.includes(order.platform)) return false;
      }

      // Items count filter
      if (filters.itemsMin || filters.itemsMax) {
        const min = filters.itemsMin ? parseInt(filters.itemsMin) : null;
        const max = filters.itemsMax ? parseInt(filters.itemsMax) : null;
        if (min !== null && order.items_count < min) return false;
        if (max !== null && order.items_count > max) return false;
      }

      // Followers filter
      if (filters.followersMin || filters.followersMax) {
        const min = parseFollowersInput(filters.followersMin);
        const max = parseFollowersInput(filters.followersMax);
        if (min !== null && (!followers || followers < min)) return false;
        if (max !== null && (!followers || followers > max)) return false;
      }

      // Engagement rate filter
      if (filters.engagementMin || filters.engagementMax) {
        const min = filters.engagementMin ? parseFloat(filters.engagementMin) : null;
        const max = filters.engagementMax ? parseFloat(filters.engagementMax) : null;
        if (min !== null && (!engagementRate || engagementRate < min)) return false;
        if (max !== null && (!engagementRate || engagementRate > max)) return false;
      }

      return true;
    });

    // Multi-field sorting
    if (filters.sorts.length > 0) {
      result = [...result].sort((a, b) => {
        const aIsInstagram = a.platform === 'instagram';
        const bIsInstagram = b.platform === 'instagram';

        const getSortValue = (order: typeof a, field: SortField, isInstagram: boolean): number | null => {
          switch (field) {
            case 'created_at':
              return new Date(order.created_at).getTime();
            case 'delivered_at':
              return order.delivered_at ? new Date(order.delivered_at).getTime() : null;
            case 'posted_charged_at':
              const post = mockPosts.find(p => p.order_id === order.id);
              return post ? new Date(post.detected_at).getTime() : (order.charged_at ? new Date(order.charged_at).getTime() : null);
            case 'items_count':
              return order.items_count;
            case 'followers':
              return isInstagram ? order.influencer?.instagram_followers ?? null : order.influencer?.tiktok_followers ?? null;
            case 'engagement_rate':
              return isInstagram ? order.influencer?.instagram_engagement_rate ?? null : order.influencer?.tiktok_engagement_rate ?? null;
            default:
              return null;
          }
        };

        for (const sort of filters.sorts) {
          const aValue = getSortValue(a, sort.field, aIsInstagram);
          const bValue = getSortValue(b, sort.field, bIsInstagram);

          // Handle nulls - push to end
          if (aValue === null && bValue === null) continue;
          if (aValue === null) return 1;
          if (bValue === null) return -1;

          const diff = aValue - bValue;
          if (diff !== 0) {
            return sort.direction === 'desc' ? -diff : diff;
          }
        }
        return 0;
      });
    }

    return result;
  }, [filters]);

  const activeFilterCount = countActiveFilters(filters);

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

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-display font-medium text-foreground">Gifts</h1>
            <p className="text-muted-foreground mt-0.5 text-xs font-body">
              Track influencer gifts from warehouse to feed.
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
        <OrderFilters 
          filters={filters}
          onFiltersChange={setFilters}
          activeFilterCount={activeFilterCount}
        />

        {/* Gifts Cards */}
        <Card className="border border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>All Gifts ({filteredOrders.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              {(['created_at', 'items_count', 'followers', 'engagement_rate'] as SortField[]).map((field) => {
                const labels: Record<SortField, string> = {
                  created_at: 'Order Date',
                  delivered_at: 'Delivery',
                  posted_charged_at: 'Posted',
                  items_count: 'Items',
                  followers: 'Followers',
                  engagement_rate: 'Engagement',
                };
                const sortIndex = filters.sorts.findIndex(s => s.field === field);
                const isActive = sortIndex !== -1;
                const currentSort = isActive ? filters.sorts[sortIndex] : null;
                const icon = !isActive 
                  ? <ArrowUpDown className="w-3.5 h-3.5" />
                  : currentSort?.direction === 'desc' 
                    ? <ArrowDown className="w-3.5 h-3.5" />
                    : <ArrowUp className="w-3.5 h-3.5" />;
                
                return (
                  <Button
                    key={field}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (isActive && currentSort) {
                        if (currentSort.direction === 'desc') {
                          // Toggle to ascending
                          const newSorts = [...filters.sorts];
                          newSorts[sortIndex] = { ...currentSort, direction: 'asc' };
                          setFilters({ ...filters, sorts: newSorts });
                        } else {
                          // Remove this sort
                          const newSorts = filters.sorts.filter((_, i) => i !== sortIndex);
                          setFilters({ ...filters, sorts: newSorts });
                        }
                      } else {
                        // Add new sort
                        setFilters({ ...filters, sorts: [...filters.sorts, { field, direction: 'desc' }] });
                      }
                    }}
                    className="gap-1.5 relative"
                  >
                    {labels[field]}
                    {icon}
                    {isActive && filters.sorts.length > 1 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                        {sortIndex + 1}
                      </span>
                    )}
                  </Button>
                );
              })}
              {filters.sorts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ ...filters, sorts: [] })}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredOrders.map(order => {
                const influencer = order.influencer;
                const isInstagram = order.platform === 'instagram';
                const handle = isInstagram ? influencer?.instagram_username : influencer?.tiktok_username;
                const followers = isInstagram ? influencer?.instagram_followers : influencer?.tiktok_followers;
                const engagementRate = isInstagram ? influencer?.instagram_engagement_rate : influencer?.tiktok_engagement_rate;
                const isTop = influencer ? isTopPerformer(influencer.id, mockPosts, mockOrders) : false;
                const isVerified = influencer ? hasPostedForVouch(influencer.id, mockPosts) : false;
                const isExpanded = expandedOrderId === order.id;

                return (
                  <div
                    key={order.id}
                    ref={(el) => { orderRefs.current[order.id] = el; }}
                    className={cn(
                      "rounded-lg bg-card border transition-all duration-200",
                      isExpanded 
                        ? cn(
                            "shadow-sm",
                            order.status === 'pending_delivery' && "border-blue-500/30",
                            order.status === 'delivered' && "border-amber-500/30",
                            order.status === 'post_pending' && "border-amber-500/30",
                            order.status === 'post_verified' && "border-emerald-500/30",
                            order.status === 'charged' && "border-rose-500/30",
                            order.status === 'completed' && "border-emerald-500/30"
                          )
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/50",
                      highlightedId === order.id && showHighlight && "ring-2 ring-primary"
                    )}
                  >
                    {/* Main card row */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer"
                      onClick={() => toggleExpand(order.id)}
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
                          <span className="text-sm font-medium flex items-center gap-1 shrink-0">
                            <Link
                              to={`/dashboard/influencers?id=${order.influencer_id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-primary transition-colors"
                            >
                              {influencer?.full_name}
                            </Link>
                            
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
                        <ChevronDown 
                          className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )} 
                        />
                      </div>
                    </div>

                    {/* Expanded timeline section */}
                    <div 
                      className={cn(
                        "overflow-hidden transition-all duration-200",
                        isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="px-4 pb-4 border-t border-border/50">
                        <OrderTimeline order={order} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No gifts found matching your criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
