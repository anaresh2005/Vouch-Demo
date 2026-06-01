import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { InfluencerCard } from '@/components/dashboard/InfluencerCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { mockInfluencers, mockOrders, mockPosts } from '@/lib/mockData';
import { prefetchAllModashProfiles, isModashPrefetched } from '@/lib/modashCache';
import { 
  InfluencerFilters, 
  InfluencerFiltersState, 
  defaultInfluencerFilters, 
  countActiveInfluencerFilters,
  parseFollowersInput 
} from '@/components/dashboard/InfluencerFilters';
import { isTopPerformer, getInfluencerBestCPM, hasPostedForVouch, calculatePostEMV } from '@/lib/cpmUtils';
import { useEMVSettings } from '@/hooks/useEMVSettings';
import { usePriorityMetric } from '@/hooks/usePriorityMetric';
import { calculateAllAttributions, getMockSalesData, getInfluencerEstimatedSales, ATTRIBUTION_DEFAULTS } from '@/lib/attributionUtils';


export default function Influencers() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightedId = searchParams.get('id');
  const [showHighlight, setShowHighlight] = useState(true);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [filters, setFilters] = useState<InfluencerFiltersState>(defaultInfluencerFilters);
  const { settings: emvSettings } = useEMVSettings();
  const { priorityMetric } = usePriorityMetric();
  const salesData = useMemo(() => getMockSalesData(), []);

  // Prefetch all Modash profiles once on mount
  useEffect(() => {
    if (!isModashPrefetched()) {
      prefetchAllModashProfiles();
    }
  }, []);

  // Scroll to highlighted influencer when page loads with id param
  useEffect(() => {
    if (highlightedId && cardRefs.current[highlightedId]) {
      setTimeout(() => {
        cardRefs.current[highlightedId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightedId]);

  // Fade out highlight after 3 seconds
  useEffect(() => {
    if (highlightedId) {
      setShowHighlight(true);
      const timer = setTimeout(() => {
        setShowHighlight(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedId]);

  // Get orders for each influencer
  const getOrdersForInfluencer = (influencerId: string) => {
    return mockOrders.filter(order => order.influencer_id === influencerId);
  };

  // Get posts for each influencer
  const getPostsForInfluencer = (influencerId: string) => {
    return mockPosts.filter(post => post.influencer_id === influencerId);
  };

  // Filter and sort influencers
  const filteredInfluencers = useMemo(() => {
    let result = [...mockInfluencers];

    // Search filter - includes order ID search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(inf => {
        // Check influencer fields
        const matchesInfluencer = 
          inf.full_name?.toLowerCase().includes(searchLower) ||
          inf.email?.toLowerCase().includes(searchLower) ||
          inf.instagram_username?.toLowerCase().includes(searchLower) ||
          inf.tiktok_username?.toLowerCase().includes(searchLower);
        
        // Check order IDs for this influencer
        const influencerOrders = getOrdersForInfluencer(inf.id);
        const matchesOrderId = influencerOrders.some(order => 
          order.id.toLowerCase().includes(searchLower) ||
          order.shopify_order_id?.toLowerCase().includes(searchLower)
        );
        
        return matchesInfluencer || matchesOrderId;
      });
    }

    // Platform filter
    if (filters.platforms.length > 0) {
      result = result.filter(inf => {
        const hasInstagram = filters.platforms.includes('instagram') && inf.instagram_username;
        const hasTiktok = filters.platforms.includes('tiktok') && inf.tiktok_username;
        return hasInstagram || hasTiktok;
      });
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter(inf => 
        inf.category && filters.categories.includes(inf.category)
      );
    }

    // Vouch Verified filter (influencer has posted for Vouch at least once)
    if (filters.vouchVerified === 'verified') {
      result = result.filter(inf => {
        return hasPostedForVouch(inf.id, mockPosts);
      });
    } else if (filters.vouchVerified === 'unverified') {
      result = result.filter(inf => {
        return !hasPostedForVouch(inf.id, mockPosts);
      });
    }

    // Top Performer filter
    if (filters.topPerformer === 'top') {
      result = result.filter(inf => {
        return isTopPerformer(inf.id, mockPosts, mockOrders, priorityMetric, emvSettings);
      });
    } else if (filters.topPerformer === 'other') {
      result = result.filter(inf => {
        return !isTopPerformer(inf.id, mockPosts, mockOrders, priorityMetric, emvSettings);
      });
    }

    // Followers filter (use max of instagram or tiktok)
    const followersMin = parseFollowersInput(filters.followersMin);
    const followersMax = parseFollowersInput(filters.followersMax);
    if (followersMin !== null || followersMax !== null) {
      result = result.filter(inf => {
        const maxFollowers = Math.max(inf.instagram_followers || 0, inf.tiktok_followers || 0);
        if (followersMin !== null && maxFollowers < followersMin) return false;
        if (followersMax !== null && maxFollowers > followersMax) return false;
        return true;
      });
    }

    // Engagement filter (use max of instagram or tiktok)
    const engMin = filters.engagementMin ? parseFloat(filters.engagementMin) : null;
    const engMax = filters.engagementMax ? parseFloat(filters.engagementMax) : null;
    if (engMin !== null || engMax !== null) {
      result = result.filter(inf => {
        const maxEngagement = Math.max(inf.instagram_engagement_rate || 0, inf.tiktok_engagement_rate || 0);
        if (engMin !== null && maxEngagement < engMin) return false;
        if (engMax !== null && maxEngagement > engMax) return false;
        return true;
      });
    }

    // Status filter - show influencers who have at least one order with matching status
    if (filters.statuses.length > 0) {
      result = result.filter(inf => {
        const influencerOrders = getOrdersForInfluencer(inf.id);
        return influencerOrders.some(order => filters.statuses.includes(order.status));
      });
    }

    // CPM filter
    const cpmMin = filters.cpmMin ? parseFloat(filters.cpmMin) : null;
    const cpmMax = filters.cpmMax ? parseFloat(filters.cpmMax) : null;
    if (cpmMin !== null || cpmMax !== null) {
      result = result.filter(inf => {
        const bestCPM = getInfluencerBestCPM(inf.id, mockPosts, mockOrders);
        if (bestCPM === null) return false;
        if (cpmMin !== null && bestCPM < cpmMin) return false;
        if (cpmMax !== null && bestCPM > cpmMax) return false;
        return true;
      });
    }

    // EMV filter (avg EMV across brand posts)
    const emvMin = filters.emvMin ? parseFloat(filters.emvMin) : null;
    const emvMax = filters.emvMax ? parseFloat(filters.emvMax) : null;
    if (emvMin !== null || emvMax !== null) {
      result = result.filter(inf => {
        const infPosts = getPostsForInfluencer(inf.id);
        if (infPosts.length === 0) return false;
        const avgEMV = infPosts.reduce((sum, p) => sum + calculatePostEMV(p, emvSettings), 0) / infPosts.length;
        if (emvMin !== null && avgEMV < emvMin) return false;
        if (emvMax !== null && avgEMV > emvMax) return false;
        return true;
      });
    }

    // Sales Impact filter
    const salesMin = filters.salesMin ? parseFloat(filters.salesMin) : null;
    const salesMax = filters.salesMax ? parseFloat(filters.salesMax) : null;
    if (salesMin !== null || salesMax !== null) {
      result = result.filter(inf => {
        const infPosts = getPostsForInfluencer(inf.id);
        const allAttributions = calculateAllAttributions(infPosts, mockOrders, salesData, ATTRIBUTION_DEFAULTS);
        const estimatedSales = getInfluencerEstimatedSales(inf.id, allAttributions);
        if (salesMin !== null && estimatedSales < salesMin) return false;
        if (salesMax !== null && estimatedSales > salesMax) return false;
        return true;
      });
    }

    // Sort
    if (filters.sort) {
      result = [...result].sort((a, b) => {
        let valueA: number = 0;
        let valueB: number = 0;

        switch (filters.sort!.field) {
          case 'followers':
            valueA = Math.max(a.instagram_followers || 0, a.tiktok_followers || 0);
            valueB = Math.max(b.instagram_followers || 0, b.tiktok_followers || 0);
            break;
          case 'engagement_rate':
            valueA = Math.max(a.instagram_engagement_rate || 0, a.tiktok_engagement_rate || 0);
            valueB = Math.max(b.instagram_engagement_rate || 0, b.tiktok_engagement_rate || 0);
            break;
          case 'orders_count':
            valueA = getOrdersForInfluencer(a.id).length;
            valueB = getOrdersForInfluencer(b.id).length;
            break;
          case 'best_cpm':
            valueA = getInfluencerBestCPM(a.id, mockPosts, mockOrders) ?? Infinity;
            valueB = getInfluencerBestCPM(b.id, mockPosts, mockOrders) ?? Infinity;
            break;
          case 'avg_emv': {
            const postsA = getPostsForInfluencer(a.id);
            const postsB = getPostsForInfluencer(b.id);
            valueA = postsA.length > 0 ? postsA.reduce((s, p) => s + calculatePostEMV(p, emvSettings), 0) / postsA.length : 0;
            valueB = postsB.length > 0 ? postsB.reduce((s, p) => s + calculatePostEMV(p, emvSettings), 0) / postsB.length : 0;
            break;
          }
          case 'sales': {
            const attrA = calculateAllAttributions(getPostsForInfluencer(a.id), mockOrders, salesData, ATTRIBUTION_DEFAULTS);
            const attrB = calculateAllAttributions(getPostsForInfluencer(b.id), mockOrders, salesData, ATTRIBUTION_DEFAULTS);
            valueA = getInfluencerEstimatedSales(a.id, attrA);
            valueB = getInfluencerEstimatedSales(b.id, attrB);
            break;
          }
        }

        if (filters.sort!.direction === 'asc') {
          return valueA - valueB;
        } else {
          return valueB - valueA;
        }
      });
    }

    return result;
  }, [filters, emvSettings, salesData, priorityMetric]);

  const activeFilterCount = countActiveInfluencerFilters(filters);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-display font-medium text-foreground">Influencers</h1>
            <p className="text-muted-foreground mt-0.5 text-xs font-body">
              Discover and analyze your Vouch customers.
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

        <InfluencerFilters 
          filters={filters}
          onFiltersChange={setFilters}
          activeFilterCount={activeFilterCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredInfluencers.map(influencer => (
            <div
              key={influencer.id}
              ref={(el) => { cardRefs.current[influencer.id] = el; }}
              className={`transition-all duration-700 rounded-lg h-full ${
                highlightedId === influencer.id && showHighlight 
                  ? 'ring-2 ring-primary' 
                  : ''
              }`}
            >
              <InfluencerCard
                influencer={influencer}
                orders={getOrdersForInfluencer(influencer.id)}
                allPosts={mockPosts}
                allOrders={mockOrders}
              />
            </div>
          ))}
          {filteredInfluencers.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center text-muted-foreground">
                No influencers found matching your search
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
