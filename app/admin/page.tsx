'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { format, parseISO, isValid, startOfWeek, endOfWeek, isWithinInterval, addDays, isToday } from 'date-fns'
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
import { getSlotsForDate, formatTime, serviceLabel, generateTimeSlots } from "@/lib/time-slots"
import Logo from "@/components/logo";
import NewsletterForm from '@/components/newsletter-form';
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ShineBorder } from "@/components/ui/shine-border";
import { WavyBackground } from "@/components/ui/wavy-background";

const ADMIN_PASSWORD = 'luxe' // This should be an environment variable in a real app

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Booking {
  id: string;
  ticketId: string;
  name:string;
  date: string;
  timeSlot: string;
  services: string[];
  phone: string;
  email?: string;
  discountApplied?: boolean;
}

interface UnavailableDate {
  date: string;
  timeSlots: string[];
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([])
  const [view, setView] = useState('all') // 'all' or 'upcoming'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [isSavingPrices, setIsSavingPrices] = useState(false)
  const [isManageDateOpen, setIsManageDateOpen] = useState(false)
  const [managedSlots, setManagedSlots] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)

  const allTimeSlots = useMemo(() => generateTimeSlots(true), [])

  useEffect(() => {
    if (sessionStorage.getItem("llb_admin_auth") === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchAdminData = async () => {
      try {
        const [bookingsRes, unavailableRes, servicesRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/unavailable-dates'),
          fetch('/api/services'),
        ]);

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData);
        } else {
          toast({ title: "Error", description: "Failed to fetch bookings.", variant: "destructive" });
        }

        if (unavailableRes.ok) {
          const unavailableData = await unavailableRes.json();
          setUnavailableDates(unavailableData);
        } else {
           toast({ title: "Error", description: "Failed to fetch unavailable dates.", variant: "destructive" });
        }

        if (servicesRes.ok) {
            const servicesData = await servicesRes.json();
            setServices(servicesData);
        } else {
            toast({ title: "Error", description: "Failed to fetch services.", variant: "destructive" });
        }

      } catch (error) {
        console.error("Failed to fetch admin data", error);
        toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
      }
    };

    fetchAdminData();
  }, [isAuthenticated]);

  const handlePriceChange = (id: string, newPrice: string) => {
    const price = parseInt(newPrice, 10);
    if (isNaN(price)) return;
    setServices(prev => 
        prev.map(s => s.id === id ? { ...s, price } : s)
    );
  };

  const handleSaveChanges = async () => {
    setIsSavingPrices(true);
    try {
        const response = await fetch('/api/services', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ services }),
        });

        if (!response.ok) {
            throw new Error('Failed to save prices');
        }

        toast({ title: "Success", description: "Service prices have been updated." });
    } catch (error) {
        toast({ title: "Error", description: "Could not save prices.", variant: "destructive" });
    } finally {
        setIsSavingPrices(false);
    }
  };

  const filteredBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let bookingsToShow = bookings;

    // Filter for upcoming bookings if showAll is false
    if (!showAll) {
      bookingsToShow = bookings.filter(booking => {
        try {
          const bookingDate = parseISO(booking.date);
          return isValid(bookingDate) && bookingDate >= today;
        } catch {
          return false;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      bookingsToShow = bookingsToShow.filter(booking => {
        const servicesString = Array.isArray(booking.services) ? booking.services.map(s => serviceLabel(s)).join(' ') : '';
        return (
          booking.name.toLowerCase().includes(searchLower) ||
          booking.phone.toLowerCase().includes(searchLower) ||
          (booking.email && booking.email.toLowerCase().includes(searchLower)) ||
          servicesString.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort the bookings by date
    return bookingsToShow.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings, searchTerm, showAll]);
  
  const weeklyCapacity = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysFromNow = addDays(today, 7);

    const bookingsInNext7Days = bookings.filter(booking => {
      try {
        const bookingDate = parseISO(booking.date);
        return isValid(bookingDate) && isWithinInterval(bookingDate, { start: today, end: sevenDaysFromNow });
      } catch {
        return false;
      }
    });

    let totalAvailableSlots = 0;
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const daySlots = getSlotsForDate(date);
      const unavailableForDate = unavailableDates.find(d => d.date === dateStr);
      const unavailableCount = unavailableForDate ? unavailableForDate.timeSlots.length : 0;
      const availableCount = daySlots.length - unavailableCount;
      totalAvailableSlots += availableCount;
    }

    if (totalAvailableSlots <= 0) {
      return { count: bookingsInNext7Days.length, percentage: bookingsInNext7Days.length > 0 ? 100 : 0 };
    }

    const percentage = Math.min((bookingsInNext7Days.length / totalAvailableSlots) * 100, 100);

    return {
      count: bookingsInNext7Days.length,
      percentage: percentage,
    };
  }, [bookings, unavailableDates]);

  const availableSlotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return getSlotsForDate(selectedDate);
  }, [selectedDate]);

  const bookingsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    return bookings.filter(b => b.date === dateString);
  }, [bookings, selectedDate]);

  const handleSaveAvailability = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      await fetch('/api/unavailable-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, slots: selectedTimeSlots }),
      });
      toast({ title: "Success", description: "Availability updated successfully." });
      
      const res = await fetch('/api/unavailable-dates');
      if (res.ok) {
        setUnavailableDates(await res.json());
      }
      
    } catch (error) {
      toast({ title: "Error", description: "Failed to update availability.", variant: "destructive" });
    }

    setIsModalOpen(false);
  };

  const bookedDays = useMemo(() => {
    return bookings.map(b => {
      const d = parseISO(b.date);
      return isValid(d) ? d : null;
    }).filter(Boolean) as Date[];
  }, [bookings]);

  const parsedUnavailableDates = useMemo(() => {
    const fullyUnavailableDates: Date[] = [];
    unavailableDates.forEach(unavailableDate => {
      const allPossibleSlots = getSlotsForDate(parseISO(unavailableDate.date));
      if (allPossibleSlots.length > 0 && allPossibleSlots.every(slot => unavailableDate.timeSlots.includes(slot))) {
        const d = parseISO(unavailableDate.date);
        if (isValid(d)) {
          fullyUnavailableDates.push(d);
        }
      }
    });
    return fullyUnavailableDates;
  }, [unavailableDates]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("llb_admin_auth", "true")
      setIsAuthenticated(true)
    } else {
      toast({ title: "Error", description: "Incorrect password.", variant: "destructive" })
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("llb_admin_auth")
    setIsAuthenticated(false)
    router.push('/');
  }

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Working days are Mon-Sat. Block clicks only on past dates and Sundays.
    if (date < today || date.getDay() === 0 ) {
      return; 
    }
    setSelectedDate(date);
    const dateString = date.toISOString().split('T')[0];
    const unavailableForDate = unavailableDates.find(d => d.date === dateString);
    setSelectedTimeSlots(unavailableForDate ? unavailableForDate.timeSlots : []);
    setIsModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <WavyBackground
        containerClassName="h-full flex flex-col items-center justify-center"
        className="p-4"
        colors={["#111111", "#222222", "#000000"]}
        waveOpacity={0.3}
        backgroundFill="black"
      >
        <Card className="relative w-full max-w-sm p-6 space-y-4 overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <ShineBorder borderWidth={2} shineColor="hsl(var(--primary))" />
          <CardHeader className="text-center">
              <Logo />
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>Enter your password to access the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </WavyBackground>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
                <h1 className="text-2xl font-serif font-semibold text-gray-900">Admin Dashboard</h1>
                <Button variant="outline" onClick={handleLogout}>Log Out</Button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <div className="lg:col-span-1 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif">Manage Availability</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <DayPicker
                  showOutsideDays
                  fixedWeeks
                  numberOfMonths={1}
                  disabled={[{ before: new Date() }, { dayOfWeek: [0] }]}
                  onDayClick={handleDateClick}
                  selected={selectedDate}
                  className="p-0 flex justify-center"
                />
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif">Next 7 Days Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">{weeklyCapacity.count} Bookings</span>
                  <span className="text-sm font-medium text-gray-600">{Math.round(weeklyCapacity.percentage)}% full</span>
                </div>
                <Progress value={weeklyCapacity.percentage} className="w-full [&>div]:bg-brand-blush-foreground" />
              </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-serif">Manage Service Prices</CardTitle>
                    <CardDescription>Update the prices for your services.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] pr-4 -mr-4">
                        <div className="space-y-4">
                            {services.map(service => (
                                <div key={service.id} className="flex justify-between items-center gap-4">
                                    <Label htmlFor={`price-${service.id}`} className="flex-1">{service.name}</Label>
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-500">MK</span>
                                      <Input
                                          id={`price-${service.id}`}
                                          type="number"
                                          value={service.price}
                                          onChange={(e) => handlePriceChange(service.id, e.target.value)}
                                          className="w-28"
                                      />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardContent>
                    <Button onClick={handleSaveChanges} disabled={isSavingPrices} className="w-full">
                        {isSavingPrices ? 'Saving...' : 'Save Prices'}
                    </Button>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif">Newsletter</CardTitle>
                <CardDescription>Send a message to all subscribers.</CardDescription>
              </CardHeader>
              <CardContent>
                <NewsletterForm />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="font-serif">Bookings ({filteredBookings.length})</CardTitle>
                  <div className="flex items-center space-x-4 w-full sm:w-auto">
                    <Input 
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-xs w-full"
                    />
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="show-all"
                        checked={showAll}
                        onCheckedChange={setShowAll}
                      />
                      <Label htmlFor="show-all">Show All</Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[1200px] pr-4 -mr-4">
                  <div className="space-y-6">
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((booking) => (
                        <div key={booking.id} className="p-4 border rounded-lg bg-white">
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="font-bold text-lg text-gray-800">{booking.name}</h3>
                                  {booking.discountApplied && <Badge className="bg-brand-blush text-brand-blush-foreground border-brand-blush-foreground/20 mt-1">30% Discount</Badge>}
                              </div>
                              <div className="text-right text-sm flex-shrink-0">
                                  <p><strong>Date:</strong> {format(parseISO(booking.date), "PPP")}</p>
                                  <p><strong>Time:</strong> {formatTime(booking.timeSlot)}</p>
                              </div>
                          </div>
                          <Separator className="my-3" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-semibold text-gray-700">Services</p>
                              <p className="text-gray-600">{booking.services.map(serviceLabel).join(', ')}</p>
                            </div>
                            <div>
                               <p className="font-semibold text-gray-700">Contact</p>
                               <p className="text-gray-600">{booking.phone}</p>
                               {booking.email && <p className="text-gray-600">{booking.email}</p>}
                            </div>
                          </div>
                          <Separator className="my-3" />
                          <p className="text-xs text-gray-500">Booking ID: {booking.ticketId}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No bookings found.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Availability for {selectedDate && format(selectedDate, 'PPP')}</DialogTitle>
            <DialogDescription>
              Select the time slots to mark as unavailable for this date. Any existing bookings will still be shown.
            </DialogDescription>
          </DialogHeader>

          {bookingsForSelectedDate.length > 0 && (
            <>
              <div className="py-2">
                <h4 className="font-semibold mb-2 text-sm text-gray-700">Bookings for this date:</h4>
                <ScrollArea className="h-[100px] rounded-md border p-2">
                  <div className="space-y-2">
                    {bookingsForSelectedDate.map(booking => (
                      <div key={booking.id} className="text-sm">
                        <strong>{formatTime(booking.timeSlot)}:</strong> {booking.name} ({booking.services.map(serviceLabel).join(', ')})
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <Separator className="my-2" />
            </>
          )}

          <div className="grid grid-cols-2 gap-4 py-4">
            {availableSlotsForSelectedDate.map(slot => {
              const isBooked = bookingsForSelectedDate.some(b => b.timeSlot === slot);
              return (
                <div key={slot} className="flex items-center space-x-2">
                  <Checkbox
                    id={slot}
                    checked={selectedTimeSlots.includes(slot) || isBooked}
                    disabled={isBooked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTimeSlots(prev => [...prev, slot]);
                      } else {
                        setSelectedTimeSlots(prev => prev.filter(s => s !== slot));
                      }
                    }}
                  />
                  <label htmlFor={slot} className={`text-sm ${isBooked ? 'text-gray-400 line-through' : ''}`}>
                    {formatTime(slot)} {isBooked && "(Booked)"}
                  </label>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAvailability}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 