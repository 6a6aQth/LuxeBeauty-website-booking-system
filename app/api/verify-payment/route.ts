import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendBookingSMS } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tx_ref, formData } = body;

    console.log('Received /api/verify-payment request:', { tx_ref, formData }); // New log

    if (!tx_ref || !formData) {
      console.error('Missing transaction reference or form data in request body.'); // Enhanced log
      return NextResponse.json({ error: 'Missing transaction reference or form data' }, { status: 400 });
    }

    console.log('tx_ref used for payment:', tx_ref); // before PaychanguCheckout

    // --- Start Real-time Verification ---
    const secretKey = process.env.PAYCHANGU_SECRET_KEY;
    if (!secretKey) {
      // In production, you should log this error and not expose it to the client.
      console.error('PayChangu secret key is not configured on the server. PAYCHANGU_SECRET_KEY:', secretKey); // Enhanced log
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    console.log('tx_ref used for verification:', tx_ref); // Log the tx_ref before verification
    const verificationUrl = `https://api.paychangu.com/verify-payment/${tx_ref}`;
    
    console.log('Attempting to verify payment with PayChangu at:', verificationUrl); // New log
    const verificationResponse = await fetch(verificationUrl, {
      headers: {
        'Authorization': `Bearer ${secretKey}`
      }
    });

    if (!verificationResponse.ok) {
      const errorBody = await verificationResponse.json().catch(() => ({ message: 'Could not parse error response from PayChangu.' }));
      console.error(`PayChangu verification failed! Status: ${verificationResponse.status}, Body:`, errorBody, `tx_ref: ${tx_ref}`); // Enhanced log
      return NextResponse.json({ error: 'Failed to verify transaction with payment provider.' }, { status: 502 });
    }

    const verificationData = await verificationResponse.json();
    console.log('PayChangu verificationData:', verificationData); // Log the full response for debugging
    console.log('tx_ref used for verification:', tx_ref); // in verify-payment route

    // Check if the transaction was successful according to PayChangu's data
    if (verificationData.status !== 'success' || verificationData.data.status !== 'success') {
        console.error('Payment not successful according to PayChangu. Verification data status:', verificationData.status, 'Data status:', verificationData.data.status, `tx_ref: ${tx_ref}`); // Enhanced log
        return NextResponse.json({ error: 'Payment not successful according to PayChangu.' }, { status: 400 });
    }

    // Optional but recommended: Verify the amount paid is what you expect
    const expectedAmount = 100; // The amount in MWK for the deposit
    if (verificationData.data.amount < expectedAmount) {
        console.error(`Payment amount incorrect. Expected at least ${expectedAmount}, but got ${verificationData.data.amount}. tx_ref: ${tx_ref}`); // Enhanced log
        return NextResponse.json({ error: `Payment amount incorrect. Expected at least ${expectedAmount}, but got ${verificationData.data.amount}` }, { status: 400 });
    }
    // --- End Real-time Verification ---

    // Loyalty Program Logic
    const bookingCount = await prisma.booking.count({ where: { phone: formData.phone } });
    const isDiscountBooking = (bookingCount + 1) % 6 === 0; // Apply discount on every 6th booking

    // If verification is successful, proceed to create the booking
    const ticketId = `LLB-${formData.date.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log('Attempting to create booking with data:', { // New log
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
    });

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

    // Send SMS confirmation (non-blocking)
    try {
      await sendBookingSMS(
        formData.phone,
        `Thank you for booking with Lauryn Luxe! Your appointment is confirmed for ${formData.date} at ${formData.timeSlot}.`
      );
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
    }

    console.log('Booking created successfully after real-time verification:', newBooking.id); // Original log

    return NextResponse.json(newBooking);

  } catch (error: any) {
    console.error('Verification or booking creation failed:', error.message, 'Stack:', error.stack); // Enhanced log
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}