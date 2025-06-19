'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { format, parseISO, isValid } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Calendar } from "@/components/ui/calendar"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { getSlotsForDate, formatTime } from "@/lib/time-slots"
import Logo from "@/components/logo";

const ADMIN_PASSWORD = 'luxe' // Change this to a secure password

interface Booking {
  ticketId: string;
  name: string;
  date: string;
  timeSlot: string;
  services: string[];
  phone: string;
  email?: string;
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
];

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [unavailableSlots, setUnavailableSlots] = useState<Record<string, string[]>>({})
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isManageDateOpen, setIsManageDateOpen] = useState(false)
  const [managedSlots, setManagedSlots] = useState<string[]>([])

  useEffect(() => {
    if (sessionStorage.getItem("llb_admin_auth") === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const bookingsData = localStorage.getItem('llb-bookings')
    if (bookingsData) {
      try {
        setBookings(JSON.parse(bookingsData))
      } catch (e) {
        console.error("Failed to parse bookings", e)
        setBookings([])
      }
    }

    const unavailableData = localStorage.getItem('llb-unavailable-dates');
    if (unavailableData) {
      try {
        setUnavailableSlots(JSON.parse(unavailableData));
      } catch (e) {
        console.error("Failed to parse unavailable dates", e);
        setUnavailableSlots({});
      }
    }
  }, [isAuthenticated]);

  const availableSlotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return getSlotsForDate(selectedDate);
  }, [selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);

    const dateStr = format(date, "yyyy-MM-dd");
    const currentlyUnavailable = unavailableSlots[dateStr] || [];
    setManagedSlots(currentlyUnavailable);

    setIsManageDateOpen(true);
  };

  const handleSaveAvailability = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const newUnavailableSlots = { ...unavailableSlots };
    
    if (managedSlots.length > 0) {
      newUnavailableSlots[dateStr] = managedSlots;
    } else {
      delete newUnavailableSlots[dateStr];
    }
    
    setUnavailableSlots(newUnavailableSlots);
    localStorage.setItem('llb-unavailable-dates', JSON.stringify(newUnavailableSlots));
    toast({
      title: "Availability Updated",
      description: `Availability for ${format(selectedDate, "PPP")} has been updated.`,
    });
    setIsManageDateOpen(false);
  };

  const bookedDays = useMemo(() => {
    return bookings.map(b => {
      const d = parseISO(b.date);
      return isValid(d) ? d : null;
    }).filter(Boolean) as Date[];
  }, [bookings]);

  const parsedUnavailableDates = useMemo(() => {
    const fullyUnavailableDates: Date[] = [];
    for (const dateStr in unavailableSlots) {
      const allPossibleSlots = getSlotsForDate(parseISO(dateStr));
      if (allPossibleSlots.length > 0 && allPossibleSlots.every(slot => unavailableSlots[dateStr]?.includes(slot))) {
        const d = parseISO(dateStr);
        if (isValid(d)) {
          fullyUnavailableDates.push(d);
        }
      }
    }
    return fullyUnavailableDates;
  }, [unavailableSlots]);

  const bookingsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    return bookings.filter(b => b.date === selectedDateStr);
  }, [bookings, selectedDate]);

  const serviceLabel = (value: string) => serviceOptions.find(s => s.value === value)?.label || value;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("llb_admin_auth", "true")
      setIsAuthenticated(true)
    } else {
      toast({
        title: "Login Error",
        description: "Incorrect password",
        variant: "destructive",
      });
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-pink-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="flex justify-center">
            <Logo />
          </div>

          <div className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-8">
            <h3 className="text-2xl font-serif text-center text-gray-800 mb-6">Admin Access</h3>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <input
                  id="password"
                  className="mt-2 block w-full px-4 py-3 text-gray-700 placeholder-gray-400 bg-white/70 border-2 border-transparent rounded-lg focus:border-pink-400 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-pink-300 transition-all duration-300"
                  type="password"
                  placeholder="Enter your password"
                  aria-label="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800 rounded-lg py-3 text-base font-semibold transition-all duration-300">
                Login
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-serif">Admin Dashboard</h1>
            <Button variant="outline" onClick={() => {
              sessionStorage.removeItem("llb_admin_auth");
              setIsAuthenticated(false);
            }}>Log Out</Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Calendar Section */}
            <div className="md:col-span-1 bg-pink-50/50 border border-pink-200 rounded-xl p-4 shadow">
              <h2 className="text-xl font-serif mb-4 text-center">Manage Availability</h2>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md justify-center flex"
                modifiers={{
                  unavailable: parsedUnavailableDates,
                  booked: bookedDays,
                }}
                modifiersClassNames={{
                  unavailable: "bg-pink-300 text-white hover:bg-pink-400 cursor-pointer",
                  booked: "bg-green-300 text-white hover:bg-green-400",
                }}
                disabled={{ before: new Date() }}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Click a date to manage its time slots.
              </p>
            </div>

            {/* Bookings List Section */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-serif mb-4">
                Upcoming Bookings
                <span className="text-base text-gray-400 font-normal ml-2">({bookings.filter(b => new Date(b.date) >= new Date()).length})</span>
              </h2>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {bookings.length === 0 ? (
                  <div className="text-gray-400 italic">No bookings yet.</div>
                ) : (
                  [...bookings]
                    .filter(b => new Date(b.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((b, i) => (
                    <div key={b.ticketId} className="bg-pink-50 border border-pink-200 rounded-xl shadow p-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="font-serif text-lg text-pink-700 mb-1">{b.name}</div>
                        <div className="text-sm text-gray-700 mb-1"><span className="font-bold">Date:</span> {format(parseISO(b.date), "PPP")} &nbsp; <span className="font-bold">Time:</span> {formatTime(b.timeSlot)}</div>
                        <div className="text-sm mb-1"><span className="font-bold">Services:</span><br />{Array.isArray(b.services) ? b.services.map((s: string) => serviceLabel(s)).join(", ") : ''}</div>
                        <div className="text-sm mb-1"><span className="font-bold">Contact:</span><br />{b.phone}{b.email && <><br />{b.email}</>}</div>
                        <div className="text-xs text-gray-400 mt-2">Booking ID: {b.ticketId}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isManageDateOpen} onOpenChange={setIsManageDateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Availability</DialogTitle>
            <DialogDescription>
              {selectedDate ? `Update time slots for ${format(selectedDate, "PPP")}` : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Block Time Slots</h3>
              <p className="text-sm text-gray-500">Select slots to make them unavailable. Slots with existing bookings cannot be blocked.</p>
              
              <div className="grid grid-cols-2 gap-2">
                {availableSlotsForSelectedDate.map(slot => {
                  const isBooked = bookingsForSelectedDate.some(b => b.timeSlot === slot);
                  const isChecked = managedSlots.includes(slot);

                  return (
                    <div key={slot} className="flex items-center space-x-2">
                      <Checkbox
                        id={slot}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setManagedSlots(prev => [...prev, slot]);
                          } else {
                            setManagedSlots(prev => prev.filter(s => s !== slot));
                          }
                        }}
                        disabled={isBooked}
                      />
                      <Label htmlFor={slot} className={isBooked ? 'text-gray-400 italic line-through' : ''}>
                        {formatTime(slot)} {isBooked && '(Booked)'}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>

            <hr className="my-2" />

            <div className="space-y-4">
              <h3 className="font-semibold">Bookings for this Day</h3>
              {bookingsForSelectedDate.length > 0 ? (
                <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {bookingsForSelectedDate.map(booking => (
                    <li key={booking.ticketId} className="text-sm p-3 bg-pink-50 rounded-lg border border-pink-100">
                      <div className="font-bold text-pink-800">{booking.name}</div>
                      <div className="text-gray-700">
                        <span className="font-semibold">Time:</span> {formatTime(booking.timeSlot)}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-semibold">Services:</span> {booking.services.map(s => serviceLabel(s)).join(', ')}
                      </div>
                       <div className="text-gray-600">
                        <span className="font-semibold">Contact:</span> {booking.phone}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No bookings for this date.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageDateOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAvailability}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 