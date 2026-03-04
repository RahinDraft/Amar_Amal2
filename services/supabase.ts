import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: any = null;

export const getSupabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

export interface SupabaseUser {
  id: string;
  name: string;
  points: number;
  today_progress: number;
  avatar: string;
  last_active: string;
}

export const syncUserToSupabase = async (user: { id: string, name: string, points: number, todayProgress: number, avatar: string }) => {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('users')
      .upsert({
        id: user.id,
        name: user.name,
        points: user.points,
        today_progress: user.todayProgress,
        avatar: user.avatar,
        last_active: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase sync error:', err);
    return null;
  }
};

export const getGlobalLeaderboard = async () => {
  const client = getSupabase();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('points', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Supabase fetch error:', err);
    return [];
  }
};
