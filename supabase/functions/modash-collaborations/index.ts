const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const hasApiKey = !!req.headers.get('apikey');
    const hasAuth = !!req.headers.get('Authorization');
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

    const apiKey = Deno.env.get('MODASH_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: true, message: 'Modash API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanUsername = username.toLowerCase().replace('@', '').trim();
    console.log(`Fetching collaborations for ${platform}/${cleanUsername}`);

    const response = await fetch('https://api.modash.io/v1/collaborations/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: cleanUsername,
        platform,
        limit: 30,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Modash Collaborations API error:', JSON.stringify(data));
      // If not found or no collaborations, return 0
      if (response.status === 404 || data.code === 'not_found') {
        return new Response(
          JSON.stringify({ error: false, sponsoredPosts30d: 0, collaborations: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: true, message: data.message || 'Failed to fetch collaborations' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count posts within last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const posts = data.posts || data.collaborations || [];
    const recentCollaborations = posts.filter((post: { timestamp?: string; created?: string }) => {
      const postDate = new Date(post.timestamp || post.created || '');
      return postDate >= thirtyDaysAgo;
    });

    console.log(`Found ${recentCollaborations.length} collaborations in last 30 days (${posts.length} total)`);

    return new Response(
      JSON.stringify({
        error: false,
        sponsoredPosts30d: recentCollaborations.length,
        collaborations: recentCollaborations.slice(0, 10).map((p: Record<string, unknown>) => ({
          brand: (p.sponsor as Record<string, unknown>)?.name || (p.brand as Record<string, unknown>)?.name || null,
          timestamp: p.timestamp || p.created || null,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching collaborations:', error);
    return new Response(
      JSON.stringify({ error: true, message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
