import { orderStage, STAGE_LABELS } from './orderStage';
import { recordedTotal } from '@dashboard/lib/recordedMetrics';
import { formatMoney, singleCurrency, moneyTotal } from './dashboardMoney';
import { VouchPost, VouchOrder, Influencer } from '@dashboard/types/vouch';
import { CPM_FORMULA, calculatePostCPM, formatCPM, isPostedOrder } from '@dashboard/lib/cpmUtils';
import { format } from 'date-fns';
import { REPORT_FOOTER, formatRate, mdCell } from './reportText';

const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatCurrency = formatMoney;
const formatCogs = (amount: number | null | undefined, currency?: string | null): string =>
  amount == null ? 'Not recorded' : formatCurrency(amount, currency);
const totalCogs = (orders: VouchOrder[]): number | null => moneyTotal(orders, 'cogs');

// Download helper
function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportPostToMarkdown(
  post: VouchPost, 
  order: VouchOrder | undefined,
) {
  const platform = post.platform.charAt(0).toUpperCase() + post.platform.slice(1);
  const handle = post.platform === 'instagram' 
    ? `@${post.influencer?.instagram_username}` 
    : `@${post.influencer?.tiktok_username}`;
  const followers = post.platform === 'instagram' 
    ? post.influencer?.instagram_followers 
    : post.influencer?.tiktok_followers;
  const engagementRate = post.platform === 'instagram' 
    ? post.influencer?.instagram_engagement_rate 
    : post.influencer?.tiktok_engagement_rate;

  const cpm = calculatePostCPM(post, order);
  const caption = 'Caption text is not available. Open the original post to read it.';

  let md = `# Post Performance Report

> Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}

---

## Creator Information

| Field | Value |
|-------|-------|
| Name | ${mdCell(post.influencer?.full_name || 'Unknown')} |
| Platform | ${platform} |
| Handle | ${mdCell(handle)} |
| Followers | ${formatNumber(followers)} |
| Engagement Rate | ${formatRate(engagementRate, 1)} |
| Email | ${mdCell(post.influencer?.email || 'N/A')} |
| Category | ${mdCell(post.influencer?.category || 'N/A')} |

---

## Post Details

| Field | Value |
|-------|-------|
| Platform | ${platform} |
| Detected At | ${format(new Date(post.detected_at), 'MMMM d, yyyy h:mm a')} |
| Post URL | ${mdCell(post.post_url)} |

### Caption

\`\`\`
${caption}
\`\`\`

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Views | ${formatNumber(post.views)} |
| Likes | ${formatNumber(post.likes)} |
| Comments | ${formatNumber(post.comments)} |
| Engagement Rate | ${formatRate(post.engagement_rate, 2)} |
| CPM (Cost Per Mille) | ${cpm !== null ? formatCPM(cpm, order?.currency) : 'N/A'} |

> CPM Formula: ${CPM_FORMULA}

`;

  if (order) {
    md += `---

## Order Details

| Field | Value |
|-------|-------|
| Order total | ${formatCurrency(order.order_total, order.currency)} |
| COGS | ${formatCogs(order.cogs, order.currency)} |
| Tax | ${formatCurrency(order.sales_tax, order.currency)} |
| Shipping | ${formatCurrency(order.shipping_cost, order.currency)} |
| Status | ${STAGE_LABELS[orderStage(order)].toUpperCase()} |
| Items | ${order.items_count || 1} |
| Created | ${format(new Date(order.created_at), 'MMM d, yyyy')} |
${order.shopify_order_id ? `| Shopify Order | #${order.shopify_order_id} |` : ''}

`;
  }

  md += `---

*${REPORT_FOOTER}*
`;

  const filename = `vouch-post-${post.influencer?.full_name?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}-${format(new Date(post.detected_at), 'yyyy-MM-dd')}.md`;
  downloadMarkdown(md, filename);
}

export function exportInfluencerToMarkdown(
  influencer: Influencer,
  allPosts: VouchPost[] = [],
  allOrders: VouchOrder[] = [],
  brandId?: string
) {
  const influencerPosts = allPosts.filter(p => p.influencer_id === influencer.id);
  const influencerOrders = allOrders.filter(o => o.influencer_id === influencer.id);
  
  // Brand-specific metrics
  const brandOrders = brandId ? influencerOrders.filter(o => o.brand_id === brandId) : influencerOrders;

  const brandVerifiedPosts = influencerPosts.filter(p => {
    if (brandId && p.brand_id !== brandId) return false;
    const order = influencerOrders.find(o => o.id === p.order_id);
    return isPostedOrder(order);
  });
  
  const totalRetailValue = moneyTotal(brandOrders, 'retail_total');
  const totalCOGS = totalCogs(brandOrders);
  const totalViews = recordedTotal(brandVerifiedPosts.map(p => p.views));
  const totalLikes = recordedTotal(brandVerifiedPosts.map(p => p.likes));

  let md = `# Creator Profile Report

> Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}

---

## Basic Information

| Field | Value |
|-------|-------|
| Name | ${mdCell(influencer.full_name || 'Unknown')} |
| Email | ${mdCell(influencer.email)} |
| Phone | ${mdCell(influencer.phone || 'N/A')} |
| Category | ${mdCell(influencer.category || 'N/A')} |
| Bio | ${mdCell(influencer.bio || 'N/A')} |

---

## Social Media Presence

### Instagram
| Field | Value |
|-------|-------|
| Username | @${mdCell(influencer.instagram_username || 'N/A')} |
| Followers | ${formatNumber(influencer.instagram_followers)} |
| Engagement Rate | ${formatRate(influencer.instagram_engagement_rate, 1)} |

### TikTok
| Field | Value |
|-------|-------|
| Username | @${mdCell(influencer.tiktok_username || 'N/A')} |
| Followers | ${formatNumber(influencer.tiktok_followers)} |
| Engagement Rate | ${formatRate(influencer.tiktok_engagement_rate, 1)} |

---

## Brand Performance Metrics

| Metric | Value |
|--------|-------|
| Total Orders | ${brandOrders.length} |
| Verified Posts | ${brandVerifiedPosts.length} |
| Total Retail Value | ${formatCurrency(totalRetailValue, singleCurrency(brandOrders))} |
| Total COGS | ${formatCogs(totalCOGS, singleCurrency(brandOrders))} |
| Total Views | ${formatNumber(totalViews)} |
| Total Likes | ${formatNumber(totalLikes)} |

---

## Order History

`;

  if (brandOrders.length > 0) {
    md += `| Date | Status | Order total | Items |
|------|--------|--------------|-------|
`;
    brandOrders.slice(0, 10).forEach(order => {
      md += `| ${format(new Date(order.created_at), 'MMM d, yyyy')} | ${STAGE_LABELS[orderStage(order)]} | ${formatCurrency(order.order_total, order.currency)} | ${order.items_count || 1} |
`;
    });
  } else {
    md += `No orders found.
`;
  }

  md += `
---

## Audience Insights

Audience demographics are not included in this report.

---

*${REPORT_FOOTER}*
`;

  const filename = `vouch-creator-${influencer.full_name?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}-${format(new Date(), 'yyyy-MM-dd')}.md`;
  downloadMarkdown(md, filename);
}

// Re-export type from pdfExport for consistency
import type { AnalyticsReportData } from './pdfExport';
export type { AnalyticsReportData };

export function exportAnalyticsToMarkdown(data: AnalyticsReportData) {
  let md = `# Analytics Report

> Timeframe: ${data.timeframe}
> Date Range: ${format(data.dateRange.from, 'MMM d, yyyy')} - ${format(data.dateRange.to, 'MMM d, yyyy')}
> Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}

---

## Gift Metrics Summary

| Metric | Value |
|--------|-------|
| Total Gifts | ${data.totalGifts} |
| Total Items | ${data.totalItems} |
| Retail Value | ${formatCurrency(data.retailValue, data.currency)} |
| COGS | ${formatCogs(data.cogs, data.currency)} |
| Actualized Spend | ${formatCurrency(data.actualizedSpend, data.currency)} |
| Charged Amount | ${formatCurrency(data.charged, data.currency)} |
| Avg Retail Value | ${formatCurrency(data.avgRetailValue, data.currency)} |
| Avg COGS | ${formatCogs(data.avgCogs, data.currency)} |

---

## Post Performance

| Metric | Value |
|--------|-------|
| Total Posts | ${data.totalPosts} |
| Post Rate | ${formatRate(data.postRate, 1)} |
| Total Views | ${formatNumber(data.totalViews)} |
| Total Likes | ${formatNumber(data.totalLikes)} |
| Total Comments | ${formatNumber(data.totalComments)} |
| Avg Engagement Rate | ${formatRate(data.avgEngagement, 2)} |
| Avg CPM | ${data.avgCpm == null ? '—' : formatCurrency(data.avgCpm, data.currency)} |

---

## Creator Metrics

| Metric | Value |
|--------|-------|
| Unique Creators | ${data.uniqueCreators} |
| Total Followers | ${formatNumber(data.totalFollowers)} |
| Avg Followers | ${formatNumber(data.avgFollowers)} |
| Avg Engagement Rate | ${formatRate(data.avgEngagementRate, 2)} |
| Instagram Creators | ${data.instagramCreators} |
| TikTok Creators | ${data.tiktokCreators} |

---

## Order Status Distribution

| Status | Count |
|--------|-------|
`;
  data.statusData.forEach(s => {
    md += `| ${mdCell(s.name)} | ${s.value} |
`;
  });

  md += `
---

## Top Performing Creators (by views)

| Rank | Name | Platform | Category | Views |
|------|------|----------|----------|-------|
`;
  data.topInfluencers.forEach((inf, i) => {
    md += `| ${i + 1} | ${mdCell(inf.name)} | ${inf.platform} | ${mdCell(inf.category) || '—'} | ${formatNumber(inf.views)} |
`;
  });

  md += `
---

## Data availability

Product-level reporting and aggregate audience demographics are not connected.

---

*${REPORT_FOOTER}*
`;

  const filename = `vouch-analytics-${format(new Date(), 'yyyy-MM-dd')}.md`;
  downloadMarkdown(md, filename);
}
