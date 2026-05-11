"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ScoreCard = ({ score, label, breakdown }) => {
  const getScoreColor = (value) => {
    if (value >= 75) return "bg-green-500";
    if (value >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const colorClass = getScoreColor(score);

  const content = (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{score.toFixed(1)}</div>
        <Progress value={score} className={`h-2 mt-2 ${colorClass}`} />
      </CardContent>
    </Card>
  );

  if (breakdown) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <div className="p-2">
              <h4 className="font-bold mb-2">Breakdown</h4>
              <ul>
                {Object.entries(breakdown).map(([key, value]) => (
                  <li key={key} className="flex justify-between">
                    <span className="capitalize mr-4">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <strong>{value.toFixed(1)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

export default ScoreCard;
