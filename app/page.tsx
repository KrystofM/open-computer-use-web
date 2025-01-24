'use client';

import { useEffect, useState } from 'react';
import ChatSidebar from './components/chat-sidebar';
import DisplayArea from './components/display-area';

export default function Home() {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  return (
    <main className="flex h-screen">
      <ChatSidebar setStreamUrl={setStreamUrl} />
      <DisplayArea streamUrl={streamUrl} />
    </main>
  );
} 