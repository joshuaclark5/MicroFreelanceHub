import {NextResponse} from 'next/server';
import {activeSeasonalOffer} from '../../lib/seasonalOffers';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json({offer:activeSeasonalOffer()},{headers:{'Cache-Control':'no-store'}});}
