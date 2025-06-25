export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/services/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const service = await prisma.service.findUnique({ where: { id: params.id } });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json(service);
  } catch (error) {
    console.error("Failed to fetch service:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/services/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, description, duration, category } = await req.json();

    const updated = await prisma.service.update({
      where: { id: params.id },
      data: { name, description, duration, category },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update service:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/services/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.service.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Failed to delete service:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 