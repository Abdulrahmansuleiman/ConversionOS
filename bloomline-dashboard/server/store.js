// server/store.js
// createStore() factory — the single entry point for persistence (spec §4.4/§4.5).
// Routes and the seed script never talk to Supabase or JSON directly; they only
// see the EventStore + UserStore interface.
import { resolveConfig } from './config.js';
import { createLocalFileAdapter } from './adapters/local-file.js';
import { createSupabaseAdapter } from './adapters/supabase.js';

export function createStore(config = resolveConfig()) {
  const adapter =
    config.mode === 'supabase'
      ? createSupabaseAdapter({
          supabaseUrl: config.supabaseUrl,
          supabaseServiceRoleKey: config.supabaseServiceRoleKey,
        })
      : createLocalFileAdapter();

  return {
    mode: config.mode,
    events: adapter, // EventStore: saveEvent / listEvents
    users: adapter, // UserStore:  listUsers / addUser
  };
}
