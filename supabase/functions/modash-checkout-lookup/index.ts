const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Instagram/TikTok CDN images are served with `Cross-Origin-Resource-Policy: same-origin`,
// so a browser <img> on another domain refuses to render them. We fetch the image
// server-side (CORP is browser-only) and inline it as a base64 data URL, which renders
// with no cross-origin restrictions. Returns the original URL on any failure.
async function inlineImageAsDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 8000);
    const res = await fetch(url, { signal: abort.signal }).catch(() => null);
    clearTimeout(timeout);
    if (!res || !res.ok) return url;

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return url;

    const buf = new Uint8Array(await res.arrayBuffer());
    // Guard against oversized payloads (>3MB) — profile pics are tiny
    if (buf.byteLength > 3_000_000) return url;

    // Base64-encode in chunks to avoid call-stack limits on large inputs
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    return `data:${contentType};base64,${btoa(binary)}`;
  } catch (_e) {
    return url;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const hasApiKey = !!(req.headers.get('apikey') || '').trim();
    const hasAuth = !!(req.headers.get('Authorization') || '').replace('Bearer', '').trim();
    if (!hasApiKey && !hasAuth) {
      return new Response(
        JSON.stringify({ error: true, message: 'Missing credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { platform, username } = await req.json();

    if (!platform || !username) {
      return new Response(
        JSON.stringify({ error: true, message: 'platform and username are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['instagram', 'tiktok'].includes(platform)) {
      return new Response(
        JSON.stringify({ error: true, message: 'platform must be instagram or tiktok' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('MODASH_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: true, message: 'Modash API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanUsername = username.toLowerCase().replace('@', '').trim();
    console.log(`[Checkout Lookup] Raw API only for ${platform}/${cleanUsername}`);

    const modashHeaders = { 'Authorization': `Bearer ${apiKey}` };

    // Build Raw API URLs (NO Discovery API)
    const userInfoUrl = platform === 'tiktok'
      ? `https://api.modash.io/v1/raw/tiktok/user-info?url=@${encodeURIComponent(cleanUsername)}`
      : `https://api.modash.io/v1/raw/ig/user-info?url=${encodeURIComponent(cleanUsername)}`;

    const userFeedUrl = platform === 'tiktok'
      ? `https://api.modash.io/v1/raw/tiktok/user-feed?url=@${encodeURIComponent(cleanUsername)}`
      : `https://api.modash.io/v1/raw/ig/user-feed?url=${encodeURIComponent(cleanUsername)}`;

    // Abort controllers: 20s for user-info (critical), 15s for user-feed (non-critical)
    const userInfoAbort = new AbortController();
    const userFeedAbort = new AbortController();
    const userInfoTimeout = setTimeout(() => userInfoAbort.abort(), 20000);
    const userFeedTimeout = setTimeout(() => userFeedAbort.abort(), 15000);

    // Make both Raw API calls in parallel (2 Raw credits total, 0 Discovery credits)
    const [userInfoResponse, userFeedResponse] = await Promise.all([
      fetch(userInfoUrl, { method: 'GET', headers: modashHeaders, signal: userInfoAbort.signal })
        .catch((e) => { console.error('user-info fetch failed:', e?.message); return null; }),
      fetch(userFeedUrl, { method: 'GET', headers: modashHeaders, signal: userFeedAbort.signal })
        .catch(() => null),
    ]);

    clearTimeout(userInfoTimeout);
    clearTimeout(userFeedTimeout);

    // Parse user-info response
    if (!userInfoResponse) {
      console.error('user-info timed out or failed');
      return new Response(
        JSON.stringify({ error: true, message: 'Profile lookup timed out. Please try again.' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.json().catch(() => ({}));
      console.error('Raw API user-info error:', JSON.stringify(errorData));

      if (userInfoResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: true, message: 'Account not found', code: 'not_found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: true, message: 'Failed to fetch profile' }),
        { status: userInfoResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userInfoData = await userInfoResponse.json();

    // Extract profile data based on platform
    let followers = 0;
    let verified = false;
    let profileImageUrl: string | null = null;
    let displayName = cleanUsername;

    if (platform === 'tiktok') {
      const userInfo = userInfoData?.user_info?.userInfo;
      const user = userInfo?.user || {};
      const stats = userInfo?.stats || {};
      followers = stats.followerCount ?? 0;
      verified = user.verified ?? false;
      profileImageUrl = user.avatarLarger || user.avatarMedium || user.avatarThumb || null;
      displayName = user.nickname || cleanUsername;
    } else {
      // Instagram
      followers = userInfoData?.follower_count ?? 0;
      verified = userInfoData?.is_verified ?? false;
      profileImageUrl = userInfoData?.profile_pic_url_hd || userInfoData?.profile_pic_url || null;
      displayName = userInfoData?.full_name || cleanUsername;
    }

    // Calculate engagement rate from user-feed posts; 0 = data unavailable (empty feed)
    let engagementRate = 0;
    if (userFeedResponse && userFeedResponse.ok) {
      try {
        const feedData = await userFeedResponse.json();
        // Include views for TikTok (used as denominator, matching Discovery API methodology)
        let posts: Array<{ likes: number; comments: number; views: number }> = [];

        if (platform === 'tiktok') {
          // TikTok feed: items may be under user_feed.items or top-level items
          const tiktokItems = feedData?.user_feed?.items ?? feedData?.items ?? [];
          posts = tiktokItems.map((item: Record<string, unknown>) => {
            const stats = (item.stats as Record<string, unknown>) || {};
            return {
              likes: (stats.diggCount as number) ?? 0,
              comments: (stats.commentCount as number) ?? 0,
              views: (stats.playCount as number) ?? 0,
            };
          });
        } else if (platform === 'instagram') {
          // Instagram feed: items may be top-level or under user_feed.items
          const igItems = feedData?.items ?? feedData?.user_feed?.items ?? [];
          posts = igItems.map((item: Record<string, unknown>) => ({
            // Restore comments — outlier filter below handles giveaway/CTA skew
            likes: (item.like_count as number) ?? 0,
            comments: (item.comment_count as number) ?? 0,
            views: 0,
          }));
        }

        // Use last 30 posts — matches Modash Discovery API methodology
        const recentPosts = posts.slice(0, 30);

        if (recentPosts.length > 0) {
          if (platform === 'tiktok') {
            // TikTok: views-based ER (industry standard — Discovery API uses this)
            // ER per post = (likes + comments) / views; average across posts with views
            const postsWithViews = recentPosts.filter(p => p.views > 0);
            if (postsWithViews.length > 0) {
              const totalRate = postsWithViews.reduce((sum, p) => sum + (p.likes + p.comments) / p.views, 0);
              engagementRate = Math.round((totalRate / postsWithViews.length) * 1000) / 10;
              console.log(`[Checkout Lookup] TikTok views-based ER: ${engagementRate}% from ${postsWithViews.length} posts with views`);
            }
          } else if (platform === 'instagram' && followers > 0) {
            // Instagram: outlier-filtered ER — exclude posts >3x median to handle viral spikes
            const engagements = recentPosts.map(p => p.likes + p.comments);
            const sorted = [...engagements].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            const threshold = median * 3;
            const filtered = recentPosts.filter(p => (p.likes + p.comments) <= threshold);
            // Fallback to full sample if filter removes everything (median itself is 0)
            const sample = filtered.length > 0 ? filtered : recentPosts;
            const totalEngagement = sample.reduce((sum, p) => sum + p.likes + p.comments, 0);
            const avgEngagement = totalEngagement / sample.length;
            engagementRate = Math.round((avgEngagement / followers) * 1000) / 10;
            console.log(`[Checkout Lookup] Instagram outlier-filtered ER: ${engagementRate}% (${sample.length}/${recentPosts.length} posts after 3x-median filter)`);
          }
        } else {
          console.log('[Checkout Lookup] user-feed returned 0 posts — engagement rate will be 0');
        }
      } catch (e) {
        console.log('[Checkout Lookup] Failed to parse user-feed (non-critical):', e);
      }
    } else {
      console.log('[Checkout Lookup] user-feed not available — engagement rate will be 0');
    }

    console.log(`[Checkout Lookup] ${cleanUsername}: ${followers} followers, ${engagementRate}% eng, verified=${verified}`);

    // Inline the CDN image as a data URL so the browser can render it cross-origin
    const inlinedImage = await inlineImageAsDataUrl(profileImageUrl);

    return new Response(
      JSON.stringify({
        error: false,
        data: {
          followers,
          engagementRate,
          sponsoredPosts30d: 0, // Not available from Raw API; collaborations endpoint handles this separately
          verified,
          profileImageUrl: inlinedImage,
          displayName,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Checkout Lookup] Error:', error);
    return new Response(
      JSON.stringify({ error: true, message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
