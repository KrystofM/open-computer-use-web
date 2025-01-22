'use client';

import { useState } from 'react';
import ChatSidebar from './components/chat-sidebar';
import DisplayArea from './components/display-area';

export default function Home() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    // Reset stream URL for new message
    setStreamUrl(null);
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instruction: message }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let currentMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        const lines = (currentMessage + chunk).split('\n');
        
        // The last line might be incomplete, save it for the next iteration
        currentMessage = lines[lines.length - 1];

        // Process all complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);
            switch (data.type) {
              case 'stream_start':
                setStreamUrl(data.stream_url);
                setMessages(prev => [...prev, { 
                  role: 'assistant', 
                  content: 'Starting screen stream...' 
                }]);
                break;
              case 'agent_output':
                // Add agent output to messages
                setMessages(prev => [...prev, { 
                  role: 'assistant', 
                  content: `${data.data.type}: ${data.data.content || JSON.stringify(data.data)}` 
                }]);
                break;
              case 'complete':
                // Handle completion - could add a success message
                break;
              case 'error':
                setMessages(prev => [...prev, { 
                  role: 'assistant', 
                  content: `Error: ${data.error}` 
                }]);
                break;
            }
          } catch (e) {
            console.error('Error parsing line:', line, e);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }]);
    }
    
    setIsLoading(false);
  };

  return (
    <main className="flex h-screen">
      <ChatSidebar 
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
      <DisplayArea streamUrl={streamUrl} />
    </main>
  );
} 