import { recordedTotal } from '@dashboard/lib/recordedMetrics';
import { COST_TO_BRAND_INFO, formatMoney } from '@dashboard/lib/dashboardMoney';
import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { DashboardLayout } from '@dashboard/components/dashboard/DashboardLayout';
import { DataStatus } from '@dashboard/components/dashboard/DataStatus';
import { ExportDropdown } from '@dashboard/components/dashboard/ExportDropdown';
import { PageHeader, SectionHeader } from '@dashboard/components/dashboard/PageHeader';
import { CreatorCell } from '@dashboard/components/dashboard/CreatorCell';
import { AdRights } from '@dashboard/components/dashboard/AdRights';
import { NoData } from '@dashboard/components/dashboard/EmptyState';
import { FilterChip, TimeframeMenu } from '@dashboard/components/dashboard/TimeframeMenu';
import { Calendar } from '@dashboard/components/ui/calendar';
import { InfoTip } from '@dashboard/components/ui/info-tip';
import { Popover, PopoverContent, PopoverTrigger } from '@dashboard/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@dashboard/components/ui/table';
import { useBrandOrders, useBrandPosts } from '@dashboard/hooks/useBrandData';
import { useEMVSettings } from '@dashboard/hooks/useEMVSettings';
import { useTimeframe } from '@dashboard/hooks/useTimeframe';
import { change, summarize } from '@dashboard/lib/analytics';
import { CPM_FORMULA, formatCPM, formatEMV } from '@dashboard/lib/cpmUtils';
import { formatCompact } from '@dashboard/lib/format';
import { exportAnalyticsToMarkdown } from '@dashboard/lib/markdownExport';
import { orderStage, STAGE_LABELS } from '@dashboard/lib/orderStage';
import type { AnalyticsReportData } from '@dashboard/lib/pdfExport';
import { periodsFor, TIMEFRAME_LABELS } from '@dashboard/lib/timeframes';
import { cn } from '@dashboard/lib/utils';

const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;

/** One figure in a row of key figures: label (with an explanation one hover away), value, and a line of context. */
function Stat({ label, info, value, context, muted = false }: { label: string; info?: string; value: string; context?: ReactNode; muted?: boolean }) {
  return (
    <div className="min-w-0 p-4">
      <p className="truncate text-sm text-muted-foreground">{label}{info && <InfoTip label={`About ${label}`}>{info}</InfoTip>}</p>
      <p className={cn('mt-1 text-xl', muted ? 'text-muted-foreground' : 'text-foreground')}>{value}</p>
      <p className="mt-0.5 min-h-4 text-xs text-muted-foreground">{context}</p>
    </div>
  );
}

function StatRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg bg-card shadow-edge sm:grid-cols-3 lg:grid-cols-6 [&>*]:shadow-[inset_-1px_-1px_0_hsl(var(--divider))]">
      {children}
    </div>
  );
}

function Trend({ value, lowerIsBetter = false, label }: { value: number | null; lowerIsBetter?: boolean; label: string }) {
  if (value === null) return null;
  const good = lowerIsBetter ? value <= 0 : value >= 0;
  return <><span className={cn('font-medium', good ? 'text-success' : 'text-destructive')}>{value > 0 ? '+' : ''}{value}%</span> {label}</>;
}

function Panel({ title, info, children }: { title: string; info?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col rounded-lg bg-card p-4 shadow-edge">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}{info && <InfoTip label={`About ${title}`}>{info}</InfoTip>}</h3>
      {children}
    </section>
  );
}

function Intro({ id, title, text, link }: { id: string; title: string; text: string; link?: ReactNode }) {
  return (
    <div>
      <SectionHeader id={id} title={title} actions={link} />
      <p className="-mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

const axis = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };
const tooltipStyle = { backgroundColor: 'hsl(var(--popover))', border: 'none', borderRadius: 8, fontSize: 12, boxShadow: '0 5px 15px rgba(0,0,0,0.12), 0 15px 35px rgba(48,49,61,0.08)' };
const viewLink = (to: string, label: string) => <Link to={to} className="text-sm font-medium text-primary hover:text-primary-hover">{label}</Link>;

export default function Analytics() {
  const { timeframe, setTimeframe, customDateRange, setCustomDateRange } = useTimeframe();
  const { settings: emvSettings } = useEMVSettings();
  const { data: orders = [], isLoading: ordersLoading, error: ordersError, refetch: retryOrders } = useBrandOrders();
  const { data: posts = [], isLoading: postsLoading, error: postsError, refetch: retryPosts } = useBrandPosts();

  const { current, previous } = useMemo(() => periodsFor(timeframe, customDateRange), [timeframe, customDateRange]);
  const stats = useMemo(() => summarize(orders, posts, current, emvSettings), [orders, posts, current, emvSettings]);
  const money = (n: number | null) => formatMoney(n, stats.currency);
  const before = useMemo(() => (previous ? summarize(orders, posts, previous, emvSettings) : null), [orders, posts, previous, emvSettings]);
  const vsLabel = timeframe === 'lifetime' ? '' : timeframe === 'custom' ? 'vs previous period' : `vs previous ${TIMEFRAME_LABELS[timeframe].replace('Last ', '')}`;
  const customLabel = customDateRange.from
    ? customDateRange.to ? `${format(customDateRange.from, 'MMM d')} – ${format(customDateRange.to, 'MMM d')}` : format(customDateRange.from, 'MMM d, yyyy')
    : 'Pick dates';

  // The PDF and Markdown exports keep their existing report layout, filled from the same period.
  function reportData(): AnalyticsReportData {
    const within = (iso: string) => new Date(iso) >= (current.from ?? new Date(0)) && new Date(iso) <= current.to;
    const gifts = orders.filter(o => within(o.created_at));
    const periodPosts = posts.filter(p => within(p.detected_at));
    const cogsKnown = gifts.length > 0 && gifts.every(g => g.cogs != null);
    const cogs = gifts.reduce((n, g) => n + (g.cogs ?? 0), 0);
    return {
      currency: stats.currency,
      timeframe: timeframe === 'custom' ? 'Custom Range' : TIMEFRAME_LABELS[timeframe],
      dateRange: { from: current.from ?? new Date(Math.min(Date.now(), ...gifts.map(g => new Date(g.created_at).getTime()), ...periodPosts.map(p => new Date(p.detected_at).getTime()))), to: current.to },
      totalGifts: stats.gifts.sent,
      totalItems: gifts.reduce((n, g) => n + (g.items_count ?? 0), 0),
      retailValue: stats.gifts.retail,
      cogs: cogsKnown ? cogs : null,
      actualizedSpend: null,
      charged: stats.gifts.recovered,
      avgRetailValue: stats.gifts.sent > 0 && stats.gifts.retail !== null ? stats.gifts.retail / stats.gifts.sent : null,
      avgCogs: cogsKnown ? cogs / gifts.length : null,
      totalPosts: stats.posts.count,
      postRate: stats.gifts.postRate === null ? null : stats.gifts.postRate * 100,
      totalViews: stats.posts.views,
      totalLikes: recordedTotal(periodPosts.map(p => p.likes)),
      totalComments: recordedTotal(periodPosts.map(p => p.comments)),
      avgEngagement: stats.posts.avgEngagementRate,
      avgCpm: stats.posts.avgCpm,
      uniqueCreators: stats.creators.count,
      totalFollowers: stats.creators.totalFollowers,
      avgFollowers: stats.creators.avgFollowers,
      avgEngagementRate: stats.creators.avgEngagementRate,
      instagramCreators: stats.creators.instagram,
      tiktokCreators: stats.creators.tiktok,
      statusData: Object.entries(STAGE_LABELS)
        .map(([stage, name]) => ({ name, value: gifts.filter(g => orderStage(g) === stage).length }))
        .filter(s => s.value > 0),
      topInfluencers: stats.creators.topByViews.map(c => ({ name: c.influencer?.full_name ?? 'Unknown', platform: c.platform, category: c.influencer?.category ?? '', views: c.views })),
    };
  }

  if (ordersLoading || postsLoading || ordersError || postsError) {
    return <DashboardLayout><DataStatus failed={!!(ordersError || postsError)} retry={() => { retryOrders(); retryPosts(); }} /></DashboardLayout>;
  }

  const { gifts, posts: postStats, creators } = stats;
  const funnelMax = Math.max(gifts.funnel[0].value, 1);
  const tierCpms = creators.tiers.map(t => t.avgCpm).filter((c): c is number => c !== null);
  const bestTier = tierCpms.length > 1 ? creators.tiers.find(t => t.avgCpm === Math.min(...tierCpms)) ?? null : null;

  return (
    <DashboardLayout>
      <PageHeader
        title="Analytics"
        description="What your gifts cost, the attention they earned, and which creators are worth it."
        actions={
          <ExportDropdown
            onExportPDF={async () => { const { exportAnalyticsToPDF } = await import('@dashboard/lib/pdfExport'); await exportAnalyticsToPDF(reportData()); }}
            onExportMarkdown={() => exportAnalyticsToMarkdown(reportData())}
            variant="outline" size="sm" showLabel
          />
        }
      />

      <div className="space-y-12">
        <div className="-mt-2 flex flex-wrap items-center gap-2">
          <TimeframeMenu value={timeframe} onChange={setTimeframe} allowCustom customLabel={customLabel} />
          {timeframe === 'custom' && (
            <Popover>
              <PopoverTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25">
                <FilterChip label="Dates" value={customLabel} className="hover:bg-secondary" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={customDateRange.from} numberOfMonths={1}
                  selected={{ from: customDateRange.from, to: customDateRange.to }}
                  onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })} />
              </PopoverContent>
            </Popover>
          )}
        </div>

        <p className="text-xs text-muted-foreground">Money totals and CPM require recorded product amounts in one currency. Mixed currencies are not converted. EMV is an estimate in USD.</p>

        {/* Early-activity note: the zeros below are real, but only because nothing has happened yet */}
        {(orders.length === 0 || posts.length === 0) && (
          <div role="note" className="-mt-6 flex items-start gap-2 rounded-md bg-secondary px-3 py-2.5 text-sm text-body">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p>
              {orders.length === 0
                ? 'No Vouch orders yet. These metrics fill in as creators check out with Post to Pay and then post about your products.'
                : 'No posts recorded yet. Gift metrics are live; post metrics fill in once creators publish their posts.'}
            </p>
          </div>
        )}

        {/* 1. Gifts: what am I spending, and is it working? */}
        <section aria-labelledby="gifts-heading" className="space-y-4">
          <Intro id="gifts-heading" title="Gift metrics" text="What you're spending on gifts, and how often they turn into posts." link={viewLink('/dashboard/orders', 'View gifts')} />
          <StatRow>
            <Stat label="Gifts sent" value={gifts.sent.toLocaleString()} context={<Trend value={change(gifts.sent, before?.gifts.sent ?? null)} label={vsLabel} />} />
            <Stat label={gifts.costToBrand === null ? 'Cost to brand · not recorded' : 'Cost to brand'} info={COST_TO_BRAND_INFO}
              value={gifts.costToBrand === null ? '—' : money(gifts.costToBrand)} muted={gifts.costToBrand === null}
              context={gifts.costPerGift !== null ? `${money(gifts.costPerGift)} per gift` : 'Needs product retail, product paid and one currency'} />
            <Stat label="Retail value gifted" value={money(gifts.retail)} context={gifts.sent > 0 && gifts.retail !== null ? `${money(gifts.retail / gifts.sent)} per gift` : 'Needs recorded product retail and one currency'} />
            <Stat label="Post rate" info="Of the gifts that reached an outcome, the share where the creator posted rather than being charged."
              value={gifts.postRate === null ? '—' : percent(gifts.postRate)} muted={gifts.postRate === null}
              context={gifts.postRate === null ? 'No outcomes yet' : `${gifts.funnel[2].value} posted · ${gifts.charged} charged`} />
            <Stat label="Charges" info="Collected amounts are unavailable in legacy order data." value={money(gifts.recovered)}
              context={`${gifts.charged} ${gifts.charged === 1 ? 'charge' : 'charges'}`} />
            <Stat label="Time to post" info="Average days from delivery to the post being detected."
              value={gifts.avgDaysToPost === null ? '—' : `${gifts.avgDaysToPost.toFixed(1)} days`} muted={gifts.avgDaysToPost === null} context="after delivery" />
          </StatRow>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Where gifts end up" info="Every gift sent in this period, and how far it has got.">
              {/* The funnel follows gifts by order date; post metrics count posts by the day they were detected. */}
              <p className="-mt-2 mb-3 text-xs text-muted-foreground">Of the gifts sent in this period. Posts below count by the day they were detected, so a post from an earlier gift shows there, not here.</p>
              <ol className="space-y-3">
                {gifts.funnel.map(step => (
                  <li key={step.label}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-foreground">{step.label}</span>
                      <span className="font-medium text-foreground">
                        {step.value}
                        {step.label !== 'Gifts sent' && gifts.sent > 0 && <span className="ml-1.5 font-normal text-muted-foreground">{percent(step.value / gifts.sent)} of gifts sent</span>}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-divider">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(step.value / funnelMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">{gifts.charged} charged for not posting by the deadline.</p>
            </Panel>
            <Panel title={`Gifts per ${stats.bucketSize}`}>
              {gifts.sent === 0 ? <NoData className="flex-1" /> : (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gifts.series} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--divider))" vertical={false} />
                      <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} minTickGap={16} />
                      <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--secondary))' }} formatter={(v: number) => [v, 'Gifts']} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={32} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>
        </section>

        {/* 2. Posts: how much attention did I get, and how efficiently? */}
        <section aria-labelledby="posts-heading" className="space-y-4">
          <Intro id="posts-heading" title="Post metrics" text="The attention your gifts earned, and what it cost." link={viewLink('/dashboard/posts', 'View posts')} />
          <StatRow>
            <Stat label="Posts" value={postStats.count.toLocaleString()} context={<Trend value={change(postStats.count, before?.posts.count ?? null)} label={vsLabel} />} />
            <Stat label="Views" value={formatCompact(postStats.views)} context={<Trend value={change(postStats.views, before?.posts.views ?? null)} label={vsLabel} />} />
            <Stat label="Engagements" info="Likes plus comments." value={formatCompact(postStats.engagements)}
              context={postStats.avgEngagementRate === null ? undefined : `${postStats.avgEngagementRate.toFixed(1)}% avg engagement rate`} />
            <Stat label="Avg CPM" info={`Cost per 1,000 views: ${CPM_FORMULA}. Lower is better.`}
              value={formatCPM(postStats.avgCpm, stats.currency)} muted={postStats.avgCpm === null}
              context={postStats.avgCpm === null ? 'Needs product retail, product paid and one currency' : <Trend value={change(postStats.avgCpm, before?.posts.avgCpm ?? null)} lowerIsBetter label={vsLabel} />} />
            <Stat label="EMV" info="Earned media value: (likes + comments) × the value per engagement set in Settings. Unavailable until every post has recorded likes and comments."
              value={formatEMV(postStats.emv)} muted={postStats.emv === null} context={postStats.emv === null && postStats.count > 0 ? 'Needs recorded likes and comments' : undefined} />
            <Stat label="Ready to run as ads" info="Posts whose creators granted rights to boost or repost them." value={`${postStats.adReady} of ${postStats.count}`} />
          </StatRow>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title={`Views per ${stats.bucketSize}`}>
              {postStats.count === 0 ? <NoData className="flex-1" /> : (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={postStats.series} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--divider))" vertical={false} />
                      <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} minTickGap={16} />
                      <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCompact(v)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCompact(v), 'Views']} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
            <Panel title="Top posts by views">
              {postStats.top.length === 0 ? <NoData className="flex-1" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead><TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">CPM</TableHead><TableHead className="text-right">Ad rights</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postStats.top.map(({ post, cpm }) => (
                      <TableRow key={post.id}>
                        <TableCell><CreatorCell influencer={post.influencer} platform={post.platform} /></TableCell>
                        <TableCell className="text-right">{formatCompact(post.views)}</TableCell>
                        <TableCell className="text-right">{formatCPM(cpm, stats.currency)}</TableCell>
                        <TableCell className="text-right"><AdRights post={post} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Panel>
          </div>
        </section>

        {/* 3. Creators: which creators give the best value? */}
        <section aria-labelledby="creators-heading" className="space-y-4">
          <Intro id="creators-heading" title="Creator metrics" text="Which creators give you the most attention for what they cost." link={viewLink('/dashboard/influencers', 'View creators')} />
          <StatRow>
            <Stat label="Creators" value={creators.count.toLocaleString()} context={<Trend value={change(creators.count, before?.creators.count ?? null)} label={vsLabel} />} />
            <Stat label="Repeat creators" info="Creators who received more than one gift in this period." value={creators.repeat.toLocaleString()} />
            <Stat label="Median followers" value={formatCompact(creators.medianFollowers)} muted={creators.medianFollowers === null} />
            <Stat label="Instagram" value={creators.instagram.toLocaleString()} context="creators" />
            <Stat label="TikTok" value={creators.tiktok.toLocaleString()} context="creators" />
            <Stat label="Best value tier" info="The follower range with the lowest average CPM in this period."
              value={bestTier ? bestTier.label : '—'} muted={!bestTier} context={bestTier ? `${formatCPM(bestTier.avgCpm, stats.currency)} avg CPM` : 'Needs CPM for two or more tiers'} />
          </StatRow>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Value by follower count" info="How creators of each size performed. Lower CPM means more views for what the gift cost you.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Followers</TableHead><TableHead className="text-right">Creators</TableHead><TableHead className="text-right">Views per post</TableHead>
                    <TableHead className="text-right">Avg CPM</TableHead><TableHead className="text-right">Post rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creators.tiers.map(tier => (
                    <TableRow key={tier.label} className={cn(bestTier?.label === tier.label && '[&>td]:font-medium')}>
                      <TableCell>{tier.label}</TableCell>
                      <TableCell className="text-right">{tier.creators}</TableCell>
                      <TableCell className="text-right">{tier.avgViewsPerPost === null ? '—' : formatCompact(Math.round(tier.avgViewsPerPost))}</TableCell>
                      <TableCell className={cn('text-right', bestTier?.label === tier.label && 'text-primary')}>{formatCPM(tier.avgCpm, stats.currency)}</TableCell>
                      <TableCell className="text-right">{tier.postRate === null ? '—' : percent(tier.postRate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
            <Panel title="Best value creators" info="Creators with posts in this period, lowest average CPM first.">
              {creators.top.length === 0 ? <NoData className="flex-1" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead><TableHead className="text-right">Posts</TableHead>
                      <TableHead className="text-right">Views</TableHead><TableHead className="text-right">Avg CPM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creators.top.map(c => (
                      <TableRow key={c.id}>
                        <TableCell><Link to={`/dashboard/influencers?id=${c.id}`} className="hover:opacity-80"><CreatorCell influencer={c.influencer} platform={c.platform} /></Link></TableCell>
                        <TableCell className="text-right">{c.posts}</TableCell>
                        <TableCell className="text-right">{formatCompact(c.views)}</TableCell>
                        <TableCell className="text-right">{formatCPM(c.avgCpm, stats.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Panel>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-dashed border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">Audience insights</h3>
              <p className="mt-1 text-sm text-muted-foreground">Aggregate audience demographics are not available. Individual profiles show provider data when available.</p>
            </div>
            <div className="rounded-lg border border-dashed border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">Sales attribution</h3>
              <p className="mt-1 text-sm text-muted-foreground">Unavailable: product sales and attribution data are not connected.</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
