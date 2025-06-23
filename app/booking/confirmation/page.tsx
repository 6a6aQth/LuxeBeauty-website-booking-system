"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRef, useEffect, useState } from "react"
import { toPng } from "html-to-image"
import Image from "next/image"
import { formatTime, serviceLabel } from "@/lib/time-slots"

export default function BookingConfirmation() {
  const ticketRef = useRef<HTMLDivElement>(null)
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const downloadButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('lauryn-luxe-booking')
    if (data) {
      setBookingDetails(JSON.parse(data))
    }
  }, [])

  useEffect(() => {
    // Scroll to the download button on page load
    if (bookingDetails && downloadButtonRef.current) {
       setTimeout(() => {
        downloadButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500); // Delay to allow page to render fully
    }
  }, [bookingDetails]);

  const handleDownload = async () => {
    if (ticketRef.current) {
      const dataUrl = await toPng(ticketRef.current)
      const link = document.createElement("a")
      link.download = "lauryn-luxe-booking-ticket.png"
      link.href = dataUrl
      link.click()
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20 bg-gradient-to-br from-pink-50 to-nude-light">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-serif mb-2">Booking Request Received</h1>
          <p className="text-gray-600 mb-8 text-lg">Please download your ticket below.</p>

          {/* Elegant Ticket Section */}
          <div className="flex flex-col items-center mb-8" ref={downloadButtonRef}>
            <div
              ref={ticketRef}
              className="relative bg-white border-2 border-pink-200 rounded-2xl shadow-2xl px-8 py-12 w-full max-w-xl flex flex-col items-center justify-center overflow-hidden"
              style={{ fontFamily: 'Montserrat, sans-serif', minHeight: 520 }}
            >
              {/* Watermark logo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10 z-0">
                <Image src="/lauryn-luxe-logo.png" alt="Lauryn Luxe Logo Watermark" width={340} height={340} style={{objectFit: 'contain'}} />
              </div>
              {/* Blush-pink gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 to-white/60 z-0" />
              {/* Main content */}
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
                      <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800">
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
              {/* Decorative border bottom */}
              <div className="absolute left-0 right-0 bottom-0 h-3 bg-gradient-to-r from-pink-200 via-pink-100 to-pink-200 rounded-b-2xl" />
            </div>
            <Button className="mt-4 bg-pink-500 text-white hover:bg-pink-600 rounded-none shadow-lg" onClick={handleDownload}>
              Download Ticket
            </Button>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-glow mb-8">
            <p className="text-gray-700 mb-6">
              Thank you for booking with Lauryn Luxe Beauty Studio. We have received your appointment request and will
              contact you shortly to confirm the details.
            </p>

            <p className="text-gray-700">
              If you have any questions or need to make changes to your appointment, please contact us at{" "}
              <span className="font-medium">0997940419</span> or{" "}
              <span className="font-medium">lambatlauryn@gmail.com</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white rounded-none"
              >
                Return to Home
              </Button>
            </Link>

            <Link href="/services">
              <Button className="bg-black text-white hover:bg-gray-800 rounded-none">Browse Our Services</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
