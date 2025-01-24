import React, { useEffect, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';

interface DisplayAreaProps {
  streamUrl: string | null;
}

export default function DisplayArea({ streamUrl }: DisplayAreaProps) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(prevKey => prevKey + 1);
    console.log("streamUrl", streamUrl);
  }, [streamUrl]);

  const reloadPlayer = () => {
    setKey(prevKey => prevKey + 1);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      {streamUrl ? (
        <>
          <MuxPlayer
            key={key} // Use the key to force re-render
            playbackId="lEmVXGBHFFx9301N900nx5IUT2Rrt1a01013tdq7VEMo86E"
            streamType="on-demand"
            controls
            autoPlay
            muted
            className="max-w-full max-h-full"
          />
          <button onClick={reloadPlayer}>Reload Player</button>
        </>
      ) : (
        <p>Please type a message to start the live stream.</p>
      )}
    </div>
  );
}