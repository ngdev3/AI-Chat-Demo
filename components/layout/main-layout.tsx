'use client';

import * as React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Book, Bot, Settings, SquareTerminal } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { ConversationHistory } from '../chat/conversation-history';
import Link from 'next/link';
import { UsageIndicator } from './usage-indicator';

interface MainLayoutProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
  children: React.ReactNode;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

export function MainLayout({
  defaultLayout = [265, 1095],
  defaultCollapsed = false,
  navCollapsedSize,
  children,
  activeConversationId,
  setActiveConversationId,
}: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const { data: session } = useSession();

  return (
    <TooltipProvider delayDuration={0}>
      <PanelGroup
        direction="horizontal"
        onLayout={(layout: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(layout)}`;
        }}
        className="h-full max-h-screen items-stretch"
      >
        <Panel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={25}
          onCollapse={() => {
            setIsCollapsed(true);
            document.cookie = `react-resizable-panels:collapsed=true`;
          }}
          onExpand={() => {
            setIsCollapsed(false);
            document.cookie = `react-resizable-panels:collapsed=false`;
          }}
          className={`min-w-[${navCollapsedSize}px] transition-all duration-300 ease-in-out ${
            isCollapsed ? 'min-w-[50px]' : 'min-w-[200px]'
          }`}
        >
          <div className="flex h-full flex-col bg-muted/40">
            <ConversationHistory
              activeConversationId={activeConversationId}
              setActiveConversationId={setActiveConversationId}
            />
            <div className="mt-auto p-2">
              <UsageIndicator />
              <div className="border-t">
                <nav className="grid gap-1 p-2">
                  <Link href="/settings">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-full justify-start">
                          <Settings className="h-4 w-4" />
                          {!isCollapsed && <span className="ml-2">Settings</span>}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Settings</TooltipContent>
                    </Tooltip>
                  </Link>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => signOut()} variant="ghost" size="icon" className="w-full justify-start">
                        <Bot className="h-4 w-4" />
                        {!isCollapsed && <span className="ml-2">Logout</span>}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Logout</TooltipContent>
                  </Tooltip>
                </nav>
                <div className="mt-2 border-t pt-2">
                  <div className="flex items-center p-2">
                    <img src={session?.user?.image ?? ''} alt="User" className="h-8 w-8 rounded-full" />
                    {!isCollapsed && <span className="ml-2 text-sm font-medium">{session?.user?.name}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className="w-px bg-border" />
        <Panel defaultSize={defaultLayout[1]}>
          {children}
        </Panel>
      </PanelGroup>
    </TooltipProvider>
  );
}
