"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

const loadingStates = [
  { text: "Processing Payment" },
  { text: "Payment Received" },
  { text: "Generating Ticket" },
  { text: "Appointment Confirmed" },
];

function VerifyingPayment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [loaderStep, setLoaderStep] = useState(2); // Start at 'Generating Ticket'
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const tx_ref = searchParams.get('tx_ref');
    const encodedFormData = searchParams.get('data');

    if (!tx_ref || !encodedFormData) {
      setErrorMessage('Transaction reference or form data not found in URL. Please try booking again.');
      setStatus('failed');
      return;
    }

    let formData;
    try {
      formData = JSON.parse(atob(encodedFormData));
    } catch (error) {
      setErrorMessage('Failed to parse booking data from URL. The link may be corrupted.');
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
          fee: "K1000 (Paid)", // Adjusted amount
        };

        // Save final details for the confirmation page
        sessionStorage.setItem('lauryn-luxe-booking', JSON.stringify(bookingDetails));
        
        setStatus('success');
        toast({ title: "Booking Confirmed!", description: "Your appointment has been successfully booked." });
        
        setLoaderStep(3); // Move to 'Appointment Confirmed'
        setTimeout(() => {
          setShowLoader(false); // Hide loader before redirect (optional)
          router.push('/booking/confirmation');
        }, 5000); // Show 'Appointment Confirmed' for 5 seconds

      } catch (error: any) {
        setErrorMessage(error.message || 'An unknown error occurred during verification.');
        setStatus('failed');
        toast({ title: "Booking Failed", description: error.message, variant: 'destructive' });
        setShowLoader(false); // Hide loader on error
      }
    };

    verifyPaymentAndCreateBooking();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={showLoader}
        duration={1500}
        loop={false}
        value={loaderStep}
      />
      {status === 'verifying' && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-brand-pink mb-4" />
          <h1 className="text-2xl font-semibold text-gray-800">Verifying Your Payment...</h1>
          <p className="text-gray-600 mt-2">Please do not refresh or close this page.</p>
        </>
      )}
      {status === 'failed' && (
        <>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h1>
          <p className="text-gray-700 mb-6">{errorMessage}</p>
          <Button asChild>
            <Link href="/booking">Try Booking Again</Link>
          </Button>
        </>
      )}
      {status === 'success' && (
        <>
          <h1 className="text-2xl font-bold text-green-600">Verification Successful!</h1>
          <p className="text-gray-600 mt-2">Redirecting you to your booking confirmation...</p>
        </>
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