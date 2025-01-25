import React, { useEffect, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';

interface DisplayAreaProps {
  streamPlaybackId: string | null;
}

export default function DisplayArea({ streamPlaybackId }: DisplayAreaProps) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(prevKey => prevKey + 1);
    console.log("streamPlaybackId", streamPlaybackId);
  }, [streamPlaybackId]);

  const reloadPlayer = () => {
    setKey(prevKey => prevKey + 1);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      {streamPlaybackId ? (
        <>
          <MuxPlayer
            key={key} // Use the key to force re-render
            playbackId={streamPlaybackId}
            streamType="on-demand"
            autoPlay
            muted
            className="max-w-full max-h-full"
          />
        </>
      ) : (
        <p>Please type a message to start the live stream.</p>
      )}
    </div>
  );
}