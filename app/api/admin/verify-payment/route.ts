import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { confirmBooking } from '@/lib/booking-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tx_ref, adminPassword } = body;

    console.log('🛠️ [PAYCHANGU-ADMIN] Admin payment verification requested:', {
      tx_ref,
      hasAdminPassword: !!adminPassword,
      timestamp: new Date().toISOString()
    });

    // Simple admin authentication
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD || adminPassword !== ADMIN_PASSWORD) {
      console.error('❌ [PAYCHANGU-ADMIN] Unauthorized admin access attempt:', {
        tx_ref,
        hasAdminPassword: !!adminPassword,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!tx_ref) {
      console.error('❌ [PAYCHANGU-ADMIN] Missing transaction reference:', {
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'Transaction reference required' }, { status: 400 });
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({ where: { ticketId: tx_ref } });
    if (!booking) {
      console.error('❌ [PAYCHANGU-ADMIN] Booking not found in database:', {
        tx_ref,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    console.log('📋 [PAYCHANGU-ADMIN] Booking found for verification:', {
      tx_ref,
      bookingId: booking.id,
      currentStatus: booking.status,
      customerName: booking.name,
      customerPhone: booking.phone,
      bookingDate: booking.date,
      bookingTime: booking.timeSlot,
      timestamp: new Date().toISOString()
    });

    // Verify with PayChangu
    const secretKey = process.env.PAYCHANGU_SECRET_KEY;
    if (!secretKey) {
      console.error('❌ [PAYCHANGU-ADMIN] Configuration error: PAYCHANGU_SECRET_KEY not configured');
      return NextResponse.json({ error: 'PayChangu secret key not configured' }, { status: 500 });
    }

    const verificationUrl = `https://api.paychangu.com/verify-payment/${tx_ref}`;

    console.log('🔍 [PAYCHANGU-ADMIN] Verifying payment with PayChangu:', {
      tx_ref,
      verificationUrl,
      timestamp: new Date().toISOString()
    });

    const verificationResponse = await fetch(verificationUrl, {
      headers: {
        'Authorization': `Bearer ${secretKey}`
      }
    });

    if (!verificationResponse.ok) {
      const errorBody = await verificationResponse.json().catch(() => ({ message: 'Could not parse error response' }));
      console.error('❌ [PAYCHANGU-ADMIN] PayChangu verification failed:', {
        tx_ref,
        status: verificationResponse.status,
        statusText: verificationResponse.statusText,
        errorBody,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({
        error: 'PayChangu verification failed',
        details: errorBody,
        booking: booking
      }, { status: 400 });
    }

    const verificationData = await verificationResponse.json();

    console.log('📊 [PAYCHANGU-ADMIN] PayChangu verification response:', {
      tx_ref,
      paychanguStatus: verificationData.status,
      paychanguDataStatus: verificationData.data?.status,
      paychanguAmount: verificationData.data?.amount,
      paychanguCurrency: verificationData.data?.currency,
      timestamp: new Date().toISOString()
    });

    // Update booking based on PayChangu response using the unified service
    let updatedBooking;
    if (verificationData.status === 'success' && verificationData.data.status === 'success') {
      try {
        updatedBooking = await confirmBooking({ ticketId: tx_ref }, 'admin_reverify');
        console.log('✅ [PAYCHANGU-ADMIN] Booking confirmed via unified service:', { tx_ref });
      } catch (confError: any) {
        console.error('❌ [PAYCHANGU-ADMIN] Confirmation service failed:', confError.message);
        return NextResponse.json({ error: 'PayChangu confirmed payment but final booking update failed.' }, { status: 500 });
      }
    } else {
      updatedBooking = await prisma.booking.update({
        where: { ticketId: tx_ref },
        data: { status: 'failed' }
      });
      console.log('❌ [PAYCHANGU-ADMIN] Booking status updated to failed:', { tx_ref });
    }

    console.log('🎉 [PAYCHANGU-ADMIN] Admin verification completed:', {
      tx_ref,
      customerName: booking.name,
      customerPhone: booking.phone,
      finalStatus: updatedBooking.status,
      paychanguResponse: verificationData,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Payment verification completed',
      booking: updatedBooking,
      paychanguResponse: verificationData
    });

  } catch (error: any) {
    console.error('💥 [PAYCHANGU-ADMIN] Unexpected error during admin verification:', {
      error: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 