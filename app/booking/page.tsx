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
import { PageHeader } from "@/components/page-header"
import { MultiStepLoader } from "@/components/ui/multi-step-loader"

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
  const [loading, setLoading] = useState(false)
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
    setLoading(true)

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
      
      // Allow loader to finish before navigating
      setTimeout(() => {
        router.push("/booking/confirmation");
      }, 2000);

    } catch (error) {
      console.error(error);
      toast({
        title: "Booking Failed",
        description: "Could not save your appointment. Please try again.",
        variant: "destructive",
      });
      setIsPaying(false);
      setLoading(false)
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
      <MultiStepLoader loadingStates={loadingStates} loading={loading} duration={1500} loop={false} />

      <PageHeader
        title="Book an Appointment"
        description="Schedule your visit to Lauryn Luxe Beauty Studio and treat yourself to a luxurious beauty experience."
      />

      <AnimatedSection className="py-16 bg-white" delay={0.2}>
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-none shadow-2xl">
            <div className="grid md:grid-cols-2">
              <div className="relative bg-gray-100 p-8">
                 <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: "url('/IMG_9067.png')" }}
                >
                   <div className="absolute inset-0 bg-black opacity-40"></div>
                </div>
                <div className="relative z-10 text-white">
                  <h3 className="text-3xl font-serif mb-6">Business Hours</h3>
                  <div className="space-y-3 text-lg font-light">
                    <div className="flex justify-between border-b border-gray-400 py-2"><span>Mon - Thu</span><span>8:30 - 16:30</span></div>
                    <div className="flex justify-between border-b border-gray-400 py-2"><span>Friday</span><span>8:30 - 15:00</span></div>
                    <div className="flex justify-between border-b border-gray-400 py-2"><span>Saturday</span><span>10:00 - 15:00</span></div>
                    <div className="flex justify-between border-b border-gray-400 py-2"><span>Sunday</span><span>Closed</span></div>
                  </div>
                   <div className="mt-8">
                    <h4 className="text-2xl font-serif mb-4">Loyalty Program</h4>
                    <p className="text-gray-200">
                      Your <span className="font-semibold text-white">6th booking comes with a 30% discount</span> as a thank you for your continued trust in us.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50">
                <CardHeader className="p-0 mb-6 text-center">
                  <CardTitle className="text-3xl font-serif">
                    {step === "form" ? "Book Your Slot" : "Confirm & Pay"}
                  </CardTitle>
                  <CardDescription>
                    {step === "form"
                      ? "A K10,000 non-refundable deposit is required."
                      : "Review your details and pay the booking fee."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {step === 'form' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input id="name" name="name" placeholder="Full Name" required value={formData.name} onChange={handleChange} className="bg-white" />
                        <Input id="phone" name="phone" placeholder="Phone Number" required value={formData.phone} onChange={handleChange} className="bg-white" />
                      </div>
                      <Input id="email" name="email" type="email" placeholder="Email Address (Optional)" value={formData.email} onChange={handleChange} className="bg-white" />
                      
                      <div className="space-y-3 pt-2">
                        <Label className="text-sm font-medium text-gray-700">Select Services</Label>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                          {serviceOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <Checkbox id={`service-${option.value}`} name="services" value={option.value} checked={formData.services.includes(option.value)} onCheckedChange={() => {
                                const newServices = formData.services.includes(option.value)
                                  ? formData.services.filter(s => s !== option.value)
                                  : [...formData.services, option.value];
                                setFormData(prev => ({ ...prev, services: newServices }));
                              }} />
                              <Label htmlFor={`service-${option.value}`} className="text-sm font-normal cursor-pointer">{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 pt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white", !date && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus disabled={[{ before: new Date(Date.now() + 86400000) }, { dayOfWeek: [0] }, ...fullyBookedDates]} />
                          </PopoverContent>
                        </Popover>
                         
                        <Select value={formData.timeSlot} onValueChange={(value) => handleSelectChange("timeSlot", value)} disabled={!date}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select a time" />
                          </SelectTrigger>
                          <SelectContent>
                             {date && availableSlotsForSelectedDate.length > 0 ? (
                                availableSlotsForSelectedDate.map(slot => {
                                    const isBooked = bookedSlots[formData.date]?.includes(slot);
                                    const isUnavailable = unavailableSlots[formData.date]?.includes(slot);
                                    const isDisabled = isBooked || isUnavailable;
                                    return <SelectItem key={slot} value={slot} disabled={isDisabled}>{formatTime(slot)}</SelectItem>
                                })
                              ) : (
                                <div className="p-2 text-sm text-gray-500">
                                  {date ? "No slots available." : "Select a date first."}
                                </div>
                              )}
                          </SelectContent>
                        </Select>
                      </div>

                      <Textarea name="notes" placeholder="Additional Notes (Optional)" value={formData.notes} onChange={handleChange} className="bg-white" />
                      <Button type="submit" className="w-full bg-black text-white hover:bg-gray-900 py-3 text-base" disabled={isSubmitting || !formData.date || formData.services.length === 0 || !formData.timeSlot}>
                        {isSubmitting ? "Processing..." : "Proceed to Payment"}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-4 text-gray-800 p-4 border rounded-lg bg-white">
                        <h3 className="font-semibold text-lg text-center border-b pb-2 mb-4">Booking Summary</h3>
                        <div className="flex justify-between"><span>Name:</span> <strong>{formData.name}</strong></div>
                        <div className="flex justify-between"><span>Date:</span> <strong>{formData.date}</strong></div>
                        <div className="flex justify-between"><span>Time Slot:</span> <strong>{formatTime(formData.timeSlot)}</strong></div>
                        <div>
                          <div className="flex justify-between">
                            <span>Services:</span>
                            <div className="text-right font-semibold">
                              {formData.services.map(s => <div key={s}>{serviceOptions.find(opt => opt.value === s)?.label}</div>)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-2">
                        <Checkbox id="terms" onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))} />
                        <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          I have read and agree to the <StudioPolicies />.
                        </label>
                      </div>
                      <Button onClick={handlePayment} disabled={isPaying || !agreedToTerms} className="w-full bg-black text-white py-3 text-base">
                        {isPaying ? "Processing..." : "Pay K10,000 Booking Fee"}
                      </Button>
                      <Button variant="link" onClick={() => setStep('form')} className="w-full text-gray-600 hover:text-black">
                        Go Back & Edit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>
            </div>
          </Card>
        </div>
      </AnimatedSection>
    </div>
  )
}
