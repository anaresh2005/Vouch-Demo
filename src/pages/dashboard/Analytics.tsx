import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Sparkles, Gift, CheckCircle, AlertCircle, DollarSign, CalendarIcon, Package, Users, ShoppingBag, TrendingUp, TrendingDown, Link2, Clock, Info, CircleDollarSign, Eye, Heart, MessageCircle, BarChart3, Instagram, Globe, Languages, UserCircle, Star, Tags, Crown, Award, Medal, Download, ExternalLink, Zap, ChevronDown, ChevronRight, BarChart2 } from 'lucide-react';
import { mockOrders, mockPosts, mockInfluencers, getTopProducts, mockBrand } from '@/lib/mockData';
import { TikTokIcon } from '@/components/icons/TikTokIcon';
import { calculatePostCPM, formatCPM, calculatePostEMV, formatEMV, isTopPerformer, hasPostedForVouch } from '@/lib/cpmUtils';
import { useEMVSettings } from '@/hooks/useEMVSettings';
import { usePriorityMetric } from '@/hooks/usePriorityMetric';
import { Link, useNavigate } from 'react-router-dom';
import { VerifiedInfluencerAvatar } from '@/components/dashboard/VerifiedInfluencerAvatar';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid, Area, AreaChart, ReferenceLine } from 'recharts';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { getCachedModashData } from '@/lib/modashCache';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay, differenceInDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTimeframe, Timeframe } from '@/hooks/useTimeframe';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MetricCardWithChart } from '@/components/dashboard/MetricCardWithChart';
import { DualMetricCard } from '@/components/dashboard/DualMetricCard';
import { BoxWhiskerPlot, calculateBoxPlotStats, BoxPlotStats } from '@/components/dashboard/BoxWhiskerPlot';
import { exportAnalyticsToPDF, AnalyticsReportData } from '@/lib/pdfExport';
import { exportAnalyticsToMarkdown } from '@/lib/markdownExport';
import { ExportDropdown } from '@/components/dashboard/ExportDropdown';
import { calculateAllAttributions, getMockSalesData, getProductSalesTimeline, formatAttribution, ATTRIBUTION_DEFAULTS } from '@/lib/attributionUtils';

type TimeframeOption = Timeframe;

interface AudienceData {
  location: { country: string; percentage: number }[];
  cities: { city: string; percentage: number }[];
  languages: { language: string; percentage: number }[];
  age: { range: string; percentage: number }[];
  gender: { type: string; percentage: number }[];
  interests: string[];
  peakActivity: string;
}

// Mock audience data - in production this would come from the influencer record
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
    peakActivity: 'Weekdays 6-9 PM EST',
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
    peakActivity: 'Evenings 8-11 PM EST',
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
    peakActivity: 'Mornings 6-9 AM EST',
  },
  'inf-4': {
    location: [
      { country: 'United States', percentage: 45 },
      { country: 'Mexico', percentage: 9 },
      { country: 'Brazil', percentage: 7 },
      { country: 'Canada', percentage: 3 },
      { country: 'India', percentage: 2 },
    ],
    cities: [
      { city: 'Los Angeles', percentage: 3 },
      { city: 'New York City', percentage: 2 },
      { city: 'Mexico City', percentage: 2 },
      { city: 'São Paulo', percentage: 1 },
      { city: 'Chicago', percentage: 1 },
    ],
    languages: [
      { language: 'English', percentage: 70 },
      { language: 'Spanish', percentage: 21 },
      { language: 'Portuguese', percentage: 7 },
      { language: 'French', percentage: 1 },
    ],
    age: [
      { range: '18-24', percentage: 29 },
      { range: '25-34', percentage: 48 },
      { range: '35-44', percentage: 16 },
    ],
    gender: [
      { type: 'Male', percentage: 68 },
      { type: 'Female', percentage: 32 },
    ],
    interests: ['Sports', 'Activewear', 'Travel', 'Fitness & Yoga', 'Healthy Lifestyle'],
    peakActivity: 'Weekdays 5-8 PM EST',
  },
  'inf-5': {
    location: [
      { country: 'United States', percentage: 66 },
      { country: 'India', percentage: 5 },
      { country: 'United Kingdom', percentage: 5 },
      { country: 'Brazil', percentage: 3 },
      { country: 'United Arab Emirates', percentage: 2 },
    ],
    cities: [
      { city: 'Los Angeles', percentage: 15 },
      { city: 'New York City', percentage: 6 },
      { city: 'Miami', percentage: 5 },
      { city: 'New Orleans', percentage: 3 },
      { city: 'Gothenburg', percentage: 2 },
    ],
    languages: [
      { language: 'English', percentage: 90 },
      { language: 'Portuguese', percentage: 4 },
      { language: 'Spanish', percentage: 4 },
      { language: 'Arabic', percentage: 1 },
    ],
    age: [
      { range: '18-24', percentage: 20 },
      { range: '25-34', percentage: 45 },
      { range: '35-44', percentage: 28 },
    ],
    gender: [
      { type: 'Male', percentage: 72 },
      { type: 'Female', percentage: 28 },
    ],
    interests: ['Shopping & Retail', 'Coffee & Beverages', 'Sports', 'Fitness & Yoga', 'Healthy Lifestyle'],
    peakActivity: 'Weekdays 7-10 PM EST',
  },
  'inf-6': {
    location: [
      { country: 'United States', percentage: 90 },
      { country: 'Canada', percentage: 1 },
      { country: 'Australia', percentage: 1 },
      { country: 'Germany', percentage: 1 },
      { country: 'South Africa', percentage: 1 },
    ],
    cities: [
      { city: 'Los Angeles', percentage: 4 },
      { city: 'Phoenix', percentage: 2 },
      { city: 'New York City', percentage: 2 },
      { city: 'Atlanta', percentage: 2 },
      { city: 'Fort Worth', percentage: 1 },
    ],
    languages: [
      { language: 'English', percentage: 96 },
      { language: 'Spanish', percentage: 1 },
      { language: 'French', percentage: 1 },
      { language: 'Arabic', percentage: 1 },
    ],
    age: [
      { range: '18-24', percentage: 46 },
      { range: '25-34', percentage: 35 },
      { range: '35-44', percentage: 5 },
    ],
    gender: [
      { type: 'Male', percentage: 60 },
      { type: 'Female', percentage: 40 },
    ],
    interests: ['Coffee & Beverages', 'Healthy Lifestyle', 'Faith', 'Fitness'],
    peakActivity: 'Evenings 7-10 PM EST',
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
  peakActivity: 'Evenings 6-9 PM EST',
};

// Custom tooltip for pie charts that matches app design
const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string; color?: string } }> }) => {
  if (active && payload && payload.length) {
    const fillValue = payload[0].payload.fill;
    const customColor = payload[0].payload.color;
    
    // Use custom color if provided, otherwise try to extract from gradient or use fallback
    let displayColor = customColor;
    if (!displayColor) {
      // Check if fill is a gradient URL and map to fallback color
      if (fillValue?.startsWith('url(#')) {
        const gradientId = fillValue.replace('url(#', '').replace(')', '');
        // Map gradient IDs to their fallback colors
        const gradientColorMap: Record<string, string> = {
          'inTransitGradient2': 'hsl(217, 91%, 60%)',
          'postingGradient2': 'hsl(43, 96%, 58%)',
          'postedGradient2': 'hsl(160, 84%, 39%)',
          'chargedGradient2': 'hsl(0, 84%, 65%)',
          'instagramGradient2': 'hsl(340, 82%, 55%)',
          'tiktokGradient2': 'hsl(170, 80%, 45%)',
          'femaleGradientAnalytics': 'hsl(340, 82%, 60%)',
          'maleGradientAnalytics': 'hsl(217, 91%, 60%)',
        };
        displayColor = gradientColorMap[gradientId] || '#888888';
      } else {
        displayColor = fillValue || '#888888';
      }
    }
    
    return (
      <div className="rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: displayColor }}
          />
          <span className="font-medium">{payload[0].name}:</span>
          <span>{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const navigate = useNavigate();
  const { timeframe, setTimeframe, customDateRange, setCustomDateRange } = useTimeframe();
  const { settings: emvSettings } = useEMVSettings();
  const { getMetricColor, priorityMetric } = usePriorityMetric();
  const [giftMetricsInfoOpen, setGiftMetricsInfoOpen] = useState(false);
  const salesChartRef = useRef<HTMLDivElement>(null);
  const [salesChartDimensions, setSalesChartDimensions] = useState<{ width: number; left: number; yAxisWidth: number } | null>(null);

  // Measure the sales chart container so we can position clickable overlays
  useEffect(() => {
    const el = salesChartRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSalesChartDimensions({ width: rect.width, left: rect.left, yAxisWidth: 32 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Section collapse state
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [chartsHidden, setChartsHidden] = useState<Record<string, boolean>>({ gift: true, posts: true, influencers: true, spike: true });
  const toggleCollapse = useCallback((key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] })), []);
  const toggleCharts = useCallback((key: string) => setChartsHidden(prev => ({ ...prev, [key]: !prev[key] })), []);

  // Determine chart type based on timeframe: bars for 7d, lines for 30d+
  const chartType = useMemo(() => {
    if (timeframe === '7d') return 'bar' as const;
    if (timeframe === 'custom' && customDateRange.from && customDateRange.to) {
      const daysDiff = differenceInDays(customDateRange.to, customDateRange.from);
      return daysDiff <= 7 ? 'bar' as const : 'line' as const;
    }
    return 'line' as const;
  }, [timeframe, customDateRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (timeframe) {
      case '7d':
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case '30d':
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      case '90d':
        return { from: startOfDay(subDays(now, 90)), to: endOfDay(now) };
      case '365d':
        return { from: startOfDay(subDays(now, 365)), to: endOfDay(now) };
      case 'custom':
        return { 
          from: customDateRange.from ? startOfDay(customDateRange.from) : undefined, 
          to: customDateRange.to ? endOfDay(customDateRange.to) : undefined 
        };
      case 'lifetime':
      default:
        return { from: undefined, to: undefined };
    }
  };

  const getPreviousDateRange = () => {
    const now = new Date();
    switch (timeframe) {
      case '7d':
        return { from: startOfDay(subDays(now, 14)), to: endOfDay(subDays(now, 8)) };
      case '30d':
        return { from: startOfDay(subDays(now, 60)), to: endOfDay(subDays(now, 31)) };
      case '90d':
        return { from: startOfDay(subDays(now, 180)), to: endOfDay(subDays(now, 91)) };
      case '365d':
        return { from: startOfDay(subDays(now, 730)), to: endOfDay(subDays(now, 366)) };
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          const daysDiff = differenceInDays(customDateRange.to, customDateRange.from) + 1;
          return { 
            from: startOfDay(subDays(customDateRange.from, daysDiff)), 
            to: endOfDay(subDays(customDateRange.from, 1))
          };
        }
        return { from: undefined, to: undefined };
      case 'lifetime':
      default:
        return { from: undefined, to: undefined };
    }
  };

  const dateRange = getDateRange();
  const previousDateRange = getPreviousDateRange();

  const filteredOrders = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return mockOrders;
    
    return mockOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (dateRange.from && orderDate < dateRange.from) return false;
      if (dateRange.to && orderDate > dateRange.to) return false;
      return true;
    });
  }, [timeframe, customDateRange]);

  const previousOrders = useMemo(() => {
    if (!previousDateRange.from && !previousDateRange.to) return [];
    
    return mockOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (previousDateRange.from && orderDate < previousDateRange.from) return false;
      if (previousDateRange.to && orderDate > previousDateRange.to) return false;
      return true;
    });
  }, [timeframe, customDateRange]);

  const filteredPosts = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return mockPosts;
    
    return mockPosts.filter(post => {
      const postDate = new Date(post.detected_at);
      if (dateRange.from && postDate < dateRange.from) return false;
      if (dateRange.to && postDate > dateRange.to) return false;
      return true;
    });
  }, [timeframe, customDateRange]);

  const previousPosts = useMemo(() => {
    if (!previousDateRange.from && !previousDateRange.to) return [];
    
    return mockPosts.filter(post => {
      const postDate = new Date(post.detected_at);
      if (previousDateRange.from && postDate < previousDateRange.from) return false;
      if (previousDateRange.to && postDate > previousDateRange.to) return false;
      return true;
    });
  }, [timeframe, customDateRange]);

  const stats = useMemo(() => {
    const statusCounts = {
      pending_delivery: 0,
      delivered: 0,
      post_pending: 0,
      post_verified: 0,
      charged: 0,
      completed: 0,
    };

    filteredOrders.forEach(order => {
      statusCounts[order.status]++;
    });

    const totalOrders = filteredOrders.length;
    const uniqueCreators = new Set(filteredOrders.map(o => o.influencer_id)).size;
    const totalItems = filteredOrders.reduce((sum, o) => sum + (o.items_count || 0), 0);
    const retailValue = filteredOrders.reduce((sum, o) => sum + o.order_total, 0);
    const totalCogs = filteredOrders.reduce((sum, o) => sum + (o.cogs || 0), 0);
    const postsCount = filteredPosts.length;
    
    const chargedOrders = (() => {
      // Charged metrics should align with the Charged chart:
      // we bucket by when the charge occurred (charged_at), not when the order was created.
      if (!dateRange.from && !dateRange.to) {
        return mockOrders.filter(o => o.status === 'charged' && !!o.charged_at);
      }

      return mockOrders.filter(o => {
        if (o.status !== 'charged' || !o.charged_at) return false;
        const chargedDate = new Date(o.charged_at);
        if (dateRange.from && chargedDate < dateRange.from) return false;
        if (dateRange.to && chargedDate > dateRange.to) return false;
        return true;
      });
    })();

    const chargedCount = chargedOrders.length;
    const chargedAmount = chargedOrders.reduce((sum, o) => sum + o.order_total, 0);
    const chargedProportion = retailValue > 0 ? (chargedAmount / retailValue) * 100 : 0;

    // Total and Average charged amounts (retail + tax + shipping for charged orders)
    const totalCharged = chargedOrders.reduce(
      (sum, o) => sum + o.order_total + (o.sales_tax || 0) + (o.shipping_cost || 0),
      0
    );
    const avgCharged = chargedCount > 0 ? totalCharged / chargedCount : 0;
    
    const savedAmount = filteredOrders
      .filter(o => o.status === 'post_verified' || o.status === 'completed')
      .reduce((sum, o) => sum + o.order_total, 0);

    // Post rate: posted orders / (posted orders + charged orders) * 100
    // Posted = post_verified or completed, Charged = charged
    const postedOrders = filteredOrders.filter(o => 
      o.status === 'post_verified' || o.status === 'completed'
    );
    const postedCount = postedOrders.length;
    const completedCount = postedCount + chargedCount;
    const postRate = completedCount > 0 ? (postedCount / completedCount) * 100 : 0;

    // Actualized Gift Spend: COGS + tax + shipping for post_verified or post_pending orders
    const actualizedOrders = filteredOrders.filter(o => 
      o.status === 'post_verified' || o.status === 'post_pending' || o.status === 'completed'
    );
    const totalActualizedSpend = actualizedOrders.reduce((sum, o) => 
      sum + (o.cogs || 0) + (o.sales_tax || 0) + (o.shipping_cost || 0), 0
    );
    const avgActualizedSpend = actualizedOrders.length > 0 ? totalActualizedSpend / actualizedOrders.length : 0;

    const prevTotalOrders = previousOrders.length;
    const prevTotalItems = previousOrders.reduce((sum, o) => sum + (o.items_count || 0), 0);
    const prevRetailValue = previousOrders.reduce((sum, o) => sum + o.order_total, 0);
    const prevTotalCogs = previousOrders.reduce((sum, o) => sum + (o.cogs || 0), 0);
    const prevPostsCount = previousPosts.length;
    const prevChargedOrders = (() => {
      // Previous-period Charged metrics should also be based on charged_at
      if (!previousDateRange.from && !previousDateRange.to) return [];

      return mockOrders.filter(o => {
        if (o.status !== 'charged' || !o.charged_at) return false;
        const chargedDate = new Date(o.charged_at);
        if (previousDateRange.from && chargedDate < previousDateRange.from) return false;
        if (previousDateRange.to && chargedDate > previousDateRange.to) return false;
        return true;
      });
    })();
    const prevChargedCount = prevChargedOrders.length;
    const prevPostedOrders = previousOrders.filter(o => 
      o.status === 'post_verified' || o.status === 'completed'
    );
    const prevPostedCount = prevPostedOrders.length;
    const prevCompletedCount = prevPostedCount + prevChargedCount;
    const prevPostRate = prevCompletedCount > 0 ? (prevPostedCount / prevCompletedCount) * 100 : 0;
    
    // Previous period charged (retail + tax + shipping)
    const prevTotalCharged = prevChargedOrders.reduce(
      (sum, o) => sum + o.order_total + (o.sales_tax || 0) + (o.shipping_cost || 0),
      0
    );
    const prevAvgCharged = prevChargedCount > 0 ? prevTotalCharged / prevChargedCount : 0;

    // Previous period actualized spend
    const prevActualizedOrders = previousOrders.filter(o => 
      o.status === 'post_verified' || o.status === 'post_pending' || o.status === 'completed'
    );
    const prevTotalActualizedSpend = prevActualizedOrders.reduce((sum, o) => 
      sum + (o.cogs || 0) + (o.sales_tax || 0) + (o.shipping_cost || 0), 0
    );
    const prevAvgActualizedSpend = prevActualizedOrders.length > 0 ? prevTotalActualizedSpend / prevActualizedOrders.length : 0;

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const changes = {
      orders: calcChange(totalOrders, prevTotalOrders),
      items: calcChange(totalItems, prevTotalItems),
      retailValue: calcChange(retailValue, prevRetailValue),
      cogs: calcChange(totalCogs, prevTotalCogs),
      posts: calcChange(postsCount, prevPostsCount),
      postedCount: calcChange(postedCount, prevPostedCount),
      chargedCount: calcChange(chargedCount, prevChargedCount),
      postRate: postRate - prevPostRate,
      actualizedSpend: calcChange(totalActualizedSpend, prevTotalActualizedSpend),
      charged: calcChange(totalCharged, prevTotalCharged),
    };

    const hasPreviousData = timeframe !== 'lifetime' && (prevTotalOrders > 0 || prevPostsCount > 0);

    const statusData = [
      { name: 'In Transit', value: statusCounts.pending_delivery, color: 'hsl(217, 91%, 60%)', icon: Package, gradientId: 'inTransitGradient' },
      { name: 'Posting', value: statusCounts.post_pending + statusCounts.delivered, color: 'hsl(38, 92%, 50%)', icon: Clock, gradientId: 'postingGradient' },
      { name: 'Posted', value: statusCounts.post_verified, color: 'hsl(160, 84%, 39%)', icon: CheckCircle, gradientId: 'postedGradient' },
      { name: 'Charged', value: statusCounts.charged, color: 'hsl(347, 77%, 50%)', icon: CircleDollarSign, gradientId: 'chargedGradient' },
    ].filter(d => d.value > 0);

    const avgRetailValue = totalOrders > 0 ? retailValue / totalOrders : 0;
    const avgCogs = totalOrders > 0 ? totalCogs / totalOrders : 0;
    const avgItems = totalOrders > 0 ? totalItems / totalOrders : 0;

    const prevAvgRetailValue = prevTotalOrders > 0 ? prevRetailValue / prevTotalOrders : 0;
    const prevAvgCogs = prevTotalOrders > 0 ? prevTotalCogs / prevTotalOrders : 0;
    const prevAvgItems = prevTotalOrders > 0 ? prevTotalItems / prevTotalOrders : 0;

    const postsWithOrders = filteredPosts.filter(post => {
      const order = filteredOrders.find(o => o.id === post.order_id);
      return order?.delivered_at;
    });
    
    let avgTimeToPost = 0;
    if (postsWithOrders.length > 0) {
      const totalHours = postsWithOrders.reduce((sum, post) => {
        const order = filteredOrders.find(o => o.id === post.order_id);
        if (order?.delivered_at) {
          const deliveryDate = new Date(order.delivered_at);
          const postDate = new Date(post.detected_at);
          const diffHours = (postDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60);
          return sum + Math.max(0, diffHours);
        }
        return sum;
      }, 0);
      avgTimeToPost = totalHours / postsWithOrders.length;
    }

    const prevPostsWithOrders = previousPosts.filter(post => {
      const order = previousOrders.find(o => o.id === post.order_id);
      return order?.delivered_at;
    });
    
    let prevAvgTimeToPost = 0;
    if (prevPostsWithOrders.length > 0) {
      const prevTotalHours = prevPostsWithOrders.reduce((sum, post) => {
        const order = previousOrders.find(o => o.id === post.order_id);
        if (order?.delivered_at) {
          const deliveryDate = new Date(order.delivered_at);
          const postDate = new Date(post.detected_at);
          const diffHours = (postDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60);
          return sum + Math.max(0, diffHours);
        }
        return sum;
      }, 0);
      prevAvgTimeToPost = prevTotalHours / prevPostsWithOrders.length;
    }

    const avgChanges = {
      retailValue: calcChange(avgRetailValue, prevAvgRetailValue),
      cogs: calcChange(avgCogs, prevAvgCogs),
      items: calcChange(avgItems, prevAvgItems),
      timeToPost: calcChange(avgTimeToPost, prevAvgTimeToPost),
      actualizedSpend: calcChange(avgActualizedSpend, prevAvgActualizedSpend),
      charged: calcChange(avgCharged, prevAvgCharged),
    };

    // Post Metrics
    const totalViews = filteredPosts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalLikes = filteredPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalComments = filteredPosts.reduce((sum, p) => sum + (p.comments || 0), 0);
    const avgViews = postsCount > 0 ? totalViews / postsCount : 0;
    const avgLikes = postsCount > 0 ? totalLikes / postsCount : 0;
    const avgComments = postsCount > 0 ? totalComments / postsCount : 0;
    const avgEngagementRate = postsCount > 0 
      ? filteredPosts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / postsCount 
      : 0;
    
    // CPM calculation for posts
    const postsWithCPM = filteredPosts.map(post => {
      const order = filteredOrders.find(o => o.id === post.order_id);
      return { post, cpm: calculatePostCPM(post, order) };
    }).filter(p => p.cpm !== null);
    const avgCPM = postsWithCPM.length > 0 
      ? postsWithCPM.reduce((sum, p) => sum + (p.cpm || 0), 0) / postsWithCPM.length 
      : null;

    // EMV calculation for posts
    const avgEMV = filteredPosts.length > 0
      ? filteredPosts.reduce((sum, p) => sum + calculatePostEMV(p, emvSettings), 0) / filteredPosts.length
      : null;

    // Previous post metrics
    const prevTotalViews = previousPosts.reduce((sum, p) => sum + (p.views || 0), 0);
    const prevTotalLikes = previousPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const prevTotalComments = previousPosts.reduce((sum, p) => sum + (p.comments || 0), 0);
    const prevAvgViews = prevPostsCount > 0 ? prevTotalViews / prevPostsCount : 0;
    const prevAvgLikes = prevPostsCount > 0 ? prevTotalLikes / prevPostsCount : 0;
    const prevAvgComments = prevPostsCount > 0 ? prevTotalComments / prevPostsCount : 0;
    const prevAvgEngagementRate = prevPostsCount > 0 
      ? previousPosts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / prevPostsCount 
      : 0;
    const prevPostsWithCPM = previousPosts.map(post => {
      const order = previousOrders.find(o => o.id === post.order_id);
      return { post, cpm: calculatePostCPM(post, order) };
    }).filter(p => p.cpm !== null);
    const prevAvgCPM = prevPostsWithCPM.length > 0 
      ? prevPostsWithCPM.reduce((sum, p) => sum + (p.cpm || 0), 0) / prevPostsWithCPM.length 
      : null;
    const prevAvgEMV = previousPosts.length > 0
      ? previousPosts.reduce((sum, p) => sum + calculatePostEMV(p, emvSettings), 0) / previousPosts.length
      : null;

    const postMetricChanges = {
      views: calcChange(avgViews, prevAvgViews),
      likes: calcChange(avgLikes, prevAvgLikes),
      comments: calcChange(avgComments, prevAvgComments),
      engagementRate: calcChange(avgEngagementRate, prevAvgEngagementRate),
      cpm: avgCPM !== null && prevAvgCPM !== null ? calcChange(avgCPM, prevAvgCPM) : null,
      emv: avgEMV !== null && prevAvgEMV !== null ? calcChange(avgEMV, prevAvgEMV) : null,
    };

    const postTotalChanges = {
      views: calcChange(totalViews, prevTotalViews),
      likes: calcChange(totalLikes, prevTotalLikes),
      comments: calcChange(totalComments, prevTotalComments),
    };

    // Box plot stats for CPM, Engagement Rate, and EMV
    const cpmValues = postsWithCPM.map(p => p.cpm || 0).filter(v => v > 0);
    const cpmBoxStats = calculateBoxPlotStats(cpmValues);
    
    const engagementValues = filteredPosts.map(p => p.engagement_rate || 0).filter(v => v > 0);
    const engagementBoxStats = calculateBoxPlotStats(engagementValues);

    const emvValues = filteredPosts.map(p => calculatePostEMV(p, emvSettings)).filter(v => v > 0);
    const emvBoxStats = calculateBoxPlotStats(emvValues);
    const uniqueInfluencerIds = [...new Set(filteredOrders.map(o => o.influencer_id))];
    const influencersInOrders = uniqueInfluencerIds.map(id => mockInfluencers.find(inf => inf.id === id)).filter(Boolean);
    
    const totalFollowers = influencersInOrders.reduce((sum, inf) => {
      const igFollowers = inf?.instagram_followers || 0;
      const ttFollowers = inf?.tiktok_followers || 0;
      return sum + Math.max(igFollowers, ttFollowers);
    }, 0);
    const avgFollowers = influencersInOrders.length > 0 ? totalFollowers / influencersInOrders.length : 0;
    
    const avgEngagementRateInfluencer = influencersInOrders.length > 0 
      ? influencersInOrders.reduce((sum, inf) => {
          const igER = inf?.instagram_engagement_rate || 0;
          const ttER = inf?.tiktok_engagement_rate || 0;
          return sum + Math.max(igER, ttER);
        }, 0) / influencersInOrders.length 
      : 0;

    // Influencer box plot stats
    const influencerFollowerValues = influencersInOrders
      .map(inf => Math.max(inf?.instagram_followers || 0, inf?.tiktok_followers || 0))
      .filter(v => v > 0);
    const followersBoxStats = calculateBoxPlotStats(influencerFollowerValues);
    
    const influencerEngagementValues = influencersInOrders
      .map(inf => Math.max(inf?.instagram_engagement_rate || 0, inf?.tiktok_engagement_rate || 0))
      .filter(v => v > 0);
    const influencerEngagementBoxStats = calculateBoxPlotStats(influencerEngagementValues);

    // Top Creator Categories
    const categoryCount: Record<string, number> = {};
    influencersInOrders.forEach(inf => {
      const category = inf?.category || 'Other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    const topCreatorCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Platform breakdown
    const instagramOrders = filteredOrders.filter(o => o.platform === 'instagram').length;
    const tiktokOrders = filteredOrders.filter(o => o.platform === 'tiktok').length;
    const instagramPosts = filteredPosts.filter(p => p.platform === 'instagram').length;
    const tiktokPosts = filteredPosts.filter(p => p.platform === 'tiktok').length;
    
    // Platform distribution by unique creators
    const instagramCreators = new Set(filteredOrders.filter(o => o.platform === 'instagram').map(o => o.influencer_id)).size;
    const tiktokCreators = new Set(filteredOrders.filter(o => o.platform === 'tiktok').map(o => o.influencer_id)).size;
    const totalPlatformCreators = instagramCreators + tiktokCreators;
    const instagramCreatorShare = totalPlatformCreators > 0 ? (instagramCreators / totalPlatformCreators) * 100 : 0;
    const tiktokCreatorShare = totalPlatformCreators > 0 ? (tiktokCreators / totalPlatformCreators) * 100 : 0;

    // Previous influencer metrics
    const prevUniqueInfluencerIds = [...new Set(previousOrders.map(o => o.influencer_id))];
    const prevInfluencersInOrders = prevUniqueInfluencerIds.map(id => mockInfluencers.find(inf => inf.id === id)).filter(Boolean);
    const prevTotalFollowers = prevInfluencersInOrders.reduce((sum, inf) => {
      const igFollowers = inf?.instagram_followers || 0;
      const ttFollowers = inf?.tiktok_followers || 0;
      return sum + Math.max(igFollowers, ttFollowers);
    }, 0);
    const prevAvgFollowers = prevInfluencersInOrders.length > 0 ? prevTotalFollowers / prevInfluencersInOrders.length : 0;
    const prevAvgEngagementRateInfluencer = prevInfluencersInOrders.length > 0 
      ? prevInfluencersInOrders.reduce((sum, inf) => {
          const igER = inf?.instagram_engagement_rate || 0;
          const ttER = inf?.tiktok_engagement_rate || 0;
          return sum + Math.max(igER, ttER);
        }, 0) / prevInfluencersInOrders.length 
      : 0;

    const influencerChanges = {
      uniqueCreators: calcChange(uniqueInfluencerIds.length, prevUniqueInfluencerIds.length),
      totalFollowers: calcChange(totalFollowers, prevTotalFollowers),
      followers: calcChange(avgFollowers, prevAvgFollowers),
      engagementRate: calcChange(avgEngagementRateInfluencer, prevAvgEngagementRateInfluencer),
    };

    // Aggregate Audience Insights
    const audienceDataList = uniqueInfluencerIds.map(id => mockAudienceData[id] || defaultAudienceData);
    const numInfluencers = audienceDataList.length;

    // Aggregate countries (average percentages, top 5)
    const countryMap: Record<string, number> = {};
    audienceDataList.forEach(data => {
      data.location.forEach(loc => {
        countryMap[loc.country] = (countryMap[loc.country] || 0) + loc.percentage;
      });
    });
    const avgCountries = Object.entries(countryMap)
      .map(([country, total]) => ({ country, percentage: Math.round(total / numInfluencers) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Aggregate cities (average percentages, top 5)
    const cityMap: Record<string, number> = {};
    audienceDataList.forEach(data => {
      data.cities.forEach(c => {
        cityMap[c.city] = (cityMap[c.city] || 0) + c.percentage;
      });
    });
    const avgCities = Object.entries(cityMap)
      .map(([city, total]) => ({ city, percentage: Math.round(total / numInfluencers) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Aggregate languages (average percentages)
    const languageMap: Record<string, number> = {};
    audienceDataList.forEach(data => {
      data.languages.forEach(l => {
        languageMap[l.language] = (languageMap[l.language] || 0) + l.percentage;
      });
    });
    const avgLanguages = Object.entries(languageMap)
      .map(([language, total]) => ({ language, percentage: Math.round(total / numInfluencers) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4);

    // Aggregate age ranges (average percentages)
    const ageMap: Record<string, number> = {};
    audienceDataList.forEach(data => {
      data.age.forEach(a => {
        ageMap[a.range] = (ageMap[a.range] || 0) + a.percentage;
      });
    });
    const avgAgeRanges = Object.entries(ageMap)
      .map(([range, total]) => ({ range, percentage: Math.round(total / numInfluencers) }))
      .sort((a, b) => {
        const aStart = parseInt(a.range.split('-')[0]);
        const bStart = parseInt(b.range.split('-')[0]);
        return aStart - bStart;
      });

    // Aggregate gender (average percentages)
    const genderMap: Record<string, number> = {};
    audienceDataList.forEach(data => {
      data.gender.forEach(g => {
        genderMap[g.type] = (genderMap[g.type] || 0) + g.percentage;
      });
    });
    const avgGender = Object.entries(genderMap)
      .map(([type, total]) => ({ type, percentage: Math.round(total / numInfluencers) }))
      .sort((a, b) => b.percentage - a.percentage);

    // Aggregate interests (most common)
    const interestCount: Record<string, number> = {};
    audienceDataList.forEach(data => {
      data.interests.forEach(interest => {
        interestCount[interest] = (interestCount[interest] || 0) + 1;
      });
    });
    const topInterests = Object.entries(interestCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([interest]) => interest);

    const audienceInsights = {
      countries: avgCountries,
      cities: avgCities,
      languages: avgLanguages,
      ageRanges: avgAgeRanges,
      gender: avgGender,
      interests: topInterests,
    };

    // Influencer Leaderboard - ranked by total views from posts
    const influencerPerformance = uniqueInfluencerIds.map(id => {
      const influencer = mockInfluencers.find(inf => inf.id === id);
      const influencerPosts = filteredPosts.filter(p => p.influencer_id === id);
      const influencerOrders = filteredOrders.filter(o => o.influencer_id === id);
      const totalViews = influencerPosts.reduce((sum, p) => sum + (p.views || 0), 0);
      const totalLikes = influencerPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
      const totalComments = influencerPosts.reduce((sum, p) => sum + (p.comments || 0), 0);
      const avgEngagement = influencerPosts.length > 0 
        ? influencerPosts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / influencerPosts.length
        : 0;
      const postsCompleted = influencerPosts.length;
      const ordersCount = influencerOrders.length;
      
      return {
        id,
        name: influencer?.full_name || 'Unknown',
        username: influencer?.instagram_username || influencer?.tiktok_username || 'unknown',
        platform: influencer?.instagram_username ? 'instagram' : 'tiktok' as 'instagram' | 'tiktok',
        followers: Math.max(influencer?.instagram_followers || 0, influencer?.tiktok_followers || 0),
        category: (influencer as any)?.category || 'Creator',
        totalViews,
        totalLikes,
        totalComments,
        avgEngagement,
        postsCompleted,
        ordersCount,
      };
    })
    .filter(inf => inf.postsCompleted > 0)
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 5);

    // Spend breakdown for chart
    const spendBreakdown = [
      { name: 'Actualized', value: totalActualizedSpend, fill: 'url(#actualizedGradient)' },
      { name: 'Charged', value: totalCharged, fill: 'url(#chargedSpendGradient)' },
    ];

    // Generate time series data for charts - always daily intervals
    const generateTimeSeriesData = () => {
      if (!dateRange.from || !dateRange.to) {
        // For lifetime, use last 12 months with monthly intervals
        const now = new Date();
        const intervals = eachMonthOfInterval({
          start: subDays(now, 365),
          end: now
        });
        return intervals.map((date, idx) => {
          const monthStart = startOfMonth(date);
          const monthEnd = idx < intervals.length - 1 ? startOfMonth(intervals[idx + 1]) : now;
          return { start: monthStart, end: monthEnd, label: format(date, 'MMM') };
        });
      }

      const daysDiff = differenceInDays(dateRange.to, dateRange.from);
      
      // For 7d: daily with date labels
      if (daysDiff <= 7) {
        return eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
          .map(date => ({ 
            start: startOfDay(date), 
            end: endOfDay(date), 
            label: format(date, 'MMM d') // Jan 5, Jan 6...
          }));
      }
      
      // For 30d and longer: daily intervals with appropriate labels
      if (daysDiff <= 31) {
        return eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
          .map(date => ({ 
            start: startOfDay(date), 
            end: endOfDay(date), 
            label: format(date, 'd') // Just day number
          }));
      }
      
      if (daysDiff <= 90) {
        return eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
          .map(date => ({ 
            start: startOfDay(date), 
            end: endOfDay(date), 
            label: format(date, 'MMM d')
          }));
      }
      
      // For very long periods (365d+), use weekly intervals to avoid overcrowding
      return eachWeekOfInterval({ start: dateRange.from, end: dateRange.to })
        .map((date, idx, arr) => ({ 
          start: startOfWeek(date), 
          end: idx < arr.length - 1 ? startOfWeek(arr[idx + 1]) : dateRange.to!, 
          label: format(date, 'MMM d')
        }));
    };

    const timeIntervals = generateTimeSeriesData();

    // Helper to calculate metrics for a time period
    const getOrdersInPeriod = (start: Date, end: Date) => 
      filteredOrders.filter(o => {
        const d = new Date(o.created_at);
        return d >= start && d < end;
      });

    const getPostsInPeriod = (start: Date, end: Date) => 
      filteredPosts.filter(p => {
        const d = new Date(p.detected_at);
        return d >= start && d < end;
      });

    // Totals time series (bar charts)
    const ordersTrend = timeIntervals.map(({ start, end, label }) => ({
      date: start.toISOString(),
      label,
      value: getOrdersInPeriod(start, end).length
    }));

    const itemsTrend = timeIntervals.map(({ start, end, label }) => ({
      date: start.toISOString(),
      label,
      value: getOrdersInPeriod(start, end).reduce((sum, o) => sum + (o.items_count || 0), 0)
    }));

    const retailValueTrend = timeIntervals.map(({ start, end, label }) => ({
      date: start.toISOString(),
      label,
      value: getOrdersInPeriod(start, end).reduce((sum, o) => sum + o.order_total, 0)
    }));

    const cogsTrend = timeIntervals.map(({ start, end, label }) => ({
      date: start.toISOString(),
      label,
      value: getOrdersInPeriod(start, end).reduce((sum, o) => sum + (o.cogs || 0), 0)
    }));

    const actualizedSpendTrend = timeIntervals.map(({ start, end, label }) => {
      const orders = getOrdersInPeriod(start, end).filter(o => 
        o.status === 'post_verified' || o.status === 'post_pending' || o.status === 'completed'
      );
      return {
        date: start.toISOString(),
        label,
        value: orders.reduce((sum, o) => sum + (o.cogs || 0) + (o.sales_tax || 0) + (o.shipping_cost || 0), 0)
      };
    });

    const chargedTrend = timeIntervals.map(({ start, end, label }) => {
      // Filter ALL orders that were charged during this time period (using charged_at date)
      // We use mockOrders instead of filteredOrders because the order's created_at may be outside
      // the time range, but its charged_at date could fall within it
      const orders = mockOrders.filter(o => {
        if (o.status !== 'charged' || !o.charged_at) return false;
        const chargedDate = new Date(o.charged_at);
        return chargedDate >= start && chargedDate < end;
      });
      return {
        date: start.toISOString(),
        label,
        value: orders.reduce((sum, o) => sum + o.order_total + (o.sales_tax || 0) + (o.shipping_cost || 0), 0)
      };
    });

    // Averages time series (line charts)
    const avgRetailValueTrend = timeIntervals.map(({ start, end, label }) => {
      const orders = getOrdersInPeriod(start, end);
      const total = orders.reduce((sum, o) => sum + o.order_total, 0);
      return { date: start.toISOString(), label, value: orders.length > 0 ? total / orders.length : 0 };
    });

    const avgCogsTrend = timeIntervals.map(({ start, end, label }) => {
      const orders = getOrdersInPeriod(start, end);
      const total = orders.reduce((sum, o) => sum + (o.cogs || 0), 0);
      return { date: start.toISOString(), label, value: orders.length > 0 ? total / orders.length : 0 };
    });

    const avgItemsTrend = timeIntervals.map(({ start, end, label }) => {
      const orders = getOrdersInPeriod(start, end);
      const total = orders.reduce((sum, o) => sum + (o.items_count || 0), 0);
      return { date: start.toISOString(), label, value: orders.length > 0 ? total / orders.length : 0 };
    });

    const avgActualizedSpendTrend = timeIntervals.map(({ start, end, label }) => {
      const orders = getOrdersInPeriod(start, end).filter(o => 
        o.status === 'post_verified' || o.status === 'post_pending' || o.status === 'completed'
      );
      const total = orders.reduce((sum, o) => sum + (o.cogs || 0) + (o.sales_tax || 0) + (o.shipping_cost || 0), 0);
      return { date: start.toISOString(), label, value: orders.length > 0 ? total / orders.length : 0 };
    });

    const avgChargedTrend = timeIntervals.map(({ start, end, label }) => {
      const orders = getOrdersInPeriod(start, end).filter(o => o.status === 'charged');
      const total = orders.reduce((sum, o) => sum + o.order_total + (o.sales_tax || 0) + (o.shipping_cost || 0), 0);
      return { date: start.toISOString(), label, value: orders.length > 0 ? total / orders.length : 0 };
    });

    // Post metrics time series
    const viewsTrend = timeIntervals.map(({ start, end, label }) => ({
      date: start.toISOString(),
      label,
      value: getPostsInPeriod(start, end).reduce((sum, p) => sum + (p.views || 0), 0)
    }));

    const likesTrend = timeIntervals.map(({ start, end, label }) => ({
      date: start.toISOString(),
      label,
      value: getPostsInPeriod(start, end).reduce((sum, p) => sum + (p.likes || 0), 0)
    }));

    const commentsTrend = timeIntervals.map(({ start, end, label }) => ({
      date: start.toISOString(),
      label,
      value: getPostsInPeriod(start, end).reduce((sum, p) => sum + (p.comments || 0), 0)
    }));

    const avgViewsTrend = timeIntervals.map(({ start, end, label }) => {
      const posts = getPostsInPeriod(start, end);
      const total = posts.reduce((sum, p) => sum + (p.views || 0), 0);
      return { date: start.toISOString(), label, value: posts.length > 0 ? total / posts.length : 0 };
    });

    const avgLikesTrend = timeIntervals.map(({ start, end, label }) => {
      const posts = getPostsInPeriod(start, end);
      const total = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
      return { date: start.toISOString(), label, value: posts.length > 0 ? total / posts.length : 0 };
    });

    const avgCommentsTrend = timeIntervals.map(({ start, end, label }) => {
      const posts = getPostsInPeriod(start, end);
      const total = posts.reduce((sum, p) => sum + (p.comments || 0), 0);
      return { date: start.toISOString(), label, value: posts.length > 0 ? total / posts.length : 0 };
    });

    const avgEngagementTrend = timeIntervals.map(({ start, end, label }) => {
      const posts = getPostsInPeriod(start, end);
      const total = posts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0);
      return { date: start.toISOString(), label, value: posts.length > 0 ? total / posts.length : 0 };
    });

    return {
      totalOrders,
      uniqueCreators,
      totalItems,
      retailValue,
      totalCogs,
      postsCount,
      postedCount,
      postRate,
      chargedCount,
      chargedAmount,
      chargedProportion,
      savedAmount,
      statusData,
      changes,
      hasPreviousData,
      avgRetailValue,
      avgCogs,
      avgItems,
      avgTimeToPost,
      avgChanges,
      // Actualized spend
      totalActualizedSpend,
      avgActualizedSpend,
      // Charged (for orders that didn't post)
      totalCharged,
      avgCharged,
      // Post metrics
      totalViews,
      totalLikes,
      totalComments,
      avgViews,
      avgLikes,
      avgComments,
      avgEngagementRate,
      avgCPM,
      avgEMV,
      postMetricChanges,
      postTotalChanges,
      // Box plot stats
      cpmBoxStats,
      engagementBoxStats,
      emvBoxStats,
      followersBoxStats,
      influencerEngagementBoxStats,
      // Influencer metrics
      totalFollowers,
      avgFollowers,
      avgEngagementRateInfluencer,
      influencerChanges,
      // Platform breakdown
      instagramOrders,
      tiktokOrders,
      instagramPosts,
      tiktokPosts,
      // Platform distribution by creators
      instagramCreators,
      tiktokCreators,
      instagramCreatorShare,
      tiktokCreatorShare,
      // Audience insights
      audienceInsights,
      // Creator categories
      topCreatorCategories,
      // Leaderboard
      influencerPerformance,
      // Spend breakdown
      spendBreakdown,
      // Time series data for charts
      timeSeries: {
        // Totals (bar charts)
        orders: ordersTrend,
        items: itemsTrend,
        retailValue: retailValueTrend,
        cogs: cogsTrend,
        actualizedSpend: actualizedSpendTrend,
        charged: chargedTrend,
        views: viewsTrend,
        likes: likesTrend,
        comments: commentsTrend,
        // Averages (line charts)
        avgRetailValue: avgRetailValueTrend,
        avgCogs: avgCogsTrend,
        avgItems: avgItemsTrend,
        avgActualizedSpend: avgActualizedSpendTrend,
        avgCharged: avgChargedTrend,
        avgViews: avgViewsTrend,
        avgLikes: avgLikesTrend,
        avgComments: avgCommentsTrend,
        avgEngagement: avgEngagementTrend,
      },
    };
  }, [filteredOrders, filteredPosts, previousOrders, previousPosts, timeframe, emvSettings]);

  // ─── Attribution ───────────────────────────────────────────────────────────
  const salesData = useMemo(() => getMockSalesData(), []);

  // All available products that appear in attribution results
  const availableAttributionProducts = useMemo(() => {
    const attributions = calculateAllAttributions(mockPosts, mockOrders, salesData, ATTRIBUTION_DEFAULTS);
    const productMap = new Map<string, string>();
    attributions.forEach(a => {
      a.productIds.forEach((id, idx) => {
        if (!productMap.has(id)) productMap.set(id, a.productNames[idx]);
      });
    });
    return Array.from(productMap.entries()).map(([id, name]) => ({ id, name }));
  }, [salesData]);

  const [selectedAttributionProductId, setSelectedAttributionProductId] = useState<string>('7654321098768');

  const attributionData = useMemo(() => {
    const attributions = calculateAllAttributions(mockPosts, mockOrders, salesData, ATTRIBUTION_DEFAULTS);
    const spikedPosts = attributions.filter(a => a.spikeDetected);
    const totalAttributedRevenue = spikedPosts.reduce((s, a) => s + a.attributedRevenue, 0);

    // Top posts by attributed revenue
    const topPosts = [...spikedPosts]
      .sort((a, b) => b.attributedRevenue - a.attributedRevenue)
      .map(attr => {
        const post = mockPosts.find(p => p.id === attr.postId)!;
        const influencer = mockInfluencers.find(i => i.id === attr.influencerId);
        return { attr, post, influencer };
      });

    // Sales timeline for the selected product
    const salesTimeline = getProductSalesTimeline(selectedAttributionProductId, salesData, 30);

    // Post markers on the timeline (for posts that feature the selected product)
    const postMarkers = attributions
      .filter(a => a.productIds.includes(selectedAttributionProductId) && a.spikeDetected)
      .map(a => {
        const post = mockPosts.find(p => p.id === a.postId)!;
        const dayDate = new Date(post.detected_at).toISOString().slice(0, 10);
        const influencer = mockInfluencers.find(i => i.id === a.influencerId);
        return { date: dayDate, influencerId: a.influencerId, postId: a.postId, orderId: post.order_id, label: salesTimeline.find(d => d.date === dayDate)?.label, influencerName: influencer?.full_name || 'Unknown' };
      });

    return { attributions, totalAttributedRevenue, topPosts, salesTimeline, postMarkers, topProductId: selectedAttributionProductId };
  }, [salesData, selectedAttributionProductId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };


  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const ChangeIndicator = ({ change }: { change: number }) => {
    if (!stats.hasPreviousData) return null;
    const isUp = change > 0;
    const isDown = change < 0;
    const absChange = Math.abs(change);
    const roundedChange = Math.round(absChange);
    
    if (roundedChange === 0) return <span className="text-[10px] flex items-center text-muted-foreground">0%</span>;
    
    return (
      <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
        {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : isDown ? <TrendingDown className="w-2.5 h-2.5" /> : null}
        {absChange > 999 ? '>999%' : `${absChange.toFixed(0)}%`}
      </span>
    );
  };

  const getReportData = (): AnalyticsReportData => {
    const topProducts = getTopProducts(filteredOrders, 5);
    
    return {
      timeframe: timeframe === '7d' ? 'Last 7 Days' : 
                 timeframe === '30d' ? 'Last 30 Days' : 
                 timeframe === '90d' ? 'Last 90 Days' : 
                 timeframe === '365d' ? 'Last 365 Days' : 
                 timeframe === 'lifetime' ? 'All Time' : 'Custom Range',
      dateRange: { 
        from: customDateRange.from || subDays(new Date(), 30), 
        to: customDateRange.to || new Date() 
      },
      // Gift Metrics
      totalGifts: stats.totalOrders,
      totalItems: stats.totalItems,
      retailValue: stats.retailValue,
      cogs: stats.totalCogs,
      actualizedSpend: stats.avgActualizedSpend * stats.totalOrders,
      charged: stats.chargedAmount,
      avgRetailValue: stats.avgRetailValue,
      avgCogs: stats.avgCogs,
      // Post Performance
      totalPosts: stats.postsCount,
      postRate: stats.postRate,
      totalViews: stats.totalViews,
      totalLikes: stats.totalLikes,
      totalComments: stats.totalComments,
      avgEngagement: stats.avgEngagementRate,
      avgCpm: stats.avgCPM,
      // Influencer Metrics
      uniqueCreators: stats.uniqueCreators,
      totalFollowers: stats.totalFollowers,
      avgFollowers: stats.avgFollowers,
      avgEngagementRate: stats.avgEngagementRateInfluencer,
      instagramCreators: stats.instagramCreators,
      tiktokCreators: stats.tiktokCreators,
      // Order Status
      statusData: stats.statusData.map(s => ({ name: s.name, value: s.value })),
      // Top Influencers
      topInfluencers: stats.influencerPerformance.slice(0, 5).map(inf => ({
        name: inf.name,
        platform: inf.platform.charAt(0).toUpperCase() + inf.platform.slice(1),
        category: inf.category,
        views: inf.totalViews
      })),
      // Top Products
      topProducts: topProducts.map(p => ({
        name: p.name,
        count: p.count,
        value: p.totalValue
      })),
      // Audience Insights
      audienceInsights: {
        countries: stats.audienceInsights.countries,
        cities: stats.audienceInsights.cities,
        languages: stats.audienceInsights.languages,
        ageRanges: stats.audienceInsights.ageRanges,
        gender: stats.audienceInsights.gender,
        interests: stats.audienceInsights.interests
      }
    };
  };

  const handleExportPDF = async () => {
    await exportAnalyticsToPDF(getReportData());
  };

  const handleExportMarkdown = () => {
    exportAnalyticsToMarkdown(getReportData());
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header with Timeframe Selector */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-display font-medium text-foreground">
              Analytics
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground font-body">
                Understand the impact of your influencer gifts.
              </p>
              <ExportDropdown
                onExportPDF={handleExportPDF}
                onExportMarkdown={handleExportMarkdown}
                variant="ghost"
                size="sm"
                showLabel
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <ToggleGroup 
              type="single" 
              value={timeframe} 
              onValueChange={(value) => value && setTimeframe(value as TimeframeOption)}
              className="bg-background/90 backdrop-blur-md p-0.5 rounded-md shadow-sm border border-border flex-shrink-0 h-7"
            >
              <ToggleGroupItem 
                value="7d" 
                className="px-2.5 h-6 text-xs data-[state=on]:vouch-gradient data-[state=on]:text-white min-w-[2rem]"
              >
                7d
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="30d" 
                className="px-2.5 h-6 text-xs data-[state=on]:vouch-gradient data-[state=on]:text-white min-w-[2rem]"
              >
                30d
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="90d" 
                className="px-2.5 h-6 text-xs data-[state=on]:vouch-gradient data-[state=on]:text-white min-w-[2rem]"
              >
                90d
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="365d" 
                className="px-2.5 h-6 text-xs data-[state=on]:vouch-gradient data-[state=on]:text-white min-w-[2rem]"
              >
                365d
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="lifetime" 
                className="px-2.5 h-6 text-xs data-[state=on]:vouch-gradient data-[state=on]:text-white"
              >
                All time
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="custom" 
                className="px-2.5 h-6 text-xs data-[state=on]:vouch-gradient data-[state=on]:text-white"
              >
                Custom
              </ToggleGroupItem>
            </ToggleGroup>
            {timeframe === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-7 justify-start text-left text-xs", !customDateRange.from && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.from ? (
                      customDateRange.to ? (
                        <>
                          {format(customDateRange.from, "MMM d")} - {format(customDateRange.to, "MMM d")}
                        </>
                      ) : (
                        format(customDateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      "Pick dates"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={customDateRange.from}
                    selected={{ from: customDateRange.from, to: customDateRange.to }}
                    onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={1}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>


        {/* Gift Metrics - Combined Totals & Averages */}
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-3">
            <div className="flex items-center gap-1">
              <button onClick={() => toggleCollapse('gift')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                {collapsed['gift'] ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                <h4 className="text-sm font-normal text-foreground">Gift Metrics</h4>
              </button>
              <Dialog open={giftMetricsInfoOpen} onOpenChange={setGiftMetricsInfoOpen}>
                <DialogTrigger asChild>
                  <button className="p-0.5 rounded hover:bg-muted transition-colors">
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Gift Metrics Explained</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <p className="text-muted-foreground text-xs italic">
                      Charts display totals over time, not averages.
                    </p>
                    <div className="space-y-1">
                      <span className="font-normal">Orders & Items</span>
                      <p className="text-muted-foreground">
                        Total gift orders placed and individual items gifted to influencers.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-normal">Retail Value</span>
                      <p className="text-muted-foreground">
                        Combined retail value of all products gifted.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-normal">COGS</span>
                      <p className="text-muted-foreground">
                        Total cost of goods sold for all gifted products.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-normal">Actualized Spend</span>
                      <p className="text-muted-foreground">
                        Cost (COGS + tax + shipping) for orders where posts are verified or pending.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-normal">Charged</span>
                      <p className="text-muted-foreground">
                        Amount charged to influencers for orders where they didn't post.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-normal">Post Rate</span>
                      <p className="text-muted-foreground">
                        Percentage of completed orders (posted or charged) that resulted in a verified post.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-normal">Time to Post</span>
                      <p className="text-muted-foreground">
                        Average time between delivery and post detection.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {!collapsed['gift'] && (
              <button onClick={() => toggleCharts('gift')} className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <BarChart2 className="w-3 h-3" />
                <span className="text-[10px]">{chartsHidden['gift'] ? 'Show charts' : 'Hide charts'}</span>
              </button>
            )}
          </div>

          {!collapsed['gift'] && <div className="space-y-2">
                {/* Main Metrics Row */}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <DualMetricCard
                      icon={<ShoppingBag className="w-3 h-3" />}
                      label="Orders"
                      totalValue={stats.totalOrders}
                      totalChange={<ChangeIndicator change={stats.changes.orders} />}
                      totalChartData={stats.timeSeries.orders}
                      formatValue={(v) => v.toLocaleString()}
                      chartType={chartType}
                      hideChart={chartsHidden['gift']}
                    />
                    <DualMetricCard
                      icon={<Package className="w-3 h-3" />}
                      label="Items"
                      totalValue={stats.totalItems}
                      avgValue={`~${Math.round(stats.avgItems)}`}
                      totalChange={<ChangeIndicator change={stats.changes.items} />}
                      totalChartData={stats.timeSeries.items}
                      formatValue={(v) => v.toLocaleString()}
                      chartType={chartType}
                      hideChart={chartsHidden['gift']}
                    />
                    <DualMetricCard
                      icon={<DollarSign className="w-3 h-3" />}
                      label="Retail Value"
                      totalValue={formatCurrency(stats.retailValue)}
                      avgValue={formatCurrency(stats.avgRetailValue)}
                      totalChange={<ChangeIndicator change={stats.changes.retailValue} />}
                      totalChartData={stats.timeSeries.retailValue}
                      formatValue={formatCurrency}
                      chartType={chartType}
                      hideChart={chartsHidden['gift']}
                    />
                    <DualMetricCard
                      icon={<DollarSign className="w-3 h-3" />}
                      label="COGS"
                      totalValue={formatCurrency(stats.totalCogs)}
                      avgValue={formatCurrency(stats.avgCogs)}
                      totalChange={<ChangeIndicator change={stats.changes.cogs} />}
                      totalChartData={stats.timeSeries.cogs}
                      formatValue={formatCurrency}
                      chartType={chartType}
                      hideChart={chartsHidden['gift']}
                    />
                </div>

                {/* Spend Row */}
                <div className="grid grid-cols-2 gap-2">
                    <DualMetricCard
                      icon={<DollarSign className="w-3 h-3 text-primary" />}
                      label="Actualized Spend"
                      totalValue={formatCurrency(stats.totalActualizedSpend)}
                      avgValue={formatCurrency(stats.avgActualizedSpend)}
                      totalChange={<ChangeIndicator change={stats.changes.actualizedSpend} />}
                      totalChartData={stats.timeSeries.actualizedSpend}
                      formatValue={formatCurrency}
                      accentColor="primary"
                      totalValueClassName="text-primary"
                      avgValueClassName="text-primary"
                      chartType={chartType}
                      hideChart={chartsHidden['gift']}
                    />
                    <DualMetricCard
                      icon={<DollarSign className="w-3 h-3 text-rose-500" />}
                      label="Charged"
                      totalValue={formatCurrency(stats.totalCharged)}
                      avgValue={formatCurrency(stats.avgCharged)}
                      totalChange={<ChangeIndicator change={stats.changes.charged} />}
                      totalChartData={stats.timeSeries.charged}
                      formatValue={formatCurrency}
                      accentColor="rose"
                      totalValueClassName="text-rose-600 dark:text-rose-400"
                      avgValueClassName="text-rose-600 dark:text-rose-400"
                      chartType={chartType}
                      hideChart={chartsHidden['gift']}
                    />
                </div>

                {/* Post Performance Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-card via-60% to-card border rounded-md px-3 py-2 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Link2 className="w-3 h-3 text-emerald-500" />
                        Posted
                      </div>
                      <ChangeIndicator change={stats.changes.postedCount} />
                    </div>
                    <p className="text-lg font-normal leading-tight text-emerald-600 dark:text-emerald-400">{stats.postedCount}</p>
                  </div>
                  <div className="border-rose-500/30 bg-gradient-to-br from-rose-500/5 via-card via-60% to-card border rounded-md px-3 py-2 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        Charges
                      </div>
                      <ChangeIndicator change={stats.changes.chargedCount} />
                    </div>
                    <p className="text-lg font-normal leading-tight text-rose-600 dark:text-rose-400">{stats.chargedCount}</p>
                  </div>
                  <div className="bg-card border border-border rounded-md px-3 py-2 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <TrendingUp className="w-3 h-3" />
                        Post Rate
                      </div>
                      <ChangeIndicator change={stats.changes.postRate} />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-normal leading-tight">{stats.postRate.toFixed(0)}%</p>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(stats.postRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-md px-3 py-2 flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Clock className="w-3 h-3" />
                        Time to Post
                      </div>
                      <ChangeIndicator change={stats.avgChanges.timeToPost} />
                    </div>
                    <p className="text-lg font-normal leading-tight">
                      {stats.avgTimeToPost > 0 
                        ? `${Math.floor(stats.avgTimeToPost)}h ${Math.round((stats.avgTimeToPost % 1) * 60)}m`
                        : '—'}
                    </p>
                  </div>
                </div>
          </div>}
        </div>


        {/* Post Metrics */}
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-3">
            <div className="flex items-center gap-1">
              <button onClick={() => toggleCollapse('posts')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                {collapsed['posts'] ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                <h4 className="text-sm font-normal text-foreground">Post Metrics</h4>
              </button>

            <Dialog>
              <DialogTrigger asChild>
                <button className="p-0.5 rounded hover:bg-muted transition-colors">
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Post Metrics</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <p className="text-muted-foreground text-xs italic">
                    Charts display totals over time, not averages.
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="font-normal">Views</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Total and average views across all verified posts.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-muted-foreground" />
                      <span className="font-normal">Likes</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Total and average likes across all verified posts.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="font-normal">Comments</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Total and average comments across all verified posts.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="font-normal">Engagement Rate (Avg.)</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Average engagement rate across all posts.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-normal">CPM (Avg.)</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Average cost per 1,000 views: ((COGS + tax + shipping) ÷ views) × 1,000. Lower is better.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`w-4 h-4 ${getMetricColor('emv').icon}`} />
                      <span className="font-normal">EMV (Avg.)</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Average Earned Media Value per post: (likes + comments) × platform CPE rate ($0.25 Instagram, $0.20 TikTok). Higher is better. Customizable in Settings.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
            {!collapsed['posts'] && (
              <button onClick={() => toggleCharts('posts')} className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <BarChart2 className="w-3 h-3" />
                <span className="text-[10px]">{chartsHidden['posts'] ? 'Show charts' : 'Hide charts'}</span>
              </button>
            )}
          </div>
          {!collapsed['posts'] && <div className="space-y-2">
            {/* Row 1: Views, Likes, Comments */}
            <div className="grid grid-cols-3 gap-2 items-stretch">
              <DualMetricCard
                icon={<Eye className="w-3 h-3" />}
                label="Views"
                totalValue={formatNumber(stats.totalViews)}
                avgValue={formatNumber(stats.avgViews)}
                totalChange={<ChangeIndicator change={stats.postTotalChanges.views} />}
                totalChartData={stats.timeSeries.views}
                formatValue={formatNumber}
                chartType={chartType}
                hideChart={chartsHidden['posts']}
              />
              <DualMetricCard
                icon={<Heart className="w-3 h-3" />}
                label="Likes"
                totalValue={formatNumber(stats.totalLikes)}
                avgValue={formatNumber(stats.avgLikes)}
                totalChange={<ChangeIndicator change={stats.postTotalChanges.likes} />}
                totalChartData={stats.timeSeries.likes}
                formatValue={formatNumber}
                chartType={chartType}
                hideChart={chartsHidden['posts']}
              />
              <DualMetricCard
                icon={<MessageCircle className="w-3 h-3" />}
                label="Comments"
                totalValue={formatNumber(stats.totalComments)}
                avgValue={formatNumber(stats.avgComments)}
                totalChange={<ChangeIndicator change={stats.postTotalChanges.comments} />}
                totalChartData={stats.timeSeries.comments}
                formatValue={formatNumber}
                chartType={chartType}
                hideChart={chartsHidden['posts']}
              />
            </div>
            {/* Row 2: CPM, Engagement Rate, EMV */}
            <div className="grid grid-cols-3 gap-2 items-stretch">
              <div className={`border rounded-md px-3 py-2 flex flex-col ${getMetricColor('cpm').border} ${getMetricColor('cpm').gradient}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <DollarSign className={`w-3 h-3 ${getMetricColor('cpm').icon}`} />
                    <span>CPM</span>
                  </div>
                  {(!stats.cpmBoxStats || stats.cpmBoxStats.count < 2) && stats.postMetricChanges.cpm !== null && stats.hasPreviousData && (
                    <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
                      {stats.postMetricChanges.cpm < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : stats.postMetricChanges.cpm > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : null}
                      {Math.abs(stats.postMetricChanges.cpm).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="mt-2 flex-1 flex flex-col">
                  {stats.cpmBoxStats && stats.cpmBoxStats.count >= 2 ? (
                    <BoxWhiskerPlot
                      stats={stats.cpmBoxStats}
                      label="CPM"
                      formatValue={(v) => formatCPM(v)}
                      accentColor="primary"
                    />
                  ) : (
                    <>
                      <span className="text-xl text-foreground">{stats.avgCPM !== null ? formatCPM(stats.avgCPM) : '—'}</span>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] text-muted-foreground">Average</span>
                        <span className="text-[10px] text-muted-foreground italic">Insufficient data for visual.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-card border border-border rounded-md px-3 py-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <BarChart3 className="w-3 h-3" />
                    <span>Engagement Rate</span>
                  </div>
                  {(!stats.engagementBoxStats || stats.engagementBoxStats.count < 2) && stats.postMetricChanges.engagementRate !== null && stats.hasPreviousData && (
                    <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
                      {stats.postMetricChanges.engagementRate > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : stats.postMetricChanges.engagementRate < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                      {Math.abs(stats.postMetricChanges.engagementRate).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="mt-2 flex-1 flex flex-col">
                  {stats.engagementBoxStats && stats.engagementBoxStats.count >= 2 ? (
                    <BoxWhiskerPlot
                      stats={stats.engagementBoxStats}
                      label="Engagement"
                      formatValue={(v) => `${v.toFixed(1)}%`}
                      accentColor="primary"
                    />
                  ) : (
                    <>
                      <span className="text-xl text-foreground">{stats.avgEngagementRate.toFixed(1)}%</span>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] text-muted-foreground">Average</span>
                        <span className="text-[10px] text-muted-foreground italic">Insufficient data for visual.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className={`border rounded-md px-3 py-2 flex flex-col ${getMetricColor('emv').border} ${getMetricColor('emv').bg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <TrendingUp className={`w-3 h-3 ${getMetricColor('emv').icon}`} />
                    <span>EMV</span>
                  </div>
                  {(!stats.emvBoxStats || stats.emvBoxStats.count < 2) && stats.postMetricChanges.emv !== null && stats.hasPreviousData && (
                    <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
                      {stats.postMetricChanges.emv > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : stats.postMetricChanges.emv < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                      {Math.abs(stats.postMetricChanges.emv).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="mt-2 flex-1 flex flex-col">
                  {stats.emvBoxStats && stats.emvBoxStats.count >= 2 ? (
                    <BoxWhiskerPlot
                      stats={stats.emvBoxStats}
                      label="EMV"
                      formatValue={(v) => formatEMV(v)}
                      accentColor="primary"
                    />
                  ) : (
                    <>
                      <span className="text-xl text-foreground">{stats.avgEMV !== null ? formatEMV(stats.avgEMV) : '—'}</span>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] text-muted-foreground">Average</span>
                        <span className="text-[10px] text-muted-foreground italic">Insufficient data for visual.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>}
        </div>

        <div>
          <div className="flex items-center justify-between gap-1.5 mb-3">
            <div className="flex items-center gap-1">
              <button onClick={() => toggleCollapse('influencers')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                {collapsed['influencers'] ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                <h4 className="text-sm font-normal text-foreground">Influencer Metrics</h4>
              </button>

            <Dialog>
              <DialogTrigger asChild>
                <button className="p-0.5 rounded hover:bg-muted transition-colors">
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Influencer Metrics</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-normal">Unique Creators</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Number of distinct influencers who received gift orders.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-normal">Total Followers</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Combined follower count across all influencers (using highest platform).
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-normal">Avg Engagement Rate</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Average engagement rate across all influencers.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-muted-foreground" />
                      <span className="font-normal">Leaderboard</span>
                    </div>
                    <p className="text-muted-foreground pl-6">
                      Top performing influencers ranked by total views from their posts.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
          {!collapsed['influencers'] && <>
          {/* 4-Column Grid Layout */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-stretch">
            {/* Row 1, Col 1 */}
            <div className="bg-card border border-border rounded-md px-3 py-2 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Users className="w-3 h-3" />
                  Followers
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-normal text-foreground">{formatNumber(stats.totalFollowers)}</span>
                  <span className="text-[10px] text-muted-foreground">total</span>
                </div>
              </div>
              <div className="mt-2">
                <BoxWhiskerPlot
                  stats={stats.followersBoxStats}
                  label="Followers"
                  formatValue={(v) => formatNumber(v)}
                  accentColor="primary"
                />
              </div>
            </div>

            {/* Row 1, Col 2 */}
            <div className="bg-card border border-border rounded-md px-3 py-2 flex flex-col">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Package className="w-3 h-3" />
                Order Status
              </div>
              <div className="mt-2">
                {(() => {
                  const total = stats.statusData.reduce((sum, d) => sum + d.value, 0);
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-[80px] h-[80px] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            <linearGradient id="inTransitGradient2" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="hsl(206, 89%, 62%)" />
                              <stop offset="50%" stopColor="hsl(217, 91%, 60%)" />
                              <stop offset="100%" stopColor="hsl(221, 83%, 53%)" />
                            </linearGradient>
                            <linearGradient id="postingGradient2" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="hsl(45, 93%, 67%)" />
                              <stop offset="50%" stopColor="hsl(43, 96%, 58%)" />
                              <stop offset="100%" stopColor="hsl(38, 92%, 50%)" />
                            </linearGradient>
                            <linearGradient id="postedGradient2" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="hsl(142, 71%, 55%)" />
                              <stop offset="50%" stopColor="hsl(160, 84%, 39%)" />
                              <stop offset="100%" stopColor="hsl(174, 84%, 38%)" />
                            </linearGradient>
                            <linearGradient id="chargedGradient2" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="hsl(351, 83%, 67%)" />
                              <stop offset="50%" stopColor="hsl(0, 84%, 65%)" />
                              <stop offset="100%" stopColor="hsl(330, 81%, 65%)" />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={stats.statusData.map((d) => ({ ...d, gradientId: d.gradientId + '2' }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={20}
                            outerRadius={35}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {stats.statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`url(#${entry.gradientId}2)`} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                      <div className="flex flex-col gap-1">
                        {stats.statusData.map((entry, index) => {
                          const Icon = entry.icon;
                          const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                          return (
                            <div key={index} className="flex items-center gap-1.5">
                              <Icon className="w-3 h-3" style={{ color: entry.color }} />
                              <span className="text-xs text-muted-foreground">{entry.name}</span>
                              <span className="text-xs text-foreground">{entry.value}</span>
                              <span className="text-xs text-muted-foreground">({percent}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Column 3 */}
            <div className="bg-card border border-border rounded-md px-3 py-2 flex flex-col sm:row-span-2">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Crown className="w-3 h-3" />
                Top Influencers
              </div>
              <div className="mt-2 flex-1">
                {stats.influencerPerformance.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No post data available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.influencerPerformance.slice(0, 3).map((inf) => {
                      const isTop = isTopPerformer(inf.id, mockPosts, mockOrders, priorityMetric, emvSettings);
                      const isVerified = hasPostedForVouch(inf.id, mockPosts);
                      const handle = inf.username;

                      return (
                        <div
                          key={inf.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <Link
                            to={`/dashboard/influencers?id=${inf.id}`}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <VerifiedInfluencerAvatar
                              initial={inf.name.charAt(0) || '?'}
                              isVerified={isVerified}
                              size="sm"
                              className="w-8 h-8 text-sm"
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link
                                to={`/dashboard/influencers?id=${inf.id}`}
                                className="text-sm truncate hover:text-primary transition-colors"
                              >
                                {inf.name}
                              </Link>
                              {isTop && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/10 border-primary/20 text-primary font-medium">
                                  Top 10%
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <a
                                href={
                                  inf.platform === 'instagram'
                                    ? `https://instagram.com/${handle}`
                                    : `https://tiktok.com/@${handle}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                              >
                                {inf.platform === 'instagram' ? (
                                  <Instagram className="w-3 h-3" />
                                ) : (
                                  <TikTokIcon className="w-3 h-3" />
                                )}
                                <span>@{handle}</span>
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{formatNumber(inf.totalViews)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              <span>{formatNumber(inf.totalLikes)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Column 4 */}
            <div className="bg-card border border-border rounded-md px-3 py-2 flex flex-col sm:row-span-2">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Star className="w-3 h-3" />
                Top Products
              </div>
              <div className="mt-2 flex-1">
                {(() => {
                  const topProducts = getTopProducts(filteredOrders, 3);

                  if (topProducts.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No product data available
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {topProducts.map((product, index) => {
                        const shopifyUrl = product.shopifyProductId
                          ? `https://admin.shopify.com/store/${mockBrand.slug}/products/${product.shopifyProductId}`
                          : null;

                        return (
                          <a
                            key={product.sku}
                            href={shopifyUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-2 rounded-md transition-colors ${shopifyUrl ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default'}`}
                            onClick={(e) => !shopifyUrl && e.preventDefault()}
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-normal bg-muted text-muted-foreground flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="text-sm font-normal text-foreground truncate">{product.name}</p>
                                {shopifyUrl && (
                                  <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {product.count} units · {formatCurrency(product.totalValue)}
                              </p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Row 2, Col 1 */}
            <div className="bg-card border border-border rounded-md px-3 py-2 flex flex-col">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <BarChart3 className="w-3 h-3" />
                Engagement Rate
              </div>
              <div className="mt-2">
                <BoxWhiskerPlot
                  stats={stats.influencerEngagementBoxStats}
                  label="Engagement"
                  formatValue={(v) => `${v.toFixed(1)}%`}
                  accentColor="primary"
                />
              </div>
            </div>

            {/* Row 2, Col 2 */}
            <div className="bg-card border border-border rounded-md px-3 py-2 flex flex-col">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Globe className="w-3 h-3" />
                Platforms
              </div>
              <div className="mt-2">
                {(() => {
                  const platformData = [
                    {
                      name: 'Instagram',
                      value: stats.instagramCreators,
                      color: 'hsl(330, 75%, 55%)',
                      gradientId: 'instagramGradient2',
                    },
                    {
                      name: 'TikTok',
                      value: stats.tiktokCreators,
                      color: 'hsl(175, 70%, 40%)',
                      gradientId: 'tiktokGradient2',
                    },
                  ].filter((d) => d.value > 0);
                  const total = stats.instagramCreators + stats.tiktokCreators;

                  if (platformData.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-[80px] text-muted-foreground text-sm">
                        No platform data available
                      </div>
                    );
                  }

                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-[80px] h-[80px] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            <linearGradient id="instagramGradient2" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="hsl(330, 85%, 70%)" />
                              <stop offset="50%" stopColor="hsl(340, 82%, 55%)" />
                              <stop offset="100%" stopColor="hsl(350, 80%, 45%)" />
                            </linearGradient>
                            <linearGradient id="tiktokGradient2" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="hsl(175, 85%, 55%)" />
                              <stop offset="50%" stopColor="hsl(170, 80%, 45%)" />
                              <stop offset="100%" stopColor="hsl(165, 75%, 35%)" />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={platformData}
                            cx="50%"
                            cy="50%"
                            innerRadius={20}
                            outerRadius={35}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {platformData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`url(#${entry.gradientId})`} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                      <div className="flex flex-col gap-1">
                        {platformData.map((entry, index) => {
                          const Icon = entry.name === 'Instagram' ? Instagram : TikTokIcon;
                          const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                          return (
                            <div key={index} className="flex items-center gap-1.5">
                              <Icon className="w-3 h-3" style={{ color: entry.color }} />
                              <span className="text-xs text-muted-foreground">{entry.name}</span>
                              <span className="text-xs text-foreground">{entry.value}</span>
                              <span className="text-xs text-muted-foreground">({percent}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Audience Insights Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {/* Countries */}
            <div className="bg-card border border-border rounded-md px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
                <Globe className="w-3 h-3" />
                <span>Top Countries</span>
              </div>
              <div className="space-y-1.5">
                {stats.audienceInsights.countries.map((country, idx) => (
                  <div key={country.country} className="flex items-center justify-between text-xs">
                    <span className={idx === 0 ? "text-foreground font-normal" : "text-muted-foreground"}>
                      {country.country}
                    </span>
                    <span className={idx === 0 ? "text-foreground font-normal" : "text-muted-foreground"}>
                      {country.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-card border border-border rounded-md px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
                <Languages className="w-3 h-3" />
                <span>Languages</span>
              </div>
              <div className="space-y-1.5">
                {stats.audienceInsights.languages.map((lang, idx) => (
                  <div key={lang.language} className="flex items-center justify-between text-xs">
                    <span className={idx === 0 ? "text-foreground font-normal" : "text-muted-foreground"}>
                      {lang.language}
                    </span>
                    <span className={idx === 0 ? "text-foreground font-normal" : "text-muted-foreground"}>
                      {lang.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Age & Gender */}
            <div className="bg-card border border-border rounded-md px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
                <Users className="w-3 h-3" />
                <span>Demographics</span>
              </div>
              <div className="space-y-2">
                {/* Age ranges */}
                <div className="space-y-1">
                  {stats.audienceInsights.ageRanges.map((age) => (
                    <div key={age.range} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-10">{age.range}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${age.percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-7 text-right">{age.percentage}%</span>
                    </div>
                  ))}
                </div>
                {/* Gender Pie Chart */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          <linearGradient id="femaleGradientAnalytics" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="hsl(330, 81%, 75%)" />
                            <stop offset="50%" stopColor="hsl(340, 82%, 60%)" />
                            <stop offset="100%" stopColor="hsl(351, 83%, 55%)" />
                          </linearGradient>
                          <linearGradient id="maleGradientAnalytics" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="hsl(206, 89%, 62%)" />
                            <stop offset="50%" stopColor="hsl(217, 91%, 60%)" />
                            <stop offset="100%" stopColor="hsl(221, 83%, 53%)" />
                          </linearGradient>
                        </defs>
                        <Pie
                          data={stats.audienceInsights.gender.map(g => ({
                            name: g.type,
                            value: g.percentage
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={14}
                          outerRadius={28}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {stats.audienceInsights.gender.map((g) => (
                            <Cell 
                              key={g.type} 
                              fill={g.type === 'Female' ? 'url(#femaleGradientAnalytics)' : 'url(#maleGradientAnalytics)'} 
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {stats.audienceInsights.gender.map((g) => (
                      <div key={g.type} className="flex items-center gap-1 text-xs">
                        <div 
                          className="w-2 h-2 rounded-sm" 
                          style={{ backgroundColor: g.type === 'Female' ? '#ec4899' : '#3b82f6' }}
                        />
                        <span className="text-muted-foreground">{g.type}</span>
                        <span className="font-normal text-foreground">{g.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="bg-card border border-border rounded-md px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Top Interests</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.audienceInsights.interests.map((interest) => (
                  <span 
                    key={interest} 
                    className="px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
          </>}
        </div>

        {/* ─── Sales Attribution ─── */}
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1">
              <button onClick={() => toggleCollapse('spike')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                {collapsed['spike'] ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                <h4 className="text-sm font-normal text-foreground">Sales Attribution</h4>
              </button>
            </div>
          </div>


          {!collapsed['spike'] && <>
          {/* KPI row + timeline in a grid matching other section layouts */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* KPI: Attributed Revenue */}
            <div className={`border rounded-md px-3 py-2 flex flex-col ${getMetricColor('sales').border} ${getMetricColor('sales').gradient}`}>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <DollarSign className={`w-3 h-3 ${getMetricColor('sales').icon}`} />
                Attributed Revenue
              </div>
              <p className="text-lg leading-tight mt-0.5">{formatAttribution(attributionData.totalAttributedRevenue)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">above 7-day baseline</p>
            </div>

            {/* KPI: Spike Posts */}
            <div className="bg-card border border-border rounded-md px-3 py-2 flex flex-col">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Zap className="w-3 h-3" />
                Posts w/ Spike
              </div>
              <p className="text-lg leading-tight mt-0.5">{attributionData.topPosts.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">of {mockPosts.length} total posts</p>
            </div>

            {/* KPI: Avg Confidence */}
            <div className="bg-card border border-border rounded-md px-3 py-2 flex flex-col">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Star className="w-3 h-3" />
                Avg Confidence
              </div>
              <p className="text-lg leading-tight mt-0.5">
                {attributionData.topPosts.length > 0
                  ? Math.round(attributionData.topPosts.reduce((s, p) => s + p.attr.confidenceScore, 0) / attributionData.topPosts.length)
                  : 0}%
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">attribution confidence</p>
            </div>

            {/* Top post summary */}
            <div className="bg-card border border-border rounded-md px-3 py-2 flex flex-col">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Crown className="w-3 h-3" />
                Top Driver
              </div>
              {attributionData.topPosts[0] ? (
                <>
                  <p className="text-sm leading-tight mt-0.5 truncate">{attributionData.topPosts[0].influencer?.full_name || 'Unknown'}</p>
                  <p className={`text-[11px] mt-0.5 ${getMetricColor('sales').text}`}>+{formatAttribution(attributionData.topPosts[0].attr.attributedRevenue)}</p>

                </>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-0.5">No spikes detected</p>
              )}
            </div>
          </div>

          {/* Timeline chart */}
          <div className="bg-card border border-border rounded-md px-3 py-2 mt-2">
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <TrendingUp className="w-3 h-3" />
                <span>Daily Sales</span>
                <span className="text-muted-foreground/60"></span>
              </div>
              <select
                value={selectedAttributionProductId}
                onChange={e => setSelectedAttributionProductId(e.target.value)}
                className="text-[11px] bg-muted border border-border rounded px-2 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer max-w-[160px] truncate"
              >
                {availableAttributionProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="h-[120px] relative" ref={salesChartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attributionData.salesTimeline} margin={{ top: 16, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="attrSalesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} width={32} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md">
                          <p className="font-medium">{label}</p>
                          <p className="text-muted-foreground">Revenue: <span className="text-foreground font-medium">${payload[0].value?.toLocaleString()}</span></p>
                        </div>
                      );
                    }}
                  />
                  {attributionData.postMarkers.map(m => {
                    const xLabel = attributionData.salesTimeline.find(d => d.date === m.date)?.label;
                    return (
                      <ReferenceLine
                        key={m.postId}
                        x={xLabel}
                        stroke="hsl(var(--primary))"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        label={(props: { viewBox?: { x?: number; y?: number; height?: number } }) => {
                          const x = props.viewBox?.x ?? 0;
                          const chartBottom = (props.viewBox?.y ?? 0) + (props.viewBox?.height ?? 120);
                          const y = chartBottom - 20;
                          return (
                            <g>
                              <rect x={x + 4} y={y} width={52} height={16} rx={3} fill="hsl(var(--primary))" fillOpacity={0.12} />
                              <svg x={x + 7} y={y + 2} width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                <circle cx="12" cy="13" r="3" />
                              </svg>
                              <text x={x + 22} y={y + 11} fontSize={9} fontFamily="Inter, sans-serif" fill="hsl(var(--primary))" fontWeight={500}>Post</text>
                            </g>
                          );
                        }}
                      />
                    );
                  })}
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#attrSalesGradient)" />
                </AreaChart>
              </ResponsiveContainer>
              {/* Clickable overlays positioned above the Recharts mouse-capture layer */}
              {salesChartDimensions && attributionData.postMarkers.map(m => {
                const timelineIndex = attributionData.salesTimeline.findIndex(d => d.date === m.date);
                if (timelineIndex < 0) return null;
                const { width: chartW, left: chartLeft, yAxisWidth } = salesChartDimensions;
                const plotWidth = chartW - yAxisWidth - 4; // 4 = right margin
                const xFraction = timelineIndex / Math.max(attributionData.salesTimeline.length - 1, 1);
                const xPx = yAxisWidth + xFraction * plotWidth;
                return (
                  <button
                    key={m.postId}
                    title={`${m.influencerName} — click to view post`}
                    onClick={() => navigate(`/dashboard/posts?order=${m.orderId}`)}
                    className="absolute inset-y-0 -translate-x-1/2 w-8 cursor-pointer z-10 hover:bg-primary/5 transition-colors rounded"
                    style={{ left: xPx }}
                    aria-label={`View post by ${m.influencerName}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Top posts by attributed revenue */}
          {attributionData.topPosts.length > 0 ? (
            <div className="bg-card border border-border rounded-md px-3 py-2 mt-2">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
                <TrendingUp className="w-3 h-3" />
                Top Revenue-Driving Posts
              </div>
              <div className="divide-y divide-border/60">
                {attributionData.topPosts.map(({ attr, post, influencer }, i) => (
                  <div key={attr.postId} className="py-2 flex items-center gap-3 first:pt-0 last:pb-0">
                    <span className="text-[11px] text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                    <Link to={`/dashboard/influencers?id=${attr.influencerId}`} className="hover:opacity-80 transition-opacity shrink-0">
                      <VerifiedInfluencerAvatar
                        initial={influencer?.full_name?.charAt(0) || '?'}
                        imageUrl={influencer?.profile_image_url}
                        isVerified={hasPostedForVouch(attr.influencerId, mockPosts)}
                        size="sm"
                        className="w-6 h-6 text-[10px]"
                      />

                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/dashboard/influencers?id=${attr.influencerId}`} className="text-xs font-medium truncate hover:text-primary transition-colors block">
                        {influencer?.full_name || 'Unknown'}
                      </Link>

                      <p className="text-[11px] text-muted-foreground truncate">{attr.productNames.slice(0, 2).join(' · ')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-medium ${getMetricColor('sales').text}`}>+{formatAttribution(attr.attributedRevenue)}</p>
                      <p className="text-[11px] text-muted-foreground">+{Math.round(attr.liftPercent)}% lift</p>
                    </div>
                    <div className="shrink-0">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] ${attr.confidenceScore >= 70 ? `${getMetricColor('sales').bg} ${getMetricColor('sales').text}` : attr.confidenceScore >= 40 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                        {attr.confidenceScore}% conf.
                      </span>
                    </div>
                    <Link to={`/dashboard/posts?order=${post.order_id}`} className="shrink-0">
                      <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary transition-colors" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-md px-3 py-4 mt-2 text-center">
              <p className="text-xs text-muted-foreground">No sales spikes detected in the selected timeframe.</p>
            </div>
          )}
          </>}
        </div>


      </div>
    </DashboardLayout>
  );
}
