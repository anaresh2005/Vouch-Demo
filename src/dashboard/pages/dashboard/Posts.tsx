import { singleCurrency } from '@dashboard/lib/dashboardMoney';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { DashboardLayout } from '@dashboard/components/dashboard/DashboardLayout';
import { DataStatus } from '@dashboard/components/dashboard/DataStatus';
import { EmptyState } from '@dashboard/components/dashboard/EmptyState';
import { PageHeader } from '@dashboard/components/dashboard/PageHeader';
import { PostDetailDialog } from '@dashboard/components/dashboard/PostDetailDialog';
import { PostFilters } from '@dashboard/components/dashboard/PostFilters';
import { PostCard } from '@dashboard/components/dashboard/PostCard';
import { useBrandOrders, useBrandPosts } from '@dashboard/hooks/useBrandData';
import { useEMVSettings } from '@dashboard/hooks/useEMVSettings';
import { useLinkedRow } from '@dashboard/hooks/useLinkedRow';
import { usePriorityMetric } from '@dashboard/hooks/usePriorityMetric';
import { calculatePostCPM, calculatePostEMV } from '@dashboard/lib/cpmUtils';
import { PostFiltersState, defaultPostFilters, countActivePostFilters, parseNumericInput } from '@dashboard/lib/postFilters';
import { matchesSearch, normalizeSearch } from '@dashboard/lib/search';
import { compareMissingLast } from '@dashboard/lib/sort';

export default function Posts() {
  const [searchParams] = useSearchParams();
  const highlightedOrderId = searchParams.get('order');
  // The open post is kept by id, so its details follow the latest data (a flag shows at once).
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [filters, setFilters] = useState<PostFiltersState>(defaultPostFilters);
  const { settings: emvSettings } = useEMVSettings();
  const { priorityMetric } = usePriorityMetric();

  const { data: posts = [], isLoading: postsLoading, error: postsError, refetch: retryPosts } = useBrandPosts();
  const selectedPost = posts.find(p => p.id === selectedPostId) ?? null;
  const { data: orders = [], isLoading: ordersLoading, error: ordersError, refetch: retryOrders } = useBrandOrders();

  // Find the post that matches the order ID
  const highlightedPost = highlightedOrderId 
    ? posts.find(post => post.order_id === highlightedOrderId)
    : null;

  const activeFilterCount = countActivePostFilters(filters);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    const query = normalizeSearch(filters.search);
    let result = posts.filter(post => {
      const order = orders.find(o => o.id === post.order_id);
      const cpm = singleCurrency(orders) ? calculatePostCPM(post, order) : null;

      // Search filter
      if (!matchesSearch(query, [post.influencer?.full_name, post.influencer?.instagram_username, post.influencer?.tiktok_username, post.post_url])) {
        return false;
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
      if (emvMin !== null && (emv === null || emv < emvMin)) return false;
      if (emvMax !== null && (emv === null || emv > emvMax)) return false;

      return true;
    });

    // Sort. Posts without a value (no CPM yet) always go last, whichever the direction.
    if (filters.sort) {
      result = [...result].sort((a, b) => {
        const orderA = orders.find(o => o.id === a.order_id);
        const orderB = orders.find(o => o.id === b.order_id);
        
        let valueA: number | null = 0;
        let valueB: number | null = 0;

        switch (filters.sort!.field) {
          case 'detected_at':
            valueA = new Date(a.detected_at).getTime();
            valueB = new Date(b.detected_at).getTime();
            break;
          case 'views':
            valueA = a.views ?? 0;
            valueB = b.views ?? 0;
            break;
          case 'likes':
            valueA = a.likes ?? 0;
            valueB = b.likes ?? 0;
            break;
          case 'engagement_rate':
            valueA = a.engagement_rate ?? 0;
            valueB = b.engagement_rate ?? 0;
            break;
          case 'cpm':
            valueA = singleCurrency(orders) ? calculatePostCPM(a, orderA) : null;
            valueB = singleCurrency(orders) ? calculatePostCPM(b, orderB) : null;
            break;
          case 'emv':
            valueA = calculatePostEMV(a, emvSettings);
            valueB = calculatePostEMV(b, emvSettings);
            break;

        }

        return compareMissingLast(valueA, valueB, filters.sort!.direction);
      });
    }

    return result;
  }, [filters, emvSettings, orders, posts]);

  const linkedCard = useLinkedRow(highlightedPost?.id);

  if (ordersLoading || postsLoading || ordersError || postsError) {
    return <DashboardLayout><DataStatus failed={!!(ordersError || postsError)} retry={() => { retryOrders(); retryPosts(); }} /></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <PageHeader title="Posts" description="Every post made for Post to Pay, and how it performed." />

      {posts.length === 0 ? (
        <EmptyState icon={Camera} title="No posts detected yet" description="Posts appear here once customers tag your brand after their order arrives." className="py-14" />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <PostFilters filters={filters} onFiltersChange={setFilters} activeFilterCount={activeFilterCount} />
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filteredPosts.map(post => (
              <PostCard
                key={post.id}
                ref={linkedCard.rowRef(post.id)}
                post={post}
                order={orders.find(o => o.id === post.order_id)}
                priorityMetric={priorityMetric}
                emvSettings={emvSettings}
                onOpen={() => setSelectedPostId(post.id)}
                highlighted={linkedCard.isHighlighted(post.id)}
              />
            ))}
          </ul>
          {filteredPosts.length === 0 && (
            <EmptyState title="No posts match your filters" description="Try adjusting your search or clearing the filters." className="mt-4" />
          )}
          <p className="mt-3 text-sm text-muted-foreground">{filteredPosts.length} of {posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>
        </>
      )}

      <PostDetailDialog
        post={selectedPost!}
        order={selectedPost ? orders.find(o => o.id === selectedPost.order_id) : undefined}
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPostId(null)}
      />
    </DashboardLayout>
  );
}
