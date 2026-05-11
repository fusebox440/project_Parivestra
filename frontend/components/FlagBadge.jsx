"use client";

import { Badge } from "@/components/ui/badge";

const flagColors = {
  "low-quality": "bg-red-500",
  "profanity": "bg-yellow-500",
  "pii": "bg-orange-500",
  "brand-safety": "bg-purple-500",
  "other": "bg-gray-500",
};

const FlagBadge = ({ flag }) => {
  const color = flagColors[flag] || flagColors["other"];
  return (
    <Badge className={`${color} text-white`}>
      {flag.replace("-", " ")}
    </Badge>
  );
};

export default FlagBadge;
