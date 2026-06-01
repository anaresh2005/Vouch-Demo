import { useState } from 'react';
import { openExternal } from '@/lib/openExternal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Influencer, VouchOrder, VouchPost } from '@/types/vouch';
import { Instagram, ExternalLink, Link2, Users, BarChart3, ShoppingCart } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TikTokIcon } from '@/components/icons/TikTokIcon';
import { cn } from '@/lib/utils';
import { useNavigate, Link } from 'react-router-dom';

import { VerifiedInfluencerAvatar } from './VerifiedInfluencerAvatar';
import { isTopPerformer, hasPostedForVouch, hasPostedForBrand, getInfluencerBestCPMForBrand, formatCPM, calculatePostEMV, formatEMV } from '@/lib/cpmUtils';
import { useEMVSettings } from '@/hooks/useEMVSettings';
import { usePriorityMetric } from '@/hooks/usePriorityMetric';
import { mockBrand } from '@/lib/mockData';
import { toast } from 'sonner';
import { OrderStatusBadge } from './OrderStatusBadge';
import { CountdownTimer } from './CountdownTimer';
import { format } from 'date-fns';
import { InfluencerProfileDialog } from './InfluencerProfileDialog';

interface InfluencerCardProps {
  influencer: Influencer;
  orders?: VouchOrder[];
  posts?: VouchPost[];
  allOrders?: VouchOrder[];
  allPosts?: VouchPost[];
  className?: string;
}

export function InfluencerCard({ 
  influencer, 
  orders = [], 
  posts = [],
  allOrders = [],
  allPosts = [],
  className 
}: InfluencerCardProps) {
  const navigate = useNavigate();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { settings: emvSettings } = useEMVSettings();
  const { getMetricColor, priorityMetric } = usePriorityMetric();
  const formatFollowers = (count: number | null) => {
    if (!count) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const influencerPosts = allPosts.length > 0 ? allPosts : posts;
  const influencerOrders = allOrders.length > 0 ? allOrders : orders;
  const isTop = isTopPerformer(influencer.id, influencerPosts, influencerOrders, priorityMetric, emvSettings);
  const isVerified = hasPostedForVouch(influencer.id, influencerPosts);
  const hasPostedForThisBrand = hasPostedForBrand(influencer.id, mockBrand.id, influencerPosts, influencerOrders);
  const bestCPM = getInfluencerBestCPMForBrand(influencer.id, mockBrand.id, influencerPosts, influencerOrders);

  // Avg EMV across this influencer's posts for this brand
  const brandPosts = influencerPosts.filter(p =>
    p.influencer_id === influencer.id &&
    influencerOrders.some(o => o.id === p.order_id && o.brand_id === mockBrand.id)
  );
  const avgEMV = brandPosts.length > 0
    ? brandPosts.reduce((sum, p) => sum + calculatePostEMV(p, emvSettings), 0) / brandPosts.length
    : null;

  // Determine primary social info
  const primaryPlatform = orders.length > 0 ? orders[0].platform : (influencer.instagram_username ? 'instagram' : 'tiktok');
  const isInstagram = primaryPlatform === 'instagram';
  const handle = isInstagram ? influencer.instagram_username : influencer.tiktok_username;
  const followers = isInstagram ? influencer.instagram_followers : influencer.tiktok_followers;
  const engagementRate = isInstagram ? influencer.instagram_engagement_rate : influencer.tiktok_engagement_rate;

  return (
    <Card className={cn('glass hover:shadow-lg transition-all duration-300 group h-full flex flex-col', className)}>
      <CardContent className="p-4 flex flex-col flex-1">
        {/* Header: avatar + name/stats + email */}
        <div className="flex items-start gap-3">
          <VerifiedInfluencerAvatar 
            initial={influencer.full_name?.charAt(0) || influencer.email.charAt(0).toUpperCase()}
            imageUrl={influencer.profile_image_url}
            isVerified={isVerified}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  {influencer.full_name || 'Unknown'}
                  {isTop && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-primary/10 border-primary/20 text-primary font-medium">
                      Top 10%
                    </Badge>
                  )}
                </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(influencer.email);
                        toast.success('Email copied to clipboard');
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {influencer.email}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Copy</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <div className="flex items-center gap-2">
                {followers && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {formatFollowers(followers)}
                  </span>
                )}
                {engagementRate && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BarChart3 className="w-3.5 h-3.5" />
                      {engagementRate}%
                    </span>
                  </>
                )}
              </div>
              {handle && (
                <button
                  onClick={() => openExternal(isInstagram ? `https://instagram.com/${handle}` : `https://tiktok.com/@${handle}`)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  {isInstagram ? <Instagram className="w-3.5 h-3.5" /> : <TikTokIcon className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mini Order Cards */}
        {orders.length > 0 && (
          <div className="mt-3 pt-3 pb-2 border-t border-border space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground mb-1">Orders ({orders.length})</p>
            {orders.slice(0, 3).map((order) => (
              <div 
                key={order.id} 
                className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 text-xs cursor-pointer hover:bg-muted transition-colors h-9"
                onClick={() => navigate(`/dashboard/orders?expand=${order.id}`)}
              >
                <div className="flex items-center gap-2">
                  {order.shopify_order_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        openExternal(`https://admin.shopify.com/store/orders/${order.shopify_order_id}`);
                      }}
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      {order.shopify_order_id}
                    </Button>
                  )}
                  <span className="text-muted-foreground">
                    {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
                  </span>
                  <span className="text-muted-foreground">
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {order.status === 'pending_delivery' && order.estimated_delivery_at && (
                    <span className="text-[10px] text-muted-foreground">
                      Est. {format(new Date(order.estimated_delivery_at), 'MMM d')}
                    </span>
                  )}
                  {order.status === 'post_pending' && order.post_deadline && (
                    <CountdownTimer deadline={order.post_deadline} className="text-[10px] font-medium" />
                  )}
                  {order.status === 'charged' && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format((order.order_total || 0) + (order.sales_tax || 0) + (order.shipping_cost || 0))}
                    </span>
                  )}
                  {order.status === 'post_verified' && (
                    <Link
                      to={`/dashboard/posts?order=${order.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-1 px-3 pt-2.5 pb-2 leading-none text-[10px] rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Link2 className="w-2.5 h-2.5" />
                      LIVE
                    </Link>
                  )}
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
            {orders.length > 3 && (
              <button
                onClick={() => navigate(`/dashboard/orders?influencer=${influencer.id}`)}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                +{orders.length - 3} more
              </button>
            )}
          </div>
        )}

        {/* Bottom row: category/CPM tags + Full View button */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs h-6 px-2.5 bg-muted border-border text-muted-foreground">
              {influencer.category}
            </Badge>
            {hasPostedForThisBrand && bestCPM !== null && (
              <Badge variant="outline" className={`text-xs h-6 px-2.5 ${getMetricColor('cpm').badgeBg}`}>
                {formatCPM(bestCPM)} CPM
              </Badge>
            )}
            {hasPostedForThisBrand && avgEMV !== null && (
              <Badge variant="outline" className={`text-xs h-6 px-2.5 ${getMetricColor('emv').badgeBg}`}>
                {formatEMV(avgEMV)} EMV
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-muted-foreground h-7 px-2 text-xs"
            onClick={() => setProfileDialogOpen(true)}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1" />
            Full View
          </Button>
        </div>
      </CardContent>

      <InfluencerProfileDialog
        influencer={influencer}
        orders={orders}
        allPosts={allPosts}
        allOrders={allOrders}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </Card>
  );
}
