import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Bleibt bewusst `null`, solange keine Umgebungsvariablen gesetzt sind ->
// die App funktioniert dann exakt wie bisher rein lokal (localStorage),
// ohne Login. Erst mit gesetzten VITE_SUPABASE_* Variablen (siehe
// .env.example) wird Cloud-Sync + Login aktiv.
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http')
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export const isSupabaseConfigured = !!supabase;
