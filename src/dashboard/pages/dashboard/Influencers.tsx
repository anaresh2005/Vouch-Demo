import { singleCurrency } from '@dashboard/lib/dashboardMoney';
import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { DashboardLayout } from '@dashboard/components/dashboard/DashboardLayout';
import { DataStatus } from '@dashboard/components/dashboard/DataStatus';
import { EmptyState } from '@dashboard/components/dashboard/EmptyState';
import { PageHeader } from '@dashboard/components/dashboard/PageHeader';
import { CreatorCell } from '@dashboard/components/dashboard/CreatorCell';
import { InfluencerFilters } from '@dashboard/components/dashboard/InfluencerFilters';
import { InfluencerProfileDialog } from '@dashboard/components/dashboard/InfluencerProfileDialog';
import { OrderStatusBadge } from '@dashboard/components/dashboard/OrderStatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@dashboard/components/ui/table';
import { useBrandOrders, useBrandPosts, useBrandInfluencers } from '@dashboard/hooks/useBrandData';
import { useEMVSettings } from '@dashboard/hooks/useEMVSettings';
import { useLinkedRow } from '@dashboard/hooks/useLinkedRow';
import { usePriorityMetric } from '@dashboard/hooks/usePriorityMetric';
import { getInfluencerAverageCPM, averagePostEMV, formatCPM, formatEMV } from '@dashboard/lib/cpmUtils';
import { creatorOn } from '@dashboard/lib/format';
import { InfluencerFiltersState, defaultInfluencerFilters, countActiveInfluencerFilters, parseFollowersInput } from '@dashboard/lib/influencerFilters';
import { orderStage } from '@dashboard/lib/orderStage';
import { matchesOrderNumber, matchesSearch, normalizeSearch } from '@dashboard/lib/search';
import { compareMissingLast } from '@dashboard/lib/sort';
import { cn } from '@dashboard/lib/utils';

export default function Influencers() {
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<InfluencerFiltersState>(defaultInfluencerFilters);
  const { settings: emvSettings } = useEMVSettings();
  const { priorityMetric } = usePriorityMetric();

  const { data: orders = [], isLoading: ordersLoading, error: ordersError, refetch: retryOrders } = useBrandOrders();
  const { data: posts = [], isLoading: postsLoading, error: postsError, refetch: retryPosts } = useBrandPosts();
  const { influencers } = useBrandInfluencers();
  const selected = influencers.find(i => i.id === selectedId);

  // Get orders for each influencer
  const getOrdersForInfluencer = useCallback((influencerId: string) => {
    return orders.filter(order => order.influencer_id === influencerId);
  }, [orders]);

  // Get posts for each influencer
  const getPostsForInfluencer = useCallback((influencerId: string) => {
    return posts.filter(post => post.influencer_id === influencerId);
  }, [posts]);

  // Filter and sort influencers
  const filteredInfluencers = useMemo(() => {
    let result = [...influencers];

    // Search filter - includes the creator's gifts' order IDs
    const query = normalizeSearch(filters.search);
    if (query) {
      result = result.filter(inf =>
        matchesSearch(query, [inf.full_name, inf.email, inf.instagram_username, inf.tiktok_username]) ||
        getOrdersForInfluencer(inf.id).some(order =>
          matchesSearch(query, [order.id, order.shopify_order_id]) || matchesOrderNumber(query, order.shopify_order_id)));
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
        inf.category && filters.categories.some(category => category === inf.category)
      );
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

    // Status filter - matches the stage of the creator's latest gift, as shown in the "Latest gift" column
    if (filters.statuses.length > 0) {
      result = result.filter(inf => {
        const latest = getOrdersForInfluencer(inf.id)[0];
        return !!latest && filters.statuses.includes(orderStage(latest));
      });
    }

    // CPM filter
    const cpmMin = filters.cpmMin ? parseFloat(filters.cpmMin) : null;
    const cpmMax = filters.cpmMax ? parseFloat(filters.cpmMax) : null;
    if (cpmMin !== null || cpmMax !== null) {
      result = result.filter(inf => {
        const avgCPM = getInfluencerAverageCPM(inf.id, posts, orders);
        if (avgCPM === null) return false;
        if (cpmMin !== null && avgCPM < cpmMin) return false;
        if (cpmMax !== null && avgCPM > cpmMax) return false;
        return true;
      });
    }

    // EMV filter (avg EMV across brand posts that have one)
    const emvMin = filters.emvMin ? parseFloat(filters.emvMin) : null;
    const emvMax = filters.emvMax ? parseFloat(filters.emvMax) : null;
    if (emvMin !== null || emvMax !== null) {
      result = result.filter(inf => {
        const avgEMV = averagePostEMV(getPostsForInfluencer(inf.id), emvSettings);
        if (avgEMV === null) return false;
        if (emvMin !== null && avgEMV < emvMin) return false;
        if (emvMax !== null && avgEMV > emvMax) return false;
        return true;
      });
    }

    // Sort. Creators without a value (no CPM or EMV yet) always go last, whichever the direction.
    if (filters.sort) {
      result = [...result].sort((a, b) => {
        let valueA: number | null = 0;
        let valueB: number | null = 0;

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
          case 'avg_cpm':
            valueA = getInfluencerAverageCPM(a.id, posts, orders);
            valueB = getInfluencerAverageCPM(b.id, posts, orders);
            break;
          case 'avg_emv':
            valueA = averagePostEMV(getPostsForInfluencer(a.id), emvSettings);
            valueB = averagePostEMV(getPostsForInfluencer(b.id), emvSettings);
            break;

        }

        return compareMissingLast(valueA, valueB, filters.sort!.direction);
      });
    }

    return result;
  }, [filters, emvSettings, influencers, orders, posts, getOrdersForInfluencer, getPostsForInfluencer]);

  const activeFilterCount = countActiveInfluencerFilters(filters);
  const linkedRow = useLinkedRow(highlightedId);

  if (ordersLoading || postsLoading || ordersError || postsError) {
    return <DashboardLayout><DataStatus failed={!!(ordersError || postsError)} retry={() => { retryOrders(); retryPosts(); }} /></DashboardLayout>;
  }

  const priorityLabel = priorityMetric === 'cpm' ? 'Avg CPM' : 'Avg EMV';
  const priorityValue = (influencerId: string) => {
    const influencerPosts = getPostsForInfluencer(influencerId);
    if (influencerPosts.length === 0) return null;
    if (priorityMetric === 'cpm') {
      const average = getInfluencerAverageCPM(influencerId, posts, orders);
      return average === null ? null : formatCPM(average, singleCurrency(orders));
    }
    const average = averagePostEMV(influencerPosts, emvSettings);
    return average === null ? null : formatEMV(average);
  };

  return (
    <DashboardLayout>
      <PageHeader title="Creators" description="Everyone who has ordered with Post to Pay, and how their posts performed." />

      {influencers.length === 0 ? (
        <EmptyState icon={Users} title="No creators yet" description="Each creator who checks out with Post to Pay appears here with their profile and posts." className="py-14" />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <InfluencerFilters filters={filters} onFiltersChange={setFilters} activeFilterCount={activeFilterCount} />
          </div>
          {/* Category appears from xl: at 1024–1279px with the sidebar it pushed the table ~30px wider
              than the content area and squeezed "View profile" onto two clipped lines. */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead className="hidden xl:table-cell">Category</TableHead>
                <TableHead className="hidden text-right md:table-cell">Engagement</TableHead>
                <TableHead className="text-right">Gifts</TableHead>
                <TableHead className="hidden sm:table-cell">Latest gift</TableHead>
                <TableHead className="text-right text-primary">{priorityLabel}</TableHead>
                <TableHead><span className="sr-only">Profile</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInfluencers.map(influencer => {
                const influencerOrders = getOrdersForInfluencer(influencer.id);
                const latest = influencerOrders[0];
                const platform = latest?.platform ?? (influencer.instagram_username ? 'instagram' : 'tiktok');
                const { engagement } = creatorOn(influencer, platform);
                const value = priorityValue(influencer.id);
                return (
                  <TableRow
                    key={influencer.id}
                    ref={linkedRow.rowRef(influencer.id)}
                    onClick={() => setSelectedId(influencer.id)}
                    className={cn('cursor-pointer', linkedRow.isHighlighted(influencer.id) && '[&>td]:bg-primary/10')}
                  >
                    <TableCell>
                      <CreatorCell influencer={influencer} platform={platform} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">{influencer.category ?? '—'}</TableCell>
                    <TableCell className="hidden text-right md:table-cell">{engagement ? `${engagement.toFixed(1)}%` : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-right">{influencerOrders.length}</TableCell>
                    <TableCell className="hidden sm:table-cell">{latest ? <OrderStatusBadge order={latest} /> : '—'}</TableCell>
                    <TableCell className="text-right font-medium">{value ?? <span className="font-normal text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <button type="button" aria-label={`View profile for ${influencer.full_name ?? 'creator'}`}
                        className="rounded text-sm font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2"
                        onClick={e => { e.stopPropagation(); setSelectedId(influencer.id); }}>View profile</button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredInfluencers.length === 0 && (
            <EmptyState title="No creators match your filters" description="Try adjusting your search or clearing the filters." className="mt-4" />
          )}
          <p className="mt-3 text-sm text-muted-foreground">{filteredInfluencers.length} of {influencers.length} {influencers.length === 1 ? 'creator' : 'creators'}</p>
        </>
      )}

      {selected && (
        <InfluencerProfileDialog
          influencer={selected}
          orders={getOrdersForInfluencer(selected.id)}
          allPosts={posts}
          allOrders={orders}
          open
          onOpenChange={(open) => !open && setSelectedId(null)}
        />
      )}
    </DashboardLayout>
  );
}
