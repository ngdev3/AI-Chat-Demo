'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Bot, User, Clipboard, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BlinkingCursor } from '../ui/blinking-cursor';
import rehypeHighlight from 'rehype-highlight';
import { useState } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  user?: {
    name?: string | null;
    image?: string | null;
  };
}

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

const CodeBlock = ({ children, ...props }: { children: React.ReactNode, className?: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (children) {
      navigator.clipboard.writeText(String(children));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      <pre {...props} className="p-4 rounded-md bg-gray-800 text-white font-mono text-sm">
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white"
      >
        {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
      </button>
    </div>
  );
};


export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex items-start space-x-4', isUser ? 'justify-end' : '')}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          {message.user?.image ? (
            <AvatarImage src={message.user.image} alt={message.user.name || 'AI'} />
          ) : (
            <Bot className="h-full w-full p-1" />
          )}
          <AvatarFallback>{message.user?.name?.charAt(0) || 'A'}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'px-4 py-2 rounded-lg max-w-lg',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        <ReactMarkdown
          className="prose dark:prose-invert"
          rehypePlugins={[rehypeHighlight]}
          components={{
            p: ({ node, ...props }) => <p className="mb-0" {...props} />,
            pre: ({ node, ...props }) => <CodeBlock {...props} />,
          }}
        >
          {message.content}
        </ReactMarkdown>
        {isLoading && <BlinkingCursor />}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
          {message.user?.image ? (
            <AvatarImage src={message.user.image} alt={message.user.name || 'User'} />
          ) : (
            <User className="h-full w-full p-1" />
          )}
          <AvatarFallback>{message.user?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
