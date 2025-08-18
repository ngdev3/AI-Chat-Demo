import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { absoluteUrl } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (!user.stripeCustomerId) {
        return new NextResponse('User is not a paying customer', { status: 400 });
    }

    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: absoluteUrl('/settings'),
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error('STRIPE_PORTAL_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
