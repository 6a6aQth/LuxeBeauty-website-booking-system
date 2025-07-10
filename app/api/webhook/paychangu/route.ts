import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createHmac } from 'crypto';
import { sendBookingSMS } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    // 1. Get the raw body for signature verification
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // 2. Verify webhook signature for security
    const signature = req.headers.get('signature');
    const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
    }
    const computedSignature = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    if (computedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Check event type and payment status
    const eventType = body.event || body.type;
    const eventData = body.data;

    if (eventType !== 'payment.success' && eventData?.status !== 'success') {
      return NextResponse.json({ message: 'Not a successful payment event.' }, { status: 200 });
    }

    // 4. Extract booking info from meta or tx_ref
    const meta = eventData?.meta || {};
    const tx_ref = eventData?.tx_ref;

    // Defensive: Check if booking already exists (by tx_ref or ticketId)
    const existing = await prisma.booking.findFirst({ where: { ticketId: tx_ref } });
    if (existing) {
      return NextResponse.json({ message: 'Booking already exists.' }, { status: 200 });
    }

    // 5. Create the booking in the database
    const ticketId = tx_ref;
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
        discountApplied: meta.loyaltyDiscountEligible || false,
      },
    });

    // Send SMS confirmation (non-blocking)
    try {
      await sendBookingSMS(
        meta.phone,
        `Thank you for booking with Lauryn Luxe! Your appointment is confirmed for ${meta.date} at ${meta.timeSlot}.`
      );
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
    }

    return NextResponse.json({ message: 'Booking created', booking: newBooking }, { status: 201 });
  } catch (error: any) {
    console.error('PayChangu webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 