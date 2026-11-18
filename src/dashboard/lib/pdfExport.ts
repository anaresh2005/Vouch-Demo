import { orderStage, STAGE_LABELS } from './orderStage';
import { recordedTotal } from '@dashboard/lib/recordedMetrics';
import { formatMoney, singleCurrency, moneyTotal } from './dashboardMoney';
import jsPDF from 'jspdf';
import { VouchPost, VouchOrder, Influencer } from '@dashboard/types/vouch';
import { CPM_FORMULA, calculatePostCPM, formatCPM, isPostedOrder } from '@dashboard/lib/cpmUtils';
import { format } from 'date-fns';
import { REPORT_FOOTER, formatRate, toPdfText } from './reportText';

// Base64 encoded Vouch logo (periwinkle) - will be loaded dynamically
let logoBase64: string | null = null;
let logoAspectRatio: number = 3.33; // default aspect ratio

// jsPDF decodes the transparent PNG logo (1920×417) and, by default, stores its pixels uncompressed:
// ~3.1 MB in every report. Flate-compressing the image keeps each PDF around 100 KB with no visible
// change; text streams stay uncompressed.
const LOGO_COMPRESSION = 'FAST';

// Load logo as base64 (the demo's PNG is rasterized from the new periwinkle logo in Figma) and calculate aspect ratio
async function loadLogo(): Promise<string | null> {
  if (logoBase64) return logoBase64;
  
  try {
    const response = await fetch(new URL('../assets/vouch-logo-periwinkle.png', import.meta.url).href);
    const blob = await response.blob();
    
    // Get actual image dimensions
    const imageBitmap = await createImageBitmap(blob);
    logoAspectRatio = imageBitmap.width / imageBitmap.height;
    imageBitmap.close();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoBase64 = reader.result as string;
        resolve(logoBase64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Footer on every page.
const addFooter = (doc: jsPDF, margin: number, pageWidth: number, pageHeight: number, simplifiedText: boolean) => {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    if (simplifiedText) doc.text('Some text simplified for PDF. Markdown keeps original characters.', margin, pageHeight - 15);
    doc.text(REPORT_FOOTER, margin, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  }
};

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

export async function exportPostToPDF(
  post: VouchPost, 
  order: VouchOrder | undefined,
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;
  let simplifiedText = false;
  const reportText = (text: string) => {
    const printable = toPdfText(text);
    if (printable !== text) simplifiedText = true;
    return printable;
  };

  // Load logo
  const logo = await loadLogo();
  
  // Helper to check page break and add new page if needed
  const checkPageBreak = (neededSpace: number): boolean => {
    if (y + neededSpace > pageHeight - 25) {
      doc.addPage();

      y = 20;
      return true;
    }
    return false;
  };

  const addText = (text: string, x: number, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(reportText(text), x, y);
  };

  const addWrappedText = (text: string, x: number, maxWidth: number, fontSize: number, lineHeight: number = 1.3, color: [number, number, number] = [100, 100, 100]): number => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(reportText(text), maxWidth);
    const lineSpacing = fontSize * 0.352778 * lineHeight; // Convert pt to mm
    
    for (let i = 0; i < lines.length; i++) {
      if (y > pageHeight - 25) {
        doc.addPage();

        y = 20;
      }
      doc.text(lines[i], x, y);
      if (i < lines.length - 1) {
        y += lineSpacing;
      }
    }
    return lines.length * lineSpacing;
  };

  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // Header with logo (proper aspect ratio)
  if (logo) {
    const logoHeight = 10;
    const logoWidth = logoHeight * logoAspectRatio;
    doc.addImage(logo, 'PNG', margin, y - 3, logoWidth, logoHeight, undefined, LOGO_COMPRESSION);
  }
  y += 15;
  addText('Post Performance Report', margin, 12, false, [100, 100, 100]);
  y += 8;
  addText(`Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`, margin, 9, false, [150, 150, 150]);
  y += 12;
  addLine();
  y += 8;

  // Influencer Info Section
  addText('Creator', margin, 10, true, [100, 100, 100]);
  y += 7;
  addText(post.influencer?.full_name || 'Unknown', margin, 14, true);
  y += 7;
  
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
  
  addText(`${platform} · ${handle} · ${formatNumber(followers)} followers · ${formatRate(engagementRate, 1)} ER`, margin, 10, false, [100, 100, 100]);
  y += 5;
  if (post.influencer?.email) {
    addText(`Email: ${post.influencer.email}`, margin, 9, false, [120, 120, 120]);
    y += 5;
  }
  if (post.influencer?.category) {
    addText(`Category: ${post.influencer.category}`, margin, 9, false, [120, 120, 120]);
  }
  y += 12;

  // Post Details Section
  addText('Post Details', margin, 10, true, [100, 100, 100]);
  y += 7;
  addText(`Platform: ${platform}`, margin, 11);
  y += 6;
  addText(`Detected: ${format(new Date(post.detected_at), 'MMMM d, yyyy h:mm a')}`, margin, 11);
  y += 6;
  addText(`Post URL: ${post.post_url}`, margin, 9, false, [100, 100, 100]);
  y += 12;

  // Caption Section with proper wrapping
  addText('Caption', margin, 10, true, [100, 100, 100]);
  y += 6;
  const caption = 'Caption text is not available. Open the original post to read it.';
  addWrappedText(caption, margin, contentWidth, 9, 1.4);
  y += 10;

  // Performance Metrics Section
  checkPageBreak(50);
  addText('Performance Metrics', margin, 10, true, [100, 100, 100]);
  y += 10;

  const metricsCol1X = margin;
  const metricsCol2X = margin + 40;
  const metricsCol3X = margin + 80;
  const metricsCol4X = margin + 120;

  addText('Views', metricsCol1X, 9, false, [100, 100, 100]);
  addText('Likes', metricsCol2X, 9, false, [100, 100, 100]);
  addText('Comments', metricsCol3X, 9, false, [100, 100, 100]);
  addText('Engagement', metricsCol4X, 9, false, [100, 100, 100]);
  y += 6;

  addText(formatNumber(post.views), metricsCol1X, 13, true);
  addText(formatNumber(post.likes), metricsCol2X, 13, true);
  addText(formatNumber(post.comments), metricsCol3X, 13, true);
  addText(formatRate(post.engagement_rate, 2), metricsCol4X, 13, true);
  y += 12;

  // CPM
  const cpm = calculatePostCPM(post, order);
  if (cpm !== null) {
    addText('CPM (Cost Per Mille)', margin, 9, false, [100, 100, 100]);
    y += 6;
    addText(formatCPM(cpm, order?.currency), margin, 14, true, [109, 99, 255]);
    y += 3;
    addText(`Formula: ${CPM_FORMULA}`, margin, 8, false, [150, 150, 150]);
    y += 12;
  }

  // Order Details (if available)
  if (order) {
    checkPageBreak(60);
    addLine();
    y += 8;
    addText('Order Details', margin, 10, true, [100, 100, 100]);
    y += 10;

    const orderCol1X = margin;
    const orderCol2X = margin + 45;
    const orderCol3X = margin + 90;
    const orderCol4X = margin + 135;

    addText('Order total', orderCol1X, 9, false, [100, 100, 100]);
    addText('COGS', orderCol2X, 9, false, [100, 100, 100]);
    addText('Tax', orderCol3X, 9, false, [100, 100, 100]);
    addText('Shipping', orderCol4X, 9, false, [100, 100, 100]);
    y += 6;
    addText(formatCurrency(order.order_total, order.currency), orderCol1X, 12, true);
    addText(formatCogs(order.cogs, order.currency), orderCol2X, 12, true);
    addText(formatCurrency(order.sales_tax, order.currency), orderCol3X, 12, true);
    addText(formatCurrency(order.shipping_cost, order.currency), orderCol4X, 12, true);
    y += 10;

    addText('Order Status', orderCol1X, 9, false, [100, 100, 100]);
    addText('Items', orderCol2X, 9, false, [100, 100, 100]);
    addText('Created', orderCol3X, 9, false, [100, 100, 100]);
    y += 6;
    addText(STAGE_LABELS[orderStage(order)].toUpperCase(), orderCol1X, 11, true);
    addText(`${order.items_count || 1} item(s)`, orderCol2X, 11, true);
    addText(format(new Date(order.created_at), 'MMM d, yyyy'), orderCol3X, 11, true);
    y += 10;

    if (order.shopify_order_id) {
      addText(`Shopify Order: #${order.shopify_order_id}`, margin, 9, false, [100, 100, 100]);
      y += 8;
    }
  }

  // Top Comments Section
  checkPageBreak(60);
  addLine();
  y += 8;
  addText('Top Comments (Most Liked)', margin, 10, true, [100, 100, 100]);
  y += 8;

  addText('Individual comments are not available. See the original post.', margin, 9);

  addFooter(doc, margin, pageWidth, pageHeight, simplifiedText);

  // Save
  const filename = `vouch-post-${post.influencer?.full_name?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}-${format(new Date(post.detected_at), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

export async function exportInfluencerToPDF(
  influencer: Influencer,
  orders: VouchOrder[],
  allPosts: VouchPost[],
  allOrders: VouchOrder[],
  brandId: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;
  let simplifiedText = false;
  const reportText = (text: string) => {
    const printable = toPdfText(text);
    if (printable !== text) simplifiedText = true;
    return printable;
  };
  
  // Load logo
  const logo = await loadLogo();

  const addText = (text: string, x: number, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(reportText(text), x, y);
  };

  const addWrappedText = (text: string, x: number, maxWidth: number, fontSize: number, lineHeight: number = 1.3, color: [number, number, number] = [100, 100, 100]): number => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(reportText(text), maxWidth);
    const lineSpacing = fontSize * 0.352778 * lineHeight;
    
    for (let i = 0; i < lines.length; i++) {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 20;
      }
      doc.text(lines[i], x, y);
      if (i < lines.length - 1) {
        y += lineSpacing;
      }
    }
    return lines.length * lineSpacing;
  };

  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  const checkPageBreak = (neededSpace: number): boolean => {
    if (y + neededSpace > pageHeight - 25) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  // Header with logo (proper aspect ratio)
  if (logo) {
    const logoHeight = 10;
    const logoWidth = logoHeight * logoAspectRatio;
    doc.addImage(logo, 'PNG', margin, y - 3, logoWidth, logoHeight, undefined, LOGO_COMPRESSION);
  }
  y += 15;
  addText('Creator Profile Report', margin, 12, false, [100, 100, 100]);
  y += 8;
  addText(`Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`, margin, 9, false, [150, 150, 150]);
  y += 12;
  addLine();
  y += 8;

  // Profile Section
  addText('Profile', margin, 10, true, [100, 100, 100]);
  y += 7;
  addText(influencer.full_name || 'Unknown', margin, 16, true);
  y += 7;
  addText(influencer.email, margin, 10, false, [100, 100, 100]);
  y += 5;
  if (influencer.category) {
    addText(`Category: ${influencer.category}`, margin, 10, false, [100, 100, 100]);
    y += 5;
  }
  if (influencer.bio) {
    addText('Bio:', margin, 9, false, [100, 100, 100]);
    y += 5;
    addWrappedText(influencer.bio.trim(), margin, contentWidth, 9, 1.3, [100, 100, 100]);
    y += 5;
  }
  y += 10;

  // Social Presence Section
  addText('Social Presence', margin, 10, true, [100, 100, 100]);
  y += 10;

  // Instagram stats
  if (influencer.instagram_username) {
    addText('Instagram', margin, 9, true, [80, 80, 80]);
    y += 6;
    addText(`@${influencer.instagram_username}`, margin, 11, false);
    y += 5;
    addText(`Followers: ${formatNumber(influencer.instagram_followers)} · ER: ${formatRate(influencer.instagram_engagement_rate, 1)}`, margin, 9, false, [100, 100, 100]);
    y += 8;
  }

  // TikTok stats
  if (influencer.tiktok_username) {
    addText('TikTok', margin, 9, true, [80, 80, 80]);
    y += 6;
    addText(`@${influencer.tiktok_username}`, margin, 11, false);
    y += 5;
    addText(`Followers: ${formatNumber(influencer.tiktok_followers)} · ER: ${formatRate(influencer.tiktok_engagement_rate, 1)}`, margin, 9, false, [100, 100, 100]);
    y += 8;
  }

  // Vouch Performance Section
  const influencerPosts = allPosts.filter(p => p.influencer_id === influencer.id);
  const influencerOrders = allOrders.filter(o => o.influencer_id === influencer.id);
  const brandVerifiedPosts = influencerPosts.filter(p => {
    if (p.brand_id !== brandId) return false;
    const order = influencerOrders.find(o => o.id === p.order_id);
    return isPostedOrder(order);
  });
  const brandOrders = influencerOrders.filter(o => o.brand_id === brandId);

  const totalRetailValue = moneyTotal(brandOrders, 'retail_total');
  const totalCOGS = totalCogs(brandOrders);
  const totalViews = recordedTotal(brandVerifiedPosts.map(p => p.views));
  const totalLikes = recordedTotal(brandVerifiedPosts.map(p => p.likes));

  // Average CPM across this creator's posts for the brand (matches the dashboard).
  const cpms = brandVerifiedPosts
    .map(post => calculatePostCPM(post, influencerOrders.find(o => o.id === post.order_id)))
    .filter((cpm): cpm is number => cpm !== null);
  const avgCPM = singleCurrency(brandOrders) && cpms.length > 0 ? cpms.reduce((sum, cpm) => sum + cpm, 0) / cpms.length : null;

  y += 5;
  addLine();
  y += 8;
  addText('Vouch Performance (Your Brand)', margin, 10, true, [100, 100, 100]);
  y += 10;

  const vouchCol1X = margin;
  const vouchCol2X = margin + 35;
  const vouchCol3X = margin + 70;
  const vouchCol4X = margin + 105;
  const vouchCol5X = margin + 140;

  addText('Retail', vouchCol1X, 9, false, [100, 100, 100]);
  addText('COGS', vouchCol2X, 9, false, [100, 100, 100]);
  addText('Views', vouchCol3X, 9, false, [100, 100, 100]);
  addText('Likes', vouchCol4X, 9, false, [100, 100, 100]);
  addText('Avg CPM', vouchCol5X, 9, false, [100, 100, 100]);
  y += 6;

  addText(formatCurrency(totalRetailValue, singleCurrency(brandOrders)), vouchCol1X, 11, true);
  addText(formatCogs(totalCOGS, singleCurrency(brandOrders)), vouchCol2X, 11, true);
  addText(brandVerifiedPosts.length > 0 ? formatNumber(totalViews) : '—', vouchCol3X, 11, true);
  addText(brandVerifiedPosts.length > 0 ? formatNumber(totalLikes) : '—', vouchCol4X, 11, true);
  addText(avgCPM !== null ? formatCPM(avgCPM, singleCurrency(brandOrders)) : '—', vouchCol5X, 11, true, [74, 84, 226]);
  y += 10;

  addText(`Verified Posts: ${brandVerifiedPosts.length}`, margin, 9, false, [100, 100, 100]);
  y += 12;

  // Order History
  if (orders.length > 0) {
    checkPageBreak(50);
    addLine();
    y += 8;
    addText(`Order History (${orders.length} orders)`, margin, 10, true, [100, 100, 100]);
    y += 10;

    for (const order of orders.slice(0, 8)) {
      checkPageBreak(15);
      const orderStatus = STAGE_LABELS[orderStage(order)].toUpperCase();
      const orderAmount = formatCurrency(order.order_total, order.currency);
      const orderDate = format(new Date(order.created_at), 'MMM d, yyyy');
      addText(`${orderDate} · ${orderAmount} · ${order.items_count || 1} item(s) · ${orderStatus}`, margin, 9);
      y += 6;
      if (order.shopify_order_id) {
        addText(`  Shopify: #${order.shopify_order_id}`, margin, 8, false, [130, 130, 130]);
        y += 5;
      }
    }
    if (orders.length > 8) {
      addText(`... and ${orders.length - 8} more orders`, margin, 9, false, [150, 150, 150]);
      y += 6;
    }
    y += 5;
  }

  checkPageBreak(30);
  addText('Audience demographics are not included in this report.', margin, 10);

  addFooter(doc, margin, pageWidth, pageHeight, simplifiedText);

  // Save
  const filename = `vouch-creator-${influencer.full_name?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

// Analytics Report Export
export interface AnalyticsReportData {
  currency?: string | null;
  timeframe: string;
  dateRange: { from: Date; to: Date };
  // Gift Metrics
  totalGifts: number;
  totalItems: number;
  retailValue: number | null;
  /** Null when cost of goods has not been recorded. */
  cogs: number | null;
  actualizedSpend: number | null;
  charged: number | null;
  avgRetailValue: number | null;
  avgCogs: number | null;
  // Post Performance
  totalPosts: number;
  /** Null until at least one order has a posting outcome. */
  postRate: number | null;
  totalViews: number | null;
  totalLikes: number | null;
  totalComments: number | null;
  avgEngagement: number | null;
  avgCpm: number | null;
  // Influencer Metrics
  uniqueCreators: number;
  totalFollowers: number | null;
  avgFollowers: number | null;
  avgEngagementRate: number | null;
  instagramCreators: number;
  tiktokCreators: number;
  // Order Status
  statusData: { name: string; value: number }[];
  // Top Influencers
  topInfluencers: { name: string; platform: string; category: string; views: number | null }[];

}

export async function exportAnalyticsToPDF(data: AnalyticsReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  let y = 20;
  let simplifiedText = false;
  const reportText = (text: string) => {
    const printable = toPdfText(text);
    if (printable !== text) simplifiedText = true;
    return printable;
  };

  // Load logo
  const logo = await loadLogo();
  
  // Helper to check page break and add new page if needed
  const checkPageBreak = (neededSpace: number): boolean => {
    if (y + neededSpace > pageHeight - 25) {
      doc.addPage();

      y = 20;
      return true;
    }
    return false;
  };

  const addText = (text: string, x: number, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(reportText(text), x, y);
  };

  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // Header with logo
  if (logo) {
    const logoHeight = 10;
    const logoWidth = logoHeight * logoAspectRatio;
    doc.addImage(logo, 'PNG', margin, y - 3, logoWidth, logoHeight, undefined, LOGO_COMPRESSION);
  }
  y += 15;
  addText('Analytics Report', margin, 14, true);
  y += 8;
  addText(`${data.timeframe} · ${format(data.dateRange.from, 'MMM d, yyyy')} - ${format(data.dateRange.to, 'MMM d, yyyy')}`, margin, 10, false, [100, 100, 100]);
  y += 6;
  addText(`Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`, margin, 9, false, [150, 150, 150]);
  y += 10;
  addLine();
  y += 10;

  // Gift Metrics Section
  addText('Gift Metrics', margin, 12, true, [80, 80, 80]);
  y += 10;

  // Row 1
  const col1X = margin;
  const col2X = margin + 45;
  const col3X = margin + 90;
  const col4X = margin + 135;

  addText('Total Gifts', col1X, 9, false, [100, 100, 100]);
  addText('Total Items', col2X, 9, false, [100, 100, 100]);
  addText('Retail Value', col3X, 9, false, [100, 100, 100]);
  addText('COGS', col4X, 9, false, [100, 100, 100]);
  y += 6;
  addText(data.totalGifts.toString(), col1X, 13, true);
  addText(data.totalItems.toString(), col2X, 13, true);
  addText(formatCurrency(data.retailValue, data.currency), col3X, 13, true);
  addText(formatCogs(data.cogs, data.currency), col4X, 13, true);
  y += 10;

  // Row 2
  addText('Actualized Spend', col1X, 9, false, [100, 100, 100]);
  addText('Charged', col2X, 9, false, [100, 100, 100]);
  addText('Avg Retail Value', col3X, 9, false, [100, 100, 100]);
  addText('Avg COGS', col4X, 9, false, [100, 100, 100]);
  y += 6;
  addText(formatCurrency(data.actualizedSpend, data.currency), col1X, 13, true);
  addText(formatCurrency(data.charged, data.currency), col2X, 13, true);
  addText(formatCurrency(data.avgRetailValue, data.currency), col3X, 13, true);
  addText(formatCogs(data.avgCogs, data.currency), col4X, 13, true);
  y += 15;

  // Post Performance Section
  checkPageBreak(60);
  addLine();
  y += 8;
  addText('Post Performance', margin, 12, true, [80, 80, 80]);
  y += 10;

  addText('Total Posts', col1X, 9, false, [100, 100, 100]);
  addText('Post Rate', col2X, 9, false, [100, 100, 100]);
  addText('Total Views', col3X, 9, false, [100, 100, 100]);
  addText('Avg CPM', col4X, 9, false, [100, 100, 100]);
  y += 6;
  addText(data.totalPosts.toString(), col1X, 13, true);
  addText(data.postRate == null ? '—' : `${data.postRate.toFixed(0)}%`, col2X, 13, true);
  addText(formatNumber(data.totalViews), col3X, 13, true);
  addText(data.avgCpm == null ? '—' : formatCPM(data.avgCpm, data.currency), col4X, 13, true, [109, 99, 255]);
  y += 10;

  addText('Total Likes', col1X, 9, false, [100, 100, 100]);
  addText('Total Comments', col2X, 9, false, [100, 100, 100]);
  addText('Avg Engagement', col3X, 9, false, [100, 100, 100]);
  y += 6;
  addText(formatNumber(data.totalLikes), col1X, 13, true);
  addText(formatNumber(data.totalComments), col2X, 13, true);
  addText(data.avgEngagement == null ? '—' : `${data.avgEngagement.toFixed(2)}%`, col3X, 13, true);
  y += 15;

  // Influencer Metrics Section
  checkPageBreak(60);
  addLine();
  y += 8;
  addText('Creator Metrics', margin, 12, true, [80, 80, 80]);
  y += 10;

  addText('Unique Creators', col1X, 9, false, [100, 100, 100]);
  addText('Total Followers', col2X, 9, false, [100, 100, 100]);
  addText('Avg Followers', col3X, 9, false, [100, 100, 100]);
  addText('Avg ER', col4X, 9, false, [100, 100, 100]);
  y += 6;
  addText(data.uniqueCreators.toString(), col1X, 13, true);
  addText(formatNumber(data.totalFollowers), col2X, 13, true);
  addText(formatNumber(data.avgFollowers), col3X, 13, true);
  addText(formatRate(data.avgEngagementRate, 1), col4X, 13, true);
  y += 10;

  addText('Instagram Creators', col1X, 9, false, [100, 100, 100]);
  addText('TikTok Creators', col2X, 9, false, [100, 100, 100]);
  y += 6;
  addText(data.instagramCreators.toString(), col1X, 13, true);
  addText(data.tiktokCreators.toString(), col2X, 13, true);
  y += 15;

  // Order Status
  checkPageBreak(50);
  addLine();
  y += 8;
  addText('Order Status Distribution', margin, 12, true, [80, 80, 80]);
  y += 10;

  for (const status of data.statusData) {
    addText(`${status.name}: ${status.value}`, margin, 10, false, [80, 80, 80]);
    y += 6;
  }
  y += 10;

  // Top Influencers
  checkPageBreak(60);
  addLine();
  y += 8;
  addText('Top Creators (by views)', margin, 12, true, [80, 80, 80]);
  y += 10;

  if (data.topInfluencers.length === 0) {
    addText('No creator data available', margin, 10, false, [150, 150, 150]);
    y += 8;
  } else {
    for (let i = 0; i < Math.min(data.topInfluencers.length, 5); i++) {
      const inf = data.topInfluencers[i];
      addText(`${i + 1}. ${inf.name}`, margin, 10, true, [60, 60, 60]);
      y += 5;
      addText([inf.platform, inf.category, `${formatNumber(inf.views)} views`].filter(Boolean).join(' · '), margin + 5, 9, false, [100, 100, 100]);
      y += 7;
    }
  }
  y += 5;

  checkPageBreak(25);
  addText('Product-level reporting and aggregate audience data are unavailable.', margin, 9);

  addFooter(doc, margin, pageWidth, pageHeight, simplifiedText);

  // Save
  const filename = `vouch-analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}
