import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { checkSubscription } from '@/lib/subscription';

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

    const isPro = await checkSubscription();

    return NextResponse.json({
      isPro,
      messageCount: user.messageCount,
    });

  } catch (error) {
    console.error('USER_USAGE_GET_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
