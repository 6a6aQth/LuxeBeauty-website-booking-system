const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const services = {
  manicure: [
    { name: 'Gel on natural nails', description: "A long-lasting gel polish application on your natural nails for a flawless finish.", duration: 60 },
    { name: 'Gel on tips', description: "Extend your nails with tips and finish with a beautiful gel polish application.", duration: 90 },
    { name: 'Acrylic on natural nails', description: "Strengthen and enhance your natural nails with a durable acrylic overlay.", duration: 90 },
    { name: 'Acrylic on tips', description: "Achieve your desired length and shape with acrylic extensions on tips.", duration: 120 },
    { name: 'Luxury manicure', description: "The ultimate hand treatment, including a relaxing hand massage, exfoliation, and perfect polish.", duration: 75 },
  ],
  pedicure: [
    { name: 'Basic pedicure', description: "A classic pedicure to groom your toenails and soften your feet.", duration: 45 },
    { name: 'Gel pedicure', description: "Enjoy a classic pedicure with the addition of long-lasting gel polish.", duration: 60 },
    { name: 'Luxury pedicure', description: "Indulge in a spa pedicure that includes a soothing foot massage, exfoliation, and mask.", duration: 75 },
    { name: 'Paraffin treatment', description: "Deeply moisturize and soften your feet with a warm paraffin wax treatment.", duration: 30 },
  ],
  refills: [
    { name: 'Gel refill', description: "Maintain your gel manicure by filling in the regrowth.", duration: 60 },
    { name: 'Acrylic refill', description: "Keep your acrylics looking fresh by filling in the regrowth area.", duration: 75 },
    { name: 'Repair (per nail)', description: "Fix a chipped or broken nail to restore your perfect manicure.", duration: 15 },
  ],
  'nail-art': [
    { name: 'Simple design (per nail)', description: "Add a touch of creativity with a simple design on one or more nails.", duration: 15 },
    { name: 'Complex design (per nail)', description: "For more intricate and detailed nail art designs.", duration: 30 },
    { name: 'Full set design', description: "Adorn all your nails with a cohesive and beautiful design.", duration: 45 },
    { name: '3D art (per nail)', description: "Elevate your nail art with stunning three-dimensional elements.", duration: 20 },
    { name: 'Chrome/holographic finish', description: "Get a futuristic and eye-catching look with a chrome or holographic finish.", duration: 25 },
  ],
  'soak-off': [
    { name: 'Gel soak off', description: "Safe and gentle removal of your gel polish.", duration: 20 },
    { name: 'Acrylic soak off', description: "Professional removal of acrylics to protect your natural nails.", duration: 30 },
    { name: 'Soak off with new application', description: "Remove your old polish as part of a fresh new application service.", duration: 15 },
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

  // Clear existing services to avoid duplicates
  await prisma.service.deleteMany();
  console.log('Cleared existing services.');

  for (const [category, serviceList] of Object.entries(services)) {
    for (const service of serviceList) {
      const createdService = await prisma.service.create({
        data: {
          name: service.name,
          description: service.description,
          duration: service.duration,
          category: category,
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