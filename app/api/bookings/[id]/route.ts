import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { confirmBooking } from '@/lib/booking-service';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      date,
      timeSlot,
      services,
      notes,
      discountApplied,
      inspirationPhotos,
      status
    } = body;

    // Validate if fields are provided
    if (name !== undefined && !name) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    if (phone !== undefined && !phone) {
      return NextResponse.json({ error: 'Phone cannot be empty' }, { status: 400 });
    }
    if (date !== undefined && !date) {
      return NextResponse.json({ error: 'Date cannot be empty' }, { status: 400 });
    }
    if (timeSlot !== undefined && !timeSlot) {
      return NextResponse.json({ error: 'Time slot cannot be empty' }, { status: 400 });
    }
    if (services !== undefined && !Array.isArray(services)) {
      return NextResponse.json({ error: 'Services must be an array' }, { status: 400 });
    }

    // Validate status if provided
    if (status) {
      const allowedStatuses = ['pending', 'successful', 'failed'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({
          error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};

    // Add fields if provided in body
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (date !== undefined) updateData.date = date;
    if (timeSlot !== undefined) updateData.timeSlot = timeSlot;
    if (services !== undefined) updateData.services = services;

    // Add optional fields if provided
    if (email !== undefined) updateData.email = email;
    if (notes !== undefined) updateData.notes = notes;
    if (discountApplied !== undefined) updateData.discountApplied = discountApplied;
    if (Array.isArray(inspirationPhotos)) updateData.inspirationPhotos = inspirationPhotos;
    if (status) {
      // If updating to successful, use the unified service to ensure side-effects (SMS, loyalty)
      if (status === 'successful') {
        const updated = await confirmBooking({ id }, 'admin');
        return NextResponse.json(updated, { status: 200 });
      }
      updateData.status = status;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    console.error('Failed to update booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
  }

  try {
    await prisma.booking.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    console.error('Failed to delete booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 