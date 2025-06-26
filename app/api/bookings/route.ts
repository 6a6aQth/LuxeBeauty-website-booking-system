import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Booking creation is now handled only after payment verification.
  // This endpoint is disabled to prevent duplicate or unpaid bookings.
  return NextResponse.json({ error: 'Booking creation is disabled. Use payment flow.' }, { status: 403 });
} 