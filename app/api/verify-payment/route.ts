import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tx_ref, formData } = body;

    if (!tx_ref || !formData) {
      return NextResponse.json({ error: 'Missing transaction reference or form data' }, { status: 400 });
    }

    console.log('tx_ref used for payment:', tx_ref); // before PaychanguCheckout

    // --- Start Real-time Verification ---
    const secretKey = process.env.PAYCHANGU_SECRET_KEY;
    if (!secretKey) {
      // In production, you should log this error and not expose it to the client.
      console.error('PayChangu secret key is not configured on the server.');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    console.log('tx_ref used for verification:', tx_ref); // Log the tx_ref before verification
    const verificationUrl = `https://api.paychangu.com/verify-payment/${tx_ref}`;
    
    const verificationResponse = await fetch(verificationUrl, {
      headers: {
        'Authorization': `Bearer ${secretKey}`
      }
    });

    if (!verificationResponse.ok) {
      // Log the detailed error from PayChangu to the server logs for debugging
      const errorBody = await verificationResponse.json().catch(() => ({ message: 'Could not parse error response from PayChangu.' }));
      console.error(`PayChangu verification failed! Status: ${verificationResponse.status}, Body:`, errorBody);
      
      // Could not connect to PayChangu's server or other network issue
      return NextResponse.json({ error: 'Failed to verify transaction with payment provider.' }, { status: 502 }); // Bad Gateway
    }

    const verificationData = await verificationResponse.json();
    console.log('PayChangu verificationData:', verificationData); // Log the full response for debugging
    console.log('tx_ref used for verification:', tx_ref); // in verify-payment route

    // Check if the transaction was successful according to PayChangu's data
    if (verificationData.status !== 'success' || verificationData.data.status !== 'success') {
        return NextResponse.json({ error: 'Payment not successful according to PayChangu.' }, { status: 400 });
    }

    // Optional but recommended: Verify the amount paid is what you expect
    const expectedAmount = 100; // The amount in MWK for the deposit
    if (verificationData.data.amount < expectedAmount) {
        // This prevents someone from paying 1 MWK and getting a full booking
        return NextResponse.json({ error: `Payment amount incorrect. Expected at least ${expectedAmount}, but got ${verificationData.data.amount}` }, { status: 400 });
    }
    // --- End Real-time Verification ---

    // Loyalty Program Logic
    const bookingCount = await prisma.booking.count({ where: { phone: formData.phone } });
    const isDiscountBooking = (bookingCount + 1) % 6 === 0; // Apply discount on every 6th booking

    // If verification is successful, proceed to create the booking
    const ticketId = `LLB-${formData.date.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = await prisma.booking.create({
      data: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        date: formData.date,
        timeSlot: formData.timeSlot,
        services: formData.services,
        notes: formData.notes,
        inspirationPhotos: formData.inspirationPhotos,
        ticketId: ticketId,
        discountApplied: isDiscountBooking,
      },
    });

    console.log('Booking created successfully after real-time verification:', newBooking.id);

    return NextResponse.json(newBooking);

  } catch (error: any) {
    console.error('Verification or booking creation failed:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}