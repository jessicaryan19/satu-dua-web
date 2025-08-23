import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const schema = process.env.NEXT_PUBLIC_SCHEMA || ''

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: schema }
})

