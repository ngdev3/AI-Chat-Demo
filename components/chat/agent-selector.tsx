'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bot, FileText, Code, Sparkles, Lock } from 'lucide-react';

export type Agent = 'assistant' | 'document' | 'coder' | 'persona';

interface AgentSelectorProps {
  selectedAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
  isPro: boolean;
}

export function AgentSelector({ selectedAgent, onSelectAgent, isPro }: AgentSelectorProps) {
  return (
    <Select value={selectedAgent} onValueChange={(value) => onSelectAgent(value as Agent)}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select an agent" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="assistant">
          <div className="flex items-center">
            <Bot className="w-4 h-4 mr-2" />
            General Assistant
          </div>
        </SelectItem>
        <SelectItem value="document">
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Document Analysis
          </div>
        </SelectItem>
        <SelectItem value="coder">
          <div className="flex items-center">
            <Code className="w-4 h-4 mr-2" />
            Code Generation
          </div>
        </SelectItem>
        <SelectItem value="persona" disabled={!isPro}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
              Persona Agent
            </div>
            {!isPro && <Lock className="w-4 h-4 text-muted-foreground" />}
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
