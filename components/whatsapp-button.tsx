"use client"

import { useState, useEffect } from "react"
import { MessageCircle } from "lucide-react"

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/265997940419", "_blank")
  }

  return (
    <button
      onClick={handleWhatsAppClick}
      className={`fixed bottom-6 right-6 z-50 bg-green-500 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:bg-green-600 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  )
}
