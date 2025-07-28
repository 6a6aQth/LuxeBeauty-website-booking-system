import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createHmac } from 'crypto';
import { sendBookingSMS } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    console.log('PayChangu webhook endpoint hit');
    // 1. Get the raw body for signature verification
    const rawBody = await req.text();
    console.log('Raw webhook body:', rawBody);
    const body = JSON.parse(rawBody);

    // 2. Verify webhook signature for security
    const signature = req.headers.get('signature');
    const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
    console.log('Signature header:', signature);
    if (!webhookSecret) {
      console.error('Webhook secret not configured.');
      return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
    }
    const computedSignature = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    console.log('Computed signature:', computedSignature);
    if (computedSignature !== signature) {
      console.error('Invalid signature.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Check event type and payment status
    const eventType = body.event || body.type;
    const eventData = body.data;
    console.log('Event type:', eventType);
    console.log('Event data:', eventData);

    if (eventType !== 'payment.success' && eventData?.status !== 'success') {
      console.log('Not a successful payment event.');
      return NextResponse.json({ message: 'Not a successful payment event.' }, { status: 200 });
    }

    // 4. Extract booking info from meta or tx_ref
    const meta = eventData?.meta || {};
    const tx_ref = eventData?.tx_ref;
    console.log('Meta:', meta);
    console.log('tx_ref:', tx_ref);

    // Defensive: Check if booking already exists (by tx_ref or ticketId)
    const existing = await prisma.booking.findFirst({ where: { ticketId: tx_ref } });
    if (!existing) {
      console.error('Booking not found for tx_ref:', tx_ref);
      return NextResponse.json({ error: 'Booking not found for this transaction reference.' }, { status: 404 });
    }

    // Update booking status to 'successful'
    const updatedBooking = await prisma.booking.update({
      where: { ticketId: tx_ref },
      data: {
        status: 'successful',
        discountApplied: (existing.discountApplied || meta.loyaltyDiscountEligible || false),
      },
    });

    // Send SMS confirmation (non-blocking)
    try {
      await sendBookingSMS(
        meta.phone,
        `Thank you for booking with Lauryn Luxe! Your appointment is confirmed for ${meta.date} at ${meta.timeSlot}.`
      );
      console.log('SMS sent successfully to:', meta.phone);
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
    }

    return NextResponse.json({ message: 'Booking updated', booking: updatedBooking }, { status: 200 });
  } catch (error: any) {
    console.error('PayChangu webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 