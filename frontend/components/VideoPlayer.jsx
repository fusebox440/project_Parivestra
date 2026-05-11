"use client";

import { useEffect, useRef } from "react";

const VideoPlayer = ({ src, onTimeUpdate }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [onTimeUpdate]);

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      <video ref={videoRef} src={src} controls className="w-full h-auto" />
    </div>
  );
};

export default VideoPlayer;
