import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedSection } from "@/components/ui/animated-section"
import prisma from "@/lib/prisma"
import type { Service } from "@prisma/client"

// Helper to format price with commas
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US').format(price);
};

// Function to fetch services and group them by category
async function getGroupedServices() {
  const services = await prisma.service.findMany({
    orderBy: {
      createdAt: 'asc',
    },
  });

  const grouped = services.reduce((acc: Record<string, Service[]>, service: Service) => {
    const { category } = service;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return grouped;
}

export default async function ServicesPage() {
  const groupedServices = await getGroupedServices();
  const categories = Object.keys(groupedServices);

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
            <Tabs defaultValue={categories[0]} className="w-full">
              <TabsList className={`grid w-full grid-cols-5 bg-white/50 border`}>
                {categories.map((category) => (
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
                {categories.map((category) => (
                  <TabsContent key={category} value={category}>
                    <div className="grid md:grid-cols-2 gap-12 items-start">
                      <div className="sticky top-24">
                        <div className="aspect-square relative overflow-hidden rounded-lg shadow-glow mb-6">
                          <Image
                            src={serviceImages[category] || '/placeholder.jpg'}
                            alt={`${category} services`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-gray-700 text-sm">
                          {categoryDescriptions[category]}
                        </p>
                      </div>

                      <div>
                        <h2 className="text-3xl font-serif mb-6 capitalize">{category.replace("-", " ")} Services</h2>
                        <div className="space-y-4">
                          {groupedServices[category].map((service: Service) => (
                            <Card key={service.id} className="border-none shadow-soft bg-white/70">
                              <CardContent className="p-4 flex justify-between items-center">
                                <h3 className="font-medium">{service.name}</h3>
                                <p className="font-serif text-gray-800">MK {formatPrice(service.price)}</p>
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
