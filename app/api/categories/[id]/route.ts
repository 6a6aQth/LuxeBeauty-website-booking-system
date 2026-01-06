import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/categories/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, imageUrl } = await req.json();

    const dataToUpdate: any = {};
    if (typeof name === "string" && name.trim()) {
      const trimmed = name.trim();
      dataToUpdate.name = trimmed;
      dataToUpdate.slug = trimmed
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    }
    if (description !== undefined) dataToUpdate.description = description || null;
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl || null;

    const category = await prisma.category.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const servicesCount = await prisma.service.count({
      where: { category: category.name },
    });

    if (servicesCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete category that is still used by existing services.",
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


