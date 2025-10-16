import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { allocateDuration, SessionPreference } from '@/lib/duration-scheduler';
import { parseTimeToMinutes } from '@/lib/time-utils';

export async function POST(req: NextRequest) {
  try {
    const { date, serviceIds, preference } = await req.json();

    if (!date || !Array.isArray(serviceIds) || serviceIds.length === 0 || !preference) {
      return NextResponse.json({ error: 'date, serviceIds, and preference are required' }, { status: 400 });
    }

    if (preference !== 'morning' && preference !== 'afternoon') {
      return NextResponse.json({ error: 'preference must be "morning" or "afternoon"' }, { status: 400 });
    }

    // Fetch service durations
    const services = await prisma.service.findMany({ where: { id: { in: serviceIds }, isAvailable: true } });
    const durations = services.map(s => s.duration);

    if (durations.length !== serviceIds.length) {
      return NextResponse.json({ error: 'Some selected services are unavailable' }, { status: 409 });
    }

    // Gather existing allocations from successful bookings for the same date
    const bookings = await prisma.booking.findMany({ where: { date, status: 'successful' } });
    const existing = bookings
      .map(b => {
        if (!b.timeSlot) return null;
        const [start, end] = b.timeSlot.split('-');
        if (!start || !end) return null;
        return { start: parseTimeToMinutes(start), end: parseTimeToMinutes(end) };
      })
      .filter(Boolean) as Array<{ start: number; end: number }>;

    const result = allocateDuration({
      serviceDurations: durations,
      preference: preference as SessionPreference,
      existingAllocations: existing,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to allocate time:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


