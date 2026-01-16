// app/api/sow/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { client_name, project_scope, timeline, payment_terms, payment_schedule_structured } = body;

    const slug = `${client_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    const sow = {
      id: slug,
      client_name,
      project_scope,
      timeline,
      payment_terms,
      payment_schedule_structured,
    };

    return NextResponse.json({ success: true, sow });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to create SOW' }, { status: 500 });
  }
}
