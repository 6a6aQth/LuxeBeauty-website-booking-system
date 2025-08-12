import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status } = body as { status?: string };

    const allowedStatuses = ['pending', 'successful', 'failed'];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid or missing status. Allowed: ${allowedStatuses.join(', ')}` }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
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