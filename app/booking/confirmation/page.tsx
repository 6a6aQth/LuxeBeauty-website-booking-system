"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRef, useEffect, useState } from "react"
import { toPng } from "html-to-image"
import Image from "next/image"
import { formatTime, serviceLabel } from "@/lib/time-slots"

export default function BookingConfirmation() {
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const ticketRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const data = sessionStorage.getItem('lauryn-luxe-booking')
    if (data) {
      setBookingDetails(JSON.parse(data))
    }
  }, [])

  const handleDownload = async () => {
    const element = ticketRef.current
    if (!element) return

    try {
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight,
      })
      const link = document.createElement('a')
      link.download = `lauryn-luxe-ticket-${bookingDetails?.ticketId || 'booking'}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('oops, something went wrong!', err)
    }
  }

  return (
    <div className="bg-gray-300 min-h-screen">
      <div className="container mx-auto px-4 py-12 md:py-20 text-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif mb-2">Booking Request Received</h1>
          <p className="text-lg text-gray-600 mb-8">Please download your ticket below.</p>
        </div>
        
        <div className="flex justify-center">
          <div ref={ticketRef} className="ticket bg-white max-w-lg rounded-xl shadow-lg p-6 md:p-10 border border-gray-200 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-8 bg-gray-300 rounded-b-full border-x border-b border-gray-400"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-8 bg-gray-300 rounded-t-full border-x border-t border-gray-400"></div>

            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="text-center mb-6">
                <p className="text-4xl font-serif tracking-widest text-black">LAURYN</p>
                <p className="text-5xl font-serif italic text-black -mt-2">luxe</p>
                <p className="text-sm tracking-widest text-gray-500">BEAUTY STUDIO</p>
              </div>

              {bookingDetails ? (
                <div className="w-full text-center text-black text-lg space-y-3">
                  {bookingDetails.discountApplied && (
                    <div className="mb-4 p-3 bg-gray-200 border border-gray-300 rounded-lg">
                      <p className="font-bold text-green-600">🎉 30% Loyalty Discount Applied! 🎉</p>
                    </div>
                  )}
                  <p><span className="font-semibold">Name:</span> {bookingDetails.name}</p>
                  <p><span className="font-semibold">Date:</span> {bookingDetails.date}</p>
                  <p><span className="font-semibold">Time:</span> {formatTime(bookingDetails.timeSlot)}</p>
                  <p><span className="font-semibold">Services:</span> {Array.isArray(bookingDetails.services) ? bookingDetails.services.map((s: string) => serviceLabel(s)).join(", ") : ''}</p>
                  <p><span className="font-semibold">Booking Fee:</span> {bookingDetails.fee}</p>
                  <div className="pt-6 text-xs text-gray-400">
                    <p>Ticket ID: {bookingDetails.ticketId}</p>
                    <p>Show this ticket at the studio for your appointment.</p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic">No booking details found.</div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className="mt-8">
            <Button
              onClick={handleDownload}
              className="bg-black text-white hover:bg-gray-800 rounded-md py-3 px-8 text-base"
            >
              Download Ticket
            </Button>
          </div>
          <p className="mt-4 text-gray-500">
            Thank you for booking with Lauryn Luxe Beauty Studio. We have received your appointment
          </p>
        </div>
      </div>
    </div>
  )
}
