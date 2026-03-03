import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// 1. Keep your existing function just in case other parts of the app use it
export const createClient = () => {
  return createClientComponentClient();
};

// 2. ADD THIS LINE: This creates the actual 'supabase' object your quiz needs
export const supabase = createClientComponentClient();