import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// In development, use a global instance to avoid creating multiple connections
// In production, create a new instance
const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Verify Category model is available (helps catch Prisma client regeneration issues)
if (!prisma.category) {
  console.warn('⚠️  Prisma Category model not found. Please restart your Next.js dev server after running: npx prisma generate');
}

export default prisma; 