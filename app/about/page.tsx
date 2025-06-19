import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AnimatedSection } from "@/components/ui/animated-section"

export default function About() {
  return (
    <div>
      {/* Page Header */}
      <AnimatedSection className="bg-black text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">About Our Studio</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Where luxury, precision, and personalized care converge to create an unforgettable beauty experience.
          </p>
        </div>
      </AnimatedSection>

      {/* About Lauryn Section */}
      <AnimatedSection className="py-20 bg-white" delay={0.2}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="aspect-[3/4] relative overflow-hidden rounded-lg shadow-glow">
                <Image src="/IMG_7705.png" alt="Lauryn Lambat" fill className="object-cover" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-serif mb-6">About Lauryn</h2>
              <p className="text-gray-700 mb-4">
                Lauryn Lambat is the creative force and founder behind Lauryn Luxe Beauty Studio. With a background in
                beauty and a passion for nail artistry, Lauryn established her studio in 2022 with a vision to redefine
                luxury beauty experiences in Blantyre.
              </p>
              <p className="text-gray-700 mb-4">
                Her journey began with a simple belief: that beauty rituals should be moments of self-care, luxury, and
                personal expression. This philosophy guides every aspect of the studio's operations, from the serene
                ambiance to the meticulous attention given to each client.
              </p>
              <p className="text-gray-700 mb-4">
                Lauryn's expertise and artistic eye have earned her a reputation for excellence. She continuously hones
                her craft by staying updated with the latest techniques and trends in the beauty industry, ensuring that
                her clients receive nothing but the best.
              </p>
              <p className="text-gray-700">
                Beyond her technical skills, Lauryn is known for her warm personality and ability to make every client
                feel valued and comfortable. She believes that true beauty comes from feeling confident and cared for,
                and she strives to create this experience for everyone who visits her studio.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Studio Philosophy */}
      <AnimatedSection className="py-20 bg-nude-light" delay={0.4}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif mb-8 text-center">Studio Philosophy</h2>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-white p-8 shadow-soft">
                <h3 className="text-xl font-serif mb-4">Precision & Excellence</h3>
                <p className="text-gray-700">
                  At Lauryn Luxe, we believe that excellence lies in the details. Every service we provide is executed
                  with meticulous precision and unwavering attention to detail. We take pride in our craftsmanship and
                  strive for perfection in every nail we touch.
                </p>
              </div>

              <div className="bg-white p-8 shadow-soft">
                <h3 className="text-xl font-serif mb-4">Elegance & Sophistication</h3>
                <p className="text-gray-700">
                  Elegance is at the heart of our aesthetic. We embrace sophisticated designs, clean lines, and timeless
                  beauty. Our work reflects a refined taste that enhances your natural beauty while making a statement
                  of quiet confidence.
                </p>
              </div>

              <div className="bg-white p-8 shadow-soft">
                <h3 className="text-xl font-serif mb-4">Self-Care & Wellness</h3>
                <p className="text-gray-700">
                  We view beauty rituals as essential acts of self-care. Our studio provides a sanctuary where you can
                  disconnect from the outside world and focus on your wellbeing. Every treatment is designed to nurture
                  both your physical appearance and inner peace.
                </p>
              </div>

              <div className="bg-white p-8 shadow-soft">
                <h3 className="text-xl font-serif mb-4">Premium Experience</h3>
                <p className="text-gray-700">
                  From the moment you enter our studio to the moment you leave, we are committed to providing a premium
                  experience. We use only the finest products, maintain impeccable hygiene standards, and offer
                  personalized attention to ensure your complete satisfaction.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/services">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-none">Explore Our Services</Button>
              </Link>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Studio Images */}
      <AnimatedSection className="py-20 bg-white" delay={0.6}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif mb-12 text-center">Our Studio</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="aspect-[3/4] relative overflow-hidden rounded-lg shadow-soft">
              <Image src="/IMG_7186.png" alt="Studio Interior" fill className="object-cover" />
            </div>
            <div className="aspect-[3/4] relative overflow-hidden rounded-lg shadow-soft">
              <Image src="/IMG_7410.png" alt="Nail Station" fill className="object-cover" />
            </div>
            <div className="aspect-[3/4] relative overflow-hidden rounded-lg shadow-soft">
              <Image src="/IMG_7429.png" alt="Relaxation Area" fill className="object-cover" />
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="py-20 bg-black text-white" delay={0.8}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif mb-6">Experience Luxury Beauty</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            We invite you to visit Lauryn Luxe Beauty Studio and experience our philosophy in action. Book your
            appointment today and discover the difference.
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
