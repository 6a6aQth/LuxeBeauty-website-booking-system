"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Clock, User, Phone, Mail } from "lucide-react"
import { format } from "date-fns"

interface Booking {
  id: string
  ticketId: string
  name: string
  phone: string
  email?: string
  date: string
  timeSlot: string
  services: string[]
  notes?: string
  inspirationPhotos: string[]
  status: string
  discountApplied: boolean
  createdAt: string
  updatedAt: string
}

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  category: string
  isAvailable: boolean
}

export default function ReschedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const successTicketId = searchParams.get('success')
  
  const [ticketId, setTicketId] = useState("")
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [showRescheduleForm, setShowRescheduleForm] = useState(false)

  // Show success message if redirected from successful reschedule
  useEffect(() => {
    if (successTicketId) {
      toast({
        title: "Reschedule Successful!",
        description: "Your appointment has been rescheduled successfully.",
      })
    }
  }, [successTicketId])

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketId.trim()) {
      toast({
        title: "Ticket ID Required",
        description: "Please enter your Ticket ID to look up your booking.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/bookings/lookup/${ticketId}`)
      const data = await response.json()

      if (response.ok && data.booking) {
        setBooking(data.booking)
        setServices(data.services || [])
        setShowRescheduleForm(true)
        toast({
          title: "Booking Found",
          description: "Your booking has been found. You can now reschedule it.",
        })
      } else {
        toast({
          title: "Booking Not Found",
          description: data.message || "No booking found with this Ticket ID.",
          variant: "destructive",
        })
        setBooking(null)
        setShowRescheduleForm(false)
      }
    } catch (error) {
      console.error("Lookup error:", error)
      toast({
        title: "Lookup Failed",
        description: "Failed to look up your booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = () => {
    if (!booking) return
    
    // Navigate to booking page with reschedule mode
    router.push(`/booking?reschedule=${booking.ticketId}`)
  }

  const getServiceNames = (serviceIds: string[]) => {
    return serviceIds
      .map(id => services.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "successful":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div>
      <PageHeader
        title="Reschedule Appointment"
        description="Use your Ticket ID to reschedule your existing appointment."
        backgroundImage="/IMG_7410.png"
      />

      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Look Up Your Booking
            </CardTitle>
            <CardDescription>
              Enter your Ticket ID to find and reschedule your appointment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="space-y-6">
              <div>
                <Label htmlFor="ticketId" className="text-base font-medium text-gray-900">
                  Ticket ID
                </Label>
                <Input
                  id="ticketId"
                  type="text"
                  placeholder="Enter your Ticket ID (e.g., LLB-1234567890-123456)"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="mt-2 bg-gray-50 border-gray-300 text-gray-900 rounded-md focus:ring-brand-pink focus:border-brand-pink"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-brand-pink text-white hover:bg-brand-pink/90 transition-colors"
                disabled={loading || !ticketId.trim()}
              >
                {loading ? "Looking up..." : "Look Up Booking"}
              </Button>
            </form>

            {booking && (
              <div className="mt-8 space-y-6">
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Booking Details</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <span className="font-medium">Name:</span>
                        <span className="ml-2 text-gray-900">{booking.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <span className="font-medium">Phone:</span>
                        <span className="ml-2 text-gray-900">{booking.phone}</span>
                      </div>
                    </div>

                    {booking.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <div>
                          <span className="font-medium">Email:</span>
                          <span className="ml-2 text-gray-900">{booking.email}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-5 w-5 text-gray-500" />
                      <div>
                        <span className="font-medium">Date:</span>
                        <span className="ml-2 text-gray-900">
                          {format(new Date(booking.date), "PPP")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <div>
                        <span className="font-medium">Time:</span>
                        <span className="ml-2 text-gray-900">{booking.timeSlot}</span>
                      </div>
                    </div>

                    <div>
                      <span className="font-medium">Services:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {booking.services.map((serviceId) => {
                          const service = services.find(s => s.id === serviceId)
                          return service ? (
                            <Badge
                              key={serviceId}
                              variant="default"
                              className="bg-brand-pink/10 text-brand-pink border-brand-pink/20"
                            >
                              {service.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-medium">Status:</span>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                      {booking.discountApplied && (
                        <Badge className="bg-purple-100 text-purple-800">
                          Loyalty Discount Applied
                        </Badge>
                      )}
                    </div>

                    {booking.notes && (
                      <div>
                        <span className="font-medium">Notes:</span>
                        <p className="mt-1 text-gray-700">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Reschedule Options</h3>
                  
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      You can reschedule your appointment to a different date and time. 
                      The system will automatically allocate the appropriate time based on your selected services.
                    </p>
                    
                    <div className="flex gap-4">
                      <Button
                        onClick={handleReschedule}
                        className="flex-1 bg-brand-pink text-white hover:bg-brand-pink/90"
                      >
                        Reschedule Appointment
                      </Button>
                      <Button
                        onClick={() => {
                          setBooking(null)
                          setShowRescheduleForm(false)
                          setTicketId("")
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
