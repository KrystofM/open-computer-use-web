'use client';

import { useEffect, useState } from 'react';
import ChatSidebar from './components/chat-sidebar';
import DisplayArea from './components/display-area';

export default function Home() {
  const [streamPlaybackId, setStreamPlaybackId] = useState<string | null>(null);

  return (
    <main className="flex h-screen">
      <ChatSidebar setStreamPlaybackId={setStreamPlaybackId} />
      <DisplayArea streamPlaybackId={streamPlaybackId} />
    </main>
  );
} 