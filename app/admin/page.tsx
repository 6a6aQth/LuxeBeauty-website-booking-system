'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
import { getSlotsForDate, formatTime, generateTimeSlots } from "@/lib/time-slots"
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
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

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
  const [isClient, setIsClient] = useState(false)
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setIsClient(true), [])

  // NEW useEffect hook to synchronize managedSlots with unavailableDates
  useEffect(() => {
    if (isModalOpen && selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const unavailableForDate = unavailableDates.find(d => d.date === dateString);
      setManagedSlots(unavailableForDate ? unavailableForDate.timeSlots : []);
    }
  }, [isModalOpen, selectedDate, unavailableDates]); // Dependency array includes unavailableDates

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

  const getServiceNames = (serviceIds: string[]): string[] => {
    if (!services || services.length === 0) return serviceIds; // Fallback to IDs if services not loaded
    return serviceIds.map(id => {
      const service = services.find(s => s.id === id);
      return service ? service.name : id; // Fallback to ID if name not found
    });
  };

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
        const servicesString = Array.isArray(booking.services) ? getServiceNames(booking.services).join(' ') : '';
        return (
          booking.name.toLowerCase().includes(searchLower) ||
          booking.phone.toLowerCase().includes(searchLower) ||
          (booking.email && booking.email.toLowerCase().includes(searchLower)) ||
          servicesString.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort the bookings by date and timeSlot (earliest first)
    return bookingsToShow.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      // If dates are equal, compare timeSlot as time (e.g., '8:30 AM')
      const parseTime = (timeStr: string) => {
        // Parse '8:30 AM' to a Date object on the same day
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      return parseTime(a.timeSlot) - parseTime(b.timeSlot);
    });
  }, [bookings, searchTerm, showAll]);
  
  const weeklyCapacity = useMemo(() => {
    const today = new Date();
    const next7Days = addDays(today, 7);
    today.setHours(0, 0, 0, 0);
    
    const bookingsInNext7Days = bookings.filter(b => {
      try {
            const bookingDate = parseISO(b.date);
            return isValid(bookingDate) && isWithinInterval(bookingDate, { start: today, end: next7Days });
      } catch {
        return false;
      }
    });

    const totalSlotsInNext7Days = allTimeSlots.length * 7;
    const bookedSlots = bookingsInNext7Days.length;

    if (totalSlotsInNext7Days === 0) {
        return { count: 0, percentage: 0 };
    }

    const percentage = (bookedSlots / totalSlotsInNext7Days) * 100;

    return { count: bookedSlots, percentage };
  }, [bookings, allTimeSlots]);

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
      const response = await fetch('/api/unavailable-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, slots: managedSlots }),
      });

      if (!response.ok) {
        throw new Error('Failed to update availability');
      }
      
      const updatedUnavailableDate = await response.json();
      setUnavailableDates(prev => {
        const existingIndex = prev.findIndex(u => u.date === updatedUnavailableDate.date);
        if (existingIndex > -1) {
          const newArr = [...prev];
          newArr[existingIndex] = updatedUnavailableDate;
          return newArr;
        } else {
          return [...prev, updatedUnavailableDate];
        }
      });

      toast({ title: "Success", description: "Availability updated successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update availability.", variant: "destructive" });
    } finally {
      setIsModalOpen(false);
      fetchAdminData(); // Ensure latest data is fetched after saving
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
    setManagedSlots(unavailableForDate ? unavailableForDate.timeSlots : []);
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
      <WavyBackground
        containerClassName="flex items-center justify-center"
        className="p-4"
        colors={["#2E2E2E", "#4A4A4A", "#1C1C1C"]}
        waveOpacity={0.3}
        backgroundFill="black"
      >
        <Card className="relative max-w-sm p-6 space-y-4 overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
          <ShineBorder borderWidth={2} shineColor="hsl(var(--primary))" />
          <CardHeader className="text-center p-0">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <CardTitle className="text-2xl font-bold font-serif">Admin Login</CardTitle>
            <CardDescription>Enter password to manage the studio.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleLogin} className="space-y-4 pt-4">
                <Input
                  type="password"
                placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg text-center bg-gray-100 dark:bg-gray-800"
                />
              <Button type="submit" className="w-full bg-brand-pink text-white rounded-lg hover:bg-brand-pink/90 transition-colors">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </WavyBackground>
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
                          <p className="text-gray-600">{Array.isArray(booking.services) ? getServiceNames(booking.services).join(', ') : ''}</p>
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
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="font-serif text-2xl flex items-center gap-2"><Settings/> Manage Services</CardTitle>
              <Button onClick={() => handleOpenServiceModal(null)} className="bg-brand-pink text-white rounded-lg hover:bg-brand-pink/90 transition-colors flex items-center gap-2 self-end sm:self-center">
                <PlusCircle className="w-5 h-5" />
                Add Service
              </Button>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="mb-4">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full">
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
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-4 border-b overflow-x-auto pb-2">
                  {serviceCategories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`capitalize pb-2 text-sm font-medium transition-colors whitespace-nowrap ${categoryFilter === cat ? 'text-brand-pink border-b-2 border-brand-pink' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      {cat.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              )}
              <ScrollArea className="h-[400px]">
                {isMobile ? (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredServices.map(service => (
                      <AccordionItem value={service.id} key={service.id}>
                        <AccordionTrigger className="p-3 bg-gray-100 rounded-xl">
                          <span className="font-semibold text-left">{service.name}</span>
                        </AccordionTrigger>
                        <AccordionContent className="p-3 bg-gray-50 rounded-b-xl">
                          <p className="text-sm text-gray-600 mb-4">{service.description || 'No description.'}</p>
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`switch-${service.id}`} className="flex items-center gap-2 text-sm font-medium">
                              <Switch
                                id={`switch-${service.id}`}
                                checked={service.isAvailable}
                                onCheckedChange={() => handleToggleServiceAvailability(service)}
                              />
                              Service Available
                            </Label>
                            <Button variant="outline" size="sm" onClick={() => handleOpenServiceModal(service)} className="flex items-center gap-2">
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="space-y-3 pr-4">
                    {filteredServices.map(service => (
                      <div key={service.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-xl gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-gray-500 truncate" title={service.description}>
                              {service.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <Switch
                            checked={service.isAvailable}
                            onCheckedChange={() => handleToggleServiceAvailability(service)}
                          />
                          <Button variant="ghost" size="icon" onClick={() => handleOpenServiceModal(service)} className="text-gray-500 hover:text-blue-500 rounded-full">
                            <Edit className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setPriceListFile(e.target.files[0]);
                    }
                  }}
                  disabled={isSavingPriceList}
                />
                {priceListFile && (
                  <div className="mt-4 flex flex-col items-center">
                    <img
                      src={URL.createObjectURL(priceListFile)}
                      alt="Selected price list preview"
                      className="w-40 h-40 object-contain rounded border border-gray-200 shadow-sm"
                    />
                    <button
                      type="button"
                      className="mt-2 text-xs text-red-500 hover:underline"
                      onClick={() => {
                        setPriceListFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      disabled={isSavingPriceList}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <Button onClick={handleSavePriceList} disabled={!priceListFile || isSavingPriceList} className="w-full bg-black text-white rounded-lg hover:bg-black/80 transition-colors flex items-center justify-center gap-2">
                {isSavingPriceList && (
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                )}
                {isSavingPriceList ? 'Uploading...' : 'Upload New Price List'}
              </Button>
              {priceListUrl && <a href={priceListUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-brand-pink hover:underline">View Current Price List</a>}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
              <CardHeader>
              <CardTitle className="font-serif text-xl">Next 7 Days Capacity</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">{weeklyCapacity.count} Bookings</span>
                <span className="text-sm font-medium text-gray-600">{Math.round(weeklyCapacity.percentage)}% full</span>
                              </div>
              <Progress value={weeklyCapacity.percentage} className="w-full" />
              </CardContent>
            </Card>
          </div>
        </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent key={selectedDate?.toISOString() || 'default'} className="rounded-2xl">
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
                                 <strong>{booking.timeSlot}:</strong> {booking.name} ({Array.isArray(booking.services) ? getServiceNames(booking.services).join(', ') : ''})
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
                return (
                  <div key={slot} className="flex items-center">
                    <Checkbox
                      id={`slot-${slot}`}
                      checked={managedSlots.includes(slot)}
                      disabled={isBooked}
                      onCheckedChange={() => {
                        if (isBooked) return;
                        setManagedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
                      }}
                    />
                    <Label htmlFor={`slot-${slot}`} className={cn("ml-2 text-sm font-medium text-gray-900", isBooked ? 'line-through text-gray-400' : '')}>
                      {formatTime(slot)}
                    </Label>
                    {isBooked && (
                      <Badge variant="destructive" className="ml-auto text-xs py-0.5 px-2 rounded-full">Booked</Badge>
                    )}
                  </div>
                );
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
                {serviceCategories.filter(c => c !== 'all').map(cat => <SelectItem key={cat} value={cat} className="capitalize">{cat.replace('-', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="sm:justify-between">
            {editingService?.id && (
              <Button 
                variant="destructive"
                onClick={() => {
                  setIsDeletingService(editingService)
                  setIsServiceModalOpen(false)
                }} 
                className="bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete Service
              </Button>
            )}
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