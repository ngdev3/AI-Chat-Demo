'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { MainLayout } from './main-layout';
import { Chat } from '../chat/chat';
import { useState } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
  defaultLayout: number[] | undefined;
  defaultCollapsed: boolean | undefined;
}

export function AppShell({ defaultLayout, defaultCollapsed }: AppShellProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { isPro } = useSubscription();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <MainLayout
        defaultLayout={defaultLayout}
        defaultCollapsed={defaultCollapsed}
        navCollapsedSize={4}
        activeConversationId={activeConversationId}
        setActiveConversationId={setActiveConversationId}
      >
        <Chat conversationId={activeConversationId} isPro={isPro} />
      </MainLayout>
    );
  }

  return null;
}
