'use client'

import { useState } from 'react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface PriceListDisplayProps {
  initialImageUrl: string | null;
}

export function PriceListDisplay({ initialImageUrl }: PriceListDisplayProps) {
  const [imageUrl] = useState(initialImageUrl || "/Prices-List.png")
  const [loading] = useState(!initialImageUrl)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = "Lauryn-Luxe-Beauty-Price-List.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
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
  )
} 