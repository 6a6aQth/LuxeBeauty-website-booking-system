const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const services = {
  manicure: [
    { name: 'Gel on natural nails', price: 15000, description: "A long-lasting gel polish application on your natural nails for a flawless finish." },
    { name: 'Gel on tips', price: 18000, description: "Extend your nails with tips and finish with a beautiful gel polish application." },
    { name: 'Acrylic on natural nails', price: 20000, description: "Strengthen and enhance your natural nails with a durable acrylic overlay." },
    { name: 'Acrylic on tips', price: 22000, description: "Achieve your desired length and shape with acrylic extensions on tips." },
    { name: 'Luxury manicure', price: 25000, description: "The ultimate hand treatment, including a relaxing hand massage, exfoliation, and perfect polish." },
  ],
  pedicure: [
    { name: 'Basic pedicure', price: 12000, description: "A classic pedicure to groom your toenails and soften your feet." },
    { name: 'Gel pedicure', price: 18000, description: "Enjoy a classic pedicure with the addition of long-lasting gel polish." },
    { name: 'Luxury pedicure', price: 22000, description: "Indulge in a spa pedicure that includes a soothing foot massage, exfoliation, and mask." },
    { name: 'Paraffin treatment', price: 15000, description: "Deeply moisturize and soften your feet with a warm paraffin wax treatment." },
  ],
  refills: [
    { name: 'Gel refill', price: 12000, description: "Maintain your gel manicure by filling in the regrowth." },
    { name: 'Acrylic refill', price: 15000, description: "Keep your acrylics looking fresh by filling in the regrowth area." },
    { name: 'Repair (per nail)', price: 2000, description: "Fix a chipped or broken nail to restore your perfect manicure." },
  ],
  'nail-art': [
    { name: 'Simple design (per nail)', price: 1000, description: "Add a touch of creativity with a simple design on one or more nails." },
    { name: 'Complex design (per nail)', price: 2000, description: "For more intricate and detailed nail art designs." },
    { name: 'Full set design', price: 10000, description: "Adorn all your nails with a cohesive and beautiful design." },
    { name: '3D art (per nail)', price: 3000, description: "Elevate your nail art with stunning three-dimensional elements." },
    { name: 'Chrome/holographic finish', price: 5000, description: "Get a futuristic and eye-catching look with a chrome or holographic finish." },
  ],
  'soak-off': [
    { name: 'Gel soak off', price: 5000, description: "Safe and gentle removal of your gel polish." },
    { name: 'Acrylic soak off', price: 8000, description: "Professional removal of acrylics to protect your natural nails." },
    { name: 'Soak off with new application', price: 3000, description: "Remove your old polish as part of a fresh new application service." },
  ],
};

const serviceImages = {
  manicure: '/IMG_7410.png',
  pedicure: '/IMG_7429.png',
  refills: '/IMG_7435.png',
  'nail-art': '/IMG_5656.png',
  'soak-off': '/IMG_5922.png',
};

async function main() {
  console.log('Start seeding...');

  for (const [category, serviceList] of Object.entries(services)) {
    for (const service of serviceList) {
      const createdService = await prisma.service.create({
        data: {
          name: service.name,
          price: service.price,
          description: service.description,
          duration: 60,
          category: category,
          image: serviceImages[category],
        },
      });
      console.log(`Created service with id: ${createdService.id}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 