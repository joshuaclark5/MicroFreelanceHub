// Retired unsafe payload-driven sender. No SDK, credentials, body parsing, database or network access.
// This includes preflight: no request is acknowledged as queued or sent. See RELEASE_CONTAINMENT.md.
Deno.serve(() => new Response(
  JSON.stringify({
    error: 'legacy_email_unavailable',
    message: 'This legacy email endpoint is unavailable. No email was sent or queued.',
  }),
  {
    status: 503,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  }
));
