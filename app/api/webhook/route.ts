import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to verify payment with PayChangu
async function verifyPayChanguPayment(tx_ref: string) {
  const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY;
  if (!PAYCHANGU_SECRET_KEY) throw new Error('PayChangu secret key not configured.');

  const response = await fetch(`https://api.paychangu.com/transaction/verify/${tx_ref}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${PAYCHANGU_SECRET_KEY}`,
    },
  });
  if (!response.ok) throw new Error('Failed to verify payment with PayChangu');
  return response.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // PayChangu should send tx_ref and meta (booking data) in the webhook
    const { tx_ref, meta } = body;
    if (!tx_ref || !meta) {
      return NextResponse.json({ error: 'Missing tx_ref or meta in webhook.' }, { status: 400 });
    }

    // 1. Verify payment status with PayChangu
    const verificationData = await verifyPayChanguPayment(tx_ref);
    if (verificationData.status !== 'success' || verificationData.data.status !== 'success') {
      return NextResponse.json({ error: 'Payment not successful according to PayChangu.' }, { status: 400 });
    }

    // 2. Idempotency: Check if booking already exists for this tx_ref (ticketId)
    const ticketId = tx_ref; // Use tx_ref as unique ticketId
    const existing = await prisma.booking.findUnique({ where: { ticketId } });
    if (existing) {
      return NextResponse.json({ message: 'Booking already exists for this payment.', booking: existing }, { status: 200 });
    }

    // 3. Create booking in DB
    const newBooking = await prisma.booking.create({
      data: {
        name: meta.name,
        phone: meta.phone,
        email: meta.email,
        date: meta.date,
        timeSlot: meta.timeSlot,
        services: meta.services,
        notes: meta.notes,
        inspirationPhotos: meta.inspirationPhotos || [],
        ticketId: ticketId,
        discountApplied: meta.discountApplied || false,
      },
    });

    return NextResponse.json({ message: 'Booking created successfully.', booking: newBooking }, { status: 201 });
  } catch (error: any) {
    console.error('Webhook error:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 