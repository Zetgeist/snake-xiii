import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Helpful runtime error if env vars are missing during development
  throw new Error(
    'Supabase environment variables are missing. ' +
      'Please create a .env.local file in the project root with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

