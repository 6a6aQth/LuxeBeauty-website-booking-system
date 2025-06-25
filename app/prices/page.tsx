import { PageHeader } from "@/components/page-header"
import { PriceListDisplay } from "@/components/price-list-display"
import prisma from "@/lib/prisma"

export const revalidate = 3600 // Revalidate at most every hour

async function getPriceListUrl() {
  try {
    const settings = await prisma.siteSettings.findFirst({
      orderBy: {
        id: 'desc', // Assuming you only have one and want the latest if multiple exist
      },
    });
    return settings?.priceListUrl || null;
  } catch (error) {
    console.error("Failed to fetch price list from db:", error)
    return null
  }
}

export default async function PricesPage() {
  const imageUrl = await getPriceListUrl();

  return (
    <div>
      <PageHeader
        title="Our Price List"
        description="Find the perfect treatment for you. All prices are in Malawian Kwacha."
      />
      <PriceListDisplay initialImageUrl={imageUrl} />
    </div>
  )
} 