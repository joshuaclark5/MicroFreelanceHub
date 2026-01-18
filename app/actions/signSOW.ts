'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// We add a 'role' parameter to know WHO is signing
export async function signContract(sowId: string, signerName: string, role: 'client' | 'provider') {
  if (!sowId || !signerName) return { error: "Missing data" };

  const updateData: any = {};
  
  if (role === 'client') {
    updateData.status = 'Signed'; // Only client marks it fully signed for now
    updateData.signed_by = signerName;
  } else {
    updateData.provider_sign = signerName;
  }

  const { error } = await supabaseAdmin
    .from('sow_documents')
    .update(updateData)
    .eq('id', sowId);

  if (error) {
    console.error("Sign Error:", error);
    return { error: "Failed to sign" };
  }

  return { success: true };
}