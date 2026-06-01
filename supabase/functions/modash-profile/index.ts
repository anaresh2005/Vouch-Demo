const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Helper to format post data from Modash report format
const formatPost = (p: Record<string, unknown>) => ({
  id: (p.id as string) || '',
  url: (p.url as string) || '',
  caption: (p.text as string) || (p.caption as string) || '',
  thumbnail: (p.thumbnail as string) || (p.image as string) || null,
  views: (p.views as number) ?? (p.plays as number) ?? null,
  likes: (p.likes as number) ?? null,
  comments: (p.comments as number) ?? null,
  shares: (p.shares as number) ?? null,
  created: (p.created as string) || '',
  // Sponsored post metadata
  mentions: (p.mentions as string[]) || [],
  sponsor: (p.sponsor as Record<string, unknown>) || null,
});

// Helper to format post data from Raw API TikTok feed
const formatRawTikTokPost = (item: Record<string, unknown>) => {
  const stats = (item.stats as Record<string, unknown>) || {};
  const video = (item.video as Record<string, unknown>) || {};
  const author = (item.author as Record<string, unknown>) || {};
  const id = (item.id as string) || '';
  const uniqueId = (author.uniqueId as string) || '';
  return {
    id,
    url: `https://www.tiktok.com/@${uniqueId}/video/${id}`,
    caption: (item.desc as string) || '',
    thumbnail: (video.cover as string) || (video.originCover as string) || null,
    views: (stats.playCount as number) ?? null,
    likes: (stats.diggCount as number) ?? null,
    comments: (stats.commentCount as number) ?? null,
    shares: (stats.shareCount as number) ?? null,
    created: (item.createTime as number)
      ? new Date((item.createTime as number) * 1000).toISOString()
      : '',
  };
};

// Helper to format post data from Raw API Instagram feed
const formatRawInstagramPost = (item: Record<string, unknown>) => {
  const id = (item.id as string) || (item.pk as string) || '';
  const code = (item.code as string) || '';
  const imageVersions = (item.image_versions2 as Record<string, unknown>) || {};
  const candidates = (imageVersions.candidates as Array<Record<string, unknown>>) || [];
  const thumbnail = candidates.length > 0 ? (candidates[0].url as string) || null : null;
  return {
    id,
    url: code ? `https://www.instagram.com/p/${code}/` : '',
    caption: ((item.caption as Record<string, unknown>)?.text as string) || '',
    thumbnail,
    views: (item.play_count as number) ?? (item.view_count as number) ?? null,
    likes: (item.like_count as number) ?? null,
    comments: (item.comment_count as number) ?? null,
    shares: (item.share_count as number) ?? null,
    created: (item.taken_at as number)
      ? new Date((item.taken_at as number) * 1000).toISOString()
      : '',
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require apikey or Authorization header (Supabase client SDK sends both automatically)
    const hasApiKey = !!req.headers.get('apikey');
    const hasAuth = !!req.headers.get('Authorization');
    if (!hasApiKey && !hasAuth) {
      console.warn('Request rejected: no apikey or Authorization header');
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
      console.error('MODASH_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: true, message: 'Modash API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanUsername = username.toLowerCase().replace('@', '').trim();
    console.log(`Fetching Modash data for ${platform}/${cleanUsername}`);

    const modashHeaders = { 'Authorization': `Bearer ${apiKey}` };

    // 1. Discovery Report (primary data source) - request average calculation method
    const reportUrl = `https://api.modash.io/v1/${platform}/profile/${encodeURIComponent(cleanUsername)}/report?calculationMethod=average`;
    
    // 2. Raw API user-feed (supplemental, real-time post stats) - attempt gracefully
    const rawFeedUrl = platform === 'tiktok'
      ? `https://api.modash.io/v1/raw/tiktok/user-feed?url=@${encodeURIComponent(cleanUsername)}`
      : `https://api.modash.io/v1/raw/ig/user-feed?url=${encodeURIComponent(cleanUsername)}`;

    // Make both calls in parallel
    const [reportResponse, rawFeedResponse] = await Promise.all([
      fetch(reportUrl, { method: 'GET', headers: modashHeaders }),
      fetch(rawFeedUrl, { method: 'GET', headers: modashHeaders }).catch(() => null),
    ]);

    const reportData = await reportResponse.json();

    if (!reportResponse.ok || reportData.error) {
      console.error('Modash Discovery API error:', JSON.stringify(reportData));
      
      const errorCode = reportData.code || reportData.error_code;
      if (errorCode === 'handle_not_found' || errorCode === 'account_not_found') {
        return new Response(
          JSON.stringify({ error: true, message: 'Account not found', code: 'not_found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: true, message: reportData.message || 'Failed to fetch profile', code: errorCode }),
        { status: reportResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse Raw API response (may fail if not subscribed - that's OK)
    let rawFeedPosts: ReturnType<typeof formatRawTikTokPost>[] = [];
    if (rawFeedResponse && rawFeedResponse.ok) {
      try {
        const rawData = await rawFeedResponse.json();
        if (platform === 'tiktok' && rawData?.user_feed?.items) {
          rawFeedPosts = rawData.user_feed.items.map(formatRawTikTokPost);
          console.log(`Raw API returned ${rawFeedPosts.length} TikTok posts`);
        } else if (platform === 'instagram' && rawData?.user_feed?.items) {
          rawFeedPosts = rawData.user_feed.items.map(formatRawInstagramPost);
          console.log(`Raw API returned ${rawFeedPosts.length} Instagram posts`);
        }
      } catch (e) {
        console.log('Raw API response parse failed (non-critical):', e);
      }
    } else {
      console.log('Raw API not available or returned error (non-critical, using Discovery data only)');
    }

    // ── Extract from Discovery Report ──
    const profile = reportData.profile;
    const profileInfo = profile?.profile || {};

    // Count sponsored posts in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSponsoredPosts = (profile?.sponsoredPosts || []).filter((post: { created: string }) => {
      const postDate = new Date(post.created);
      return postDate >= thirtyDaysAgo;
    });

    // Engagement rate - use ?? to preserve 0 values
    let engagementRate = 0;
    if (profileInfo.engagementRate != null) {
      engagementRate = Math.round(profileInfo.engagementRate * 1000) / 10;
    } else if (profileInfo.followers && profile?.avgLikes) {
      engagementRate = Math.round((profile.avgLikes / profileInfo.followers) * 1000) / 10;
    }

    // ── Audience data ──
    const audience = profile?.audience || {};
    const audienceGenders = audience?.genders || [];
    const audienceAges = audience?.ages || [];
    const audienceCountries = audience?.geoCountries || audience?.countries || [];
    const audienceCities = audience?.geoCities || audience?.cities || [];
    const audienceLanguages = audience?.languages || [];
    const audienceInterests = audience?.interests || [];
    const audienceCredibility = profile?.audienceCredibility ?? null;
    const audienceNotableUsers = audience?.notableUsers || [];
    const lookalikes = profile?.lookalikes || [];

    const genderData = audienceGenders.map((g: { code: string; weight: number }) => ({
      type: g.code === 'FEMALE' ? 'Female' : g.code === 'MALE' ? 'Male' : 'Other',
      percentage: Math.round(g.weight * 100),
    }));

    const ageData = audienceAges.map((a: { code: string; weight: number }) => ({
      range: a.code,
      percentage: Math.round(a.weight * 100),
    }));

    const countryData = audienceCountries
      .slice(0, 5)
      .map((c: { name?: string; code?: string; weight: number }) => ({
        country: c.name || c.code || 'Unknown',
        percentage: Math.round(c.weight * 100),
      }));

    const cityData = audienceCities
      .slice(0, 5)
      .map((c: { name?: string; weight: number }) => ({
        city: c.name || 'Unknown',
        percentage: Math.round(c.weight * 100),
      }));

    const languageData = audienceLanguages
      .slice(0, 5)
      .map((l: { name?: string; code?: string; weight: number }) => ({
        language: l.name || l.code || 'Unknown',
        percentage: Math.round(l.weight * 100),
      }));

    const interestData = audienceInterests
      .slice(0, 6)
      .map((i: { name?: string }) => i.name || '');

    // ── Posts from Discovery Report ──
    const rawRecentPosts = profile?.recentPosts || [];
    const recentPostsData = rawRecentPosts.slice(0, 10).map(formatPost);

    const rawSponsoredPosts = profile?.sponsoredPosts || [];
    const sponsoredPostsData = rawSponsoredPosts.slice(0, 10).map(formatPost);

    const rawPopularPosts = profile?.topPosts || profile?.popularPosts || [];
    const popularPostsData = rawPopularPosts.slice(0, 10).map(formatPost);

    // ── Merge Raw API posts with Discovery posts ──
    // Raw API gives real-time stats; use them to update/supplement discovery posts
    if (rawFeedPosts.length > 0) {
      const rawPostMap = new Map(rawFeedPosts.map(p => [p.id, p]));
      
      // Update discovery recent posts with real-time stats from raw API
      for (const post of recentPostsData) {
        const rawPost = rawPostMap.get(post.id);
        if (rawPost) {
          // Prefer raw API values (more real-time) - use ?? to keep raw nulls from overwriting
          if (rawPost.views != null) post.views = rawPost.views;
          if (rawPost.likes != null) post.likes = rawPost.likes;
          if (rawPost.comments != null) post.comments = rawPost.comments;
          if (rawPost.shares != null) post.shares = rawPost.shares;
          if (rawPost.thumbnail && !post.thumbnail) post.thumbnail = rawPost.thumbnail;
        }
      }

      // Add any raw posts not in discovery (newer posts)
      for (const rawPost of rawFeedPosts) {
        if (!recentPostsData.find(p => p.id === rawPost.id)) {
          recentPostsData.push(rawPost);
        }
      }

      // Re-sort by date and limit
      recentPostsData.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      recentPostsData.splice(15); // Keep up to 15 with raw supplement
    }

    // ── Profile-level stats (use ?? to preserve 0) ──
    const avgLikes = profile?.avgLikes ?? (recentPostsData.length > 0 
      ? Math.round(recentPostsData.reduce((s: number, p: { likes: number | null }) => s + (p.likes ?? 0), 0) / recentPostsData.length) 
      : null);
    const avgComments = profile?.avgComments ?? (recentPostsData.length > 0 
      ? Math.round(recentPostsData.reduce((s: number, p: { comments: number | null }) => s + (p.comments ?? 0), 0) / recentPostsData.length) 
      : null);
    const avgViews = profile?.avgViews ?? (recentPostsData.length > 0 
      ? Math.round(recentPostsData.reduce((s: number, p: { views: number | null }) => s + (p.views ?? 0), 0) / recentPostsData.length) 
      : null);
    const avgShares = profile?.avgShares ?? (recentPostsData.length > 0 
      ? Math.round(recentPostsData.reduce((s: number, p: { shares: number | null }) => s + (p.shares ?? 0), 0) / recentPostsData.length) 
      : null);

    // ── New fields from Discovery Report ──
    const totalLikes = profile?.totalLikes ?? null;
    const paidPostPerformance = profile?.paidPostPerformance ?? null;
    const paidPostPerformanceViews = profile?.paidPostPerformanceViews ?? null;
    const sponsoredPostsMedianViews = profile?.sponsoredPostsMedianViews ?? null;
    const sponsoredPostsMedianLikes = profile?.sponsoredPostsMedianLikes ?? null;
    const nonSponsoredPostsMedianViews = profile?.nonSponsoredPostsMedianViews ?? null;
    const nonSponsoredPostsMedianLikes = profile?.nonSponsoredPostsMedianLikes ?? null;

    // Stat history (monthly follower/engagement trends)
    const statHistory = (profile?.statHistory || []).map((s: Record<string, unknown>) => ({
      month: s.month as string,
      followers: s.followers as number,
      following: s.following as number,
      avgLikes: s.avgLikes as number,
      avgViews: s.avgViews as number,
      avgComments: s.avgComments as number,
      avgShares: (s.avgShares as number) ?? null,
    }));

    // Stats by content type (e.g., reels vs feed posts)
    const statsByContentType = profile?.statsByContentType ?? null;

    // Profile-level interests (distinct from audience interests)
    const profileInterests = (profile?.interests || []).map((i: { name?: string; id?: number }) => i.name || '').filter(Boolean);

    // Posting frequency
    const postingFrequency = profile?.postingFrequency ?? null;

    // Audience extra data
    const audienceExtra = profile?.audienceExtra ?? null;

    const result = {
      error: false,
      data: {
        followers: profileInfo.followers ?? null,
        engagementRate,
        sponsoredPosts30d: recentSponsoredPosts.length,
        verified: profile?.isVerified || profileInfo.isVerified || false,
        profileImageUrl: profileInfo.picture || null,
        displayName: profileInfo.fullname || cleanUsername,
        bio: profile?.bio || profileInfo.description || null,
        
        // Averages
        avgLikes,
        avgComments,
        avgViews,
        avgShares,
        
        // Totals and counts
        totalLikes,
        postsCount: profile?.postsCount ?? profileInfo.postsCount ?? null,
        
        // Sponsored vs organic performance
        paidPostPerformance,
        paidPostPerformanceViews,
        sponsoredPostsMedianViews,
        sponsoredPostsMedianLikes,
        nonSponsoredPostsMedianViews,
        nonSponsoredPostsMedianLikes,
        
        // Location and demographics
        country: profile?.country ?? null,
        city: profile?.city ?? null,
        state: profile?.state ?? null,
        gender: profile?.gender ?? null,
        ageGroup: profile?.ageGroup ?? null,
        accountType: profile?.accountType ?? null,
        isPrivate: profile?.isPrivate || false,
        
        // Content and frequency
        postingFrequency,
        statsByContentType,
        profileInterests,
        
        // Historical data
        statHistory,
        
        // Audience demographics
        audience: {
          countries: countryData,
          cities: cityData,
          languages: languageData,
          ages: ageData,
          genders: genderData,
          interests: interestData.filter(Boolean),
          credibility: audienceCredibility,
          notableUsers: audienceNotableUsers.slice(0, 10).map((u: Record<string, unknown>) => ({
            userId: (u.userId as string) || '',
            username: (u.username as string) || (u.handle as string) || '',
            fullname: (u.fullname as string) || '',
            picture: (u.picture as string) || null,
            followers: (u.followers as number) ?? null,
            isVerified: (u.isVerified as boolean) || false,
            engagementRate: (u.engagementRate as number) ?? null,
            url: (u.url as string) || '',
          })),
          extra: audienceExtra,
        },
        
        // Similar creators (lookalikes)
        lookalikes: lookalikes.slice(0, 10).map((l: Record<string, unknown>) => ({
          userId: (l.userId as string) || '',
          username: (l.username as string) || (l.handle as string) || '',
          fullname: (l.fullname as string) || '',
          picture: (l.picture as string) || null,
          followers: (l.followers as number) ?? null,
          isVerified: (l.isVerified as boolean) || false,
          engagementRate: (l.engagementRate as number) ?? null,
          url: (l.url as string) || '',
        })),
        
        // Posts
        recentPosts: recentPostsData,
        popularPosts: popularPostsData,
        sponsoredPosts: sponsoredPostsData,
        
        // Data source info
        _rawApiUsed: rawFeedPosts.length > 0,
      },
    };

    console.log(`Modash profile fetched successfully: ${cleanUsername} (${result.data.followers} followers, ${recentPostsData.length} recent posts, ${sponsoredPostsData.length} sponsored posts, raw API: ${rawFeedPosts.length > 0 ? 'yes' : 'no'})`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Modash profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: true, message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
