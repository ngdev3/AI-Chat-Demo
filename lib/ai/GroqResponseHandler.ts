// --- FREE-TIER OPTION: GroqCloud ---
// This file implements the server-side logic for handling chat interactions
// using the Groq API. It is responsible for managing conversation history,
// calling the Groq LLM, handling tool calls (like web search), and streaming
// the response back to the client. This is a replacement for the original
*// --- PAID OPTION: OpenAI ---*
// implementation that used the OpenAI Assistants API.

import Groq from 'groq-sdk';
import { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import { prisma } from '@/lib/db';
import { Agent } from '@/components/chat/agent-selector';

// Define a type for the writer object that the API route will pass to us.
interface StreamWriter {
  write: (chunk: string) => void;
  close: () => void;
  error: (error: any) => void;
}

export class GroqResponseHandler {
  private groq: Groq;
  private writer: StreamWriter;
  private messages: ChatCompletionMessageParam[];
  private conversationId: string | null;
  private agent: Agent;
  private language: string;
  private persona: string;
  private is_done = false;

  constructor(
    writer: StreamWriter,
    initialMessages: ChatCompletionMessageParam[],
    conversationId: string | null,
    agent: Agent = 'assistant',
    language: string = 'JavaScript',
    persona: string = ''
  ) {
    this.writer = writer;
    this.messages = initialMessages;
    this.conversationId = conversationId;
    this.agent = agent;
    this.language = language;
    this.persona = persona;
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  private async getSystemPrompt(): Promise<ChatCompletionMessageParam> {
    if (this.agent === 'document' && this.conversationId) {
      const document = await prisma.document.findUnique({
        where: { conversationId: this.conversationId },
      });
      if (document) {
        return {
          role: 'system',
          content: `You are a document analysis agent. You will answer questions based on the provided document context. Here is the document content:\n\n---\n\n${document.content}\n\n---\n\nIf the answer is not in the document, say so. Do not use outside knowledge.`,
        };
      }
    }

    switch (this.agent) {
      case 'coder':
        return {
          role: 'system',
          content: `You are an expert code generation agent specializing in ${this.language}. You are a master of all programming languages, algorithms, and data structures. When asked to write code, you must provide a single, complete, and runnable code block in ${this.language} markdown format. Do not provide explanations or conversational text outside of the code block.`,
        };
      case 'persona':
        return {
          role: 'system',
          content: this.persona || 'You are a helpful general-purpose AI assistant.',
        }
      default:
        return {
          role: 'system',
          content: 'You are a helpful general-purpose AI assistant.',
        };
    }
  }

  public async run(): Promise<void> {
    try {
      const systemPrompt = await this.getSystemPrompt();
      const messagesWithSystemPrompt = [systemPrompt, ...this.messages];

      const stream = await this.groq.chat.completions.create({
        model: 'llama3-8b-8192', // A fast model available on Groq
        messages: messagesWithSystemPrompt,
        tools: [
          {
            type: 'function',
            function: {
              name: 'web_search',
              description: 'Performs a web search for a given query.',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'The search query.',
                  },
                },
                required: ['query'],
              },
            },
          },
        ],
        tool_choice: 'auto',
        stream: true,
      });

      let responseMessage = '';
      let toolCalls: Groq.Chat.Completions.ChatCompletionMessageToolCall[] = [];

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          responseMessage += delta.content;
          this.writer.write(delta.content);
        }

        if (delta?.tool_calls) {
          // Collect tool calls
          toolCalls.push(...delta.tool_calls);
        }
      }

      if (toolCalls.length > 0) {
        // A tool has been called.
        this.messages.push({
          role: 'assistant',
          content: null,
          tool_calls: toolCalls,
        });

        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'web_search') {
            const args = JSON.parse(toolCall.function.arguments);
            const searchResult = await this.performWebSearch(args.query);
            this.messages.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              name: 'web_search',
              content: searchResult,
            });
          }
        }

        // Now, call the model again with the tool results
        const secondStream = await this.groq.chat.completions.create({
          model: 'llama3-8b-8192',
          messages: this.messages,
          stream: true,
        });

        let finalResponse = '';
        for await (const chunk of secondStream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            finalResponse += content;
            this.writer.write(content);
          }
        }
        // Here we would save the assistant's final message to the database
      } else {
        // No tool call, just a regular response.
        // Here we would save the assistant's message to the database
      }

    } catch (error) {
      console.error('Error in GroqResponseHandler run:', error);
      this.writer.error(error);
    }
  }

  private async performWebSearch(query: string): Promise<string> {
    console.log(`Performing web search for: "${query}"`);
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      console.warn('SERPER_API_KEY not found. Returning placeholder search results.');
      return JSON.stringify({
        results: [{ title: 'Web search is not configured.', content: 'The SERPER_API_KEY is missing.' }],
      });
    }

    try {
      const response = await axios.post(
        'https://google.serper.dev/search',
        { q: query },
        {
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      // We need to format the results into a string that the LLM can easily digest.
      // A stringified JSON array of the top few results should work well.
      return JSON.stringify(response.data.organic.slice(0, 5));
    } catch (error) {
      console.error('Error performing web search with Serper:', error);
      return JSON.stringify({
        error: 'An exception occurred during the search.',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  public dispose(): void {
    if (this.is_done) {
      return;
    }
    this.is_done = true;
  }
}
