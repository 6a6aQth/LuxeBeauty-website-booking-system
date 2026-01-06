import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/categories
export async function GET() {
  try {
    // Check if Category model is available in Prisma client
    if (!prisma.category) {
      console.error("❌ Prisma Category model not found. The Prisma client needs to be regenerated.");
      return NextResponse.json(
        { 
          error: "Prisma client not updated. Please restart your Next.js dev server after running: npx prisma generate",
          details: "Category model not found in Prisma client"
        },
        { status: 500 }
      );
    }

    console.log("Fetching categories from database...");
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
    });
    console.log(`Found ${categories.length} categories:`, categories.map(c => c.name));
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Failed to fetch categories:", error);
    console.error("Error details:", error.message, error.stack);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/categories
export async function POST(req: NextRequest) {
  try {
    const { name, description, imageUrl } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    const slug = trimmedName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


