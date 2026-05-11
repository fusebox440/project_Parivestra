"use client";

import { useQuery } from "@tanstack/react-query";
import { getSubmissionDetail } from "@/lib/api";
import { useParams } from "next/navigation";
import Loader from "@/components/Loader";
import ErrorState from "@/components/ErrorState";
import VideoPlayer from "@/components/VideoPlayer";
import ScoreCard from "@/components/ScoreCard";
import FlagBadge from "@/components/FlagBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const SubmissionDetailPage = () => {
  const { id } = useParams();
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["submission", id],
    queryFn: () => getSubmissionDetail(id),
    enabled: !!id,
  });

  if (isLoading) return <Loader size="lg" />;
  if (error)
    return (
      <ErrorState
        title="Failed to load submission"
        message={error.message}
        onRetry={refetch}
      />
    );

  const submission = data || {};

  const renderStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      case "PROCESSING":
        return <Badge className="bg-blue-500 text-white">Processing</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Submission: {id.substring(0, 8)}...</h1>
        {renderStatusBadge(submission.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <VideoPlayer src={submission.videoUrl} />
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {submission.auditLog?.map((log, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {new Date(log.timestamp).toLocaleString()}
                    </span> {log.message}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ScoreCard score={submission.qcScore} title="Final QC Score" />
          <Card>
            <CardHeader>
              <CardTitle>Decision Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Status:</strong> {submission.status}</p>
              <p><strong>Reviewer:</strong> {submission.reviewer || 'N/A'}</p>
              <p className="mt-2"><strong>Notes:</strong> {submission.reviewerNotes || 'No notes.'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Transcription:</strong> ${submission.cost?.transcription.toFixed(4)}</p>
              <p><strong>Video Analysis:</strong> ${submission.cost?.video.toFixed(4)}</p>
              <p><strong>Total:</strong> ${submission.cost?.total.toFixed(4)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detected Flags</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {submission.flags?.map((flag) => (
                <FlagBadge key={flag} flag={flag} />
              ))}
              {submission.flags?.length === 0 && <p>No flags detected.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Raw Analyzer Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {submission.analyzerResults && Object.entries(submission.analyzerResults).map(([analyzer, result]) => (
                <AccordionItem key={analyzer} value={analyzer}>
                  <AccordionTrigger>{analyzer}</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmissionDetailPage;
