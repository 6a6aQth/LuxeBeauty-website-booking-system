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
  try {
    const body = await req.json();
    const { name, phone, email, services, timeSlot, date, notes } = body;

    if (!name || !phone || !services || !timeSlot || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const ticketId = `LLB-${date.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = await prisma.booking.create({
      data: {
        name,
        phone,
        email,
        services,
        timeSlot,
        date,
        notes,
        ticketId,
      },
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Failed to create booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 