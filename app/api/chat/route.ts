import { GroqResponseHandler } from '@/lib/ai/GroqResponseHandler';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { checkSubscription } from '@/lib/subscription';

const FREE_TIER_MESSAGE_LIMIT = 20;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { messages, conversationId, agent, language, persona } = await req.json();

    if (!messages) {
      return new Response('Messages are required', { status: 400 });
    }

    const isPro = await checkSubscription();

    if (agent === 'persona' && !isPro) {
        return new NextResponse('You must be a Pro subscriber to use the Persona Agent.', { status: 403 });
    }

    if (!isPro) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (!user || user.messageCount >= FREE_TIER_MESSAGE_LIMIT) {
        return new NextResponse('You have reached the free message limit.', { status: 403 });
      }
      await prisma.user.update({
        where: { email: session.user.email },
        data: { messageCount: { increment: 1 } },
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const writer = {
          write: (chunk: string) => {
            controller.enqueue(encoder.encode(chunk));
          },
          close: () => {
            controller.close();
          },
          error: (error: any) => {
            controller.error(error);
          },
        };

        const handler = new GroqResponseHandler(
          writer,
          messages,
          conversationId,
          agent,
          language,
          persona
        );

        try {
          await handler.run();
        } catch (error) {
          console.error('Error during GroqResponseHandler run:', error);
          writer.error(error);
        } finally {
          writer.close();
          handler.dispose();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error in chat API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
