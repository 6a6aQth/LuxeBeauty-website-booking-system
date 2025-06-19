import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Instagram } from "lucide-react"
import { TiktokIcon } from "@/components/tiktok-icon"
import { AnimatedSection } from "@/components/ui/animated-section"
import NewsletterSignup from "@/components/newsletter-signup"

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] w-full bg-gradient-to-r from-white to-pink-light flex items-center">
        <div className="container mx-auto px-4 z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              <div className="text-4xl font-serif tracking-wider">LAURYN</div>
              <div className="text-5xl font-serif italic tracking-wide">luxe</div>
              <div className="text-sm tracking-[0.2em] mt-1">B E A U T Y &nbsp; S T U D I O</div>
              <div className="text-xs tracking-[0.1em] mt-0.5">E S T D 2 0 2 2</div>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-light mb-6 glow-text">Luxury beauty, redefined.</h1>
            <p className="text-lg md:text-xl mb-8 max-w-xl mx-auto text-gray-700">
              Experience premium nail care and beauty services in the heart of Blantyre.
            </p>
            <Link href="/booking">
              <Button className="bg-black text-white hover:bg-gray-800 rounded-none px-8 py-6 text-base">
                Book Appointment
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Studio Section */}
      <AnimatedSection className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl font-serif mb-6">About Our Studio</h2>
              <p className="text-gray-700 mb-6">
                Lauryn Luxe Beauty Studio is a premium beauty destination where elegance meets expertise. Founded by
                Lauryn Lambat, our studio offers a serene escape where clients can indulge in top-tier nail care
                services delivered with precision and artistry.
              </p>
              <p className="text-gray-700 mb-6">
                We believe that beauty rituals should be moments of self-care and luxury. Our studio combines
                sophisticated aesthetics with warm hospitality to create an unforgettable experience for every client.
              </p>
              <Link href="/about">
                <Button
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white rounded-none"
                >
                  Learn More About Us
                </Button>
              </Link>
            </div>
            <div className="order-1 md:order-2">
              <div className="aspect-square relative overflow-hidden rounded-lg shadow-glow">
                <Image src="/IMG_7186.png" alt="Lauryn Luxe Beauty Studio Interior" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Services Preview */}
      <AnimatedSection className="py-20 bg-nude-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif mb-4">Our Services</h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Discover our range of premium nail care services, each delivered with meticulous attention to detail and
              using only the finest products.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Manicure",
                image: "/IMG_7410.png",
                description: "Rejuvenate your hands with our signature manicure treatments.",
              },
              {
                title: "Pedicure",
                image: "/IMG_7429.png",
                description: "Pamper your feet with our luxurious pedicure experiences.",
              },
              {
                title: "Nail Art",
                image: "/IMG_7435.png",
                description: "Express yourself with our creative and elegant nail art designs.",
              },
            ].map((service, index) => (
              <Card
                key={index}
                className="border-none shadow-soft overflow-hidden bg-white transition-all duration-300 hover:shadow-glow hover:-translate-y-2"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-serif mb-2">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <Link href="/services" className="text-sm font-medium text-black hover:text-pink-dark">
                    View Details →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/services">
              <Button className="bg-black text-white hover:bg-gray-800 rounded-none">View All Services</Button>
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* About Lauryn */}
      <AnimatedSection className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="aspect-[3/4] relative overflow-hidden rounded-lg shadow-glow">
                <Image src="/IMG_7705.png" alt="Lauryn Lambat" fill className="object-cover" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-serif mb-6">Meet Lauryn</h2>
              <p className="text-gray-700 mb-6">
                Lauryn Lambat is the visionary founder and lead artist behind Lauryn Luxe Beauty Studio. With years of
                experience and a passion for beauty, Lauryn has created a sanctuary where clients can experience the
                pinnacle of nail artistry.
              </p>
              <p className="text-gray-700 mb-6">
                Her meticulous attention to detail and commitment to excellence ensures that every client leaves feeling
                beautiful, confident, and pampered.
              </p>
              <Link href="/about">
                <Button
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white rounded-none"
                >
                  Read Lauryn's Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Instagram Feed */}
      <AnimatedSection className="py-20 bg-gradient-to-r from-pink-light to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif mb-4">Follow Our Journey</h2>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-gray-700">
              <a
                href="https://www.instagram.com/laurynluxebeautystudio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-pink-500"
              >
                <Instagram className="h-5 w-5 mr-2" />
                @laurynluxebeautystudio
              </a>
              <a
                href="https://www.tiktok.com/@nailsbylauryn_nbl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-pink-500"
              >
                <TiktokIcon className="h-5 w-5 mr-2" />
                @nailsbylauryn_nbl
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "/IMG_5656.png",
              "/IMG_5922.png",
              "/IMG_6004.png",
              "/IMG_6056.png",
              "/IMG_6721.png",
              "/IMG_8819.png",
              "/IMG_9067.png",
              "/IMG_9745.png"
            ].map((image, index) => (
              <div key={index} className="aspect-square relative overflow-hidden rounded-lg group">
                <Image
                  src={image}
                  alt={`Instagram post ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Instagram className="h-8 w-8 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Newsletter Section */}
      <AnimatedSection className="py-20 bg-nude-light">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-serif mb-4">Join Our Newsletter</h2>
            <p className="text-gray-700 mb-8">
              Stay up to date with the latest news, exclusive offers, and beauty tips from our experts.
            </p>
            <div className="max-w-md mx-auto">
              <NewsletterSignup />
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif mb-6">Ready for Your Luxe Experience?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Book your appointment today and experience the Lauryn Luxe difference. Your journey to beautiful nails
            begins here.
          </p>
          <Link href="/booking">
            <Button className="bg-white text-black hover:bg-gray-200 rounded-none px-8 py-6 text-base">
              Book Your Appointment
            </Button>
          </Link>
        </div>
      </AnimatedSection>
    </div>
  )
}
