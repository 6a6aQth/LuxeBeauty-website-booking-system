import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    const { ticketId } = params;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    // Find booking by ticketId
    const booking = await prisma.booking.findUnique({
      where: { ticketId },
    });

    if (!booking) {
      return NextResponse.json({ 
        message: 'No booking found with this Ticket ID',
        booking: null 
      }, { status: 404 });
    }

    // Only allow rescheduling of successful bookings
    if (booking.status !== 'successful') {
      return NextResponse.json({ 
        message: 'Only successful bookings can be rescheduled',
        booking: null 
      }, { status: 400 });
    }

    // Get service details for the booking
    const services = await prisma.service.findMany({
      where: { 
        id: { in: booking.services },
        isAvailable: true 
      },
    });

    // Check if any services are no longer available
    const unavailableServices = booking.services.filter(
      serviceId => !services.some(s => s.id === serviceId)
    );

    if (unavailableServices.length > 0) {
      return NextResponse.json({ 
        message: 'Some services in this booking are no longer available',
        booking: null 
      }, { status: 400 });
    }

    return NextResponse.json({
      booking,
      services,
    });

  } catch (error: any) {
    console.error('Failed to lookup booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
