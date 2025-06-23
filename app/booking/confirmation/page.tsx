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
    if (!ticketRef.current) return

    try {
      const dataUrl = await toPng(ticketRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `lauryn-luxe-ticket-${bookingDetails?.ticketId || 'booking'}.png`;
      link.href = dataUrl;
      link.click();
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
        
        <div>
          <div ref={ticketRef} className="ticket bg-white max-w-lg mx-auto rounded-xl shadow-lg p-6 md:p-10 border border-gray-200 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-8 bg-gray-300 rounded-b-full border-x border-b border-gray-400"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-8 bg-gray-300 rounded-t-full border-x border-t border-gray-400"></div>

            <div className="relative z-10 w-full flex flex-col items-center">
              {/* Logo text recreation */}
              <div className="text-center mb-2">
                <div className="text-[2.5rem] md:text-[3.2rem] font-serif tracking-[0.3em] leading-none text-black font-light">LAURYN</div>
                <div className="text-3xl md:text-4xl italic font-serif tracking-wide text-black -mt-2 mb-1" style={{fontFamily: 'Playfair Display, serif', fontStyle: 'italic'}}>luxe</div>
                <div className="uppercase text-xs tracking-[0.2em] text-gray-700 mb-1">Beauty Studio</div>
                <div className="italic text-gray-400 text-base mb-6">Luxury beauty. Redefined.</div>
              </div>
              {bookingDetails ? (
                <div className="mx-auto max-w-md text-center text-black text-lg space-y-2" style={{fontFamily: 'Montserrat, sans-serif'}}>
                  {bookingDetails.discountApplied && (
                    <div className="mb-4 p-3 bg-gray-400 border border-gray-500 rounded-lg text-gray-900">
                      <span className="font-bold">🎉 30% Loyalty Discount Applied! 🎉</span>
                    </div>
                  )}
                  <div><span className="font-bold">Name:</span> {bookingDetails.name}</div>
                  <div><span className="font-bold">Date:</span> {bookingDetails.date}</div>
                  <div><span className="font-bold">Time:</span> {formatTime(bookingDetails.timeSlot)}</div>
                  <div><span className="font-bold">Services:</span> {Array.isArray(bookingDetails.services) ? bookingDetails.services.map((s: string) => serviceLabel(s)).join(", ") : ''}</div>
                  <div><span className="font-bold">Booking Fee:</span> {bookingDetails.fee}</div>
                  <div className="pt-4 text-xs text-gray-400">Ticket ID: {bookingDetails.ticketId}</div>
                  <div className="text-xs text-gray-400">Show this ticket at the studio for your appointment.</div>
                </div>
              ) : (
                <div className="text-gray-400 italic">No booking details found.</div>
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
