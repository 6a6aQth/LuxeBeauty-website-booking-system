"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { Download } from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function PricesPage() {
  const [imageUrl, setImageUrl] = useState("/Prices-List.png")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPriceListUrl = async () => {
      try {
        const response = await fetch("/api/price-list")
        if (response.ok) {
          const data = await response.json()
          setImageUrl(data.priceListUrl)
        }
      } catch (error) {
        console.error("Failed to fetch price list URL:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPriceListUrl()
  }, [])

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = "Lauryn-Luxe-Beauty-Price-List.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <PageHeader
        title="Our Price List"
        description="Find the perfect treatment for you. All prices are in Malawian Kwacha."
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
        <div className="w-full max-w-lg mb-8">
          {loading ? (
            <Skeleton className="w-full h-[700px] rounded-lg" />
          ) : (
            <Image
              src={imageUrl}
              alt="Lauryn Luxe Beauty Price List"
              width={1000}
              height={1414}
              className="rounded-lg shadow-lg object-contain w-full h-auto"
              priority
            />
          )}
        </div>
        <Button onClick={handleDownload} disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          Download Price List
        </Button>
      </div>
    </div>
  )
} 