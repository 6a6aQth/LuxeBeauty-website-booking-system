import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logPaymentEvent } from '@/lib/paymentLogger';
import { confirmBooking } from '@/lib/booking-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tx_ref, formData } = body;

    console.log('🔍 [PAYCHANGU-VERIFY] Starting payment verification:', {
      tx_ref,
      customerName: formData?.name,
      customerPhone: formData?.phone,
      timestamp: new Date().toISOString()
    });

    if (!tx_ref || !formData) {
      console.error('❌ [PAYCHANGU-VERIFY] Missing data:', {
        hasTxRef: !!tx_ref,
        hasFormData: !!formData,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ error: 'Missing transaction reference or form data' }, { status: 400 });
    }

    // --- Start Real-time Verification with Retry Logic ---
    const secretKey = process.env.PAYCHANGU_SECRET_KEY;
    if (!secretKey) {
      console.error('❌ [PAYCHANGU-VERIFY] Configuration error: PAYCHANGU_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const verificationUrl = `https://api.paychangu.com/verify-payment/${tx_ref}`;

    // Retry logic with exponential backoff
    let verificationData = null;
    let lastError = null;
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [PAYCHANGU-VERIFY] Attempt ${attempt}/${maxRetries} for tx_ref: ${tx_ref}`, {
          attempt,
          maxRetries,
          tx_ref,
          verificationUrl,
          timestamp: new Date().toISOString()
        });
        await logPaymentEvent({ txRef: tx_ref, eventType: 'verify_attempt', attempt, message: 'Starting verify attempt' });

        const verificationResponse = await fetch(verificationUrl, {
          headers: {
            'Authorization': `Bearer ${secretKey}`
          }
        });

        if (!verificationResponse.ok) {
          const errorBody = await verificationResponse.json().catch(() => ({ message: 'Could not parse error response from PayChangu.' }));
          console.error(`❌ [PAYCHANGU-VERIFY] API Error on attempt ${attempt}:`, {
            attempt,
            maxRetries,
            tx_ref,
            status: verificationResponse.status,
            statusText: verificationResponse.statusText,
            errorBody,
            timestamp: new Date().toISOString()
          });
          await logPaymentEvent({ txRef: tx_ref, eventType: 'verify_error', attempt, httpStatus: verificationResponse.status, message: 'Verify HTTP error', payload: errorBody });

          if (attempt === maxRetries) {
            console.error(`💥 [PAYCHANGU-VERIFY] All ${maxRetries} attempts failed for tx_ref: ${tx_ref}`, {
              tx_ref,
              totalAttempts: maxRetries,
              finalError: errorBody,
              timestamp: new Date().toISOString()
            });
            await logPaymentEvent({ txRef: tx_ref, eventType: 'verify_failed', attempt, message: 'All verify attempts failed' });
            return NextResponse.json({ error: 'Failed to verify transaction with payment provider after multiple attempts.' }, { status: 502 });
          }

          // Wait before retry with exponential backoff
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ [PAYCHANGU-VERIFY] Waiting ${delay}ms before retry ${attempt + 1} for tx_ref: ${tx_ref}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        verificationData = await verificationResponse.json();
        console.log(`✅ [PAYCHANGU-VERIFY] Success on attempt ${attempt} for tx_ref: ${tx_ref}`, {
          attempt,
          tx_ref,
          paychanguStatus: verificationData.status,
          paychanguDataStatus: verificationData.data?.status,
          paychanguAmount: verificationData.data?.amount,
          paychanguCurrency: verificationData.data?.currency,
          timestamp: new Date().toISOString()
        });
        await logPaymentEvent({ txRef: tx_ref, eventType: 'verify_success', attempt, status: verificationData.status, payload: verificationData });

        // If we get here, the request was successful
        break;

      } catch (error: any) {
        console.error(`💥 [PAYCHANGU-VERIFY] Network/parsing error on attempt ${attempt}:`, {
          attempt,
          maxRetries,
          tx_ref,
          error: error.message,
          errorStack: error.stack,
          timestamp: new Date().toISOString()
        });
        lastError = error;

        if (attempt === maxRetries) {
          console.error(`💥 [PAYCHANGU-VERIFY] All ${maxRetries} attempts failed due to network errors for tx_ref: ${tx_ref}`, {
            tx_ref,
            totalAttempts: maxRetries,
            finalError: lastError.message,
            timestamp: new Date().toISOString()
          });
          await logPaymentEvent({ txRef: tx_ref, eventType: 'verify_failed_network', attempt, message: 'All verify attempts failed (network)' });
          return NextResponse.json({ error: 'Failed to verify transaction with payment provider.' }, { status: 502 });
        }

        // Wait before retry with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ [PAYCHANGU-VERIFY] Waiting ${delay}ms before retry ${attempt + 1} for tx_ref: ${tx_ref}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Check if the transaction was successful according to PayChangu's data
    if (verificationData.status !== 'success' || (verificationData.data.status !== 'success' && verificationData.data.status !== 'paid')) {
      console.warn(`⚠️ [PAYCHANGU-VERIFY] Payment not yet successful according to PayChangu for tx_ref: ${tx_ref}`, {
        tx_ref,
        paychanguStatus: verificationData.status,
        paychanguDataStatus: verificationData.data?.status,
        paychanguMessage: verificationData.message,
        timestamp: new Date().toISOString()
      });
      await logPaymentEvent({ txRef: tx_ref, eventType: 'verify_provider_pending', status: verificationData.status, message: 'Provider returned not-success (pending)', payload: verificationData });

      // IMPORTANT: We DO NOT mark the booking as 'failed' here. 
      // We want to give the webhook or subsequent pulls a chance.
      // If it's explicitly 'failed' or 'cancelled' from Paychangu, we could, 
      // but often 'pending' just means we beat the webhook.

      if (verificationData.data?.status === 'failed' || verificationData.data?.status === 'expired') {
        await prisma.booking.update({
          where: { ticketId: tx_ref },
          data: { status: 'failed' },
        });
        await logPaymentEvent({ txRef: tx_ref, eventType: 'verify_mark_failed', status: 'failed', message: 'Marked failed after provider explicit failure' });
        return NextResponse.json({ error: 'Payment failed or expired according to provider.' }, { status: 400 });
      }

      // Return a 'processing' status to the frontend instead of an error
      return NextResponse.json({ status: 'processing', message: 'Payment is still being processed.' }, { status: 202 });
    }

    // Optional but recommended: Verify the amount paid is what you expect
    const expectedAmount = 10000; // The amount in MWK for the deposit
    if (verificationData.data.amount < expectedAmount) {
      console.warn(`⚠️ [PAYCHANGU-VERIFY] Insufficient payment amount for tx_ref: ${tx_ref}`, {
        tx_ref,
        expectedAmount,
        actualAmount: verificationData.data.amount,
        currency: verificationData.data.currency,
        timestamp: new Date().toISOString()
      });
      await logPaymentEvent({ txRef: tx_ref, eventType: 'verify_insufficient_amount', status: 'pending', message: 'Insufficient amount detected', payload: { expectedAmount, actualAmount: verificationData.data.amount } });

      // Again, don't mark as failed immediately if there's any ambiguity, 
      // but here the amount is definitively low. However, to be safe and avoid 
      // blocking a potentially corrected webhook, we just return an error to the user
      // without necessarily corrupting the DB state if they want to try verifying again.

      return NextResponse.json({ error: `Payment amount incorrect. Expected at least ${expectedAmount}, but got ${verificationData.data.amount}` }, { status: 400 });
    }

    // Use the unified confirmation service to handle status update, loyalty, SMS, and logging
    try {
      const updatedBooking = await confirmBooking({ ticketId: tx_ref }, 'user_verify');
      return NextResponse.json(updatedBooking);
    } catch (confError: any) {
      console.error(`❌ [PAYCHANGU-VERIFY] Confirmation service failed for tx_ref: ${tx_ref}`, confError.message);
      return NextResponse.json({ error: 'Payment verified but final booking update failed. Please contact us.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error(`💥 [PAYCHANGU-VERIFY] Unexpected error during verification:`, {
      error: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}