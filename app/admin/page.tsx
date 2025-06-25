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
import { PlusCircle, Edit, Trash2, Calendar as CalendarIcon, LogOut, Search, UploadCloud, Send, Sun, Moon, Settings, Users, Briefcase, Mail } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/ui/file-upload'

const ADMIN_PASSWORD = 'luxe' // This should be an environment variable in a real app

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  category: string;
  isAvailable: boolean;
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
  isAvailable: true,
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
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
        description: 'Failed to fetch data.',
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
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return bookings.filter(b => b.date.startsWith(dateStr));
  }, [selectedDate, bookings]);

  const bookedTimeSlots = useMemo(() => {
    return bookingsForSelectedDate.map(b => b.timeSlot);
  }, [bookingsForSelectedDate]);

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

  const handleToggleServiceAvailability = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !service.isAvailable }),
      });

      if (!response.ok) {
        throw new Error('Failed to update service availability');
      }

      toast({ title: "Success", description: "Service availability has been updated." });
      fetchAdminData();
    } catch (error) {
      toast({ title: "Error", description: "Could not update availability.", variant: "destructive" });
    }
  };

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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-soft">
          <CardHeader className="p-0 text-center">
            <h1 className="font-serif text-3xl font-bold">Admin Access</h1>
            <CardDescription>Enter the password to manage the studio.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg text-center"
            />
            <Button type="submit" className="w-full bg-brand-pink text-white rounded-lg hover:bg-brand-pink/90 transition-colors">
              Login
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-4xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleLogout} variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-brand-pink">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-2xl shadow-soft overflow-hidden">
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2"><Briefcase/> Upcoming Bookings</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  placeholder="Search bookings..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-lg"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {filteredBookings.length > 0 ? filteredBookings.map(booking => (
                    <div key={booking.id} className="p-4 bg-gray-100 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg">{booking.name}</p>
                          {booking.discountApplied && (
                            <Badge variant="secondary" className="mt-1 bg-pink-100 text-pink-700 border-pink-200">30% Discount</Badge>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold">{format(parseISO(booking.date), 'EEE, MMM d')}</p>
                          <p className="text-sm text-brand-pink font-medium">{booking.timeSlot}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="font-semibold text-gray-700">Contact</p>
                          <p className="text-gray-600">{booking.phone}</p>
                          {booking.email && <p className="text-gray-600">{booking.email}</p>}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Services</p>
                          <p className="text-gray-600">{Array.isArray(booking.services) ? booking.services.map(s => serviceLabel(s)).join(', ') : ''}</p>
                        </div>
                        {booking.notes && (
                          <div className="md:col-span-2">
                            <p className="font-semibold text-gray-700">Notes</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{booking.notes}</p>
                          </div>
                        )}
                        {booking.inspirationPhotos && booking.inspirationPhotos.length > 0 && (
                          <div className="md:col-span-2">
                            <p className="font-semibold text-gray-700">Inspiration Photos</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {booking.inspirationPhotos.map((photoUrl, index) => (
                                <a key={index} href={photoUrl} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={photoUrl}
                                    alt={`Inspiration ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded-md border-2 border-gray-200 hover:border-brand-pink transition"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Ticket ID: {booking.ticketId}</p>
                      </div>
                    </div>
                  )) : <p className="text-center text-gray-500 py-8">No upcoming bookings.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-2xl flex items-center gap-2"><Settings/> Manage Services</CardTitle>
              <Button onClick={() => handleOpenServiceModal(null)} className="bg-brand-pink text-white rounded-lg hover:bg-brand-pink/90 transition-colors flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Add Service
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4 border-b">
                {serviceCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`capitalize pb-2 text-sm font-medium transition-colors ${categoryFilter === cat ? 'text-brand-pink border-b-2 border-brand-pink' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    {cat.replace('-', ' ')}
                  </button>
                ))}
              </div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {filteredServices.map(service => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-xl">
                      <div>
                        <p className="font-semibold">{service.name}</p>
                        {service.description && (
                          <p className="text-sm text-gray-500 truncate" title={service.description}>
                            {service.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={service.isAvailable}
                          onCheckedChange={() => handleToggleServiceAvailability(service)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleOpenServiceModal(service)} className="text-gray-500 hover:text-blue-500 rounded-full">
                          <Edit className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsDeletingService(service)} className="text-gray-500 hover:text-red-500 rounded-full">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2"><CalendarIcon /> Availability</CardTitle>
              <CardDescription>Click a date to manage time slots.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={date => date && handleDateClick(date)}
                disabled={{ before: new Date() }}
                className="rounded-lg"
              />
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2"><Mail/> Newsletter</CardTitle>
            </CardHeader>
            <CardContent>
              <NewsletterForm />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2"><UploadCloud /> Price List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <FileUpload onChange={(files) => setPriceListFile(files[0])} />
              </div>
              <Button onClick={handleSavePriceList} disabled={!priceListFile || isSavingPriceList} className="w-full bg-black text-white rounded-lg hover:bg-black/80 transition-colors">
                {isSavingPriceList ? 'Uploading...' : 'Upload New Price List'}
              </Button>
              {priceListUrl && <a href={priceListUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-brand-pink hover:underline">View Current Price List</a>}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Manage Availability for {selectedDate && format(selectedDate, 'PPP')}</DialogTitle>
            <DialogDescription>Select the time slots that are unavailable on this day. Booked slots are disabled.</DialogDescription>
          </DialogHeader>
          
          {bookingsForSelectedDate.length > 0 && (
            <div className="py-2">
                <h4 className="font-semibold mb-2 text-sm text-gray-700">Bookings for this date:</h4>
                <ScrollArea className="h-[100px] rounded-md border p-2 bg-gray-50">
                    <div className="space-y-2">
                        {bookingsForSelectedDate.map(booking => (
                            <div key={booking.id} className="text-sm">
                                <strong>{booking.timeSlot}:</strong> {booking.name} ({booking.services.map(serviceLabel).join(', ')})
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
          )}

          <ScrollArea className="max-h-[50vh]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-4 pr-4">
              {allTimeSlots.map(slot => {
                const isBooked = bookedTimeSlots.includes(slot);
                const isChecked = managedSlots.includes(slot) || isBooked;
                return (
                  <div key={slot} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`slot-${slot}`}
                      checked={isChecked}
                      disabled={isBooked}
                      onChange={() => {
                        if (isBooked) return;
                        setManagedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])
                      }}
                      className="w-4 h-4 text-brand-pink bg-gray-100 border-gray-300 rounded focus:ring-brand-pink disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Label htmlFor={`slot-${slot}`} className={`ml-2 text-sm font-medium text-gray-900 ${isBooked ? 'line-through text-gray-400' : ''}`}>
                      {serviceLabel(slot)}
                    </Label>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={handleSaveAvailability} className="bg-brand-pink text-white rounded-lg hover:bg-brand-pink/90">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editingService?.id ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Service Name" value={editingService?.name || ''} onChange={(e) => setEditingService(s => s ? {...s, name: e.target.value} : null)} />
            <Textarea placeholder="Description" value={editingService?.description || ''} onChange={(e) => setEditingService(s => s ? {...s, description: e.target.value} : null)} />
            <Input type="number" placeholder="Duration (minutes)" value={editingService?.duration || ''} onChange={(e) => setEditingService(s => s ? {...s, duration: parseInt(e.target.value)} : null)} />
            <Select value={editingService?.category} onValueChange={(value) => setEditingService(s => s ? {...s, category: value} : null)}>
              <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
              <SelectContent>
                {serviceCategories.filter(c => c !== 'all').map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveService} className="bg-brand-pink text-white rounded-lg hover:bg-brand-pink/90">Save Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!isDeletingService} onOpenChange={() => setIsDeletingService(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Are you sure?</DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete the "{isDeletingService?.name}" service.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeletingService(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteService} className="bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 