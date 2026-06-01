import jsPDF from 'jspdf';
import { VouchPost, VouchOrder, Influencer } from '@/types/vouch';
import { calculatePostCPM, formatCPM } from '@/lib/cpmUtils';
import { format } from 'date-fns';

// Base64 encoded Vouch logo (periwinkle) - will be loaded dynamically
let logoBase64: string | null = null;
let logoAspectRatio: number = 3.33; // default aspect ratio

// Load logo as base64 and calculate aspect ratio
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

// Strip emojis and special characters that jsPDF can't render
const stripEmojis = (text: string): string => {
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{FE0F}]/gu, '').trim();
};

const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency,
    maximumFractionDigits: 0 
  }).format(amount);
};

// Caption generation logic (same as in PostDetailDialog)
const generateCaption = (post: VouchPost): string => {
  const captions: Record<string, string> = {
    'inf-2': "Faith + mindset + style 🙏 @styleco_official really understood the assignment with this one. Quality is unmatched! #ad #styleco #fashion #mindset",
    'inf-3': "Vancouver fits check ✈️🇨🇦 @styleco_official coming through with the heat! These pieces are perfect for content days. Link in bio! #gifted #styleco #contentcreator",
  };
  
  return captions[post.influencer_id] || "Loving my new pieces from @styleco_official! 💕 The quality is incredible and I can't stop wearing them. Check out my stories for more details! #styleco #fashion #sponsored";
};

// Comment generation (same logic as PostDetailDialog)
interface Comment {
  username: string;
  text: string;
  likes: number;
}

const generateMockComments = (postId: string): Comment[] => {
  const baseComments = [
    { username: 'fashionlover22', text: 'Omg this is stunning! 😍', likes: 234 },
    { username: 'style_queen', text: 'Need this in my life rn!!', likes: 189 },
    { username: 'trendsetter_x', text: 'Where can I get this?? Link please! 🙏', likes: 156 },
    { username: 'vibes.only', text: 'This is everything! You always have the best finds', likes: 145 },
    { username: 'aesthetic_dreams', text: 'Your content is always so fire 🔥🔥', likes: 132 },
  ];

  const hash = postId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return [...baseComments].sort((a, b) => {
    const aHash = (a.username.charCodeAt(0) + hash) % 10;
    const bHash = (b.username.charCodeAt(0) + hash) % 10;
    return aHash - bHash;
  });
};

// Colors for charts
const chartColors = {
  primary: [109, 99, 255] as [number, number, number],
  secondary: [167, 139, 250] as [number, number, number],
  tertiary: [196, 181, 253] as [number, number, number],
  quaternary: [221, 214, 254] as [number, number, number],
  quinary: [237, 233, 254] as [number, number, number],
  female: [236, 72, 153] as [number, number, number],
  male: [59, 130, 246] as [number, number, number],
};

// Draw a horizontal bar chart
function drawBarChart(
  doc: jsPDF,
  data: { label: string; value: number }[],
  x: number,
  y: number,
  width: number,
  barHeight: number = 8,
  gap: number = 4
): number {
  const maxValue = Math.max(...data.map(d => d.value));
  let currentY = y;
  
  const colors = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.tertiary,
    chartColors.quaternary,
    chartColors.quinary,
  ];
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const barWidth = (item.value / maxValue) * (width - 50);
    const color = colors[i % colors.length];
    
    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(item.label, x, currentY + barHeight / 2 + 2);
    
    // Bar background
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(x + 50, currentY, width - 50, barHeight, 2, 2, 'F');
    
    // Bar fill
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x + 50, currentY, Math.max(barWidth, 4), barHeight, 2, 2, 'F');
    
    // Value
    doc.setTextColor(60, 60, 60);
    doc.text(`${item.value}%`, x + width + 3, currentY + barHeight / 2 + 2);
    
    currentY += barHeight + gap;
  }
  
  return currentY;
}

// Draw a simple pie chart
function drawPieChart(
  doc: jsPDF,
  data: { label: string; value: number; color: [number, number, number] }[],
  centerX: number,
  centerY: number,
  radius: number
): void {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -Math.PI / 2; // Start from top
  
  for (const item of data) {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    
    // Draw slice
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    
    // Create pie slice path
    const startX = centerX + radius * Math.cos(currentAngle);
    const startY = centerY + radius * Math.sin(currentAngle);
    const endX = centerX + radius * Math.cos(currentAngle + sliceAngle);
    const endY = centerY + radius * Math.sin(currentAngle + sliceAngle);
    
    // Draw as filled sector using triangles (approximate arc with segments)
    const segments = Math.max(Math.floor(sliceAngle / 0.1), 5);
    for (let i = 0; i < segments; i++) {
      const angle1 = currentAngle + (i / segments) * sliceAngle;
      const angle2 = currentAngle + ((i + 1) / segments) * sliceAngle;
      
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      
      doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');
    }
    
    currentAngle += sliceAngle;
  }
}

// Draw pie chart legend
function drawPieChartLegend(
  doc: jsPDF,
  data: { label: string; value: number; color: [number, number, number] }[],
  x: number,
  y: number
): number {
  let currentY = y;
  
  for (const item of data) {
    // Color box
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.rect(x, currentY - 3, 8, 8, 'F');
    
    // Label and value
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`${item.label}: ${item.value}%`, x + 12, currentY + 2);
    
    currentY += 12;
  }
  
  return currentY;
}

export async function exportPostToPDF(
  post: VouchPost, 
  order: VouchOrder | undefined,
  allPosts: VouchPost[],
  allOrders: VouchOrder[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;
  let pageNum = 1;
  
  // Load logo
  const logo = await loadLogo();
  
  // Helper to check page break and add new page if needed
  const checkPageBreak = (neededSpace: number): boolean => {
    if (y + neededSpace > pageHeight - 25) {
      doc.addPage();
      pageNum++;
      y = 20;
      return true;
    }
    return false;
  };

  const addText = (text: string, x: number, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, x, y);
  };

  const addWrappedText = (text: string, x: number, maxWidth: number, fontSize: number, lineHeight: number = 1.3, color: [number, number, number] = [100, 100, 100]): number => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineSpacing = fontSize * 0.352778 * lineHeight; // Convert pt to mm
    
    for (let i = 0; i < lines.length; i++) {
      if (y > pageHeight - 25) {
        doc.addPage();
        pageNum++;
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
    doc.addImage(logo, 'PNG', margin, y - 3, logoWidth, logoHeight);
  }
  y += 15;
  addText('Post Performance Report', margin, 12, false, [100, 100, 100]);
  y += 8;
  addText(`Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`, margin, 9, false, [150, 150, 150]);
  y += 12;
  addLine();
  y += 8;

  // Influencer Info Section
  addText('Influencer', margin, 10, true, [100, 100, 100]);
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
  
  addText(`${platform} · ${handle} · ${formatNumber(followers)} followers · ${engagementRate?.toFixed(1) || '—'}% ER`, margin, 10, false, [100, 100, 100]);
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
  const caption = stripEmojis(generateCaption(post));
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
  addText(`${post.engagement_rate?.toFixed(2) || '—'}%`, metricsCol4X, 13, true);
  y += 12;

  // CPM
  const cpm = calculatePostCPM(post, order);
  if (cpm !== null) {
    addText('CPM (Cost Per Mille)', margin, 9, false, [100, 100, 100]);
    y += 6;
    addText(formatCPM(cpm), margin, 14, true, [109, 99, 255]);
    y += 3;
    addText('Formula: ((COGS + tax + shipping) ÷ views) × 1,000', margin, 8, false, [150, 150, 150]);
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

    addText('Retail Value', orderCol1X, 9, false, [100, 100, 100]);
    addText('COGS', orderCol2X, 9, false, [100, 100, 100]);
    addText('Tax', orderCol3X, 9, false, [100, 100, 100]);
    addText('Shipping', orderCol4X, 9, false, [100, 100, 100]);
    y += 6;
    addText(formatCurrency(order.order_total || 0), orderCol1X, 12, true);
    addText(formatCurrency(order.cogs || 0), orderCol2X, 12, true);
    addText(formatCurrency(order.sales_tax || 0), orderCol3X, 12, true);
    addText(formatCurrency(order.shipping_cost || 0), orderCol4X, 12, true);
    y += 10;

    addText('Order Status', orderCol1X, 9, false, [100, 100, 100]);
    addText('Items', orderCol2X, 9, false, [100, 100, 100]);
    addText('Created', orderCol3X, 9, false, [100, 100, 100]);
    y += 6;
    addText(order.status.replace(/_/g, ' ').toUpperCase(), orderCol1X, 11, true);
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

  const comments = generateMockComments(post.id).slice(0, 5);
  for (const comment of comments) {
    checkPageBreak(15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`@${comment.username}`, margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${stripEmojis(comment.text)} (${comment.likes} likes)`, margin + 5, y);
    y += 7;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by Vouch · vouch.io', margin, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  }

  // Save
  const filename = `vouch-post-${post.influencer?.full_name?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}-${format(new Date(post.detected_at), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

// Audience data type
interface AudienceData {
  location: { country: string; percentage: number }[];
  cities: { city: string; percentage: number }[];
  languages: { language: string; percentage: number }[];
  age: { range: string; percentage: number }[];
  gender: { type: string; percentage: number }[];
  interests: string[];
}

// Mock audience data (same as InfluencerProfileDialog)
const mockAudienceData: Record<string, AudienceData> = {
  'inf-1': {
    location: [
      { country: 'United States', percentage: 45 },
      { country: 'United Kingdom', percentage: 18 },
      { country: 'Canada', percentage: 12 },
      { country: 'Australia', percentage: 8 },
      { country: 'Other', percentage: 17 },
    ],
    cities: [
      { city: 'Los Angeles', percentage: 18 },
      { city: 'New York', percentage: 15 },
      { city: 'London', percentage: 12 },
      { city: 'Toronto', percentage: 8 },
      { city: 'Miami', percentage: 6 },
    ],
    languages: [
      { language: 'English', percentage: 78 },
      { language: 'Spanish', percentage: 12 },
      { language: 'French', percentage: 6 },
      { language: 'Other', percentage: 4 },
    ],
    age: [
      { range: '18-24', percentage: 50 },
      { range: '25-34', percentage: 37 },
      { range: '35-44', percentage: 13 },
    ],
    gender: [
      { type: 'Female', percentage: 68 },
      { type: 'Male', percentage: 32 },
    ],
    interests: ['Fashion', 'Beauty', 'Lifestyle', 'Travel'],
  },
  'inf-2': {
    location: [
      { country: 'United States', percentage: 62 },
      { country: 'Germany', percentage: 10 },
      { country: 'Japan', percentage: 8 },
      { country: 'South Korea', percentage: 6 },
      { country: 'Other', percentage: 14 },
    ],
    cities: [
      { city: 'San Francisco', percentage: 22 },
      { city: 'Seattle', percentage: 14 },
      { city: 'Austin', percentage: 10 },
      { city: 'Tokyo', percentage: 8 },
      { city: 'Berlin', percentage: 6 },
    ],
    languages: [
      { language: 'English', percentage: 72 },
      { language: 'Japanese', percentage: 10 },
      { language: 'German', percentage: 8 },
      { language: 'Korean', percentage: 6 },
      { language: 'Other', percentage: 4 },
    ],
    age: [
      { range: '18-24', percentage: 55 },
      { range: '25-34', percentage: 35 },
      { range: '35-44', percentage: 10 },
    ],
    gender: [
      { type: 'Male', percentage: 75 },
      { type: 'Female', percentage: 25 },
    ],
    interests: ['Tech', 'Gaming', 'Gadgets', 'Reviews'],
  },
  'inf-3': {
    location: [
      { country: 'United States', percentage: 55 },
      { country: 'United Kingdom', percentage: 15 },
      { country: 'Australia', percentage: 10 },
      { country: 'Canada', percentage: 8 },
      { country: 'Other', percentage: 12 },
    ],
    cities: [
      { city: 'Los Angeles', percentage: 20 },
      { city: 'Sydney', percentage: 12 },
      { city: 'London', percentage: 10 },
      { city: 'Denver', percentage: 8 },
      { city: 'Vancouver', percentage: 6 },
    ],
    languages: [
      { language: 'English', percentage: 88 },
      { language: 'Spanish', percentage: 7 },
      { language: 'Other', percentage: 5 },
    ],
    age: [
      { range: '18-24', percentage: 50 },
      { range: '25-34', percentage: 40 },
      { range: '35-44', percentage: 10 },
    ],
    gender: [
      { type: 'Female', percentage: 60 },
      { type: 'Male', percentage: 40 },
    ],
    interests: ['Fitness', 'Wellness', 'Nutrition', 'Yoga'],
  },
};

const defaultAudienceData: AudienceData = {
  location: [
    { country: 'United States', percentage: 50 },
    { country: 'United Kingdom', percentage: 15 },
    { country: 'Canada', percentage: 10 },
    { country: 'Other', percentage: 25 },
  ],
  cities: [
    { city: 'New York', percentage: 18 },
    { city: 'Los Angeles', percentage: 14 },
    { city: 'London', percentage: 10 },
    { city: 'Chicago', percentage: 8 },
    { city: 'Toronto', percentage: 6 },
  ],
  languages: [
    { language: 'English', percentage: 82 },
    { language: 'Spanish', percentage: 10 },
    { language: 'Other', percentage: 8 },
  ],
  age: [
    { range: '18-24', percentage: 50 },
    { range: '25-34', percentage: 35 },
    { range: '35-44', percentage: 15 },
  ],
  gender: [
    { type: 'Female', percentage: 55 },
    { type: 'Male', percentage: 45 },
  ],
  interests: ['Lifestyle', 'Fashion', 'Entertainment'],
};

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
  
  // Load logo
  const logo = await loadLogo();

  const addText = (text: string, x: number, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, x, y);
  };

  const addWrappedText = (text: string, x: number, maxWidth: number, fontSize: number, lineHeight: number = 1.3, color: [number, number, number] = [100, 100, 100]): number => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxWidth);
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
    doc.addImage(logo, 'PNG', margin, y - 3, logoWidth, logoHeight);
  }
  y += 15;
  addText('Influencer Profile Report', margin, 12, false, [100, 100, 100]);
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
    addWrappedText(stripEmojis(influencer.bio), margin, contentWidth, 9, 1.3, [100, 100, 100]);
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
    addText(`Followers: ${formatNumber(influencer.instagram_followers)} · ER: ${influencer.instagram_engagement_rate?.toFixed(1) || '—'}%`, margin, 9, false, [100, 100, 100]);
    y += 8;
  }

  // TikTok stats
  if (influencer.tiktok_username) {
    addText('TikTok', margin, 9, true, [80, 80, 80]);
    y += 6;
    addText(`@${influencer.tiktok_username}`, margin, 11, false);
    y += 5;
    addText(`Followers: ${formatNumber(influencer.tiktok_followers)} · ER: ${influencer.tiktok_engagement_rate?.toFixed(1) || '—'}%`, margin, 9, false, [100, 100, 100]);
    y += 8;
  }

  // Vouch Performance Section
  const influencerPosts = allPosts.filter(p => p.influencer_id === influencer.id);
  const influencerOrders = allOrders.filter(o => o.influencer_id === influencer.id);
  const brandVerifiedPosts = influencerPosts.filter(p => {
    if (p.brand_id !== brandId) return false;
    const order = influencerOrders.find(o => o.id === p.order_id);
    return order?.status === 'post_verified';
  });
  const brandOrders = influencerOrders.filter(o => o.brand_id === brandId);

  const totalRetailValue = brandOrders.reduce((sum, o) => sum + o.order_total, 0);
  const totalCOGS = brandOrders.reduce((sum, o) => sum + (o.cogs || 0), 0);
  const totalViews = brandVerifiedPosts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = brandVerifiedPosts.reduce((sum, p) => sum + (p.likes || 0), 0);

  // Find best CPM
  let bestCPM: number | null = null;
  for (const post of brandVerifiedPosts) {
    const order = influencerOrders.find(o => o.id === post.order_id);
    const cpm = calculatePostCPM(post, order);
    if (cpm !== null && (bestCPM === null || cpm < bestCPM)) {
      bestCPM = cpm;
    }
  }

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
  addText('Best CPM', vouchCol5X, 9, false, [100, 100, 100]);
  y += 6;

  addText(formatCurrency(totalRetailValue), vouchCol1X, 11, true);
  addText(formatCurrency(totalCOGS), vouchCol2X, 11, true);
  addText(brandVerifiedPosts.length > 0 ? formatNumber(totalViews) : '—', vouchCol3X, 11, true);
  addText(brandVerifiedPosts.length > 0 ? formatNumber(totalLikes) : '—', vouchCol4X, 11, true);
  addText(bestCPM !== null ? formatCPM(bestCPM) : '—', vouchCol5X, 11, true, [109, 99, 255]);
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
      const orderStatus = order.status.replace(/_/g, ' ').toUpperCase();
      const orderAmount = formatCurrency(order.order_total || 0);
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

  // Audience Insights Section with Charts
  checkPageBreak(80);
  addLine();
  y += 8;
  addText('Audience Insights', margin, 12, true, [60, 60, 60]);
  y += 15;

  const audienceData = mockAudienceData[influencer.id] || defaultAudienceData;

  // Top Countries Bar Chart
  addText('Top Countries', margin, 10, true, [80, 80, 80]);
  y += 8;
  const countriesData = audienceData.location.map(l => ({ label: l.country, value: l.percentage }));
  y = drawBarChart(doc, countriesData, margin, y, contentWidth / 2 - 10);
  y += 10;

  // Top Cities Bar Chart
  checkPageBreak(70);
  addText('Top Cities', margin, 10, true, [80, 80, 80]);
  y += 8;
  const citiesData = audienceData.cities.map(c => ({ label: c.city, value: c.percentage }));
  y = drawBarChart(doc, citiesData, margin, y, contentWidth / 2 - 10);
  y += 10;

  // Languages Bar Chart
  checkPageBreak(60);
  addText('Languages', margin, 10, true, [80, 80, 80]);
  y += 8;
  const languagesData = audienceData.languages.map(l => ({ label: l.language, value: l.percentage }));
  y = drawBarChart(doc, languagesData, margin, y, contentWidth / 2 - 10);
  y += 10;

  // Age Distribution Bar Chart
  checkPageBreak(60);
  addText('Age Distribution', margin, 10, true, [80, 80, 80]);
  y += 8;
  const ageData = audienceData.age.map(a => ({ label: a.range, value: a.percentage }));
  y = drawBarChart(doc, ageData, margin, y, contentWidth / 2 - 10);
  y += 10;

  // Gender Pie Chart
  checkPageBreak(60);
  addText('Gender Distribution', margin, 10, true, [80, 80, 80]);
  y += 8;
  
  const genderData = audienceData.gender.map(g => ({
    label: g.type,
    value: g.percentage,
    color: g.type === 'Female' ? chartColors.female : chartColors.male
  }));
  
  const pieRadius = 20;
  const pieCenterX = margin + pieRadius + 10;
  const pieCenterY = y + pieRadius;
  
  drawPieChart(doc, genderData, pieCenterX, pieCenterY, pieRadius);
  drawPieChartLegend(doc, genderData, pieCenterX + pieRadius + 15, y + 10);
  
  y += pieRadius * 2 + 10;

  // Interests
  checkPageBreak(30);
  addText('Interests', margin, 10, true, [80, 80, 80]);
  y += 8;
  
  // Draw interest tags
  let tagX = margin;
  const tagHeight = 7;
  const tagPadding = 4;
  
  for (const interest of audienceData.interests) {
    const textWidth = doc.getTextWidth(interest) + tagPadding * 2;
    
    if (tagX + textWidth > pageWidth - margin) {
      tagX = margin;
      y += tagHeight + 4;
    }
    
    // Tag background
    doc.setFillColor(237, 233, 254);
    doc.roundedRect(tagX, y - 5, textWidth, tagHeight, 2, 2, 'F');
    
    // Tag text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(109, 99, 255);
    doc.text(interest, tagX + tagPadding, y);
    
    tagX += textWidth + 6;
  }
  y += 12;

  // Credibility
  checkPageBreak(30);
  addText('Credibility', margin, 10, true, [80, 80, 80]);
  y += 8;
  addText('Authentic followers: 97% · Bot followers: 3%', margin, 9, false, [100, 100, 100]);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by Vouch · vouch.io', margin, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  }

  // Save
  const filename = `vouch-influencer-${influencer.full_name?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

// Analytics Report Export
export interface AnalyticsReportData {
  timeframe: string;
  dateRange: { from: Date; to: Date };
  // Gift Metrics
  totalGifts: number;
  totalItems: number;
  retailValue: number;
  cogs: number;
  actualizedSpend: number;
  charged: number;
  avgRetailValue: number;
  avgCogs: number;
  // Post Performance
  totalPosts: number;
  postRate: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgEngagement: number;
  avgCpm: number;
  // Influencer Metrics
  uniqueCreators: number;
  totalFollowers: number;
  avgFollowers: number;
  avgEngagementRate: number;
  instagramCreators: number;
  tiktokCreators: number;
  // Order Status
  statusData: { name: string; value: number }[];
  // Top Influencers
  topInfluencers: { name: string; platform: string; category: string; views: number }[];
  // Top Products
  topProducts: { name: string; count: number; value: number }[];
  // Audience Insights
  audienceInsights: {
    countries: { country: string; percentage: number }[];
    cities: { city: string; percentage: number }[];
    languages: { language: string; percentage: number }[];
    ageRanges: { range: string; percentage: number }[];
    gender: { type: string; percentage: number }[];
    interests: string[];
  };
}

export async function exportAnalyticsToPDF(data: AnalyticsReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;
  let pageNum = 1;
  
  // Load logo
  const logo = await loadLogo();
  
  // Helper to check page break and add new page if needed
  const checkPageBreak = (neededSpace: number): boolean => {
    if (y + neededSpace > pageHeight - 25) {
      doc.addPage();
      pageNum++;
      y = 20;
      return true;
    }
    return false;
  };

  const addText = (text: string, x: number, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, x, y);
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
    doc.addImage(logo, 'PNG', margin, y - 3, logoWidth, logoHeight);
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
  addText(formatCurrency(data.retailValue), col3X, 13, true);
  addText(formatCurrency(data.cogs), col4X, 13, true);
  y += 10;

  // Row 2
  addText('Actualized Spend', col1X, 9, false, [100, 100, 100]);
  addText('Charged', col2X, 9, false, [100, 100, 100]);
  addText('Avg Retail Value', col3X, 9, false, [100, 100, 100]);
  addText('Avg COGS', col4X, 9, false, [100, 100, 100]);
  y += 6;
  addText(formatCurrency(data.actualizedSpend), col1X, 13, true);
  addText(formatCurrency(data.charged), col2X, 13, true);
  addText(formatCurrency(data.avgRetailValue), col3X, 13, true);
  addText(formatCurrency(data.avgCogs), col4X, 13, true);
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
  addText(`${data.postRate.toFixed(0)}%`, col2X, 13, true);
  addText(formatNumber(data.totalViews), col3X, 13, true);
  addText(formatCPM(data.avgCpm), col4X, 13, true, [109, 99, 255]);
  y += 10;

  addText('Total Likes', col1X, 9, false, [100, 100, 100]);
  addText('Total Comments', col2X, 9, false, [100, 100, 100]);
  addText('Avg Engagement', col3X, 9, false, [100, 100, 100]);
  y += 6;
  addText(formatNumber(data.totalLikes), col1X, 13, true);
  addText(formatNumber(data.totalComments), col2X, 13, true);
  addText(`${data.avgEngagement.toFixed(2)}%`, col3X, 13, true);
  y += 15;

  // Influencer Metrics Section
  checkPageBreak(60);
  addLine();
  y += 8;
  addText('Influencer Metrics', margin, 12, true, [80, 80, 80]);
  y += 10;

  addText('Unique Creators', col1X, 9, false, [100, 100, 100]);
  addText('Total Followers', col2X, 9, false, [100, 100, 100]);
  addText('Avg Followers', col3X, 9, false, [100, 100, 100]);
  addText('Avg ER', col4X, 9, false, [100, 100, 100]);
  y += 6;
  addText(data.uniqueCreators.toString(), col1X, 13, true);
  addText(formatNumber(data.totalFollowers), col2X, 13, true);
  addText(formatNumber(data.avgFollowers), col3X, 13, true);
  addText(`${data.avgEngagementRate.toFixed(1)}%`, col4X, 13, true);
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
  addText('Top Influencers', margin, 12, true, [80, 80, 80]);
  y += 10;

  if (data.topInfluencers.length === 0) {
    addText('No influencer data available', margin, 10, false, [150, 150, 150]);
    y += 8;
  } else {
    for (let i = 0; i < Math.min(data.topInfluencers.length, 5); i++) {
      const inf = data.topInfluencers[i];
      addText(`${i + 1}. ${inf.name}`, margin, 10, true, [60, 60, 60]);
      y += 5;
      addText(`${inf.platform} · ${inf.category} · ${formatNumber(inf.views)} views`, margin + 5, 9, false, [100, 100, 100]);
      y += 7;
    }
  }
  y += 5;

  // Top Products
  checkPageBreak(60);
  addLine();
  y += 8;
  addText('Top Products', margin, 12, true, [80, 80, 80]);
  y += 10;

  if (data.topProducts.length === 0) {
    addText('No product data available', margin, 10, false, [150, 150, 150]);
    y += 8;
  } else {
    for (let i = 0; i < Math.min(data.topProducts.length, 5); i++) {
      const prod = data.topProducts[i];
      addText(`${i + 1}. ${prod.name}`, margin, 10, true, [60, 60, 60]);
      y += 5;
      addText(`${prod.count} units · ${formatCurrency(prod.value)}`, margin + 5, 9, false, [100, 100, 100]);
      y += 7;
    }
  }
  y += 5;

  // Audience Insights
  checkPageBreak(80);
  addLine();
  y += 8;
  addText('Audience Insights', margin, 12, true, [80, 80, 80]);
  y += 10;

  // Countries
  addText('Top Countries', margin, 10, true, [80, 80, 80]);
  y += 6;
  for (const country of data.audienceInsights.countries.slice(0, 5)) {
    addText(`${country.country}: ${country.percentage}%`, margin, 9, false, [100, 100, 100]);
    y += 5;
  }
  y += 8;

  // Demographics
  checkPageBreak(40);
  addText('Demographics', margin, 10, true, [80, 80, 80]);
  y += 6;
  for (const age of data.audienceInsights.ageRanges) {
    addText(`${age.range}: ${age.percentage}%`, margin, 9, false, [100, 100, 100]);
    y += 5;
  }
  y += 4;
  for (const gender of data.audienceInsights.gender) {
    addText(`${gender.type}: ${gender.percentage}%`, margin, 9, false, [100, 100, 100]);
    y += 5;
  }
  y += 8;

  // Interests
  checkPageBreak(30);
  addText('Top Interests', margin, 10, true, [80, 80, 80]);
  y += 6;
  addText(data.audienceInsights.interests.join(', '), margin, 9, false, [100, 100, 100]);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by Vouch · vouch.io', margin, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  }

  // Save
  const filename = `vouch-analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}
