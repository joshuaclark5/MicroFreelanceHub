import { NextResponse } from 'next/server';
import { searchTemplates } from '../../lib/templateLibrary';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = Number(params.get('page') || '1');
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return NextResponse.json({ error: 'Invalid page' }, { status: 400 });
  try {
    return NextResponse.json(await searchTemplates(params.get('q') || '', params.get('filter') || 'all', page));
  } catch {
    return NextResponse.json({ error: 'Unable to load templates. Please retry.' }, { status: 503 });
  }
}
