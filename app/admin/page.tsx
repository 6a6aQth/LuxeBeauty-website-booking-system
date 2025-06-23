'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { format, parseISO, isValid, startOfWeek, endOfWeek, isWithinInterval, addDays } from 'date-fns'
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
import { getSlotsForDate, formatTime, serviceLabel } from "@/lib/time-slots"
import Logo from "@/components/logo";
import NewsletterForm from '@/components/newsletter-form';
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const ADMIN_PASSWORD = 'luxe' // Change this to a secure password

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

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [unavailableSlots, setUnavailableSlots] = useState<Record<string, string[]>>({})
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isManageDateOpen, setIsManageDateOpen] = useState(false)
  const [managedSlots, setManagedSlots] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false); // To toggle between all and upcoming

  useEffect(() => {
    if (sessionStorage.getItem("llb_admin_auth") === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchAdminData = async () => {
      try {
        const [bookingsRes, unavailableRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/unavailable-dates')
        ]);

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData);
        } else {
          toast({ title: "Error", description: "Failed to fetch bookings.", variant: "destructive" });
        }

        if (unavailableRes.ok) {
          const unavailableData = await unavailableRes.json();
          setUnavailableSlots(unavailableData);
        } else {
           toast({ title: "Error", description: "Failed to fetch unavailable dates.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Failed to fetch admin data", error);
        toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
      }
    };

    fetchAdminData();
  }, [isAuthenticated]);

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
      const unavailable = unavailableSlots[dateStr] || [];
      const availableCount = daySlots.filter(slot => !unavailable.includes(slot)).length;
      totalAvailableSlots += availableCount;
    }

    if (totalAvailableSlots === 0) {
      return { count: bookingsInNext7Days.length, percentage: 100 };
    }

    const percentage = Math.min((bookingsInNext7Days.length / totalAvailableSlots) * 100, 100);

    return {
      count: bookingsInNext7Days.length,
      percentage: percentage,
    };
  }, [bookings, unavailableSlots]);

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

  const handleSaveAvailability = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const newUnavailableSlots = { ...unavailableSlots };
    
    if (managedSlots.length > 0) {
      newUnavailableSlots[dateStr] = managedSlots;
    } else {
      delete newUnavailableSlots[dateStr];
    }
    
    try {
      const response = await fetch('/api/unavailable-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, slots: managedSlots }),
      });

      if (!response.ok) throw new Error('Failed to save availability');
      
      setUnavailableSlots(newUnavailableSlots);
      toast({
        title: "Availability Updated",
        description: `Availability for ${format(selectedDate, "PPP")} has been updated.`,
      });
      setIsManageDateOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not update availability.", variant: "destructive" });
    }
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
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return bookings.filter(b => b.date === dateStr);
  }, [bookings, selectedDate]);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("llb_admin_auth", "true")
      setIsAuthenticated(true)
    } else {
      toast({
        title: "Authentication Failed",
        description: "The password you entered is incorrect.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("llb_admin_auth");
    setIsAuthenticated(false);
    router.push('/');
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-fit mb-4">
              <Logo />
              <h2 className="text-2xl font-serif mt-4">Admin Login</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Log In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif">Manage Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={[{ before: new Date() }]}
                  modifiers={{ 
                    booked: bookedDays,
                    unavailable: parsedUnavailableDates
                  }}
                  modifiersStyles={{
                    booked: { fontWeight: 'bold', color: '#4ade80' },
                    unavailable: { textDecoration: 'line-through', color: '#f87171' }
                  }}
                  className="p-0"
                />
                <p className="text-sm text-gray-500 mt-4 text-center">Click a date to manage its time slots.</p>
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

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
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
                <div className="flex justify-between items-center">
                  <CardTitle className="font-serif">Upcoming Bookings ({filteredBookings.length})</CardTitle>
                  <div className="flex items-center space-x-4">
                    <Input 
                      placeholder="Search bookings by name, contact, etc."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-xs"
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
                <ScrollArea className="h-[600px] pr-4">
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
                              <p className="font-semibold">Services:</p>
                              <p>{booking.services.map(serviceLabel).join(', ')}</p>
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

      <Dialog open={isManageDateOpen} onOpenChange={setIsManageDateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif">Manage Availability for {selectedDate && format(selectedDate, "PPP")}</DialogTitle>
            <DialogDescription>
              Select the time slots to mark as unavailable for this date. Any existing bookings will still be shown.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] pr-4 -mr-4">
            <div className="grid grid-cols-2 gap-4 py-4">
              {availableSlotsForSelectedDate.map(slot => {
                  const isBooked = bookingsForSelectedDate.some(b => b.timeSlot === slot);
                  return (
                      <div key={slot} className="flex items-center space-x-2">
                          <Checkbox
                              id={slot}
                              checked={managedSlots.includes(slot)}
                              onCheckedChange={(checked) => {
                                  setManagedSlots(prev => 
                                      checked ? [...prev, slot] : prev.filter(s => s !== slot)
                                  )
                              }}
                              disabled={isBooked}
                          />
                          <Label htmlFor={slot} className={isBooked ? 'line-through text-gray-400' : ''}>
                              {formatTime(slot)} {isBooked && "(Booked)"}
                          </Label>
                      </div>
                  )
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageDateOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAvailability} className="bg-gray-800 hover:bg-gray-900 text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 