"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ScoreCard = ({ score, title = "QC Score" }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-center">
          <span className={getScoreColor(score)}>{score}</span>
          <span className="text-2xl text-gray-500">/100</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreCard;
