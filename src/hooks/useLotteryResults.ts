import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';

interface LotteryResult {
  id: number;
  game_type: string;
  period: string;
  draw_date: string;
  draw_time: string;
  numbers: number[];
  special_number: number;
  zodiacs: string[];
  created_at: string;
}

export function useLotteryResults(gameType: string) {
  const [latestResult, setLatestResult] = useState<LotteryResult | null>(null);
  const [history, setHistory] = useState<LotteryResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    const { data } = await supabase
      .from('lottery_results')
      .select('*')
      .eq('game_type', gameType)
      .order('draw_date', { ascending: false })
      .limit(20);
    
    if (data) {
      setHistory(data);
      setLatestResult(data[0] || null);
    }
    setLoading(false);
  }, [gameType]);

  useEffect(() => {
    fetchResults();

    const subscription = supabase
      .channel('lottery_results')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'lottery_results', filter: `game_type=eq.${gameType}` },
        () => fetchResults()
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [gameType, fetchResults]);

  return { latestResult, history, loading, refetch: fetchResults };
}
