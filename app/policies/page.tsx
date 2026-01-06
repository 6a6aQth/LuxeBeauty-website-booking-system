import { Metadata } from "next"
import { StudioPoliciesContent } from "@/components/studio-policies"

export const metadata: Metadata = {
  title: "Studio Policies | Lauryn Luxe Beauty Studio",
  description: "Read our studio policies including booking, cancellations, payments, and service guidelines.",
}

export default function PoliciesPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
            Studio Policies
          </h1>
          <p className="text-lg text-gray-600">
            Please read our policies carefully to ensure a smooth and enjoyable experience at Lauryn Luxe Beauty Studio.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <StudioPoliciesContent scrollable={false} />
        </div>
      </div>
    </div>
  )
}
