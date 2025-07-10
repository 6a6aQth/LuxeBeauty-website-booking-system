import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const PolicySection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    <div className="space-y-2 text-sm text-gray-600">{children}</div>
  </div>
)

export function StudioPolicies() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-pink-500 hover:underline">Studio Policies</button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Studio Policies</DialogTitle>
          <DialogDescription>
            Please read our policies carefully before confirming your appointment.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4 text-gray-800">
          <PolicySection title="1. Booking & Appointments">
            <ul className="list-disc pl-5">
              <li>A non-refundable booking fee of K10,000 is required to secure your appointment. This amount will be credited toward your total service cost.</li>
              <li>Advance booking is mandatory. Walk-ins are accepted only if there is available time.</li>
              <li>Please confirm your appointment a day in advance. Unconfirmed appointments are subject to automatic cancellation.</li>
            </ul>
          </PolicySection>

          <PolicySection title="2. Late Arrivals">
            <ul className="list-disc pl-5">
              <li>A 15-minute grace period is permitted. Arriving later than this will incur a K10,000 late fee.</li>
              <li>Excessive lateness may result in your appointment being cancelled, and your deposit will be forfeited.</li>
            </ul>
          </PolicySection>

          <PolicySection title="3. Nail Prep">
            <ul className="list-disc pl-5">
              <li>Please arrive with clean nails, free of any product. A cleanup service will be subject to an additional fee.</li>
              <li>We do not work over services performed by other nail technicians. A full removal will be required.</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. No Escorts">
            <ul className="list-disc pl-5">
              <li>For safety and to ensure a relaxing environment for all clients, children or guests are not permitted unless they are also receiving a service.</li>
            </ul>
          </PolicySection>
          
          <PolicySection title="5. Cancellations & Rescheduling">
            <ul className="list-disc pl-5">
              <li>To cancel or reschedule, please provide at least 24 hours' notice to avoid forfeiting your booking fee.</li>
              <li>No-shows will forfeit their deposit and may be required to pay in full for future bookings.</li>
            </ul>
          </PolicySection>

          <PolicySection title="6. Payments">
            <ul className="list-disc pl-5">
              <li>We accept cash, mobile money, and bank transfers.</li>
              <li>Full payment is due upon completion of your service. No refunds will be issued once the service is complete.</li>
              <li>Prices are subject to change without prior notice.</li>
            </ul>
          </PolicySection>

          <PolicySection title="7. Respectful Environment">
            <ul className="list-disc pl-5">
              <li>Rude, disrespectful, or inappropriate behavior will not be tolerated and will result in immediate cancellation of your appointment.</li>
              <li>The salon reserves the right to refuse service to anyone who violates these policies.</li>
            </ul>
          </PolicySection>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function StudioPoliciesContent() {
  return (
    <div className="max-h-[60vh] overflow-y-auto pr-4 text-gray-800">
      <PolicySection title="1. Booking & Appointments">
        <ul className="list-disc pl-5">
          <li>A non-refundable booking fee of K10,000 is required to secure your appointment. This amount will be credited toward your total service cost.</li>
          <li>Advance booking is mandatory. Walk-ins are accepted only if there is available time.</li>
          <li>Please confirm your appointment a day in advance. Unconfirmed appointments are subject to automatic cancellation.</li>
        </ul>
      </PolicySection>

      <PolicySection title="2. Late Arrivals">
        <ul className="list-disc pl-5">
          <li>A 15-minute grace period is permitted. Arriving later than this will incur a K10,000 late fee.</li>
          <li>Excessive lateness may result in your appointment being cancelled, and your deposit will be forfeited.</li>
        </ul>
      </PolicySection>

      <PolicySection title="3. Nail Prep">
        <ul className="list-disc pl-5">
          <li>Please arrive with clean nails, free of any product. A cleanup service will be subject to an additional fee.</li>
          <li>We do not work over services performed by other nail technicians. A full removal will be required.</li>
        </ul>
      </PolicySection>

      <PolicySection title="4. No Escorts">
        <ul className="list-disc pl-5">
          <li>For safety and to ensure a relaxing environment for all clients, children or guests are not permitted unless they are also receiving a service.</li>
        </ul>
      </PolicySection>
      
      <PolicySection title="5. Cancellations & Rescheduling">
        <ul className="list-disc pl-5">
          <li>To cancel or reschedule, please provide at least 24 hours' notice to avoid forfeiting your booking fee.</li>
          <li>No-shows will forfeit their deposit and may be required to pay in full for future bookings.</li>
        </ul>
      </PolicySection>

      <PolicySection title="6. Payments">
        <ul className="list-disc pl-5">
          <li>We accept cash, mobile money, and bank transfers.</li>
          <li>Full payment is due upon completion of your service. No refunds will be issued once the service is complete.</li>
          <li>Prices are subject to change without prior notice.</li>
        </ul>
      </PolicySection>

      <PolicySection title="7. Respectful Environment">
        <ul className="list-disc pl-5">
          <li>Rude, disrespectful, or inappropriate behavior will not be tolerated and will result in immediate cancellation of your appointment.</li>
          <li>The salon reserves the right to refuse service to anyone who violates these policies.</li>
        </ul>
      </PolicySection>
    </div>
  )
} 