"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import ScoreCard from "@/components/ScoreCard";
import FlagBadge from "@/components/FlagBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Smile, Frown, Meh } from "lucide-react";
import Loader from "@/components/Loader";
import ErrorState from "@/components/ErrorState";
import { format } from "date-fns";

const fetchSubmission = async ({ queryKey }) => {
  const [_key, { id }] = queryKey;
  const response = await api.get(`/submissions/${id}`);
  return response.data;
};

const SentimentIcon = ({ sentiment }) => {
  if (sentiment > 0.5) return <Smile className="h-5 w-5 text-green-500" />;
  if (sentiment < -0.5) return <Frown className="h-5 w-5 text-red-500" />;
  return <Meh className="h-5 w-5 text-yellow-500" />;
};

export default function SubmissionPage() {
  const params = useParams();
  const { id } = params;

  const { data: submission, error, isLoading } = useQuery({
    queryKey: ["submission", { id }],
    queryFn: fetchSubmission,
    enabled: !!id,
  });

  if (isLoading) return <Loader text="Loading submission details..." />;
  if (error) return <ErrorState message={error.message || "Failed to load submission."} />;
  if (!submission) return null;

  const { qcResult } = submission;

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-2 space-y-8">
        <VideoPlayer src={submission.videoUrl} />
        <Card>
          <CardHeader>
            <CardTitle>Analysis Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="transcript">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="visual">Visuals</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
              </TabsList>
              <TabsContent value="transcript" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Sentiment</h4>
                    <div className="flex items-center gap-2">
                      <SentimentIcon sentiment={qcResult.transcriptAnalysis.sentiment.score} />
                      <span className="font-mono text-sm">{qcResult.transcriptAnalysis.sentiment.score.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {qcResult.transcriptAnalysis.keywords.map((kw) => (
                        <FlagBadge key={kw} flag={{ type: "keyword", value: kw }} />
                      ))}
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none h-64 overflow-y-auto rounded-md border p-4">
                    <p>{qcResult.transcriptAnalysis.fullTranscript}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="visual" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Lighting Quality</h4>
                  <Progress value={qcResult.visualAnalysis.lighting.score * 100} className="w-1/2" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Video Stability</h4>
                  <Progress value={qcResult.visualAnalysis.stability.score * 100} className="w-1/2" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Detected Objects</h4>
                  <div className="flex flex-wrap gap-2">
                    {qcResult.visualAnalysis.objects.map((obj) => (
                      <FlagBadge key={obj.name} flag={{ type: "object", value: `${obj.name} (${(obj.confidence * 100).toFixed(0)}%)` }} />
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="audio" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Clarity Score</h4>
                  <Progress value={qcResult.audioAnalysis.clarity.score * 100} className="w-1/2" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Background Noise</h4>
                  <Progress value={qcResult.audioAnalysis.backgroundNoise.level * 100} className="w-1/2" />
                </div>
                <div className="flex items-center gap-4">
                  <h4 className="font-semibold">Silence Detection</h4>
                  {qcResult.audioAnalysis.silence.detected ? (
                    <AlertCircle className="text-destructive" />
                  ) : (
                    <CheckCircle className="text-success" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {qcResult.audioAnalysis.silence.duration}s of silence
                  </span>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-8">
        <ScoreCard score={submission.score} flags={qcResult.flags} />
        <Card>
          <CardHeader>
            <CardTitle>Submission Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Creator:</span>
              <span>{submission.creator.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Title:</span>
              <span className="text-right">{submission.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted:</span>
              <span>{format(new Date(submission.createdAt), "PPpp")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">File:</span>
              <span className="truncate">{submission.fileName}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
