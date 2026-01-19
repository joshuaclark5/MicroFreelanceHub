import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  // 1. Get the key safely
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'CRITICAL: No API Key found in env variables.' });
  }

  // 2. Ask Google for the list of available models for this key
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await response.json();

  return NextResponse.json(data);
}