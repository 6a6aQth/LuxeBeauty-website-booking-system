"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

function PaymentStatus() {
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState('Checking payment status...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const tx_ref = searchParams.get('tx_ref');
    const status = searchParams.get('status'); // Paychangu typically sends 'failed' here

    if (status === 'failed') {
      setStatusMessage('Your payment was not successful or was cancelled. Please try booking again.');
      setIsError(true);
    } else if (tx_ref) {
      // This case might be hit if the return_url is called for other reasons, 
      // or if you want to explicitly verify the tx_ref here as well (though it's not strictly needed if verifying on callback_url)
      setStatusMessage('We are unable to confirm your payment status at this moment. If you believe your payment was successful, please check your email for confirmation or contact support.');
      setIsError(true);
    } else {
      setStatusMessage('An unexpected error occurred. No transaction details found.');
      setIsError(true);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
      <div className="flex flex-col items-center justify-center w-full mt-4">
        {isError ? (
          <img
            src="/error.gif"
            alt="Error animation"
            style={{ width: 180, height: 180, margin: '0 auto' }}
            className="mb-2"
          />
        ) : (
          <Loader2 className="h-12 w-12 animate-spin text-brand-pink mb-4" />
        )}
        <h1 className="text-2xl font-bold mb-4" style={{ color: isError ? '#E11D48' : '#3B82F6' }}>
          {isError ? 'Payment Unsuccessful' : 'Processing...'}
        </h1>
        <p className="text-gray-700 mb-6">{statusMessage}</p>
        <Button asChild>
          <Link href="/booking">Try Booking Again</Link>
        </Button>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-pink mb-4" />
        <h1 className="text-2xl font-semibold text-gray-800">Loading...</h1>
      </div>
    }>
      <PaymentStatus />
    </Suspense>
  );
} 