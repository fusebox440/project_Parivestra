"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, PlayCircle } from "lucide-react";

export default function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("loading"); // 'loading', 'playing', 'error'

  useEffect(() => {
    setStatus(src ? "loading" : "error");
  }, [src]);

  const Placeholder = () => (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-zinc-900 aspect-video">
      <PlayCircle className="h-16 w-16 text-zinc-600" />
      <p className="mt-2 text-sm font-medium text-zinc-500">Video unavailable</p>
    </div>
  );

  const Spinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
    </div>
  );

  if (status === "error") {
    return <Placeholder />;
  }

  return (
    <div className="relative w-full rounded-lg bg-black overflow-hidden">
      {status === "loading" && <Spinner />}
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full h-full aspect-video"
        onCanPlay={() => setStatus("playing")}
        onError={() => setStatus("error")}
        onWaiting={() => setStatus("loading")}
        onPlaying={() => setStatus("playing")}
        style={{ display: status === "loading" ? "none" : "block" }}
      />
      {status === "loading" && (
        <div className="w-full bg-black aspect-video" />
      )}
    </div>
  );
}
