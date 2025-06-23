"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"
import { AnimatedSection } from "@/components/ui/animated-section"

const services = {
  manicure: [
    { name: "Gel on natural nails", price: "15,000" },
    { name: "Gel on tips", price: "18,000" },
    { name: "Acrylic on natural nails", price: "20,000" },
    { name: "Acrylic on tips", price: "22,000" },
    { name: "Luxury manicure (includes hand massage)", price: "25,000" },
  ],
  pedicure: [
    { name: "Basic pedicure", price: "12,000" },
    { name: "Gel pedicure", price: "18,000" },
    { name: "Luxury pedicure (includes foot massage)", price: "22,000" },
    { name: "Paraffin treatment", price: "15,000" },
  ],
  refills: [
    { name: "Gel refill", price: "12,000" },
    { name: "Acrylic refill", price: "15,000" },
    { name: "Repair (per nail)", price: "2,000" },
  ],
  nailArt: [
    { name: "Simple design (per nail)", price: "1,000" },
    { name: "Complex design (per nail)", price: "2,000" },
    { name: "Full set design", price: "10,000" },
    { name: "3D art (per nail)", price: "3,000" },
    { name: "Chrome/holographic finish", price: "5,000" },
  ],
  soakOff: [
    { name: "Gel soak off", price: "5,000" },
    { name: "Acrylic soak off", price: "8,000" },
    { name: "Soak off with new application", price: "3,000" },
  ],
}

const serviceImages = {
  manicure: "/IMG_7410.png",
  pedicure: "/IMG_7429.png",
  refills: "/IMG_7435.png",
  nailArt: "/IMG_5656.png",
  soakOff: "/IMG_5922.png",
}

export default function ServicesPage() {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState("manicure")

  return (
    <div>
      {/* Page Header */}
      <AnimatedSection className="bg-black text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Our Services</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Discover our range of premium nail care services, each delivered with meticulous attention to detail and
            using only the finest products.
          </p>
        </div>
      </AnimatedSection>

      {/* Main Content Area */}
      <div className="bg-gray-300">
        {/* Services Section */}
        <AnimatedSection className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif mb-12 text-center">Our Services</h2>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {isMobile && (
                <Select onValueChange={setActiveTab} value={activeTab}>
                  <SelectTrigger className="w-full mb-4">
                    <SelectValue placeholder="Select a service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(services).map((category) => (
                      <SelectItem key={category} value={category} className="capitalize">
                        {category.replace("-", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <TabsList className={`grid w-full grid-cols-5 bg-white/50 border ${isMobile ? "hidden" : ""}`}>
                {Object.keys(services).map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="capitalize data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
                  >
                    {category.replace("-", " ")}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-8">
                {Object.keys(services).map((category) => (
                  <TabsContent key={category} value={category}>
                    <div className="grid md:grid-cols-2 gap-12 items-start">
                      <div className="sticky top-24">
                        <div className="aspect-square relative overflow-hidden rounded-lg shadow-glow mb-6">
                          <Image
                            src={serviceImages[category as keyof typeof serviceImages]}
                            alt={`${category} services`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-gray-700 text-sm">
                          {category === "manicure" &&
                            "Our manicure services are designed to enhance the natural beauty of your hands while ensuring nail health and longevity."}
                          {category === "pedicure" &&
                            "Pamper your feet with our luxurious pedicure treatments that combine relaxation with expert nail care."}
                          {category === "refills" &&
                            "Maintain your beautiful nails with our professional refill services, extending the life of your manicure."}
                          {category === "nail-art" &&
                            "Express your personality with our creative nail art options, from subtle elegance to bold statements."}
                          {category === "soak-off" &&
                            "Our gentle soak-off services ensure safe removal of previous applications without damaging your natural nails."}
                        </p>
                      </div>

                      <div>
                        <h2 className="text-3xl font-serif mb-6 capitalize">{category.replace("-", " ")} Services</h2>
                        <div className="space-y-4">
                          {services[category as keyof typeof services].map((service, index) => (
                            <Card key={index} className="border-none shadow-soft bg-white/70">
                              <CardContent className="p-4 flex justify-between items-center">
                                <h3 className="font-medium">{service.name}</h3>
                                <p className="font-serif text-gray-800">MK {service.price}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        </AnimatedSection>

        {/* Additional Info Section */}
        <AnimatedSection className="py-20" delay={0.2}>
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif mb-8 text-center">Additional Information</h2>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-serif mb-3">Products We Use</h3>
                <p className="text-gray-500 mb-4">Only the finest quality for our clients</p>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>Premium gel polish brands</li>
                  <li>High-quality acrylic products</li>
                  <li>Luxury hand and foot creams</li>
                  <li>Professional-grade tools and equipment</li>
                  <li>Sanitized and sterilized implements for each client</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-serif mb-3">Service Policies</h3>
                <p className="text-gray-500 mb-4">What to expect during your visit</p>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>Please arrive 5-10 minutes before your appointment</li>
                  <li>Cancellations require 24-hour notice</li>
                  <li>Late arrivals may result in shortened service time</li>
                  <li>Complimentary beverages offered during your service</li>
                  <li>Payment methods: Cash, mobile money, and bank transfers</li>
                </ul>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif mb-6">Ready to Book Your Service?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Schedule your appointment today and experience the luxury of Lauryn Luxe Beauty Studio.
          </p>
          <Link href="/booking">
            <Button className="bg-white text-black hover:bg-gray-200 rounded-none px-8 py-6 text-base">
              Book Your Appointment
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
