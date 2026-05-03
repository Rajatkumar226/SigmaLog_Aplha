import { supabase } from '../lib/supabase/client';

export interface TimeCapsule {
  id: string;
  message: string;
  written_at: string;
  deliver_on: string;
  is_opened: boolean;
  opened_at: string | null;
  created_at: string;
}

export async function createCapsule(message: string, deliverInDays: number): Promise<{ success: boolean; data?: TimeCapsule; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const deliverOn = new Date();
  deliverOn.setDate(deliverOn.getDate() + deliverInDays);
  const deliverOnStr = deliverOn.toISOString().split('T')[0];

  const { data, error } = await (supabase as any)
    .from('time_capsules')
    .insert({ user_id: user.id, message: message.trim(), deliver_on: deliverOnStr })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as TimeCapsule };
}

export async function getCapsules(): Promise<TimeCapsule[]> {
  const { data, error } = await (supabase as any)
    .from('time_capsules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as TimeCapsule[];
}

export async function openCapsule(capsuleId: string): Promise<boolean> {
  const { error } = await (supabase as any)
    .from('time_capsules')
    .update({ is_opened: true, opened_at: new Date().toISOString() })
    .eq('id', capsuleId);

  return !error;
}
