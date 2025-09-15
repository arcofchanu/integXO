import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Add a check to ensure the user has set the environment variables
if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  // This is a friendly error for the developer, not for the end-user.
  console.error(
    "Supabase credentials are not set. Please create a .env file with:\n" +
    "VITE_SUPABASE_URL=your_supabase_url\n" +
    "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n" +
    "The app will not work correctly without them."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
