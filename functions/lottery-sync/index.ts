import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const gameTypes = ['xinmacau', 'laomacau', 'hongkong', 'canada20', 'hanoi', 'canadapan', 'shishi'];
const zodiacMap = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

function getZodiac(num: number) {
  return zodiacMap[(num - 1) % 12];
}

async function fetchLotteryData(gameType: string) {
  // 模拟外部API - 实际使用时替换为真实API
  const now = new Date();
  const period = `2026${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`;
  return {
    period,
    draw_date: now.toISOString().split('T')[0],
    draw_time: '20:30:00',
    numbers: Array.from({ length: 6 }, () => Math.floor(Math.random() * 49) + 1),
    special_number: Math.floor(Math.random() * 49) + 1,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = [];
    
    for (const gameType of gameTypes) {
      const data = await fetchLotteryData(gameType);
      const zodiacs = [...data.numbers, data.special_number].map(n => getZodiac(n));
      
      const { error } = await supabase
        .from('lottery_results')
        .upsert({
          game_type: gameType,
          period: data.period,
          draw_date: data.draw_date,
          draw_time: data.draw_time,
          numbers: data.numbers,
          special_number: data.special_number,
          zodiacs: zodiacs,
        }, { onConflict: 'game_type,period' });
        
      if (error) throw error;
      results.push({ gameType, period: data.period, success: true });
    }

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});