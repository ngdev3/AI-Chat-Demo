'use client';

import useSWR from 'swr';
import axios from 'axios';
import { PlusCircle, MessageSquare, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Conversation = {
  id: string;
  name: string;
};

interface ConversationHistoryProps {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function ConversationHistory({
  activeConversationId,
  setActiveConversationId,
}: ConversationHistoryProps) {
  const { data: conversations, mutate } = useSWR<Conversation[]>('/api/conversations', fetcher);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleNewChat = async () => {
    const response = await axios.post<Conversation>('/api/conversations');
    mutate();
    setActiveConversationId(response.data.id);
  };

  const handleDelete = async () => {
    if (!selectedConversationId) return;
    await axios.delete(`/api/conversations/${selectedConversationId}`);
    mutate();
    setIsDeleteDialogOpen(false);
  };

  const handleRename = async (id: string, name: string) => {
    await axios.put(`/api/conversations/${id}`, { name });
    mutate();
    setIsRenaming(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2">
        <Button onClick={handleNewChat} className="w-full justify-start">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <div className="flex-grow overflow-auto">
        {conversations?.map((convo) => (
          <div
            key={convo.id}
            onClick={() => setActiveConversationId(convo.id)}
            className={cn(
              'flex items-center p-2 rounded-md hover:bg-muted cursor-pointer',
              activeConversationId === convo.id && 'bg-muted'
            )}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {isRenaming === convo.id ? (
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRename(convo.id, renameValue)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(convo.id, renameValue);
                }}
                autoFocus
                className="h-8"
              />
            ) : (
              <span className="flex-grow text-sm truncate">{convo.name}</span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    setIsRenaming(convo.id);
                    setRenameValue(convo.name);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedConversationId(convo.id);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
