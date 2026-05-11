"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import FlagBadge from "./FlagBadge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ScoreCard({ score, flags }) {
  const getScoreColor = () => {
    if (score > 85) return "bg-green-500";
    if (score > 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-6xl font-bold">{score}</div>
          <div className="text-sm text-muted-foreground">out of 100</div>
        </div>
        <Progress value={score} className="h-3" indicatorClassName={getScoreColor()} />
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Flags ({flags.length})</h4>
          <ScrollArea className="h-32">
            <div className="flex flex-wrap gap-2">
              {flags.map((flag, index) => (
                <FlagBadge key={index} flag={flag} />
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
