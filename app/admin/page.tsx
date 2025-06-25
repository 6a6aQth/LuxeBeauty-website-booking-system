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
  DialogTrigger,
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
import { PlusCircle, Edit, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const ADMIN_PASSWORD = 'luxe' // This should be an environment variable in a real app

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
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
  inspirationPhotos?: string[];
  notes?: string;
}

interface UnavailableDate {
  date: string;
  timeSlots: string[];
}

const serviceCategories = [
  'all',
  'manicure',
  'pedicure',
  'refills',
  'nail-art',
  'soak-off',
]

const emptyService: Service = {
  id: '',
  name: '',
  description: '',
  duration: 60,
  category: 'manicure',
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
  const [priceListUrl, setPriceListUrl] = useState('')
  const [priceListFile, setPriceListFile] = useState<File | null>(null)
  const [isSavingPriceList, setIsSavingPriceList] = useState(false)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isDeletingService, setIsDeletingService] = useState<Service | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('all')

  // State to prevent hydration errors
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const allTimeSlots = useMemo(() => generateTimeSlots(true), [])

    const fetchAdminData = async () => {
      try {
      const [bookingsRes, unavailableRes, servicesRes, priceListRes] =
        await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/unavailable-dates'),
          fetch('/api/services'),
          fetch('/api/price-list'),
        ])

      if (bookingsRes.ok) setBookings(await bookingsRes.json())
      if (unavailableRes.ok) setUnavailableDates(await unavailableRes.json())
      if (servicesRes.ok) setServices(await servicesRes.json())
      if (priceListRes.ok) {
        const data = await priceListRes.json()
        setPriceListUrl(data.priceListUrl)
      }
    } catch (error) {
      console.error('Failed to fetch admin data', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    if (isClient && sessionStorage.getItem('llb_admin_auth') === 'true') {
      setIsAuthenticated(true)
    }
  }, [isClient])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData()
    }
  }, [isAuthenticated])

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

  const handleSavePriceList = async () => {
    if (!priceListFile) {
      toast({ title: "No file selected", description: "Please select an image to upload.", variant: "destructive" });
      return;
    }

    setIsSavingPriceList(true);
    try {
      const response = await fetch(
        `/api/price-list/upload?filename=${priceListFile.name}`,
        {
          method: 'POST',
          body: priceListFile,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload price list');
      }

      const newBlob = await response.json();
      setPriceListUrl(newBlob.url);
      setPriceListFile(null); // Clear the file input

      toast({ title: "Success", description: "Price list has been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Could not save price list.", variant: "destructive" });
    } finally {
      setIsSavingPriceList(false);
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

  const handleOpenServiceModal = (service: Service | null) => {
    setEditingService(service ? { ...service } : { ...emptyService })
    setIsServiceModalOpen(true)
  }

  const handleSaveService = async () => {
    if (!editingService) return

    const { id, name, description, duration, category } = editingService

    const url = id ? `/api/services/${id}` : '/api/services'
    const method = id ? 'PUT' : 'POST'
    const body = JSON.stringify({ name, description, duration, category })

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (!response.ok) throw new Error('Failed to save service')

      toast({
        title: 'Success',
        description: `Service has been ${id ? 'updated' : 'created'}.`,
      })
      setIsServiceModalOpen(false)
      setEditingService(null)
      fetchAdminData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not save service.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteService = async () => {
    if (!isDeletingService) return

    try {
      const response = await fetch(`/api/services/${isDeletingService.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete service')
      }

      toast({ title: 'Success', description: 'Service has been deleted.' })
      setIsDeletingService(null)
      fetchAdminData() // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not delete service.',
        variant: 'destructive',
      })
    }
  }

  const filteredServices = useMemo(() => {
    if (categoryFilter === 'all') {
      return services
    }
    return services.filter((service) => service.category === categoryFilter)
  }, [services, categoryFilter])

  if (!isClient) {
    return null; // Render nothing on the server/first-client render
  }

  if (!isAuthenticated) {
    return (
      <WavyBackground
        className="p-4"
        colors={["#111111", "#222222", "#000000"]}
        waveOpacity={0.3}
        backgroundFill="black"
      >
        <Card className="relative max-w-sm p-6 space-y-4 overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Manage Services</CardTitle>
                  <CardDescription>
                    Add, edit, or delete your service offerings.
                  </CardDescription>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-4">
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="capitalize">
                          {cat.replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handleOpenServiceModal(null)} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {filteredServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                      >
                        <div>
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            {service.category.replace('-', ' ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenServiceModal(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setIsDeletingService(service)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

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
                <CardTitle className="font-serif">Newsletter</CardTitle>
                <CardDescription>Send a message to all subscribers.</CardDescription>
              </CardHeader>
              <CardContent>
                <NewsletterForm />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Update Price List</CardTitle>
                <CardDescription>
                  Change the image for the prices page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="price-list-file">Price List Image</Label>
                  <Input
                    id="price-list-file"
                    type="file"
                    onChange={(e) =>
                      setPriceListFile(e.target.files?.[0] || null)
                    }
                    accept="image/*"
                  />
                  {priceListUrl && !priceListFile && (
                    <div className="mt-2 text-sm text-gray-500">
                      Current image:{' '}
                      <a
                        href={priceListUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSavePriceList}
                  disabled={isSavingPriceList}
                  className="w-full mt-4"
                >
                  {isSavingPriceList ? 'Uploading...' : 'Upload New Price List'}
                </Button>
              </CardContent>
            </Card>

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
                <ScrollArea className="h-[70vh] pr-4 -mr-4">
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
                          {(booking.inspirationPhotos && booking.inspirationPhotos.length > 0) || booking.notes ? (
                            <>
                              <Separator className="my-3" />
                              <div className="space-y-2 text-sm">
                                {booking.notes && (
                                  <div>
                                    <p className="font-semibold text-gray-700">Notes</p>
                                    <p className="text-gray-600 whitespace-pre-wrap">{booking.notes}</p>
                                  </div>
                                )}
                                {booking.inspirationPhotos && booking.inspirationPhotos.length > 0 && (
                                  <div>
                                    <p className="font-semibold text-gray-700">Inspiration Photos</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {booking.inspirationPhotos.map((photoUrl, index) => (
                                        <a key={index} href={photoUrl} target="_blank" rel="noopener noreferrer">
                                          <img
                                            src={photoUrl}
                                            alt={`Inspiration ${index + 1}`}
                                            className="w-16 h-16 object-cover rounded-md border"
                                          />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : null}
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

      <Dialog
        open={isServiceModalOpen}
        onOpenChange={setIsServiceModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService?.id ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Service Name"
              value={editingService?.name || ''}
              onChange={(e) =>
                setEditingService({ ...editingService!, name: e.target.value })
              }
            />
            <Textarea
              placeholder="Description"
              value={editingService?.description || ''}
              onChange={(e) =>
                setEditingService({
                  ...editingService!,
                  description: e.target.value,
                })
              }
            />
            <Input
              type="number"
              placeholder="Duration (minutes)"
              value={editingService?.duration || ''}
              onChange={(e) =>
                setEditingService({
                  ...editingService!,
                  duration: parseInt(e.target.value, 10) || 0,
                })
              }
            />
            <Select
              value={editingService?.category || ''}
              onValueChange={(value) =>
                setEditingService({ ...editingService!, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {serviceCategories
                  .filter((c) => c !== 'all')
                  .map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat.replace('-', ' ')}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveService}>Save Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!isDeletingService}
        onOpenChange={() => setIsDeletingService(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the service "{isDeletingService?.name}". This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeletingService(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteService}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 