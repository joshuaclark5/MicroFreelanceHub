'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// We add a 'role' parameter to know WHO is signing
export async function signContract(sowId: string, signerName: string, role: 'client' | 'provider') {
  if (typeof sowId !== 'string' || typeof signerName !== 'string' ||
      signerName.trim().length < 2 || signerName.trim().length > 160 || !['client', 'provider'].includes(role)) {
    return { error: 'Enter a valid name and signing role.' };
  }
  const { data: document, error: lookupError } = await supabaseAdmin.from('sow_documents').select('id, user_id, status, signed_by, provider_sign').eq('id', sowId).single();
  if (lookupError || !document || ['Paid', 'Canceled', 'Cancelled'].includes(document.status)) return { error: 'This agreement is not available for signing.' };
  if (role === 'provider') {
    const auth = createServerActionClient({ cookies });
    const { data: { user } } = await auth.auth.getUser();
    if (!user || user.id !== document.user_id) return { error: 'Sign in as the agreement owner to sign as provider.' };
  }
  if (role === 'client' ? document.signed_by : document.provider_sign) return { error: 'This signature has already been recorded.' };

  const updateData: any = {};
  
  if (role === 'client') {
    updateData.status = 'Signed'; // Only client marks it fully signed for now
    updateData.signed_by = signerName.trim();
  } else {
    updateData.provider_sign = signerName.trim();
  }

  const { data: updated, error } = await supabaseAdmin
    .from('sow_documents')
    .update(updateData)
    .eq('id', sowId)
    .eq('status', document.status)
    .or(`${role === 'client' ? 'signed_by' : 'provider_sign'}.is.null,${role === 'client' ? 'signed_by' : 'provider_sign'}.eq.`)
    .select('id');

  if (error || !updated?.length) {
    console.error("Sign Error:", error);
    return { error: "Failed to sign" };
  }

  return { success: true };
}
