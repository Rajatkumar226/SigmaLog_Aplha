import { supabase } from '../lib/supabase/client';

export interface ExcuseRecord {
  id: string;
  habit_id: string;
  excuse_date: string;
  excuse_text: string;
}

export async function addExcuse(habitId: string, excuseText: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await (supabase as any)
    .from('habit_excuses')
    .insert({ user_id: user.id, habit_id: habitId, excuse_text: excuseText.trim() })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Already excused this habit today' };
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

export async function getTodayExcuses(): Promise<Record<string, string>> {
  const { data: serverDate } = await supabase.rpc('get_current_date');
  const today = serverDate || new Date().toISOString().split('T')[0];

  const { data, error } = await (supabase as any)
    .from('habit_excuses')
    .select('habit_id, excuse_text')
    .eq('excuse_date', today);

  if (error || !data) return {};
  return (data as any[]).reduce((acc: Record<string, string>, row: any) => {
    acc[row.habit_id] = row.excuse_text;
    return acc;
  }, {});
}

export async function getWeekExcuses(): Promise<ExcuseRecord[]> {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const startStr = start.toISOString().split('T')[0];

  const { data, error } = await (supabase as any)
    .from('habit_excuses')
    .select('*')
    .gte('excuse_date', startStr)
    .order('excuse_date', { ascending: false });

  if (error || !data) return [];
  return data as ExcuseRecord[];
}

export async function deleteExcuse(habitId: string): Promise<boolean> {
  const { data: serverDate } = await supabase.rpc('get_current_date');
  const today = serverDate || new Date().toISOString().split('T')[0];

  const { error } = await (supabase as any)
    .from('habit_excuses')
    .delete()
    .eq('habit_id', habitId)
    .eq('excuse_date', today);

  return !error;
}
