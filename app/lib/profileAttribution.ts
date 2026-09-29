export function sanitizeAttribution(landing: unknown, source: unknown) {
  const path = typeof landing === 'string' ? landing.split(/[?#]/)[0] : '';
  // Private document routes and arbitrary query text must never become acquisition data.
  const publicPath = /^\/(?:$|(?:templates|profession|articles)(?:\/[a-z0-9-]+)?$|tools\/[a-z0-9-]+$|(?:create|pricing|partners)$)/.test(path);
  return {
    signup_landing_page: publicPath && path.length <= 240 ? path : null,
    lead_source: typeof source === 'string' && /^[a-z0-9][a-z0-9:_-]{0,99}$/i.test(source) ? source : null,
  };
}

export async function persistFirstTouch(admin: any, user: { id: string; email?: string; user_metadata?: Record<string, unknown> }, landing: unknown, source: unknown) {
  const original = sanitizeAttribution(user.user_metadata?.signup_landing_page, user.user_metadata?.signup_lead_source);
  const fallback = sanitizeAttribution(landing, source);
  const attribution = {
    signup_landing_page: original.signup_landing_page || fallback.signup_landing_page,
    lead_source: original.lead_source || fallback.lead_source,
  };
  const { error } = await admin.from('profiles').upsert({ id: user.id, email: user.email || null }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error('Unable to ensure signup profile');
  // Conditional writes prevent concurrent callbacks or later signins replacing first touch.
  for (const [field, value] of Object.entries(attribution)) {
    if (!value) continue;
    const { error: updateError } = await admin.from('profiles').update({ [field]: value }).eq('id', user.id).is(field, null);
    if (updateError) throw new Error('Unable to persist signup attribution');
  }
}
