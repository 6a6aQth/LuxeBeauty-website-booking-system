"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
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
  })
  const [date, setDate] = useState<Date | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'form' | 'payment'>('form')
  const [isPaying, setIsPaying] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [unavailableSlots, setUnavailableSlots] = useState<Record<string, string[]>>({})
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});
  const [bookingStatus, setBookingStatus] = useState<'processing' | 'received' | 'generating' | 'complete' | 'idle'>('idle');
  const bookingFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 'payment') {
      setTimeout(() => {
        bookingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100); // A small delay to ensure the element is rendered
    }
  }, [step]);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        const [unavailableRes, bookingsRes] = await Promise.all([
          fetch('/api/unavailable-dates'),
          fetch('/api/bookings')
        ]);

        if (unavailableRes.ok) {
          const unavailableData = await unavailableRes.json();
          setUnavailableSlots(unavailableData);
        } else {
          console.error("Failed to fetch unavailable dates");
        }

        if (bookingsRes.ok) {
          const bookingsData: Booking[] = await bookingsRes.json();
          const slots: Record<string, string[]> = {};
          bookingsData.forEach(booking => {
            if (!slots[booking.date]) {
              slots[booking.date] = [];
            }
            slots[booking.date].push(booking.timeSlot);
          });
          setBookedSlots(slots);
        } else {
          console.error("Failed to fetch bookings data");
        }
      } catch (error) {
        console.error("Failed to fetch initial booking data:", error);
      }
    };
    fetchBookingData();
  }, [])

  const availableSlotsForSelectedDate = useMemo(() => {
    if (!date) return [];
    return getSlotsForDate(date);
  }, [date]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (name === "services" && type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => {
        if (checked) {
          return { ...prev, services: [...prev.services, value] }
        } else {
          return { ...prev, services: prev.services.filter((s) => s !== value) }
        }
      })
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
    setFormData((prev) => ({ ...prev, date: dateStr, timeSlot: "" })); // Reset timeslot
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.date || !formData.name || !formData.phone || formData.services.length === 0 || !formData.timeSlot) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields, including name, phone, services, date, and a time slot.",
        variant: "destructive",
      })
      return
    }
    setStep('payment')
  }

  const handlePayment = async () => {
    setIsPaying(true)
    setBookingStatus('processing');

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setBookingStatus('received');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setBookingStatus('generating');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const newBooking = await response.json();

      const bookingDetails = {
        ...newBooking,
        fee: "K10,000 (Paid)",
      };

      sessionStorage.setItem('lauryn-luxe-booking', JSON.stringify(bookingDetails));
      
      setBookingStatus('complete');
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push("/booking/confirmation");

    } catch (error) {
      console.error(error);
      toast({
        title: "Booking Failed",
        description: "Could not save your appointment. Please try again.",
        variant: "destructive",
      });
      setIsPaying(false);
      setBookingStatus('idle');
    }
  }

  const serviceOptions = [
    { value: "gel-natural", label: "Gel on Natural Nails" },
    { value: "gel-tips", label: "Gel on Tips" },
    { value: "acrylic-natural", label: "Acrylic on Natural Nails" },
    { value: "acrylic-tips", label: "Acrylic on Tips" },
    { value: "luxury-manicure", label: "Luxury Manicure" },
    { value: "basic-pedicure", label: "Basic Pedicure" },
    { value: "gel-pedicure", label: "Gel Pedicure" },
    { value: "luxury-pedicure", label: "Luxury Pedicure" },
    { value: "nail-art", label: "Nail Art" },
    { value: "soak-off", label: "Soak Off" },
    { value: "refill", label: "Refill" },
  ]

  return (
    <div>
      <Dialog open={bookingStatus !== 'idle'} >
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center font-serif text-2xl mb-4">Securing Your Appointment</DialogTitle>
          </DialogHeader>
          <div className="py-8">
             <BookingStatus status={bookingStatus} />
          </div>
        </DialogContent>
      </Dialog>
      {/* Page Header */}
      <AnimatedSection className="bg-black text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Book an Appointment</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Schedule your visit to Lauryn Luxe Beauty Studio and treat yourself to a luxurious beauty experience.
          </p>
        </div>
      </AnimatedSection>

      {/* Booking Form or Payment Step */}
      <AnimatedSection className="py-20 bg-white" delay={0.2}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto" ref={bookingFormRef}>
            {step === 'form' && (
              <div className="mb-8 p-6 bg-pink-50/50 rounded-lg border border-pink-200/50">
                <h3 className="text-xl font-serif text-center mb-4">Business Hours</h3>
                <div className="space-y-2 text-gray-700 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span>Monday - Thursday</span>
                    <span>8:30 AM - 4:30 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Friday</span>
                    <span>8:30 AM - 3:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>10:00 AM - 3:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
            )}
            <Card className="border-none shadow-glow">
              <CardHeader className="bg-pink-50/50">
                <CardTitle className="text-2xl font-serif">
                  {step === "form" ? "Appointment Details" : "Confirm & Pay"}
                </CardTitle>
                <CardDescription>
                  {step === "form"
                    ? "Fill out the form below. A K10,000 non-refundable deposit is required to confirm."
                    : "Review your appointment details and pay the booking fee to secure your spot."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {step === 'form' ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Your full name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="Your phone number"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address (Optional)</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Your email address"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Services (Select all that apply)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {serviceOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`service-${option.value}`}
                              name="services"
                              value={option.value}
                              checked={formData.services.includes(option.value)}
                              onChange={handleChange}
                              className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                            />
                            <Label htmlFor={`service-${option.value}`} className="cursor-pointer">{option.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="date">Preferred Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={handleDateSelect}
                              initialFocus
                              disabled={[
                                { before: new Date(Date.now() + 86400000) }, // tomorrow
                                { dayOfWeek: [0] }, // Sundays
                                ...fullyBookedDates,
                              ]}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Preferred Time Slot</Label>
                        {!date && <div className="text-sm text-gray-500">Please select a date to see available times.</div>}
                        {date && availableSlotsForSelectedDate.length > 0 && (
                          <RadioGroup
                            value={formData.timeSlot}
                            onValueChange={(value) => handleSelectChange("timeSlot", value)}
                            className="mt-2 grid grid-cols-2 gap-2"
                          >
                            {availableSlotsForSelectedDate.map(slot => {
                              const isBooked = bookedSlots[formData.date]?.includes(slot);
                              const isUnavailable = unavailableSlots[formData.date]?.includes(slot);
                              const isDisabled = isBooked || isUnavailable;

                              return (
                                <div key={slot} className="flex items-center space-x-2">
                                  <RadioGroupItem 
                                    value={slot} 
                                    id={slot} 
                                    disabled={isDisabled}
                                  />
                                  <Label 
                                    htmlFor={slot} 
                                    className={isDisabled ? 'text-gray-400 line-through' : ''}
                                  >
                                    {formatTime(slot)}
                                  </Label>
                                </div>
                              )
                            })}
                          </RadioGroup>
                        )}
                         {date && availableSlotsForSelectedDate.length === 0 && (
                          <div className="text-sm text-red-500">No time slots available for this day. It may be a Sunday or fully booked.</div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Any specific requests or information we should know"
                        className="min-h-[100px]"
                        value={formData.notes}
                        onChange={handleChange}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-3 text-base"
                      disabled={isSubmitting || !formData.date || formData.services.length === 0 || !formData.timeSlot}
                    >
                      {isSubmitting ? "Submitting..." : "Proceed to Payment"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4 text-gray-800 p-4 border rounded-lg bg-pink-50/30">
                      <h3 className="font-semibold text-lg border-b pb-2">Booking Summary</h3>
                      <div className="flex justify-between"><span>Name:</span> <strong>{formData.name}</strong></div>
                      <div className="flex justify-between"><span>Date:</span> <strong>{formData.date}</strong></div>
                      <div className="flex justify-between"><span>Time Slot:</span> <strong>{formatTime(formData.timeSlot)}</strong></div>
                      <div>
                        <div className="flex justify-between">
                          <span>Services:</span>
                          <div className="text-right">
                            {formData.services.map(s => <div key={s}>{serviceOptions.find(opt => opt.value === s)?.label}</div>)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))} />
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I have read and agree to the <StudioPolicies />.
                      </label>
                    </div>

                    <Button
                      onClick={handlePayment}
                      disabled={isPaying || !agreedToTerms}
                      className="w-full rounded-none"
                    >
                      {isPaying ? "Processing..." : "Pay K10,000 Booking Fee"}
                    </Button>
                    <Button variant="link" onClick={() => setStep('form')} className="w-full text-pink-500">
                      Go Back to Edit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AnimatedSection>

      {/* Additional Information */}
      <AnimatedSection className="py-20 bg-nude-light" delay={0.4}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif mb-8 text-center">Booking Information</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-none shadow-soft">
                <CardHeader>
                  <CardTitle>Appointment Policies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    <strong>Cancellations:</strong> We require 24-hour notice for cancellations to avoid a cancellation
                    fee.
                  </p>
                  <p className="text-gray-700">
                    <strong>Late Arrivals:</strong> If you arrive more than 15 minutes late, we may need to reschedule
                    your appointment.
                  </p>
                  <p className="text-gray-700">
                    <strong>Confirmation:</strong> We'll contact you to confirm your appointment after you submit your
                    request.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-soft">
                <CardHeader>
                  <CardTitle>Business Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Monday - Thursday</span>
                      <span>8:30 AM - 4:30 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Friday</span>
                      <span>8:30 AM - 3:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 3:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  )
}
