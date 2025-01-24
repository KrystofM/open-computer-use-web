'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatInput } from './chat-input';
import { FaUser, FaRobot, FaCogs, FaLightbulb, FaBullseye, FaPlay, FaEye } from 'react-icons/fa';
import modelsList from '@/lib/models.json'
import templates, { TemplateId } from '@/lib/templates'
import { useLocalStorage } from 'usehooks-ts'
import { LLMModelConfig } from '@/lib/models'
import { ndjsonStream } from '@/utils/ndjsonStream';
import { ChatPicker } from './chat-picker';

interface Message {
  role: string;
  content: string;
}

interface ChatSidebarProps {
  setStreamUrl: (url: string | null) => void;
}

export default function ChatSidebar({
  setStreamUrl,
}: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>();
  const [input, setInput] = useState('');
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>('languageModel', {
    model: 'claude-3-5-sonnet-latest',
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleLanguageModelChange(e: LLMModelConfig) {
    setLanguageModel({ ...languageModel, ...e });
  }

  function getDisplayedContent(content: string) {
    try {
      JSON.parse(content);
      return 'Action performed';
    } catch {
      return content;
    }
  }

  function getIconForRole(role: string) {
    switch (role) {
      case 'user':
        return <FaUser className="text-[#ff8800]" />;
      case 'assistant':
        return <FaRobot className="text-black" />;
      case 'system':
        return <FaCogs className="text-black" />;
      case 'thought':
        return <FaLightbulb className="text-black" />;
      case 'objective':
        return <FaBullseye className="text-black" />;
      case 'action':
        return <FaPlay className="text-black" />;
      case 'observation':
        return <FaEye className="text-black" />;
      default:
        return <FaCogs className="text-black" />;
    }
  }

  function getMessageStyle(role: string) {
    switch (role) {
      case 'user':
        return 'bg-[#ffe1bf]';
      default:
        return 'bg-gray-50';
    }
  }

  async function handleSend() {
    if (!input.trim()) return;
    setMessages([...(messages || []), { role: 'user', content: input }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: input }),
      });

      for await (const chunk of ndjsonStream(response)) {
        if (chunk.type === 'stream_started') {
          setMessages((prev) => [
            ...(prev || []),
            { role: 'system', content: 'Waiting for stream...' },  
          ]);
        } else if (chunk.type === 'stream_awaited') {
          setStreamUrl(chunk.url || "localhost:8000"); 
        } else if (chunk.type === 'agent_output') {
          const { type, content = '', name = '' } = chunk.data;
          
          setMessages((prev) => [
            ...(prev || []),
            {
              role: type,
              content: type === 'action' && name ? `${name}: ${content}` : content,
            },
          ]);
        } else if (chunk.type === 'complete' || chunk.status === 'stopped') {          
        }
      }
    } catch (err) {
      console.error('Error streaming from /api/run:', err);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="w-1/2 border-r border-gray-200 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages && messages.map((message, index) => {
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
          handleSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
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