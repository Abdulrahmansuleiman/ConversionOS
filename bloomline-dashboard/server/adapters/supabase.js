// server/adapters/supabase.js
// SupabaseAdapter — primary persistence (spec §4.4/§4.5, schema §4.6).
// The service-role client is created server-side ONLY; the key never leaves
// this module and is never sent to the browser.
import { createClient } from '@supabase/supabase-js';

export class DuplicateEmailError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DuplicateEmailError';
    this.code = 'DUPLICATE_EMAIL';
  }
}

function normalizeEvent(row) {
  return {
    id: Number(row.id),
    event_type: row.event_type,
    client_id: row.client_id,
    timestamp: new Date(row.timestamp).toISOString(),
    payload: row.payload ?? {},
  };
}

export function createSupabaseAdapter({ supabaseUrl, supabaseServiceRoleKey }) {
  const client = createClient(supabaseUrl, supabaseServiceRoleKey);

  return {
    // ---- EventStore (spec §4.4) ----
    async saveEvent({ event_type, client_id, timestamp, payload }) {
      const { data, error } = await client
        .from('events')
        .insert({
          event_type,
          client_id,
          timestamp: timestamp ?? new Date().toISOString(),
          payload: payload ?? {},
        })
        .select('*')
        .single();
      if (error) throw new Error(`SupabaseAdapter.saveEvent: ${error.message}`);
      return normalizeEvent(data);
    },

    async listEvents({ eventTypes, from, to, clientId } = {}) {
      let query = client.from('events').select('*');
      if (eventTypes && eventTypes.length > 0) query = query.in('event_type', eventTypes);
      if (clientId) query = query.eq('client_id', clientId);
      if (from) query = query.gte('timestamp', from);
      if (to) query = query.lt('timestamp', to);
      const { data, error } = await query;
      if (error) throw new Error(`SupabaseAdapter.listEvents: ${error.message}`);
      return (data || []).map(normalizeEvent);
    },

    // ---- UserStore (spec §4.4) ----
    async listUsers() {
      const { data, error } = await client.from('dashboard_users').select('*');
      if (error) throw new Error(`SupabaseAdapter.listUsers: ${error.message}`);
      return data || [];
    },

    async addUser({ name, email, role }) {
      const { data, error } = await client
        .from('dashboard_users')
        .insert({ name, email, role })
        .select('*')
        .single();
      if (error) {
        // 23505 = unique_violation on dashboard_users.email (unique per §4.6)
        if (error.code === '23505') {
          throw new DuplicateEmailError(`A person with email ${email} already exists.`);
        }
        throw new Error(`SupabaseAdapter.addUser: ${error.message}`);
      }
      return data;
    },
  };
}
