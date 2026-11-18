import { Fragment, useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronDown, Gift } from 'lucide-react';
import { ShopifyIcon } from '@dashboard/components/icons/ShopifyIcon';
import { DashboardLayout } from '@dashboard/components/dashboard/DashboardLayout';
import { DataStatus } from '@dashboard/components/dashboard/DataStatus';
import { EmptyState } from '@dashboard/components/dashboard/EmptyState';
import { OrderFilters } from '@dashboard/components/dashboard/OrderFilters';
import { OrderStatusBadge } from '@dashboard/components/dashboard/OrderStatusBadge';
import { OrderTimeline } from '@dashboard/components/dashboard/OrderTimeline';
import { PageHeader } from '@dashboard/components/dashboard/PageHeader';
import { CreatorCell } from '@dashboard/components/dashboard/CreatorCell';
import { StatusSegments } from '@dashboard/components/dashboard/StatusSegments';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@dashboard/components/ui/table';
import { useBrandOrders, useBrandPosts } from '@dashboard/hooks/useBrandData';
import { useLinkedRow } from '@dashboard/hooks/useLinkedRow';
import { useShopifyConnection } from '@dashboard/hooks/useShopifyConnection';
import { formatDate } from '@dashboard/lib/format';
import { orderStage, finishedAt, type OrderStage } from '@dashboard/lib/orderStage';
import { OrderFiltersState, defaultFilters, countActiveFilters, parseFollowersInput, SortField } from '@dashboard/lib/orderFilters';
import { matchesOrderNumber, matchesSearch, normalizeSearch } from '@dashboard/lib/search';
import { shopifyOrderUrl } from '@dashboard/lib/shopifyLinks';
import { cn } from '@dashboard/lib/utils';
import type { VouchOrder } from '@dashboard/types/vouch';

// Quick filters above the table, one click each, by where each gift is; the Filter button holds
// the rest. "Awaiting post" includes gifts whose deadline has passed and are about to be charged.
const SEGMENTS: { label: string; stages: OrderStage[] }[] = [
  { label: 'All', stages: [] },
  { label: 'Order placed', stages: ['placed'] },
  { label: 'In transit', stages: ['in_transit'] },
  { label: 'Awaiting post', stages: ['awaiting_post', 'charge_pending'] },
  { label: 'Posted', stages: ['posted'] },
  { label: 'Charged', stages: ['charged'] },
];

export default function Orders() {
  const { data: shopify } = useShopifyConnection();
  const [searchParams] = useSearchParams();
  const { data: orders = [], isLoading: ordersLoading, error: ordersError, refetch: retryOrders } = useBrandOrders();
  const { data: posts = [], isLoading: postsLoading, error: postsError, refetch: retryPosts } = useBrandPosts();
  const [filters, setFilters] = useState<OrderFiltersState>(defaultFilters);
  const [stages, setStages] = useState<OrderStage[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const highlightedId = searchParams.get('expand');

  // A link to one gift opens it; useLinkedRow below scrolls to it once it is shown.
  useEffect(() => {
    if (highlightedId) setExpandedOrderId(highlightedId);
  }, [highlightedId]);

  // Memoize filtered and sorted orders
  const filteredOrders = useMemo(() => {
    const query = normalizeSearch(filters.search);
    let result = orders.filter(order => {
      const influencer = order.influencer;
      const isInstagram = order.platform === 'instagram';
      const followers = isInstagram ? influencer?.instagram_followers : influencer?.tiktok_followers;
      const engagementRate = isInstagram ? influencer?.instagram_engagement_rate : influencer?.tiktok_engagement_rate;

      // Search filter
      if (!matchesSearch(query, [influencer?.full_name, influencer?.email, influencer?.instagram_username, influencer?.tiktok_username, order.shopify_order_id, order.id])
        && !matchesOrderNumber(query, order.shopify_order_id)) return false;

      // Status filter (multi-select: empty array means all)
      if (filters.statuses.length > 0 && !filters.statuses.includes(orderStage(order))) return false;

      // Date filter
      if (filters.dateType) {
        let dateToCheck: Date | null = null;
        
        if (filters.dateType === 'created') {
          dateToCheck = new Date(order.created_at);
        } else if (filters.dateType === 'delivered' && order.delivered_at) {
          dateToCheck = new Date(order.delivered_at);
        } else if (filters.dateType === 'posted_charged') {
          // Check post detected_at or charged_at
          const post = posts.find(p => p.order_id === order.id);
          if (order.transaction) {
            const completed = finishedAt(order);
            dateToCheck = completed ? new Date(completed) : null;
          } else if (post) {
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

      // Platform filter (multi-select: empty array means all)
      if (filters.platforms.length > 0) {
        if (!filters.platforms.includes(order.platform)) return false;
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
            case 'posted_charged_at': {
              if (order.transaction) {
                const completed = finishedAt(order);
                return completed ? Date.parse(completed) : null;
              }
              const post = posts.find(p => p.order_id === order.id);
              return post ? new Date(post.detected_at).getTime() : (order.charged_at ? new Date(order.charged_at).getTime() : null);
            }
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
  }, [filters, orders, posts]);

  const activeFilterCount = countActiveFilters(filters);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // Clicking a column header sorts by it (newest or largest first), then reverses, then clears.
  // Several columns can be combined; their order is shown by a small number.
  function toggleSort(field: SortField) {
    const index = filters.sorts.findIndex(s => s.field === field);
    const current = index === -1 ? null : filters.sorts[index];
    if (!current) setFilters({ ...filters, sorts: [...filters.sorts, { field, direction: 'desc' }] });
    else if (current.direction === 'desc') setFilters({ ...filters, sorts: filters.sorts.map((s, i) => i === index ? { ...s, direction: 'asc' } : s) });
    else setFilters({ ...filters, sorts: filters.sorts.filter((_, i) => i !== index) });
  }

  // A plain function rather than a component defined in here, so re-rendering keeps the button (and keyboard focus).
  function sortHead(field: SortField, children: string, className?: string) {
    const index = filters.sorts.findIndex(s => s.field === field);
    const current = index === -1 ? null : filters.sorts[index];
    const Arrow = current?.direction === 'asc' ? ArrowUp : ArrowDown;
    return (
      <TableHead className={className} aria-sort={current ? (current.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
        <button type="button" onClick={() => toggleSort(field)} className={cn('inline-flex items-center gap-1 hover:text-foreground', current && 'text-foreground')}>
          {children}
          {current && <Arrow className="h-3 w-3" />}
          {current && filters.sorts.length > 1 && <span className="text-xs text-muted-foreground">{index + 1}</span>}
        </button>
      </TableHead>
    );
  }

  const inStages = (selected: OrderStage[]) => (order: VouchOrder) => selected.length === 0 || selected.includes(orderStage(order));
  const visibleOrders = filteredOrders.filter(inStages(stages));
  const linkedRow = useLinkedRow(highlightedId);

  if (ordersLoading || postsLoading || ordersError || postsError) {
    return <DashboardLayout><DataStatus failed={!!(ordersError || postsError)} retry={() => { retryOrders(); retryPosts(); }} /></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <PageHeader title="Gifts" description="Every Post to Pay order, from warehouse to feed." />

      {orders.length === 0 ? (
        <EmptyState icon={Gift} title="No gifts yet" description="Vouch orders appear here as soon as a customer checks out with Post to Pay." className="py-14" />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <StatusSegments
              segments={SEGMENTS.map(segment => ({ label: segment.label, count: filteredOrders.filter(inStages(segment.stages)).length, value: segment.stages.join(',') }))}
              value={stages.join(',')}
              onChange={value => setStages(value ? value.split(',') as OrderStage[] : [])}
            />
            <OrderFilters filters={filters} onFiltersChange={setFilters} activeFilterCount={activeFilterCount} />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Shopify order</TableHead>
                {sortHead('created_at', 'Ordered', 'text-right')}
                <TableHead className="w-8"><span className="sr-only">Details</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleOrders.map(order => {
                const isExpanded = expandedOrderId === order.id;
                const orderUrl = shopifyOrderUrl(order.shopDomain ?? shopify?.connection?.shop_domain, order.shopify_order_id);
                const posted = orderStage(order) === 'posted' && posts.some(p => p.order_id === order.id);
                const highlighted = linkedRow.isHighlighted(order.id);
                return (
                  <Fragment key={order.id}>
                    <TableRow
                      ref={linkedRow.rowRef(order.id)}
                      onClick={() => toggleExpand(order.id)}
                      className={cn('cursor-pointer', highlighted && '[&>td]:bg-primary/10',
                        // An open gift and its timeline read as one grey panel, the width of the hover fill.
                        // The brief highlight of a linked gift replaces the grey until it fades.
                        isExpanded && 'shadow-none [&>td:first-child]:rounded-bl-none [&>td:last-child]:rounded-br-none',
                        isExpanded && !highlighted && '[&>td]:bg-secondary')}
                    >
                      <TableCell>
                        <Link to={`/dashboard/influencers?id=${order.influencer_id}`} onClick={e => e.stopPropagation()} className="inline-block hover:opacity-80">
                          <CreatorCell influencer={order.influencer} platform={order.platform} />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <OrderStatusBadge order={order} />
                          {posted && <Link to={`/dashboard/posts?order=${order.id}`} onClick={e => e.stopPropagation()} className="text-xs font-medium text-primary hover:text-primary-hover">View post</Link>}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {orderUrl
                          ? (
                            <a href={orderUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              aria-label={`Open order ${order.shopify_order_id} in Shopify`}
                              className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary-hover">
                              <ShopifyIcon className="h-4 w-4" />{order.shopify_order_id}
                            </a>
                          )
                          : <span className="text-muted-foreground">{order.shopify_order_id ?? '—'}</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <button type="button" aria-label={`${isExpanded ? 'Hide' : 'Show'} details for gift ${order.shopify_order_id ?? order.id}`}
                          aria-expanded={isExpanded} aria-controls={isExpanded ? `gift-details-${order.id}` : undefined}
                          className="rounded p-1 hover:bg-muted focus-visible:outline focus-visible:outline-2"
                          onClick={e => { e.stopPropagation(); toggleExpand(order.id); }}>
                          <ChevronDown aria-hidden="true" className={cn('h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                        </button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        {/* The timeline runs from the creator column to the date column's right edge. */}
                        <TableCell id={`gift-details-${order.id}`} colSpan={4}
                          className="bg-secondary pb-4 pt-0 first:rounded-tl-none last:rounded-tr-none [tbody_tr:hover>&]:bg-secondary">
                          <OrderTimeline order={order} post={posts.find(p => p.order_id === order.id)} />
                        </TableCell>
                        <TableCell aria-hidden="true" className="hidden bg-secondary first:rounded-tl-none last:rounded-tr-none sm:table-cell [tbody_tr:hover>&]:bg-secondary" />
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
          {visibleOrders.length === 0 && (
            <EmptyState title="No gifts match these filters" description="Try a different status or clear the filters." className="mt-4" />
          )}
          <p className="mt-3 text-sm text-muted-foreground">{visibleOrders.length} of {orders.length} {orders.length === 1 ? 'gift' : 'gifts'}</p>
        </>
      )}
    </DashboardLayout>
  );
}
