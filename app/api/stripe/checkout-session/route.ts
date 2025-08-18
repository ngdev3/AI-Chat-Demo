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

    // If user is already subscribed, redirect to billing portal
    if (user.stripeSubscriptionId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId!,
        return_url: absoluteUrl('/settings'),
      });
      return NextResponse.json({ url: stripeSession.url });
    }

    // Create a new checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: absoluteUrl('/settings?success=true'),
      cancel_url: absoluteUrl('/settings?canceled=true'),
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'auto',
      customer_email: user.email,
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error('STRIPE_CHECKOUT_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
