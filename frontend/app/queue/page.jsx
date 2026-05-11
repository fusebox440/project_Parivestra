"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueue, resolveQueueItem } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import VideoPlayer from '@/components/VideoPlayer';
import ScoreCard from '@/components/ScoreCard';
import FlagBadge from '@/components/FlagBadge';
import { format } from 'date-fns';

export default function QueuePage() {
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviewQueue', page],
    queryFn: () => getQueue(page),
    keepPreviousData: true,
  });

  const mutation = useMutation({
    mutationFn: ({ id, decision, notes }) => resolveQueueItem(id, decision, notes),
    onSuccess: () => {
      queryClient.invalidateQueries(['reviewQueue']);
      queryClient.invalidateQueries(['dashboardStats']);
      setSelectedItem(null);
      setReviewerNotes('');
    },
  });

  const handleResolve = (decision) => {
    if (selectedItem) {
      mutation.mutate({ id: selectedItem.id, decision, notes: reviewerNotes });
    }
  };

  const renderTable = () => (
    <Card>
        <CardHeader>
            <CardTitle>Human Review Queue</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>QC Score</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Top Flag</TableHead>
                    <TableHead>Action</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {data?.data.map((item) => (
                    <TableRow key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer">
                    <TableCell>{item.submission.creator.name}</TableCell>
                    <TableCell>{item.submission.campaign.name}</TableCell>
                    <TableCell>{format(new Date(item.submission.createdAt), 'PPpp')}</TableCell>
                    <TableCell>{item.submission.qcResult.qcScore.toFixed(1)}</TableCell>
                    <TableCell>{item.submission.qcResult.goodnessScore.toFixed(1)}</TableCell>
                    <TableCell>
                        {item.submission.qcResult.flags.length > 0 && <FlagBadge flag={item.submission.qcResult.flags[0]} />}
                    </TableCell>
                    <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}>Review</Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );

  const renderSheetContent = () => {
    if (!selectedItem) return null;
    const { submission } = selectedItem;
    const { qcResult } = submission;

    return (
      <SheetContent className="w-[800px] sm:w-[940px]">
        <SheetHeader>
          <SheetTitle>Review Video Submission</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <VideoPlayer src={submission.videoUrl} />
          <div className="grid grid-cols-2 gap-4">
            <ScoreCard score={qcResult.qcScore} label="QC Score" />
            <ScoreCard score={qcResult.goodnessScore} label="Goodness Score" />
          </div>
          <div>
            <h4 className="font-semibold mb-2">Flags</h4>
            <div className="flex flex-wrap gap-2">
              {qcResult.flags.sort((a,b) => b.severity.localeCompare(a.severity)).map(flag => <FlagBadge key={flag.id} flag={flag} />)}
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto bg-gray-50 p-2 rounded">
            <h4 className="font-semibold mb-2">Transcript</h4>
            <p className="text-sm">{qcResult.transcription?.text || 'No transcript available.'}</p>
          </div>
          <div>
            <Textarea
              placeholder="Add reviewer notes..."
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="destructive" onClick={() => handleResolve('REJECTED')} disabled={mutation.isLoading}>
              {mutation.isLoading ? 'Rejecting...' : 'Reject'}
            </Button>
            <Button variant="default" onClick={() => handleResolve('APPROVED')} disabled={mutation.isLoading}>
              {mutation.isLoading ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        </div>
      </SheetContent>
    );
  };

  if (isLoading) return <div>Loading queue...</div>;
  if (error) return <div>Error loading queue: {error.message}</div>;

  return (
    <Sheet open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}>
      {renderTable()}
      {renderSheetContent()}
    </Sheet>
  );
}
