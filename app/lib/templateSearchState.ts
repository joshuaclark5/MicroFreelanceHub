export function templateSearchState(params: {get(name: string): string | null}) {
  const query = (params.get('q') || '').slice(0, 150);
  const value = params.get('filter') || 'all';
  const filter = ['all', 'contract', 'invoice', 'scope', 'email'].includes(value) ? value : 'all';
  const number = Number(params.get('page') || '1');
  const page = Number.isSafeInteger(number) && number >= 1 && number <= 10000 ? number : 1;
  return {query, filter, page};
}
