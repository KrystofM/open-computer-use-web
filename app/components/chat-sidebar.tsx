'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatInput } from './chat-input';
import { FaUser, FaRobot, FaCogs, FaLightbulb, FaBullseye, FaPlay, FaEye } from 'react-icons/fa';
import modelsList from '@/lib/models.json'
import templates, { TemplateId } from '@/lib/templates'
import { useLocalStorage } from 'usehooks-ts'
import { LLMModelConfig } from '@/lib/models'
import { ChatPicker } from './chat-picker';

interface Message {
  role: string;
  content: string;
}

interface ChatSidebarProps {
  // If you want to pre-load messages, you can pass them in here.
  messages?: Message[];
  isLoading: boolean;
}

// Simple helper to interpret NDJSON lines safely
async function* ndjsonStream(response: Response) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  if (!reader) return;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let lines = buffer.split('\n');
    // Keep the last (possibly partial) line in buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed !== '') {
        try {
          yield JSON.parse(trimmed);
        } catch {
          // ignore JSON parse errors on malformed lines
        }
      }
    }
  }

  // Flush the remaining buffer
  if (buffer.trim() !== '') {
    try {
      yield JSON.parse(buffer);
    } catch {
      // ignore any trailing malformed JSON
    }
  }
}

export default function ChatSidebar({
  messages: initialMessages = [],
  isLoading,
}: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>('languageModel', {
    model: 'claude-3-5-sonnet-latest',
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleLanguageModelChange(e: LLMModelConfig) {
    setLanguageModel({ ...languageModel, ...e });
  }

  // If content is valid JSON and presumably an action, hide or replace with a short note
  function getDisplayedContent(content: string) {
    try {
      JSON.parse(content);
      return 'Action performed';
    } catch {
      return content;
    }
  }

  // Return the icon depending on the role.
  function getIconForRole(role: string) {
    switch (role) {
      case 'user':
        return <FaUser className="text-blue-500" />;
      case 'assistant':
        return <FaRobot className="text-green-600" />;
      case 'system':
        return <FaCogs className="text-gray-500" />;
      case 'thought':
        return <FaLightbulb className="text-purple-500" />;
      case 'objective':
        return <FaBullseye className="text-orange-500" />;
      case 'action':
        return <FaPlay className="text-red-500" />;
      case 'observation':
        return <FaEye className="text-teal-500" />;
      default:
        return <FaCogs className="text-gray-400" />;
    }
  }

  // Determine container style depending on role
  function getMessageStyle(role: string) {
    switch (role) {
      case 'user':
        return 'bg-blue-100 ml-auto justify-end';
      case 'assistant':
        return 'bg-gray-100';
      case 'system':
        return 'bg-gray-200';
      case 'thought':
        return 'bg-purple-100';
      case 'objective':
        return 'bg-orange-100';
      case 'action':
        return 'bg-red-100';
      case 'observation':
        return 'bg-teal-100';
      default:
        return 'bg-gray-50';
    }
  }

  async function handleSend() {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: input }),
      });

      for await (const chunk of ndjsonStream(response)) {
        if (chunk.type === 'agent_output') {
          const { type, content = '', name = '' } = chunk.data;
          
          setMessages((prev) => [
            ...prev,
            {
              role: type, // e.g. 'thought'
              content: type === 'action' && name ? `${name}: ${content}` : content,
            },
          ]);
        } else if (chunk.type === 'complete' || chunk.status === 'stopped') {
          // The conversation might have ended; handle if needed
        }
      }
    } catch (err) {
      console.error('Error streaming from /api/run:', err);
    } finally {
      setLoading(false); // set loading to false once response is done
    }
  }

  async function handleStop() {
    if (!isLoading) return;

    try {
      await fetch('/api/stop', { method: 'POST' });
    } catch (error) {
      console.error('Error stopping run:', error);
    }
  }

  // Simple form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="w-1/2 border-r border-gray-200 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => {
          const displayedContent = getDisplayedContent(message.content);
          const messageStyle = getMessageStyle(message.role);

          return (
            <div
              key={index}
              className={`mb-4 p-3 rounded-lg max-w-[80%] flex items-start ${messageStyle}`}
            >
              <div className="mr-3 mt-1">{getIconForRole(message.role)}</div>
              <div className="whitespace-pre-wrap break-words">
                {displayedContent}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4">
        <ChatInput
          retry={() => {}}
          isErrored={false}
          isLoading={isLoading}
          isRateLimited={false}
          stop={handleStop}
          input={input}
          handleInputChange={(e) => setInput(e.target.value)}
          handleSubmit={handleSubmit}
        >
          <ChatPicker
            models={modelsList.models}
            languageModel={languageModel}
            onLanguageModelChange={handleLanguageModelChange}
          />
        </ChatInput>
      </div>
    </div>
  );
} 