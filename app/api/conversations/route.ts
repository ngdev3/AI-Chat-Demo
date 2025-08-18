import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('CONVERSATIONS_GET_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const newConversation = await prisma.conversation.create({
            data: {
                user: {
                    connect: {
                        email: session.user.email,
                    }
                }
            }
        });

        return NextResponse.json(newConversation);

    } catch (error) {
        console.error('CONVERSATIONS_POST_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
