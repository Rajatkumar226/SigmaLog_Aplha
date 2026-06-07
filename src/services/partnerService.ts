/**
 * Accountability Partner Service
 * ==============================
 * 1-on-1 accountability pacts. All cross-user reads go through SECURITY
 * DEFINER RPCs (migration 010) that verify an accepted partnership and
 * expose only completion % + streak — never the partner's habits/logs.
 */

import { supabase } from '../lib/supabase/client';

export interface PartnerStatus {
  partnerId: string;
  email: string;
  todayScore: number;
  todayMax: number;
  todayPct: number;
  completedToday: boolean;
  streak: number;
}

export interface PartnerRequest {
  id: string;
  requesterId: string;
  email: string;
  createdAt: string;
}

export interface SentRequest {
  id: string;
  addresseeId: string;
  email: string;
  createdAt: string;
}

export async function sendRequestByEmail(email: string): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await supabase.rpc('send_partner_request', { p_email: email });
  if (error) return { ok: false, message: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: !!row?.ok, message: row?.message ?? 'Something went wrong' };
}

export async function listRequests(): Promise<PartnerRequest[]> {
  const { data, error } = await supabase.rpc('list_partner_requests');
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    id: r.id,
    requesterId: r.requester_id,
    email: r.email,
    createdAt: r.created_at,
  }));
}

export async function respondToRequest(id: string, accept: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc('respond_partner_request', { p_id: id, p_accept: accept });
  return !error && !!data;
}

export async function listSentRequests(): Promise<SentRequest[]> {
  const { data, error } = await supabase.rpc('list_sent_requests');
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    id: r.id,
    addresseeId: r.addressee_id,
    email: r.email,
    createdAt: r.created_at,
  }));
}

export async function cancelRequest(id: string): Promise<boolean> {
  // RLS lets the requester delete their own pending row
  const { error } = await supabase.from('accountability_partners').delete().eq('id', id);
  return !error;
}

export async function getPartners(): Promise<PartnerStatus[]> {
  const { data, error } = await supabase.rpc('get_partners_status');
  if (error || !data) return [];
  return (data as any[]).map((r) => {
    const score = r.today_score ?? 0;
    const max = r.today_max ?? 0;
    return {
      partnerId: r.partner_id,
      email: r.email,
      todayScore: score,
      todayMax: max,
      todayPct: max > 0 ? Math.round((score / max) * 100) : 0,
      completedToday: max > 0 && score >= max,
      streak: r.streak ?? 0,
    };
  });
}

export async function removePartner(partnerId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  // RLS allows deleting rows you're part of; match either direction
  const { error } = await supabase
    .from('accountability_partners')
    .delete()
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${partnerId}),and(requester_id.eq.${partnerId},addressee_id.eq.${user.id})`,
    );
  return !error;
}
