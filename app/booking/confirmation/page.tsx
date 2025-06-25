"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Logo from '@/components/logo'
import { serviceLabel, formatTime } from '@/lib/time-slots'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'
import { AnimatedSubscribeButton } from '@/components/ui/animated-subscribe-button'
import { Mail, Phone, Home } from 'lucide-react'

interface BookingDetails {
  id: string
  name: string
  date: string
  timeSlot: string
  services: string[]
  fee: string
  ticketId: string
  email?: string
}

export default function BookingConfirmationPage() {
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(
    null
  )
  const [isClient, setIsClient] = useState(false)
  const ticketRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
    try {
      const storedBooking = sessionStorage.getItem('lauryn-luxe-booking')
      if (storedBooking) {
        setBookingDetails(JSON.parse(storedBooking))
      }
    } catch (error) {
      console.error('Failed to parse booking details from session storage', error)
    }
  }, [])

  const handleDownloadTicket = async () => {
    const { default: html2canvas } = await import('html2canvas')
    if (ticketRef.current) {
      const canvas = await html2canvas(ticketRef.current, { scale: 2 })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `booking-ticket-${bookingDetails?.ticketId}.png`
      link.click()
    }
  }

  const handleSubscribe = async () => {
    if (!bookingDetails?.email) {
      toast({
        title: 'No Email Found',
        description:
          'An email address is required to subscribe. It was not provided during booking.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Subscribing...',
      description: 'Adding you to our newsletter.',
    })

    try {
      const response = await fetch('/api/newsletter/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: bookingDetails.email }),
      })

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to subscribe')
      }

      toast({
        title: 'Subscribed!',
        description: 'Thank you for subscribing to our newsletter.',
      })
    } catch (error: any) {
      toast({
        title: 'Subscription Failed',
        description: error.message || 'Could not subscribe. Please try again later.',
        variant: 'destructive',
      })
    }
  }

  if (!isClient) {
    return null // Render nothing on the server
  }

  if (!bookingDetails) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          No Booking Found
        </h1>
        <p className="text-gray-600 mb-8">
          We couldn't find any booking details. Please book an appointment first.
        </p>
        <Button asChild>
          <Link href="/booking">Go to Booking Page</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-gray-200 py-12 sm:py-20">
      <div className="w-full max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-serif text-gray-800 mb-3">
          Booking Request Received
        </h1>
        <p className="text-gray-600 mb-10">
          Please download your ticket below.
        </p>

        <div className="max-w-md mx-auto">
          {/* Ticket */}
          <div
            ref={ticketRef}
            className="bg-white p-8 rounded-t-xl shadow-2xl relative"
          >
            <div className="text-center mb-8">
              <Logo />
            </div>
            <div className="space-y-4 text-center text-gray-700">
              <p>
                <strong>Name:</strong> {bookingDetails.name}
              </p>
              <p>
                <strong>Date:</strong> {bookingDetails.date}
              </p>
              <p>
                <strong>Time:</strong> {formatTime(bookingDetails.timeSlot)}
              </p>
              <p>
                <strong>Services:</strong>{' '}
                {bookingDetails.services.map(serviceLabel).join(', ')}
              </p>
              <p>
                <strong>Booking Fee:</strong> {bookingDetails.fee}
              </p>
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm font-semibold text-gray-800">
                Ticket ID: {bookingDetails.ticketId}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Show this ticket at the studio for your appointment.
              </p>
            </div>
            {/* Decorative cutout */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-gray-200 rounded-full"></div>
          </div>

          {/* Action Area */}
          <div className="bg-white p-8 rounded-b-xl shadow-2xl text-center">
            <Button asChild>
                <Link href="/#newsletter-signup">Subscribe to Newsletter</Link>
            </Button>
            <p className="text-xs text-gray-500 mt-4 max-w-xs mx-auto">
                Stay updated with our latest offers and news.
            </p>
          </div>
        </div>
      </div>

      {/* Post-Booking Section */}
      <div className="w-full max-w-2xl mx-auto mt-12 text-center text-gray-700">
        <p className="mb-4">
            Thank you for booking with Lauryn Luxe Beauty Studio. We have
            received your appointment details.
        </p>
        <div className="flex justify-center mb-8">
          <AnimatedSubscribeButton onClick={handleDownloadTicket} className="bg-black text-white">
            <span>Download Ticket</span>
            <span>Downloaded!</span>
          </AnimatedSubscribeButton>
        </div>
      </div>
    </div>
  )
}
