/**
 * activityService
 * Reads go straight through Supabase. RLS's is_admin() branch on the
 * activities table lets admins read every tenant's activity; regular users
 * only ever see their own (activities_select_own policy).
 */
import { supabase } from '@/lib/supabaseClient';

function timeAgo(iso) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusFor(type) {
  if (type?.includes('ban') || type?.includes('disconnect')) return 'destructive';
  if (type?.includes('suspend')) return 'warning';
  return 'success';
}

function toneFor(type) {
  if (type === 'order_flagged') return 'warning';
  if (type === 'message_generated') return 'neutral';
  return 'success';
}

function iconFor(type) {
  if (type === 'message_generated') return 'message';
  if (type === 'order_flagged') return 'alert';
  return 'check';
}

export const activityService = {
  async listAdmin() {
    const { data, error } = await supabase
      .from('activities')
      .select('*, profiles:user_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new Error('Could not load activity.');
    return (data || []).map((a) => ({
      id: a.id,
      user: a.profiles?.full_name || a.profiles?.email || 'System',
      action: a.description || a.activity_type,
      time: new Date(a.created_at).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
      }),
      device: '—', // not currently captured server-side
      status: statusFor(a.activity_type),
    }));
  },

  async getRecent(limit = 6) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error('Could not load activity.');
    return (data || []).map((a) => ({
      id: a.id,
      icon: iconFor(a.activity_type),
      text: a.description || a.activity_type,
      time: timeAgo(a.created_at),
      tone: toneFor(a.activity_type),
    }));
  },
};
