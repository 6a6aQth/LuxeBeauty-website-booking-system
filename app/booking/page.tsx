"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { parseISO, format, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getSlotsForDate, formatTime } from "@/lib/time-slots"
import { Checkbox } from "@/components/ui/checkbox"
import { StudioPolicies } from "@/components/studio-policies"
import { AnimatedSection } from "@/components/ui/animated-section"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import BookingStatus from "@/components/booking-status"
import { PageHeader } from "@/components/page-header"
import { MultiStepLoader } from "@/components/ui/multi-step-loader"
import { FileUpload } from "@/components/ui/file-upload"
import { BookingForm } from "@/components/booking-form"
import useSWR from 'swr';

declare global {
  interface Window {
    PaychanguCheckout?: any;
  }
}

const loadingStates = [
  { text: "Processing Payment" },
  { text: "Payment Received" },
  { text: "Generating Ticket" },
  { text: "Appointment Confirmed" },
]

// Helper to get tomorrow's date in yyyy-mm-dd format
function getMinBookingDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// Helper to get max booking date (e.g., 1 year from now)
function getMaxBookingDate() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

interface Booking {
  id: string;
  date: string;
  timeSlot: string;
}

async function verifyPaymentWithRetry(tx_ref: string, formData: any, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx_ref, formData }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' || data.status === 'paid' || data.success) {
        return data;
      }
    }
    await new Promise(r => setTimeout(r, delay));
  }
  throw new Error('Payment verification failed after multiple attempts.');
}

export default function Booking() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    services: [] as string[],
    timeSlot: "",
    date: "",
    notes: "",
    inspirationPhotos: [] as string[],
  })
  const [date, setDate] = useState<Date | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'form' | 'payment'>('form')
  const [isPaying, setIsPaying] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const bookingFormRef = useRef<HTMLDivElement>(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [loyaltyDiscountEligible, setLoyaltyDiscountEligible] = useState(false);

  useEffect(() => {
    // Clear any previous booking data when starting a new booking
    sessionStorage.removeItem('lauryn-luxe-booking');
    localStorage.removeItem('lauryn-luxe-booking-form');
  }, []);

  useEffect(() => {
    if (step === 'payment') {
      setTimeout(() => {
        bookingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100); // A small delay to ensure the element is rendered
    }
  }, [step]);

  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data: unavailableDatesData = [] } = useSWR('/api/unavailable-dates', fetcher, { refreshInterval: 1000 });
  const { data: bookingsData = [] } = useSWR('/api/bookings', fetcher, { refreshInterval: 1000 });
  const { data: latestServices = [] } = useSWR('/api/services', fetcher, { refreshInterval: 0 });

  const unavailableSlots = useMemo(() => {
    const transformed: Record<string, string[]> = {};
    unavailableDatesData.forEach((item: any) => {
      transformed[item.date] = item.timeSlots;
    });
    return transformed;
  }, [unavailableDatesData]);

  const bookedSlots = useMemo(() => {
    const slots: Record<string, string[]> = {};
    bookingsData.forEach((booking: any) => {
      if (!slots[booking.date]) slots[booking.date] = [];
      slots[booking.date].push(booking.timeSlot);
    });
    return slots;
  }, [bookingsData]);

  const availableSlotsForSelectedDate = useMemo(() => {
    if (!date) return [];
    return getSlotsForDate(date);
  }, [date]);

  const allUnavailableSlotsForDate = useMemo(() => {
    if (!date) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    console.log('DEBUG date:', date);
    console.log('DEBUG dateStr:', dateStr);
    console.log('DEBUG unavailableSlots[dateStr]:', unavailableSlots[dateStr]);
    const bSlots = bookedSlots[dateStr] || [];
    const uSlots = unavailableSlots[dateStr] || [];
    const combined = [...new Set([...bSlots, ...uSlots])];
    return combined;
  }, [date, bookedSlots, unavailableSlots]);

  const fullyBookedDates = useMemo(() => {
    const allDates = new Set([...Object.keys(bookedSlots), ...Object.keys(unavailableSlots)]);
    const fullyBlockedDates: Date[] = [];

    for (const dateStr of allDates) {
      const allPossibleSlots = getSlotsForDate(parseISO(dateStr));
      if (allPossibleSlots.length === 0) continue;

      const isMorningBlocked = allPossibleSlots.every(slot => 
        (bookedSlots[dateStr]?.includes(slot)) || (unavailableSlots[dateStr]?.includes(slot))
      );
      
      if (isMorningBlocked) {
        const d = parseISO(dateStr);
        if (isValid(d)) {
          fullyBlockedDates.push(d);
        }
      }
    }
    
    return fullyBlockedDates;
  }, [bookedSlots, unavailableSlots]);

  // Check loyalty eligibility when phone or step changes to 'payment'
  useEffect(() => {
    const checkLoyalty = async () => {
      if (step === 'payment' && formData.phone) {
        try {
          const res = await fetch(`/api/bookings?phone=${encodeURIComponent(formData.phone)}`);
          if (res.ok) {
            const bookings = await res.json();
            const count = Array.isArray(bookings) ? bookings.length : 0;
            if ((count + 1) % 6 === 0) {
              setLoyaltyDiscountEligible(true);
            } else {
              setLoyaltyDiscountEligible(false);
            }
          } else {
            setLoyaltyDiscountEligible(false);
          }
        } catch {
          setLoyaltyDiscountEligible(false);
        }
      } else {
        setLoyaltyDiscountEligible(false);
      }
    };
    checkLoyalty();
  }, [step, formData.phone]);

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
    setFormData((prev) => ({ ...prev, date: dateStr, timeSlot: "" })); // Reset timeslot
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.name || !formData.phone || !formData.email || formData.services.length === 0 || !formData.timeSlot) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields, including name, phone, email, services, date, and a time slot.",
        variant: "destructive",
      });
      return;
    }
    // Real-time verification: fetch latest services and check availability
    const res = await fetch('/api/services');
    const services = await res.json();
    const unavailable = formData.services.filter(
      (id: string) => !services.some((s: any) => s.id === id && s.isAvailable)
    );
    if (unavailable.length > 0) {
      toast({
        title: 'Service Unavailable',
        description: 'One or more of your selected services became unavailable. Please update your selection.',
        variant: 'destructive',
      });
      return;
    }
    setStep('payment');
  };

  const handlePayment = async () => {
    setPaymentStarted(true);
    setLoading(true);
    const encodedFormData = btoa(JSON.stringify(formData));
    if (typeof window !== 'undefined' && typeof window.PaychanguCheckout === 'function') {
      setIsPaying(true);
      const tx_ref = 'LLB-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
      const callbackUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/booking/verifying`);
      callbackUrl.searchParams.set('data', encodedFormData);
      window.PaychanguCheckout({
        public_key: "pub-live-AqcX7rfFKPLXnFycvVrSAX1AaBWcb3OV",
        amount: 10000,
        currency: "MWK",
        callback_url: callbackUrl.toString(),
        customer: {
          email: formData.email,
          first_name: formData.name.split(' ')[0] || formData.name,
          last_name: formData.name.split(' ').slice(1).join(' ') || formData.name,
        },
        customization: {
          title: "Lauryn Luxe Booking",
          description: "Booking deposit for Lauryn Luxe Beauty Studio",
        },
        meta: {
          phone: formData.phone,
        },
        onclose: () => {
          setIsPaying(false);
          setLoading(false);
          setPaymentCancelled(true);
        },
        callback: async (response: any) => {
          if (response.status === "successful") {
            try {
              // Use retry logic for verification
              const newBooking = await verifyPaymentWithRetry(response.tx_ref, formData);
              const bookingDetails = {
                ...newBooking,
                fee: "K1000 (Paid)",
              };
              sessionStorage.setItem('lauryn-luxe-booking', JSON.stringify(bookingDetails));
              setTimeout(() => {
                setLoading(false);
                router.push("/booking/confirmation");
              }, 2000);
            } catch (error: any) {
              toast({
                title: "Booking Finalization Failed",
                description: error.message || "Your payment was successful, but we failed to create your booking. Please contact support.",
                variant: "destructive",
              });
              setIsPaying(false);
              setLoading(false);
            }
          } else {
            toast({
              title: "Payment Failed",
              description: "Your payment was not successful. Please try again.",
              variant: "destructive",
            });
            setIsPaying(false);
            setLoading(false);
          }
        }
      });
    } else {
      toast({
        title: "Payment Error",
        description: "Payment library not loaded. Please refresh and try again.",
        variant: "destructive",
      });
      setIsPaying(false);
      setLoading(false);
    }
  };

  const handleFileChange = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    
    toast({ title: "Uploading...", description: "Your inspiration photo is being uploaded." });

    try {
      const response = await fetch(
        `/api/bookings/upload?filename=${file.name}`,
        {
          method: 'POST',
          body: file,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const newBlob = await response.json();
      setFormData((prev) => ({
        ...prev,
        inspirationPhotos: [...prev.inspirationPhotos, newBlob.url],
      }));
      
      toast({ title: "Success!", description: "Photo uploaded successfully." });

    } catch (error) {
      console.error(error);
      toast({
        title: "Upload Failed",
        description: "Could not upload your photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add debug logs before rendering BookingForm
  console.log('DEBUG allUnavailableSlotsForDate:', allUnavailableSlotsForDate);
  console.log('DEBUG bookedSlots:', bookedSlots);
  console.log('DEBUG unavailableSlots:', unavailableSlots);

  return (
    <div>
      <MultiStepLoader loadingStates={loadingStates} loading={loading} duration={1500} loop={false} />

      <PageHeader
        title="Book an Appointment"
        description="Schedule your visit to Lauryn Luxe Beauty Studio and treat yourself to a luxurious beauty experience."
        backgroundImage="/IMG_7410.png"
      />

      <div className="container mx-auto py-12 px-4" ref={bookingFormRef}>
        <BookingForm
          formData={formData}
          setFormData={setFormData}
          date={date}
          handleDateSelect={handleDateSelect}
          fullyBookedDates={fullyBookedDates}
          step={step}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          handleSelectChange={handleSelectChange}
          availableSlotsForSelectedDate={availableSlotsForSelectedDate}
          unavailableSlots={allUnavailableSlotsForDate}
          formatTime={formatTime}
          isPaying={isPaying}
          agreedToTerms={agreedToTerms}
          setAgreedToTerms={setAgreedToTerms}
          handlePayment={handlePayment}
          setStep={setStep}
          loyaltyDiscountEligible={loyaltyDiscountEligible}
        />
      </div>

      <Dialog open={isSubmitting}>
        <DialogContent>
          {/* Existing code for the dialog content */}
        </DialogContent>
      </Dialog>

      {paymentCancelled && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded shadow text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">Payment Cancelled</h2>
            <p className="mb-6">You cancelled the payment. Would you like to try booking again?</p>
            <button
              className="bg-brand-pink text-white px-4 py-2 rounded"
              onClick={() => {
                setPaymentCancelled(false);
                setPaymentStarted(false);
                setStep('form'); // Reset to booking form step
                // Optionally reset formData here if you want a full reset
              }}
            >
              Try Booking Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
