import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import prisma from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { subject, content } = await req.json();

    if (!subject || !content) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 });
    }

    const subscribers = await prisma.newsletterSubscription.findMany({
      select: { email: true },
    });

    const emails = subscribers.map(s => s.email);

    if (emails.length === 0) {
      return NextResponse.json({ message: 'No subscribers to send to.' }, { status: 200 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Luxe Beauty Studio <onboarding@resend.dev>', // Replace with your verified domain
      to: emails,
      subject: subject,
      html: `<p>${content}</p>`, // In a real app, you'd use a nice HTML template here
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Newsletter sent successfully', data });

  } catch (error) {
    console.error('Send newsletter error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 