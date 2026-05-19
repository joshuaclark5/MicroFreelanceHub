'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';

export async function deleteUserAccount() {
  try {
    // 1. Get the current user securely from the active session
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user found.");
    }

    // 2. Spin up an ADMIN client to bypass security rules
    // This uses your secret Service Role Key to talk directly to the Auth system
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! 
    );

    // 3. Nuke the user from the Supabase Auth system
    // (If your tables are set up correctly, this will cascade and delete their profile too)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete account:", error.message);
    return { success: false, error: error.message };
  }
}