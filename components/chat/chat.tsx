'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import axios from 'axios';
import { ChatMessage, Message } from './chat-message';
import { ChatInput } from './chat-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgentSelector, Agent } from './agent-selector';
import { FileUpload } from './file-upload';
import { LanguageSelector, LANGUAGES } from './language-selector';
import { Textarea } from '../ui/textarea';

interface ChatProps {
  conversationId: string | null;
  isPro: boolean;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function Chat({ conversationId, isPro }: ChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent>('assistant');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(LANGUAGES[0]);
  const [persona, setPersona] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: conversationData, error } = useSWR(
    conversationId ? `/api/conversations/${conversationId}` : null,
    fetcher
  );

  useEffect(() => {
    if (conversationData) {
      setMessages(conversationData.messages);
    } else {
      setMessages([]);
    }
  }, [conversationData]);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;

    // Optimistically add user message to UI
    const tempUserMessageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: tempUserMessageId,
      role: 'user',
      content,
      user: { name: session?.user?.name || 'User', image: session?.user?.image || undefined },
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to DB
    await axios.post('/api/messages', { content, role: 'user', conversationId });

    // Prepare for assistant response
    const tempAssistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: tempAssistantMessageId,
      role: 'assistant',
      content: '',
      user: { name: 'Nexus AI', image: '/nexus-ai-logo.png' },
    };
    setMessages((prev) => [...prev, assistantMessage]);

    let finalAssistantResponse = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }],
          agent: selectedAgent,
          conversationId: conversationId,
          language: selectedLanguage,
          persona: persona,
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        finalAssistantResponse += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAssistantMessageId
              ? { ...msg, content: finalAssistantResponse }
              : msg
          )
        );
      }

      // Save assistant message to DB
      if (finalAssistantResponse.trim()) {
        await axios.post('/api/messages', { content: finalAssistantResponse, role: 'assistant', conversationId });
      }

    } catch (error) {
      console.error('Error streaming response:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAssistantMessageId
            ? { ...msg, content: 'Sorry, something went wrong.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-scroll to the bottom
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if(viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center space-x-4">
          <AgentSelector
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
            isPro={isPro}
          />
          {selectedAgent === 'coder' && (
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onSelectLanguage={setSelectedLanguage}
            />
          )}
        </div>
        {selectedAgent === 'document' && (
          <FileUpload
            conversationId={conversationId || ''}
            onUploadSuccess={() => {
              // Maybe refetch conversation data here in the future
            }}
          />
        )}
        {selectedAgent === 'persona' && isPro && (
          <Textarea
            placeholder="Define the AI's persona... e.g., 'You are a sarcastic pirate.'"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
          />
        )}
      </div>
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLoading={isLoading && index === messages.length - 1 && message.role === 'assistant'}
            />
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
