import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    const body = req.method !== 'GET' ? await req.json().catch(() => ({})) : {};

    switch (path) {
      case 'config': {
        const { data } = await supabase.from('site_config').select('*').single();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'profiles': {
        if (req.method === 'POST') {
          const { data, error } = await supabase.from('profiles').insert(body).select().single();
          if (error) throw error;
          return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { data } = await supabase.from('profiles').select('*');
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'bets': {
        if (req.method === 'POST') {
          const { data, error } = await supabase.from('bets').insert(body).select().single();
          if (error) throw error;
          return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const userId = url.searchParams.get('user_id');
        let query = supabase.from('bets').select('*').order('created_at', { ascending: false });
        if (userId) query = query.eq('user_id', userId);
        const { data } = await query.limit(50);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'transactions': {
        if (req.method === 'POST') {
          const { data, error } = await supabase.from('transactions').insert(body).select().single();
          if (error) throw error;
          return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const userId = url.searchParams.get('user_id');
        let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });
        if (userId) query = query.eq('user_id', userId);
        const { data } = await query.limit(50);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'chat-sessions': {
        if (req.method === 'POST') {
          const { data, error } = await supabase.from('chat_sessions').insert(body).select().single();
          if (error) throw error;
          return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (req.method === 'PATCH') {
          const { id, ...updates } = body;
          const { data, error } = await supabase.from('chat_sessions').update(updates).eq('id', id).select().single();
          if (error) throw error;
          return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { data } = await supabase.from('chat_sessions').select('*').order('last_time', { ascending: false });
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'chat-messages': {
        if (req.method === 'POST') {
          const { data, error } = await supabase.from('chat_messages').insert(body).select().single();
          if (error) throw error;
          return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const sessionId = url.searchParams.get('session_id');
        let query = supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
        if (sessionId) query = query.eq('session_id', sessionId);
        const { data } = await query.limit(100);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'lottery-results': {
        const gameType = url.searchParams.get('game_type');
        let query = supabase.from('lottery_results').select('*').order('draw_date', { ascending: false });
        if (gameType) query = query.eq('game_type', gameType);
        const { data } = await query.limit(20);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});