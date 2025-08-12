import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createHmac } from 'crypto';
import { sendBookingSMS } from '@/lib/sms';
import { logPaymentEvent } from '@/lib/paymentLogger';

export async function POST(req: NextRequest) {
  try {
    console.log('🔔 [PAYCHANGU-WEBHOOK] Webhook endpoint hit', {
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('user-agent'),
      contentType: req.headers.get('content-type')
    });

    // 1. Get the raw body for signature verification
    const rawBody = await req.text();
    console.log('📄 [PAYCHANGU-WEBHOOK] Raw webhook body received:', {
      bodyLength: rawBody.length,
      timestamp: new Date().toISOString()
    });

    const body = JSON.parse(rawBody);

    // 2. Verify webhook signature for security
    const signature = req.headers.get('signature');
    const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
    
    console.log('🔐 [PAYCHANGU-WEBHOOK] Signature verification:', {
      hasSignature: !!signature,
      hasWebhookSecret: !!webhookSecret,
      timestamp: new Date().toISOString()
    });
    
    if (!webhookSecret) {
      console.error('❌ [PAYCHANGU-WEBHOOK] Configuration error: PAYCHANGU_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
    }
    
    const computedSignature = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    
    // More robust signature verification with detailed logging
    if (!signature) {
      console.error('❌ [PAYCHANGU-WEBHOOK] No signature header received from PayChangu', {
        timestamp: new Date().toISOString()
      });
      await logPaymentEvent({ txRef: body?.data?.tx_ref ?? 'unknown', eventType: 'webhook_error', message: 'No signature header', payload: { headers: Object.fromEntries(req.headers) } });
      return NextResponse.json({ error: 'No signature header' }, { status: 401 });
    }
    
    if (computedSignature !== signature) {
      console.error('❌ [PAYCHANGU-WEBHOOK] Invalid signature:', {
        expected: computedSignature,
        received: signature,
        timestamp: new Date().toISOString()
      });
      await logPaymentEvent({ txRef: body?.data?.tx_ref ?? 'unknown', eventType: 'webhook_error', message: 'Invalid signature', payload: { expected: computedSignature, received: signature } });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('✅ [PAYCHANGU-WEBHOOK] Signature verification successful');

    // 3. Check event type and payment status
    const eventType = body.event || body.type;
    const eventData = body.data;
    
    console.log('📋 [PAYCHANGU-WEBHOOK] Event details:', {
      eventType,
      eventDataStatus: eventData?.status,
      txRef: eventData?.tx_ref,
      timestamp: new Date().toISOString()
    });

    if (eventType !== 'payment.success' && eventData?.status !== 'success') {
      console.log('⚠️ [PAYCHANGU-WEBHOOK] Not a successful payment event:', {
        eventType,
        eventDataStatus: eventData?.status,
        timestamp: new Date().toISOString()
      });
      await logPaymentEvent({ txRef: eventData?.tx_ref ?? 'unknown', eventType: 'webhook_ignored', status: eventData?.status, message: 'Not a successful payment event', payload: body });
      return NextResponse.json({ message: 'Not a successful payment event.' }, { status: 200 });
    }

    // 4. Extract booking info from meta or tx_ref
    const meta = eventData?.meta || {};
    const tx_ref = eventData?.tx_ref;
    
    console.log('📊 [PAYCHANGU-WEBHOOK] Payment data extracted:', {
      tx_ref,
      customerName: meta.name,
      customerPhone: meta.phone,
      customerEmail: meta.email,
      bookingDate: meta.date,
      bookingTime: meta.timeSlot,
      amount: eventData?.amount,
      currency: eventData?.currency,
      timestamp: new Date().toISOString()
    });

    if (!tx_ref) {
      console.error('❌ [PAYCHANGU-WEBHOOK] No tx_ref found in webhook data', {
        eventData,
        timestamp: new Date().toISOString()
      });
      await logPaymentEvent({ txRef: 'unknown', eventType: 'webhook_error', message: 'No tx_ref in webhook', payload: body });
      return NextResponse.json({ error: 'No transaction reference found' }, { status: 400 });
    }

    // Defensive: Check if booking already exists (by tx_ref or ticketId)
    const existing = await prisma.booking.findFirst({ where: { ticketId: tx_ref } });
    if (!existing) {
      console.error('❌ [PAYCHANGU-WEBHOOK] Booking not found in database:', {
        tx_ref,
        timestamp: new Date().toISOString()
      });
      await logPaymentEvent({ txRef: tx_ref, eventType: 'webhook_no_booking', message: 'Booking not found for tx_ref', payload: body });
      return NextResponse.json({ error: 'Booking not found for this transaction reference.' }, { status: 404 });
    }

    console.log('📋 [PAYCHANGU-WEBHOOK] Existing booking found:', {
      tx_ref,
      bookingId: existing.id,
      currentStatus: existing.status,
      customerName: existing.name,
      customerPhone: existing.phone,
      bookingDate: existing.date,
      bookingTime: existing.timeSlot,
      timestamp: new Date().toISOString()
    });

    // Check if booking is already successful to avoid unnecessary updates
    if (existing.status === 'successful') {
      console.log('ℹ️ [PAYCHANGU-WEBHOOK] Booking already marked as successful:', {
        tx_ref,
        bookingId: existing.id,
        timestamp: new Date().toISOString()
      });
      await logPaymentEvent({ txRef: tx_ref, bookingId: existing.id, eventType: 'webhook_already_success', status: 'successful', message: 'Booking already marked as successful' });
      return NextResponse.json({ message: 'Booking already successful' }, { status: 200 });
    }

    // Calculate loyalty discount eligibility (consistent with verify-payment logic)
    // Exclude the current booking from the count since it's not yet marked as successful
    const existingSuccessfulBookingsCount = await prisma.booking.count({ 
      where: { 
        phone: meta.phone, 
        status: 'successful',
        // Exclude the current booking from the count
        NOT: { ticketId: tx_ref }
      } 
    });
    const isEligibleForDiscount = (existingSuccessfulBookingsCount + 1) % 6 === 0;
    
    console.log('🎯 [PAYCHANGU-WEBHOOK] Loyalty discount calculation:', {
      tx_ref,
      customerPhone: meta.phone,
      existingSuccessfulBookingsCount,
      newBookingNumber: existingSuccessfulBookingsCount + 1,
      isEligibleForDiscount,
      frontendLoyaltyEligible: meta.loyaltyDiscountEligible,
      discountLogic: `(${existingSuccessfulBookingsCount} + 1) % 6 === 0`,
      timestamp: new Date().toISOString()
    });

    // Update booking status to 'successful'
    const updatedBooking = await prisma.booking.update({
      where: { ticketId: tx_ref },
      data: {
        status: 'successful',
        discountApplied: isEligibleForDiscount,
      },
    });
    await logPaymentEvent({ txRef: tx_ref, bookingId: updatedBooking.id, eventType: 'webhook_mark_success', status: 'successful', message: 'Marked booking successful via webhook', payload: eventData });

    console.log('✅ [PAYCHANGU-WEBHOOK] Booking status updated successfully:', {
      tx_ref,
      bookingId: updatedBooking.id,
      oldStatus: existing.status,
      newStatus: 'successful',
      discountApplied: updatedBooking.discountApplied,
      timestamp: new Date().toISOString()
    });

    // Send SMS confirmation (non-blocking)
    try {
      await sendBookingSMS(
        meta.phone,
        `Thank you for booking with Lauryn Luxe! Your appointment is confirmed for ${meta.date} at ${meta.timeSlot}.`
      );
      console.log('📱 [PAYCHANGU-WEBHOOK] SMS confirmation sent:', {
        tx_ref,
        customerPhone: meta.phone,
        smsContent: `Thank you for booking with Lauryn Luxe! Your appointment is confirmed for ${meta.date} at ${meta.timeSlot}.`,
        timestamp: new Date().toISOString()
      });
    } catch (smsError: any) {
      console.error('❌ [PAYCHANGU-WEBHOOK] SMS sending failed:', {
        tx_ref,
        customerPhone: meta.phone,
        smsError: smsError.message,
        timestamp: new Date().toISOString()
      });
      // Don't fail the webhook if SMS fails
    }

    console.log('🎉 [PAYCHANGU-WEBHOOK] Webhook processing completed successfully:', {
      tx_ref,
      customerName: meta.name,
      customerPhone: meta.phone,
      bookingDate: meta.date,
      bookingTime: meta.timeSlot,
      paychanguAmount: eventData?.amount,
      paychanguCurrency: eventData?.currency,
      finalStatus: 'successful',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ message: 'Booking updated', booking: updatedBooking }, { status: 200 });
  } catch (error: any) {
    console.error('💥 [PAYCHANGU-WEBHOOK] Unexpected error during webhook processing:', {
      error: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 