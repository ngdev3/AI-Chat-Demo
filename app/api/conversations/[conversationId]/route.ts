import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

interface IParams {
  conversationId?: string;
}

export async function GET(request: Request, { params }: { params: IParams }) {
  try {
    const session = await getServerSession(authOptions);
    const { conversationId } = params;

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!conversationId) {
      return new NextResponse('Conversation ID required', { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
        where: {
            id: conversationId,
            user: {
                email: session.user.email
            }
        },
        include: {
            messages: {
                orderBy: {
                    createdAt: 'asc'
                }
            }
        }
    });

    if (!conversation) {
        return new NextResponse('Conversation not found', { status: 404 });
    }

    return NextResponse.json(conversation);

  } catch (error) {
    console.error('CONVERSATION_GET_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const session = await getServerSession(authOptions);
    const { conversationId } = params;
    const body = await request.json();
    const { name } = body;

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!conversationId) {
      return new NextResponse('Conversation ID required', { status: 400 });
    }

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    const updatedConversation = await prisma.conversation.updateMany({
      where: {
        id: conversationId,
        user: {
          email: session.user.email, // Ensure the user owns this conversation
        },
      },
      data: {
        name,
      },
    });

    if (updatedConversation.count === 0) {
        return new NextResponse('Conversation not found or user not authorized', { status: 404 });
    }

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('CONVERSATION_PUT_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: IParams }) {
    try {
        const session = await getServerSession(authOptions);
        const { conversationId } = params;

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!conversationId) {
            return new NextResponse('Conversation ID required', { status: 400 });
        }

        const deletedConversation = await prisma.conversation.deleteMany({
            where: {
                id: conversationId,
                user: {
                    email: session.user.email, // Ensure the user owns this conversation
                }
            }
        });

        if (deletedConversation.count === 0) {
            return new NextResponse('Conversation not found or user not authorized', { status: 404 });
        }

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error) {
        console.error('CONVERSATION_DELETE_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
