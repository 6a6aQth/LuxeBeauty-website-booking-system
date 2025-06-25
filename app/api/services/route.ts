import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'

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
    const { services } = await req.json();

    if (!Array.isArray(services)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const updatePromises = services.map(service =>
      prisma.service.update({
        where: { id: service.id },
        data: {
          name: service.name,
          description: service.description,
          duration: service.duration,
          category: service.category,
        },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: 'Services updated successfully' });
  } catch (error) {
    console.error('Failed to update services:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, description, duration, category } = body;

        const newService = await prisma.service.create({
            data: {
                name,
                description,
                duration,
                category,
            },
        });

        return NextResponse.json(newService, { status: 201 });
    } catch (error) {
        console.error('Failed to create service:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 