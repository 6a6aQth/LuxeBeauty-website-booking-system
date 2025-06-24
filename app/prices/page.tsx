"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { Download } from "lucide-react"

export default function PricesPage() {
  const imageUrl = "/Prices-List.png"

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
          <Image
            src={imageUrl}
            alt="Lauryn Luxe Beauty Price List"
            width={1000}
            height={1414}
            className="rounded-lg shadow-lg object-contain w-full h-auto"
            priority
          />
        </div>
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download Price List
        </Button>
      </div>
    </div>
  )
} 