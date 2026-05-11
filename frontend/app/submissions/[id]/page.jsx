"use client";

import { useQuery } from '@tanstack/react-query';
import { getSubmissionDetail } from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';
import ScoreCard from '@/components/ScoreCard';
import FlagBadge from '@/components/FlagBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';

export default function SubmissionDetailPage({ params }) {
  const { id } = params;
  const { data: submission, isLoading, error } = useQuery({
    queryKey: ['submissionDetail', id],
    queryFn: () => getSubmissionDetail(id),
    enabled: !!id,
  });

  if (isLoading) return <div>Loading submission details...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!submission) return <div>Submission not found.</div>;

  const { qcResult, auditLogs } = submission;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Submission Details</h1>
      <VideoPlayer src={submission.videoUrl} />

      <div className="grid md:grid-cols-2 gap-4">
        <ScoreCard score={qcResult.qcScore} label="QC Score" />
        <ScoreCard score={qcResult.goodnessScore} label="Goodness Score" />
      </div>

      <Card>
        <CardHeader><CardTitle>Flags</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {qcResult.flags.length > 0 ? (
            qcResult.flags.map(flag => <FlagBadge key={flag.id} flag={flag} />)
          ) : (
            <p>No flags raised.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {auditLogs.map(log => (
              <li key={log.id} className="flex items-start">
                <div className="flex-shrink-0 w-24 text-sm text-gray-500">{format(new Date(log.createdAt), 'PPpp')}</div>
                <div className="ml-4">
                  <p className="font-semibold">{log.event.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-600">{log.details}</p>
                  <p className="text-xs text-gray-400">by {log.actor}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="raw-data">
          <AccordionTrigger>Raw Analyzer Outputs</AccordionTrigger>
          <AccordionContent>
            <pre className="bg-gray-900 text-white p-4 rounded-md text-xs overflow-x-auto">
              {JSON.stringify(qcResult, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
