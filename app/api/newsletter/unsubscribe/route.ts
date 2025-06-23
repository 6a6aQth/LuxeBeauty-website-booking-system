import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.redirect(new URL('/?error=invalid_request', req.url));
  }

  try {
    await prisma.newsletterSubscription.delete({
      where: { email },
    });
    
    // Redirect to a success page
    return NextResponse.redirect(new URL('/unsubscribed', req.url));
  } catch (error) {
    // This will catch errors if the user was already unsubscribed, etc.
    // We can still treat it as a success for the user.
    console.warn(`Unsubscribe attempt for non-existent email: ${email}`, error);
    return NextResponse.redirect(new URL('/unsubscribed?already=true', req.url));
  }
} 