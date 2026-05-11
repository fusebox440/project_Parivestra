"use client";

import { useState, useEffect } from 'react';

const VideoPlayer = ({ src }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (src) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [src]);

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="w-full aspect-video bg-gray-200 animate-pulse rounded-md flex items-center justify-center">Loading video...</div>;
  }

  if (error || !src) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-md flex flex-col items-center justify-center text-center">
        <p className="text-red-500 font-semibold">Video unavailable</p>
        {src && (
          <a href={src} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-2">
            Open in new tab
          </a>
        )}
      </div>
    );
  }

  return (
    <video
      key={src}
      className="w-full rounded-md"
      controls
      autoPlay
      muted
      playsInline
      onError={handleError}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoPlayer;
