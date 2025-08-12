import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/payment-events?tx_ref=...  (returns events in sequence order for a tx_ref)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const txRef = searchParams.get('tx_ref');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Number(limitParam || 100), 500);

    if (!txRef) {
      return NextResponse.json({ error: 'tx_ref is required' }, { status: 400 });
    }

    const events = await prisma.paymentEvent.findMany({
      where: { txRef },
      orderBy: { sequence: 'asc' }, // Order by sequence (1, 2, 3, ...) instead of creation time
      take: limit,
    });

    return NextResponse.json({ 
      tx_ref: txRef, 
      total_events: events.length,
      events: events.map(event => ({
        sequence: event.sequence,
        event_type: event.eventType,
        status: event.status,
        http_status: event.httpStatus,
        message: event.message,
        attempt: event.attempt,
        created_at: event.createdAt,
        payload: event.payload
      }))
    });
  } catch (error: any) {
    console.error('💥 [PAYMENT-EVENTS] Failed to fetch payment events', {
      error: error?.message,
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

