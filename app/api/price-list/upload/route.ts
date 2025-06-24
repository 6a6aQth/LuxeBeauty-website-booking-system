import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: "Missing filename or request body" }, { status: 400 });
  }

  try {
    const blob = await put(filename, request.body, {
      access: 'public',
    });

    const settings = await prisma.siteSettings.findFirst();
    if (settings) {
      await prisma.siteSettings.update({
        where: { id: settings.id },
        data: { priceListUrl: blob.url },
      });
    } else {
      await prisma.siteSettings.create({
        data: { priceListUrl: blob.url },
      });
    }

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Failed to upload file:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 