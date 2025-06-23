import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const subscribers = await prisma.newsletterSubscription.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(subscribers);
  } catch (error) {
    console.error('Failed to fetch subscribers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 