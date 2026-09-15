/**
 * licenseService
 * Admin license management. Reads go straight through Supabase (RLS grants
 * admins SELECT on licenses); generation goes through admin-licenses.js
 * since inserting rows requires the service-role key. Customer-side
 * activation lives in AuthContext.activate(), which calls license-activate.js.
 */
import { supabase } from '@/lib/supabaseClient';
import { callFunction } from '@/lib/functionsClient';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shape(row) {
  return {
    id: row.id,
    code: row.activation_code,
    assignedUser: row.profiles?.full_name || row.profiles?.email || '—',
    status: row.status,
    created: formatDate(row.created_at),
    activated: formatDate(row.activated_at),
  };
}

export const licenseService = {
  async list() {
    const { data, error } = await supabase
      .from('licenses')
      .select('*, profiles:assigned_user_id(email, full_name)')
      .order('created_at', { ascending: false });
    if (error) throw new Error('Could not load licenses.');
    return (data || []).map(shape);
  },

  async generate(count = 1) {
    const { licenses } = await callFunction('admin-licenses', { body: { action: 'generate', count } });
    return (licenses || []).map((row) => ({
      id: row.id,
      code: row.activation_code,
      assignedUser: '—',
      status: row.status,
      created: formatDate(row.created_at),
      activated: '—',
    }));
  },

  async revoke(licenseId) {
    const { license } = await callFunction('admin-licenses', { body: { action: 'revoke', license_id: licenseId } });
    return shape({ ...license, profiles: null });
  },

  async suspend(licenseId) {
    const { license } = await callFunction('admin-licenses', { body: { action: 'suspend', license_id: licenseId } });
    return shape({ ...license, profiles: null });
  },
};
