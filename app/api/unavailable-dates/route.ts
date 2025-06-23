import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const unavailableDates = await prisma.unavailableDate.findMany();
    const slotsByDate = unavailableDates.reduce((acc, curr) => {
      acc[curr.date] = curr.timeSlots;
      return acc;
    }, {} as Record<string, string[]>);
    return NextResponse.json(slotsByDate);
  } catch (error) {
    console.error('Failed to fetch unavailable dates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date, slots } = await req.json();

    if (!date || !slots) {
      return NextResponse.json({ error: 'Date and slots are required' }, { status: 400 });
    }

    const result = await prisma.unavailableDate.upsert({
      where: { date },
      update: { timeSlots: slots },
      create: { date, timeSlots: slots },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update unavailable dates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 