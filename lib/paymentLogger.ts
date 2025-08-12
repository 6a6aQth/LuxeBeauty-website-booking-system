import prisma from '@/lib/prisma';

type PaymentEventInput = {
  txRef: string;
  bookingId?: string | null;
  eventType: string;
  status?: string | null;
  httpStatus?: number | null;
  message?: string | null;
  payload?: unknown;
  attempt?: number | null;
};

export async function logPaymentEvent(event: PaymentEventInput): Promise<void> {
  try {
    // Get the next sequence number for this tx_ref
    const existingCount = await prisma.paymentEvent.count({
      where: { txRef: event.txRef }
    });
    const sequence = existingCount + 1;

    await prisma.paymentEvent.create({
      data: {
        txRef: event.txRef,
        bookingId: event.bookingId ?? null,
        eventType: event.eventType,
        status: event.status ?? null,
        httpStatus: event.httpStatus ?? null,
        message: event.message ?? null,
        payload: (event.payload as any) ?? null,
        attempt: event.attempt ?? 0,
        sequence: sequence,
      },
    });
  } catch (error: any) {
    // Never throw from logger to avoid breaking primary flows
    console.error('💥 [PAYMENT-EVENT-LOGGER] Failed to persist payment event', {
      error: error?.message,
      txRef: event.txRef,
      eventType: event.eventType,
    });
  }
}

