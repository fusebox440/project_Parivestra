"use client";
import { useState, useEffect } from "react";

const CircularProgress = ({ score, size = "md" }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setProgress(score));
    return () => cancelAnimationFrame(animation);
  }, [score]);

  const sizeMap = {
    sm: { radius: 20, stroke: 3, textSize: "text-sm" },
    md: { radius: 40, stroke: 6, textSize: "text-2xl" },
    lg: { radius: 60, stroke: 8, textSize: "text-4xl" },
  };

  const { radius, stroke, textSize } = sizeMap[size];
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (score >= 75) return "stroke-green-500";
    if (score >= 50) return "stroke-amber-500";
    return "stroke-red-500";
  };

  return (
    <svg
      width={radius * 2 + stroke}
      height={radius * 2 + stroke}
      className="transform -rotate-90"
    >
      <circle
        className="stroke-zinc-800"
        strokeWidth={stroke}
        fill="transparent"
        r={radius}
        cx={radius + stroke / 2}
        cy={radius + stroke / 2}
      />
      <circle
        className={`transition-all duration-1000 ease-out ${getColor()}`}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={radius + stroke / 2}
        cy={radius + stroke / 2}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        className={`transform rotate-90 origin-center fill-white font-bold ${textSize}`}
      >
        {Math.round(progress)}
      </text>
    </svg>
  );
};

export default function ScoreCard({ score, label, size = "md" }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg">
      <CircularProgress score={score} size={size} />
      {label && <span className="mt-3 text-sm font-medium text-zinc-400">{label}</span>}
    </div>
  );
}
