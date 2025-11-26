"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { MenuIcon } from "lucide-react"
import Logo from "@/components/logo"
import { useState } from "react"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/prices", label: "Prices" },
  { href: "/booking", label: "Booking" },
  { href: "/lookup", label: "Reschedule" },
  { href: "/contact", label: "Contact" },
]

const Header = () => {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isAdminPage = pathname.startsWith('/admin')

  return (
    <header id="main-header" className="bg-white shadow-md relative overflow-hidden">
      {!isAdminPage && <div className="holiday-border h-1 w-full" />}

      {!isAdminPage && (
        <div className="bg-gradient-to-r from-[#b5122c] via-[#b5122c] to-[#0f6f2f] text-white text-sm md:text-base py-2">
          <div className="container mx-auto px-4 flex flex-wrap items-center justify-center gap-3 text-center">
            <Image
              src="/christmas-icon.png"
              alt="Holiday ornament"
              width={28}
              height={28}
              className="w-6 h-6 sm:w-7 sm:h-7"
            />
            <span className="font-medium tracking-wide text-center">
              Unwrap your December glam · Glam That Shines Brighter Than Christmas Lights
            </span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 min-h-20 py-2 flex justify-between items-center relative">
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top,_rgba(229,75,75,0.25),_transparent_60%)]" />
        <div className="relative z-10">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        {!isAdminPage && (
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-pink-500 ${
                  pathname === link.href
                    ? "text-pink-600 font-bold"
                    : "text-gray-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="hidden md:block relative z-10">
          {isAdminPage ? (
            <div className="flex items-center pr-4">
              <span className="font-semibold text-pink-600">Admin</span>
            </div>
          ) : (
            <Button asChild className="rounded-none bg-[#B5122C] hover:bg-[#8F0F23] text-white border border-[#b5122c]/30">
              <Link href="/booking">Book Appointment</Link>
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-white">
              <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
              <SheetDescription className="sr-only">
                A list of navigation links for the website.
              </SheetDescription>
              <div className="flex flex-col h-full">
                <div className="p-6">
                  <Logo />
                </div>
                {!isAdminPage && (
                  <nav className="flex flex-col items-center justify-center flex-1 gap-6 text-lg">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`font-medium transition-colors hover:text-pink-500 ${
                          pathname === link.href
                            ? "text-pink-600 font-bold"
                            : "text-gray-700"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                )}
                <div className="p-6 mt-auto">
                  {isAdminPage ? (
                     <div className="text-center">
                      <span className="font-semibold text-pink-600">Admin Mode</span>
                    </div>
                  ) : (
                    <Button
                      asChild
                      className="w-full rounded-none bg-[#B5122C] hover:bg-[#8F0F23] text-white border border-[#b5122c]/40"
                    >
                      <Link href="/booking" onClick={() => setIsMobileMenuOpen(false)}>
                        Book Appointment
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Header
