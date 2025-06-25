'use client'

import React, { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Service } from "@prisma/client"

interface ServicesListProps {
    groupedServices: Record<string, Service[]>;
}

export function ServicesList({ groupedServices }: ServicesListProps) {
    const categories = Object.keys(groupedServices)
    const [activeTab, setActiveTab] = useState(categories.length > 0 ? categories[0] : '')

    if (!categories.length) {
        return <div>No services available at the moment.</div>;
    }

    const serviceImages: Record<string, string> = {
        manicure: "/IMG_7410.png",
        pedicure: "/pedicure.jpg",
        refills: "/IMG_7435.png",
        'nail-art': "/IMG_5656.png",
        'soak-off': "/IMG_5922.png",
    }

    const categoryDescriptions: Record<string, string> = {
        manicure: "Our manicure services are designed to enhance the natural beauty of your hands while ensuring nail health and longevity.",
        pedicure: "Pamper your feet with our luxurious pedicure treatments that combine relaxation with expert nail care.",
        refills: "Maintain your beautiful nails with our professional refill services, extending the life of your manicure.",
        'nail-art': "Express your personality with our creative nail art options, from subtle elegance to bold statements.",
        'soak-off': "Our gentle soak-off services ensure safe removal of previous applications without damaging your natural nails."
    };
    
    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="hidden md:grid w-full grid-cols-2 md:grid-cols-5 bg-white/80 border backdrop-blur-sm">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="capitalize data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md transition-all duration-300"
                >
                  {category.replace("-", " ")}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="md:hidden">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="capitalize">
                      {category.replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-12">
              {categories.map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="grid md:grid-cols-2 gap-12 items-start">
                    <div className="sticky top-24">
                      <div className="aspect-square relative overflow-hidden rounded-lg shadow-lg mb-6">
                        <Image
                          src={serviceImages[category] || '/placeholder.jpg'}
                          alt={`${category} services`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-gray-600 text-sm italic">
                        {categoryDescriptions[category]}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-3xl font-serif mb-6 capitalize">{category.replace("-", " ")}</h2>
                      <div className="space-y-4">
                        {groupedServices[category].map((service: Service) => (
                          <Card key={service.id} className="border-none shadow-md bg-white/90">
                            <CardContent className="p-4">
                              <h3 className="font-medium text-lg mb-2">{service.name}</h3>
                              <p className="text-gray-600 text-sm">
                                {service.description}
                              </p>
                              <p className="text-sm text-gray-500 mt-2">
                                Duration: {service.duration} minutes
                              </p>
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
    )
} 