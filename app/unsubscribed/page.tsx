import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/ui/animated-section';

export default function UnsubscribedPage() {
  return (
    <div>
      <AnimatedSection className="bg-gray-100 py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-serif mb-4">You've Been Unsubscribed</h1>
          <p className="text-gray-700 mb-8 max-w-xl mx-auto">
            You have been successfully removed from our mailing list. You will no longer receive newsletter updates from us.
          </p>
          <Link href="/">
            <Button>Return to Homepage</Button>
          </Link>
        </div>
      </AnimatedSection>
    </div>
  );
} 