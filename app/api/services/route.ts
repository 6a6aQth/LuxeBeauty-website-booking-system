import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
    return NextResponse.json(services);
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { services }: { services: { id: string; price: number }[] } = body;

        if (!services || !Array.isArray(services)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const updatePromises = services.map(service =>
            prisma.service.update({
                where: { id: service.id },
                data: { price: service.price },
            })
        );

        await prisma.$transaction(updatePromises);

        return NextResponse.json({ message: 'Prices updated successfully' });
    } catch (error) {
        console.error('Failed to update prices:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 