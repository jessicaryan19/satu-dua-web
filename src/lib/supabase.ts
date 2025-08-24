import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const schema = process.env.NEXT_PUBLIC_SCHEMA || 'public';

// Create a function to get the Supabase client safely
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables are missing');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    db: { schema: schema }
  });
}

// Export the client for backwards compatibility
export const supabase = getSupabaseClient();

