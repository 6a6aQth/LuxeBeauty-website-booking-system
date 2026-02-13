import prisma from './prisma';
import { sendBookingSMS } from './sms';
import { logPaymentEvent } from './paymentLogger';

/**
 * Unified service to confirm a booking as successful.
 * This ensures that loyalty logic, SMS notifications, and audit logging
 * are triggered consistently regardless of whether the confirmation
 * comes from the PayChangu webhook, user polling, or admin manual action.
 */
export async function confirmBooking(identifier: { id?: string; ticketId?: string }, source: string) {
    const { id, ticketId } = identifier;

    // 1. Fetch the booking
    const booking = await prisma.booking.findUnique({
        where: id ? { id } : { ticketId }
    });

    if (!booking) {
        throw new Error(`Booking not found for ${id ? `ID: ${id}` : `Ticket ID: ${ticketId}`}`);
    }

    const tx_ref = booking.ticketId;

    // 2. Idempotency check: Skip if already successful
    if (booking.status === 'successful') {
        console.log(`ℹ️ [BOOKING-SERVICE] Booking ${tx_ref} already marked as successful. Source: ${source}`);
        await logPaymentEvent({
            txRef: tx_ref,
            bookingId: booking.id,
            eventType: `${source}_already_success`,
            status: 'successful',
            message: 'Booking already marked as successful'
        });
        return booking;
    }

    // 3. Loyalty Program Logic
    // Count existing successful bookings for this phone (excluding current one)
    const existingSuccessfulCount = await prisma.booking.count({
        where: {
            phone: booking.phone,
            status: 'successful',
            NOT: { id: booking.id }
        }
    });

    const isEligibleForDiscount = (existingSuccessfulCount + 1) % 6 === 0;

    console.log(`🎯 [BOOKING-SERVICE] Loyalty calculation for ${tx_ref}:`, {
        phone: booking.phone,
        countBefore: existingSuccessfulCount,
        isEligible: isEligibleForDiscount,
        source
    });

    // 4. Update Database
    const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
            status: 'successful',
            discountApplied: isEligibleForDiscount,
        },
    });

    // 5. Audit Logging
    await logPaymentEvent({
        txRef: tx_ref,
        bookingId: updatedBooking.id,
        eventType: `${source}_mark_success`,
        status: 'successful',
        message: `Marked booking successful via ${source}`
    });

    // 6. Non-blocking SMS Notification
    // We don't await this to avoid slowing down the response, but we wrap in try/catch
    (async () => {
        try {
            await sendBookingSMS(
                booking.phone,
                `Thank you for booking with Lauryn Luxe! Your appointment is confirmed for ${booking.date} at ${booking.timeSlot}.`
            );
            console.log(`📱 [BOOKING-SERVICE] SMS sent for ${tx_ref}`);
        } catch (smsError: any) {
            console.error(`❌ [BOOKING-SERVICE] SMS failed for ${tx_ref}:`, smsError.message);
        }
    })();

    return updatedBooking;
}
