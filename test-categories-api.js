// Quick test script to verify categories API works
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing Category model...');
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✅ Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (slug: ${cat.slug})`);
    });
    
    if (categories.length === 0) {
      console.log('\n⚠️  No categories found in database!');
      console.log('Run: node prisma/migrate-categories.js');
    } else {
      console.log('\n✅ Categories are accessible via Prisma Client');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\n💡 Try running: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

test();

