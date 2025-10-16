import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logPaymentEvent } from '@/lib/paymentLogger';

export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    const { ticketId } = params;
    const { date, timeSlot, services, notes } = await req.json();

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    if (!date || !timeSlot || !services || !Array.isArray(services)) {
      return NextResponse.json({ 
        error: 'Date, timeSlot, and services are required' 
      }, { status: 400 });
    }

    // Find the existing booking
    const existingBooking = await prisma.booking.findUnique({
      where: { ticketId },
    });

    if (!existingBooking) {
      return NextResponse.json({ 
        message: 'No booking found with this Ticket ID' 
      }, { status: 404 });
    }

    // Only allow rescheduling of successful bookings
    if (existingBooking.status !== 'successful') {
      return NextResponse.json({ 
        message: 'Only successful bookings can be rescheduled' 
      }, { status: 400 });
    }

    // Verify services are still available
    const availableServices = await prisma.service.findMany({
      where: { 
        id: { in: services },
        isAvailable: true 
      },
    });

    if (availableServices.length !== services.length) {
      return NextResponse.json({ 
        message: 'Some selected services are no longer available' 
      }, { status: 400 });
    }

    // Check for conflicts with other bookings on the same date and time
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        date,
        timeSlot,
        status: 'successful',
        NOT: { ticketId }, // Exclude the current booking
      },
    });

    if (conflictingBooking) {
      return NextResponse.json({ 
        message: 'This time slot is already booked by another appointment' 
      }, { status: 409 });
    }

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { ticketId },
      data: {
        date,
        timeSlot,
        services,
        notes: notes || existingBooking.notes,
        updatedAt: new Date(),
      },
    });

    // Log the reschedule event
    await logPaymentEvent({
      txRef: ticketId,
      bookingId: updatedBooking.id,
      eventType: 'booking_rescheduled',
      status: 'successful',
      message: `Booking rescheduled to ${date} at ${timeSlot}`,
      payload: {
        oldDate: existingBooking.date,
        oldTimeSlot: existingBooking.timeSlot,
        newDate: date,
        newTimeSlot: timeSlot,
        services,
      },
    });

    console.log('✅ [RESCHEDULE] Booking updated successfully:', {
      ticketId,
      bookingId: updatedBooking.id,
      oldDate: existingBooking.date,
      oldTimeSlot: existingBooking.timeSlot,
      newDate: date,
      newTimeSlot: timeSlot,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Booking rescheduled successfully',
      booking: updatedBooking,
    });

  } catch (error: any) {
    console.error('Failed to reschedule booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
