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
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'delayed'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [loaderStep, setLoaderStep] = useState(0);
  const [finalStatus, setFinalStatus] = useState<'success' | 'failed' | 'delayed' | null>(null);
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

    // Retrieve formData from sessionStorage
    const storedFormData = sessionStorage.getItem('lauryn-luxe-booking-form');

    if (!tx_ref || !storedFormData) {
      setErrorMessage('Transaction reference or booking data not found. Please try booking again.');
      setLoaderStates(failStates);
      setFinalStatus('failed');
      setStatus('failed');
      return;
    }

    let formData: any;
    try {
      formData = JSON.parse(storedFormData);
    } catch (error) {
      setErrorMessage('Failed to parse stored booking data. Please try booking again.');
      setLoaderStates(failStates);
      setFinalStatus('failed');
      setStatus('failed');
      return;
    }

    const verifyPaymentAndCreateBooking = async () => {
      const maxRetries = 10;
      const pollingInterval = 3000; // 3 seconds

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const verificationRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tx_ref, formData }),
          });

          if (verificationRes.status === 202) {
            console.log(`[VERIFY-PAGE] Still processing, attempt ${attempt}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, pollingInterval));
            continue;
          }

          if (!verificationRes.ok) {
            const errorData = await verificationRes.json();
            throw new Error(errorData.error || 'Payment verification failed.');
          }

          const newBooking = await verificationRes.json();
          sessionStorage.setItem('lauryn-luxe-booking', JSON.stringify({
            ...newBooking,
            fee: "K10,000 (Paid)",
          }));

          setLoaderStates(successStates);
          setFinalStatus('success');
          setStatus('success');
          return;
        } catch (error: any) {
          if (attempt === maxRetries || error.message.includes('failed') || error.message.includes('expired')) {
            if (attempt === maxRetries && !error.message.includes('failed')) {
              setFinalStatus('delayed');
              setStatus('delayed');
              setShowLoader(false);
              toast({
                title: "Verification taking longer than expected",
                description: "Your payment may still be processing. Please don't worry.",
                variant: "destructive",
              });
            } else {
              setErrorMessage(error.message || 'Verification failed.');
              setLoaderStates(failStates);
              setFinalStatus('failed');
              setStatus('failed');
            }
            return;
          }
          await new Promise(resolve => setTimeout(resolve, pollingInterval));
        }
      }
    };

    verifyPaymentAndCreateBooking();
  }, [searchParams, router]);

  const tx_ref = searchParams.get('tx_ref');

  if (status === 'delayed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 mt-10">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
        </div>
        <h1 className="text-3xl font-serif text-gray-900 mb-4">Verification Delayed</h1>
        <div className="space-y-6 w-full">
          <p className="text-gray-600 leading-relaxed">
            Your payment has been initiated, but we're still waiting for final confirmation from PayChangu.
            <strong> Please do not pay again.</strong>
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Your Ticket ID</p>
            <p className="text-2xl font-mono font-bold text-black select-all break-all">{tx_ref}</p>
          </div>

          <div className="space-y-4 text-left bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
            <p className="text-sm font-semibold text-blue-900">Next Steps:</p>
            <ul className="text-sm text-blue-800/80 space-y-2 list-disc pl-5">
              <li>Keep this page open or save your Ticket ID.</li>
              <li>Check your SMS/WhatsApp in a few minutes for your confirmation ticket.</li>
              <li>If you don't receive a ticket within 30 minutes, message us with your Ticket ID.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full mt-10">
          <Link href="/contact" className="flex-1">
            <Button variant="outline" className="w-full border-gray-200 rounded-full py-6">
              Contact Support
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button className="w-full bg-black text-white rounded-full py-6 hover:bg-black/80 shadow-lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
      <MultiStepLoader
        loadingStates={loaderStates}
        loading={showLoader}
        duration={1200}
        loop={false}
        value={loaderStep}
      />
      {!showLoader && status === 'failed' && (
        <div className="flex flex-col items-center justify-center w-full mt-4">
          <img src="/error.gif" alt="Error" style={{ width: 180, height: 180 }} className="mb-2" />
          <h1 className="text-2xl font-bold mb-4 text-red-600">Payment Not Successful</h1>
          <p className="text-gray-700 mb-6 max-w-md">{errorMessage || 'Your payment could not be verified. Please try booking again.'}</p>
          <Button asChild className="rounded-full px-8">
            <Link href="/booking">Try Booking Again</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

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