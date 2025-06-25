import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import LayoutProvider from "@/components/layout-provider"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Lauryn Luxe Beauty Studio",
  description: "Luxury beauty, redefined. Premium beauty salon in Blantyre.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ overflowX: "hidden" }}>
      <body
        className={`${playfair.variable} ${inter.variable} font-sans bg-white`}
        style={{ overflowX: "hidden" }}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LayoutProvider>{children}</LayoutProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
