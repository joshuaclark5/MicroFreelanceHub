// Only known workspace pages may be used as post-auth destinations.
// Do not accept arbitrary paths, hosts, query strings or encoded redirects.
// Setup intent is restricted to exact known goal/edit URLs.
const destinations = new Set([
  '/payment-success', '/workspace', '/workspace/setup', '/workspace/clients', '/workspace/projects',
  '/workspace/stages', '/workspace/tasks', '/workspace/agreements',
  '/workspace/time', '/workspace/team', '/workspace/scheduling',
  '/workspace/resources', '/workspace/reports', '/workspace/invoices',
  '/workspace/crm', '/workspace/connections',
]);

for (const goal of ['clients','projects','agreements','scheduling','time','invoices']) {
  destinations.add('/workspace/setup?goal=' + goal);
}
destinations.add('/workspace/setup?edit=1');

export function getAuthDestination(params: { get(name: string): string | null }): string | null {
  const candidate = params.get('next') || params.get('returnTo');
  return candidate && destinations.has(candidate) ? candidate : null;
}
