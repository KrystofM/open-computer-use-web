import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface DisplayAreaProps {
  streamUrl: string | null;
}

export default function DisplayArea({ streamUrl }: DisplayAreaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(console.error);
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari which has native HLS support
      video.src = streamUrl;
      video.play().catch(console.error);
    }
  }, [streamUrl]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      {streamUrl ? (
        <video
          ref={videoRef}
          className="max-w-full max-h-full"
          controls
          playsInline
          autoPlay
          muted
        />
      ) : (
        <div className="text-white">Waiting for stream...</div>
      )}
    </div>
  );
} 