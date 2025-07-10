import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { formData, loyaltyDiscountEligible, amount, return_url } = await req.json();

    const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

    if (!PAYCHANGU_SECRET_KEY) {
      return NextResponse.json({ message: 'Paychangu secret key not configured.' }, { status: 500 });
    }

    // Construct tx_ref unique for every transaction
    const tx_ref = `LLB-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    // Always set callback_url to the webhook endpoint
    const callback_url = `${APP_URL}/api/webhook`;
    // Always set return_url to the user-facing status page
    const safe_return_url = `${APP_URL}/booking/status`;

    const paychanguRequestBody = {
      amount,
      currency: "MWK", // Assuming MWK as per your project's context
      email: formData.email,
      first_name: formData.name.split(' ')[0] || formData.name,
      last_name: formData.name.split(' ').slice(1).join(' ') || formData.name,
      callback_url,
      return_url: safe_return_url,
      tx_ref,
      customization: {
        title: "Lauryn Luxe Booking Deposit",
        description: "Booking deposit for Lauryn Luxe Beauty Studio",
      },
      meta: {
        ...formData,
        loyaltyDiscountEligible: loyaltyDiscountEligible,
        discountApplied: loyaltyDiscountEligible, // for consistency with DB
      },
    };

    const paychanguResponse = await fetch('https://api.paychangu.com/payment', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${PAYCHANGU_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paychanguRequestBody),
    });

    const paychanguData = await paychanguResponse.json();

    if (paychanguResponse.ok && paychanguData.status === 'success' && paychanguData.data?.checkout_url) {
      return NextResponse.json({ checkout_url: paychanguData.data.checkout_url });
    } else {
      console.error('Paychangu API error:', paychanguData);
      return NextResponse.json(
        { message: paychanguData.message || 'Failed to initiate payment with Paychangu.' },
        { status: paychanguResponse.status || 500 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
} 