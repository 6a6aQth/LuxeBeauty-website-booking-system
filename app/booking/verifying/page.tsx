"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

const successStates = [
  { text: "Processing Payment" },
  { text: "Payment Received" },
  { text: "Generating Ticket" },
  { text: "Appointment Confirmed" },
];
const failStates = [
  { text: "Processing Payment" },
  { text: "Payment Not Received" },
  { text: "Payment Failed" },
];

function VerifyingPayment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [loaderStep, setLoaderStep] = useState(0);
  const [finalStatus, setFinalStatus] = useState<'success' | 'failed' | null>(null);
  const [showLoader, setShowLoader] = useState(true);
  const [loaderStates, setLoaderStates] = useState(successStates);

  // Animate loader through the correct number of steps
  useEffect(() => {
    if (!showLoader) return;
    if (loaderStep < loaderStates.length - 1) {
      const timeout = setTimeout(() => {
        setLoaderStep((prev) => prev + 1);
      }, 1200);
      return () => clearTimeout(timeout);
    } else if (finalStatus) {
      // Loader finished, now handle final state
      setTimeout(() => {
        setShowLoader(false);
        if (finalStatus === 'success') {
          router.push('/booking/confirmation');
        }
        // If failed, error UI will show below
      }, 1200);
    }
  }, [loaderStep, showLoader, finalStatus, router, loaderStates.length]);

  useEffect(() => {
    const cancelled = searchParams.get('cancelled');
    if (cancelled) {
      setErrorMessage('You cancelled the payment.');
      setLoaderStates(failStates);
      setFinalStatus('failed');
      setStatus('failed');
      return;
    }
    const tx_ref = searchParams.get('tx_ref');
    const encodedFormData = searchParams.get('data');

    if (!tx_ref || !encodedFormData) {
      setErrorMessage('Transaction reference or form data not found in URL. Please try booking again.');
      setLoaderStates(failStates);
      setFinalStatus('failed');
      setStatus('failed');
      return;
    }

    let formData;
    try {
      formData = JSON.parse(atob(encodedFormData));
    } catch (error) {
      setErrorMessage('Failed to parse booking data from URL. The link may be corrupted.');
      setLoaderStates(failStates);
      setFinalStatus('failed');
      setStatus('failed');
      return;
    }

    const verifyPaymentAndCreateBooking = async () => {
      try {
        const verificationRes = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tx_ref, formData }),
        });

        if (!verificationRes.ok) {
          const errorData = await verificationRes.json();
          throw new Error(errorData.error || 'Payment verification failed on the server.');
        }

        const newBooking = await verificationRes.json();
        const bookingDetails = {
          ...newBooking,
          fee: "K100 (Paid)", // Adjusted amount
        };

        // Save final details for the confirmation page
        sessionStorage.setItem('lauryn-luxe-booking', JSON.stringify(bookingDetails));
        setLoaderStates(successStates);
        setFinalStatus('success');
        setStatus('success');
      } catch (error: any) {
        setErrorMessage(error.message || 'An unknown error occurred during verification.');
        setLoaderStates(failStates);
        setFinalStatus('failed');
        setStatus('failed');
      }
    };

    verifyPaymentAndCreateBooking();
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
      <MultiStepLoader
        loadingStates={loaderStates}
        loading={showLoader}
        duration={1200}
        loop={false}
        value={loaderStep}
      />
      {/* Show nothing else while loader is animating */}
      {!showLoader && status === 'failed' && (
        <div className="flex flex-col items-center justify-center w-full mt-4">
          {/* Error animation */}
          <img
            src="/error.gif"
            alt="Error animation"
            style={{ width: 180, height: 180, margin: '0 auto' }}
            className="mb-2"
          />
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#E11D48' }}>
            Payment Not Successful
          </h1>
          <p className="text-gray-700 mb-6">{errorMessage || 'Your payment could not be verified. Please try booking again.'}</p>
          <Button asChild>
            <Link href="/booking">Try Booking Again</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

// The main page export provides the Suspense boundary
export default function VerifyingPaymentPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-brand-pink mb-4" />
              <h1 className="text-2xl font-semibold text-gray-800">Loading...</h1>
            </div>
        }>
            <VerifyingPayment />
        </Suspense>
    )
} 