import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const phoneFilter = searchParams.get('phone');
    
    let whereClause = {};
    
    // If no status filter is specified, only show successful bookings
    if (!statusFilter || statusFilter === 'successful') {
      whereClause = { status: 'successful' };
    } else if (statusFilter === 'all') {
      // Show all bookings regardless of status
      whereClause = {};
    } else {
      // Filter by specific status
      whereClause = { status: statusFilter };
    }

    // Add phone filter if provided
    if (phoneFilter) {
      whereClause = { ...whereClause, phone: phoneFilter };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Booking creation is now handled only after payment verification.
  // This endpoint is disabled to prevent duplicate or unpaid bookings.
  return NextResponse.json({ error: 'Booking creation is disabled. Use payment flow.' }, { status: 403 });
} 