import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { content, role, conversationId } = body;

    if (!content || !role || !conversationId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Verify user owns the conversation
    const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, user: { email: session.user.email } },
    });

    if (!conversation) {
        return new NextResponse('Conversation not found or user not authorized', { status: 404 });
    }

    const newMessage = await prisma.message.create({
      data: {
        content,
        role,
        conversationId,
      },
    });

    // Also update the conversation's updatedAt timestamp
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('MESSAGES_POST_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
