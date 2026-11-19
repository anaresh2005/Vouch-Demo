import { singleCurrency } from '@dashboard/lib/dashboardMoney';
import { useMemo, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { startOfDay } from 'date-fns';
import { Camera, CheckCircle2, Gift, Info } from 'lucide-react';
import { DashboardLayout } from '@dashboard/components/dashboard/DashboardLayout';
import { DataStatus } from '@dashboard/components/dashboard/DataStatus';
import { EmptyState } from '@dashboard/components/dashboard/EmptyState';
import { MetricCard } from '@dashboard/components/dashboard/MetricCard';
import { OrderStatusBadge } from '@dashboard/components/dashboard/OrderStatusBadge';
import { PageHeader, SectionHeader } from '@dashboard/components/dashboard/PageHeader';
import { CreatorCell } from '@dashboard/components/dashboard/CreatorCell';
import { GiftPipeline } from '@dashboard/components/dashboard/GiftPipeline';
import { ShopifyIcon } from '@dashboard/components/icons/ShopifyIcon';
import { PostCard } from '@dashboard/components/dashboard/PostCard';
import { PostDetailDialog } from '@dashboard/components/dashboard/PostDetailDialog';
import { TimeframeMenu } from '@dashboard/components/dashboard/TimeframeMenu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@dashboard/components/ui/table';
import { useShopifyConnection } from '@dashboard/hooks/useShopifyConnection';
import { useBrandOrders, useBrandPosts } from '@dashboard/hooks/useBrandData';
import { useEMVSettings, type EMVSettings } from '@dashboard/hooks/useEMVSettings';
import { usePriorityMetric } from '@dashboard/hooks/usePriorityMetric';
import { useTimeframe, Timeframe } from '@dashboard/hooks/useTimeframe';
import { recordedTotal } from '@dashboard/lib/recordedMetrics';
import { calculatePostCPM, calculatePostEMV, formatEMV, totalPostEMV } from '@dashboard/lib/cpmUtils';
import { formatDate } from '@dashboard/lib/format';
import { inPeriod, type Period } from '@dashboard/lib/analytics';
import { finishedAt, orderStage } from '@dashboard/lib/orderStage';
import { cn } from '@dashboard/lib/utils';
import { periodsFor, TIMEFRAME_LABELS } from '@dashboard/lib/timeframes';
import { shopifyOrderUrl } from '@dashboard/lib/shopifyLinks';
import type { VouchOrder, VouchPost } from '@dashboard/types/vouch';

// Sparkline points for a metric: the whole period split into equal slices, the first starting on
// the period's first day and the last ending today. All time starts at the first gift or post.
const generateSparklineData = (
  orders: VouchOrder[],
  posts: VouchPost[],
  metric: 'totalEMV' | 'totalLikes' | 'totalViews' | 'totalGifts',
  period: Period,
  emvSettings: EMVSettings,
  points: number = 7
): number[] => {
  const end = period.to.getTime() + 1;
  const start = period.from?.getTime()
    ?? startOfDay(Math.min(...orders.map(o => new Date(o.created_at).getTime()), ...posts.map(p => new Date(p.detected_at).getTime()), period.to.getTime())).getTime();
  const slice = (end - start) / points;
  const slot = (iso: string) => {
    const time = new Date(iso).getTime();
    return time < start || time >= end ? -1 : Math.min(Math.floor((time - start) / slice), points - 1);
  };
  const data: number[] = Array(points).fill(0);

  if (metric === 'totalGifts') {
    orders.forEach(order => { const i = slot(order.created_at); if (i >= 0) data[i] += 1; });
    return data;
  }
  // A sparkline is hidden below whenever the period has incomplete metrics.
  const value = (post: VouchPost) => metric === 'totalEMV' ? calculatePostEMV(post, emvSettings) ?? 0
    : metric === 'totalLikes' ? post.likes || 0 : post.views || 0;
  posts.forEach(post => { const i = slot(post.detected_at); if (i >= 0) data[i] += value(post); });
  return data;
};

export default function Overview() {
  const { data: shopify } = useShopifyConnection();
  const navigate = useNavigate();
  const { timeframe, setTimeframe } = useTimeframe();
  const { settings: emvSettings } = useEMVSettings();
  const { priorityMetric } = usePriorityMetric();
  const [postView, setPostView] = useState<'recent' | 'top'>('recent');
  // The open post is kept by id, so its details follow the latest data (a flag shows at once).
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const { data: allOrders = [], isLoading: ordersLoading, error: ordersError, refetch: retryOrders } = useBrandOrders();
  const { data: allPosts = [], isLoading: postsLoading, error: postsError, refetch: retryPosts } = useBrandPosts();
  const selectedPost = allPosts.find(p => p.id === selectedPostId) ?? null;

  // Map 'custom' timeframe to '7d' for Overview since it doesn't support custom ranges
  const effectiveTimeframe = timeframe === 'custom' ? '7d' : timeframe;

  // The same period boundaries as Analytics, so "Last 7 days" covers the same days on both pages.
  const { current, previous } = useMemo(() => periodsFor(effectiveTimeframe), [effectiveTimeframe]);

  // Helper to calculate stats from orders/posts
  const calculateStats = useCallback((orders: VouchOrder[], posts: VouchPost[]) => {
    const postedOrders = orders.filter(o => orderStage(o) === 'posted');
    const chargedOrders = orders.filter(o => orderStage(o) === 'charged');
    const totalPostedAndCharged = postedOrders.length + chargedOrders.length;
    const postedToChargedRatio = totalPostedAndCharged > 0 
      ? Math.round((postedOrders.length / totalPostedAndCharged) * 100)
      : 0;

    // Use the recorded elapsed time, including late posts.
    const postTimesInHours = posts.map(post => {
      const order = orders.find(o => o.id === post.order_id);
      if (order?.delivered_at) {
        const deliveredDate = new Date(order.delivered_at);
        const postedDate = new Date(post.detected_at);
        const hoursToPost = (postedDate.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60);
        return Math.max(hoursToPost, 0);
      }
      return 0;
    }).filter(time => time > 0);
    
    const avgTimeToPost = postTimesInHours.length > 0
      ? postTimesInHours.reduce((sum, time) => sum + time, 0) / postTimesInHours.length
      : 0;

    // Calculate total likes
    const totalLikes = recordedTotal(posts.map(post => post.likes));

    // Calculate total views
    const totalViews = recordedTotal(posts.map(post => post.views));

    const totalGifts = orders.length;

    // Total EMV requires recorded engagement for every post in the period.
    const totalEMV = totalPostEMV(posts, emvSettings);

    return { postedToChargedRatio, avgTimeToPost, totalLikes, totalViews, totalGifts, totalEMV };
  }, [emvSettings]);

  // Gifts by order date and posts by detection date, for this period and the one before it
  // (none for all time, so no trend is shown).
  const { filteredOrders, currentStats, previousStats } = useMemo(() => {
    const within = (period: Period) => ({
      orders: allOrders.filter(order => inPeriod(order.created_at, period)),
      posts: allPosts.filter(post => inPeriod(post.detected_at, period)),
    });
    const now = within(current);
    const before = previous ? within(previous) : null;
    return {
      filteredOrders: now.orders,
      currentStats: calculateStats(now.orders, now.posts),
      previousStats: before ? calculateStats(before.orders, before.posts) : null,
    };
  }, [current, previous, allOrders, allPosts, calculateStats]);

  // Calculate percentage change
  const calculateTrend = (current: number | null, previous: number | null): number | null => {
    if (current === null || previous === null) return null;
    // No earlier activity to compare against, so any percentage would be invented.
    if (previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  };

  // For ratio, show absolute difference (e.g., 69% - 67% = +2%)

  const likesTrend = previousStats ? calculateTrend(currentStats.totalLikes, previousStats.totalLikes) : null;
  const viewsTrend = previousStats ? calculateTrend(currentStats.totalViews, previousStats.totalViews) : null;
  const giftsTrend = previousStats ? calculateTrend(currentStats.totalGifts, previousStats.totalGifts) : null;
  const emvTrend = previousStats && currentStats.totalEMV !== null ? calculateTrend(currentStats.totalEMV, previousStats.totalEMV) : null;

  // Generate sparkline data for each metric based on current timeframe
  const sparklineData = useMemo(() => ({
    totalEMV: generateSparklineData(allOrders, allPosts, 'totalEMV', current, emvSettings),
    totalLikes: generateSparklineData(allOrders, allPosts, 'totalLikes', current, emvSettings),
    totalViews: generateSparklineData(allOrders, allPosts, 'totalViews', current, emvSettings),
    totalGifts: generateSparklineData(allOrders, allPosts, 'totalGifts', current, emvSettings),
  }), [current, allOrders, allPosts, emvSettings]);

  // The pipeline shows every gift still in progress (Charge pending included, in its last phase),
  // whenever it was ordered, and the ones that finished (posted or charged) in this period, whenever
  // they were ordered. A gift posted this week counts here alongside its post's views, even if it was
  // ordered last month.
  const activeOrders = allOrders.filter(o => !['posted', 'charged'].includes(orderStage(o)));
  const finishedOrders = allOrders.filter(o => ['posted', 'charged'].includes(orderStage(o)));
  const completionDate = (order: VouchOrder) => finishedAt(order, allPosts.find(p => p.order_id === order.id));
  const completedOrders = finishedOrders.filter(o => current.from === null || inPeriod(completionDate(o), current));
  const undatedFinishes = current.from === null ? 0 : finishedOrders.filter(o => !completionDate(o)).length;

  if (ordersLoading || postsLoading || ordersError || postsError) {
    return <DashboardLayout><DataStatus failed={!!(ordersError || postsError)} retry={() => { retryOrders(); retryPosts(); }} /></DashboardLayout>;
  }

  const periodLabel = effectiveTimeframe === 'lifetime' ? null : `vs previous ${TIMEFRAME_LABELS[effectiveTimeframe].replace('Last ', '')}`;
  const header = <PageHeader title="Overview" />;

  // A brand with no Vouch orders yet has nothing to measure, so show what to expect instead of zeros.
  if (allOrders.length === 0) {
    const shopifyConnected = shopify?.state === 'connected';
    return (
      <DashboardLayout>
        {header}
        <EmptyState
          icon={Gift}
          title="Waiting for your first Vouch order"
          description={
            <>
              When a customer checks out with Post to Pay, their order appears here.{' '}
              {shopifyConnected
                ? 'Your Shopify store is connected. New Vouch orders will appear after Post to Pay is configured and activated.'
                : <>Orders can only arrive once your Shopify store is connected. <Link to="/dashboard/settings" className="font-medium text-primary hover:text-primary-hover">Connect it in Settings</Link>.</>}
            </>
          }
          className="py-14"
          action={
            <ul className="space-y-2 text-left text-sm text-body">
              {['Each order\'s delivery status', 'Every creator\'s posting deadline', 'How each post performs'].map(item => (
                <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{item}</li>
              ))}
            </ul>
          }
        />
      </DashboardLayout>
    );
  }

  // Post metrics stay blank until a post has been recorded, rather than reading as zero performance.
  const hasPosts = allPosts.length > 0;
  const noPosts = hasPosts ? undefined : ' · no posts yet';
  const recentOrders = [...filteredOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
  // Content: the newest posts of any date, or the best posts detected in the chosen period by the
  // chosen metric (lowest CPM, or highest EMV); views decide when the metric isn't available.
  const orderFor = (post: VouchPost) => allOrders.find(o => o.id === post.order_id);
  const postScore = (post: VouchPost) => {
    if (priorityMetric === 'cpm') {
      const cpm = singleCurrency(allOrders) ? calculatePostCPM(post, orderFor(post)) : null;
      return cpm === null ? -Infinity : -cpm;
    }
    return calculatePostEMV(post, emvSettings) ?? -Infinity;
  };
  const shownPosts = postView === 'recent'
    ? [...allPosts].sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()).slice(0, 4)
    : allPosts.filter(post => inPeriod(post.detected_at, current))
      .sort((a, b) => (postScore(b) - postScore(a)) || ((b.views ?? 0) - (a.views ?? 0))).slice(0, 4);

  return (
    <DashboardLayout>
      {header}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <TimeframeMenu value={effectiveTimeframe} onChange={(value: Timeframe) => setTimeframe(value)} />
      </div>

      <GiftPipeline active={activeOrders} completed={completedOrders} />
      {undatedFinishes > 0 && <p className="mt-3 text-xs text-muted-foreground">
        {undatedFinishes} finished {undatedFinishes === 1 ? 'gift has' : 'gifts have'} no recorded post or charge date and {undatedFinishes === 1 ? 'is' : 'are'} excluded from this period. Choose All time to include {undatedFinishes === 1 ? 'it' : 'them'}.
      </p>}

      <section aria-labelledby="performance-heading" className="mt-10">
        <SectionHeader id="performance-heading" title="Performance" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total Gifts" info="Gifts sent to creators through Post to Pay in the selected period."
            value={currentStats.totalGifts.toLocaleString()} trend={giftsTrend} comparison={periodLabel ?? undefined} series={sparklineData.totalGifts} />
          <MetricCard title="Total Views" titleNote={noPosts} info="Combined views across detected posts."
            value={hasPosts ? currentStats.totalViews?.toLocaleString() ?? '—' : '—'} trend={viewsTrend} comparison={periodLabel ?? undefined}
            series={sparklineData.totalViews} empty={!hasPosts || currentStats.totalViews === null} />
          <MetricCard title="Total Likes" titleNote={noPosts} info="Likes across detected posts."
            value={hasPosts ? currentStats.totalLikes?.toLocaleString() ?? '—' : '—'} trend={likesTrend} comparison={periodLabel ?? undefined}
            series={sparklineData.totalLikes} empty={!hasPosts || currentStats.totalLikes === null} />
          <MetricCard title="Total EMV" titleNote={noPosts}
            info="Earned media value: the estimated dollar value of posts, from engagements (likes and comments) times the value per engagement set in Settings. Unavailable until every post has recorded likes and comments."
            value={hasPosts ? formatEMV(currentStats.totalEMV) : '—'} trend={emvTrend} comparison={periodLabel ?? undefined}
            series={sparklineData.totalEMV} empty={!hasPosts || currentStats.totalEMV === null} />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          <span><span className="font-medium text-body">Sales attribution</span> is unavailable until product sales are connected.</span>
        </p>
      </section>

      <section aria-labelledby="content-heading" className="mt-10">
        <SectionHeader id="content-heading" title="Content"
          actions={<>
            <div role="group" aria-label="Which posts" className="flex rounded-md bg-secondary p-0.5">
              {(['recent', 'top'] as const).map(view => (
                <button key={view} type="button" aria-pressed={postView === view} onClick={() => setPostView(view)}
                  className={cn('h-7 rounded px-2.5 text-sm font-medium transition-colors',
                    postView === view ? 'bg-card text-foreground shadow-edge' : 'text-subdued hover:text-foreground')}>
                  {view === 'recent' ? 'Recent' : 'Top performing'}
                </button>
              ))}
            </div>
            <Link to="/dashboard/posts" className="text-sm font-medium text-primary hover:text-primary-hover">View all</Link>
          </>} />
        <p className="-mt-1 mb-3 text-xs text-muted-foreground">{postView === 'recent' ? 'Latest posts, any date' : 'Best posts detected in the selected period'}</p>
        {!hasPosts ? (
          <EmptyState icon={Camera} title="No posts yet" description="Posts appear here once creators tag your brand after their gift arrives." />
        ) : shownPosts.length === 0 ? (
          <EmptyState icon={Camera} title="No posts in this period" description="Choose a longer timeframe, or view all posts." />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {shownPosts.map(post => (
              <PostCard key={post.id} post={post} order={orderFor(post)} priorityMetric={priorityMetric} emvSettings={emvSettings}
                onOpen={() => setSelectedPostId(post.id)} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-heading" className="mt-10">
        <SectionHeader id="recent-heading" title="Recent gifts"
          actions={<Link to="/dashboard/orders" className="text-sm font-medium text-primary hover:text-primary-hover">View all</Link>} />
        {recentOrders.length === 0 ? (
          <EmptyState title="No gifts in this timeframe" description="Choose a longer timeframe to see earlier gifts." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Shopify order</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map(order => {
                const orderUrl = shopifyOrderUrl(order.shopDomain ?? shopify?.connection?.shop_domain, order.shopify_order_id);
                return (
                  <TableRow key={order.id} className="cursor-pointer" onClick={() => navigate(`/dashboard/orders?expand=${order.id}`)}>
                    <TableCell>
                      {/* The row is clickable with a mouse; this link gives keyboard users the same way in. */}
                      <Link to={`/dashboard/orders?expand=${order.id}`} onClick={e => e.stopPropagation()} aria-label={`Open gift for ${order.influencer?.full_name ?? 'creator'}`}
                        className="block rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">
                        <CreatorCell influencer={order.influencer} platform={order.platform} />
                      </Link>
                    </TableCell>
                    <TableCell><OrderStatusBadge order={order} /></TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {orderUrl
                        ? (
                          <a href={orderUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label={`Open order ${order.shopify_order_id} in Shopify`}
                            className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary-hover">
                            <ShopifyIcon className="h-4 w-4" />{order.shopify_order_id}
                          </a>
                        )
                        : <span className="text-muted-foreground">{order.shopify_order_id ?? '—'}</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
      <PostDetailDialog
        post={selectedPost!}
        order={selectedPost ? orderFor(selectedPost) : undefined}
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPostId(null)}
      />
    </DashboardLayout>
  );
}
