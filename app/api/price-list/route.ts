import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findFirst()
    if (settings) {
      return NextResponse.json({ priceListUrl: settings.priceListUrl })
    }
    return NextResponse.json({ priceListUrl: "/Prices-List.png" }) // Default
  } catch (error) {
    console.error("Failed to fetch price list URL:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { priceListUrl } = body

    if (!priceListUrl) {
      return NextResponse.json(
        { error: "Missing priceListUrl" },
        { status: 400 }
      )
    }

    const settings = await prisma.siteSettings.findFirst()
    if (settings) {
      await prisma.siteSettings.update({
        where: { id: settings.id },
        data: { priceListUrl },
      })
    } else {
      await prisma.siteSettings.create({
        data: { priceListUrl },
      })
    }

    return NextResponse.json({ message: "Price list URL updated" })
  } catch (error) {
    console.error("Failed to update price list URL:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 