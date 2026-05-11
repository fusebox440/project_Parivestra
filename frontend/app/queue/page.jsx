"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import SearchBar from "@/components/SearchBar";
import TablePagination from "@/components/TablePagination";
import FlagBadge from "@/components/FlagBadge";
import ScoreCard from "@/components/ScoreCard";
import VideoPlayer from "@/components/VideoPlayer";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard } from "@/components/Loader";
import { toast } from "sonner";
import { FileQuestion } from "lucide-react";

const FILTERS = ["All", "Pending", "In Review"];

const fetchQueue = async ({ queryKey }) => {
  const [_key, params] = queryKey;
  const { data } = await api.get("/dashboard/queue", { params });
  return data;
};

const scoreColors = (score) => {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
};

const ReviewSheet = ({ item, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const resolveMutation = useMutation({
    mutationFn: ({ decision }) => api.patch(`/dashboard/queue/${item.id}/resolve`, { decision, notes }),
    onSuccess: () => {
      toast.success(`Submission has been resolved.`);
      queryClient.invalidateQueries(["queueData"]);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to resolve submission.");
    },
  });

  const handleSubmit = (decision) => {
    if (decision === "REJECTED" && !notes.trim()) {
      return toast.error("Reviewer notes are required for rejection.");
    }
    resolveMutation.mutate({ decision });
  };

  const sortedFlags = [...item.flags].sort((a, b) => {
    const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <SheetContent className="w-[600px] sm:w-[600px] bg-zinc-950 border-l-zinc-800 text-white p-0">
      <SheetHeader className="p-6 border-b border-zinc-800">
        <SheetTitle>{item.creator.name} - {item.campaign.name}</SheetTitle>
      </SheetHeader>
      <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-150px)]">
        <VideoPlayer src={item.videoUrl} />
        <div className="grid grid-cols-2 gap-4">
          <ScoreCard score={item.qcScore} label="QC Score" size="lg" />
          <ScoreCard score={item.goodnessScore} label="Goodness Score" size="lg" />
        </div>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader><CardTitle>Flags</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {sortedFlags.map(flag => <FlagBadge key={flag.code} {...flag} />)}
          </CardContent>
        </Card>
        {/* Transcript section would go here */}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-zinc-950 border-t border-zinc-800">
        <Textarea placeholder="Add notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-zinc-900 border-zinc-700" />
        <div className="mt-4 flex justify-end space-x-2">
          <Button onClick={() => handleSubmit('REJECTED')} variant="destructive" disabled={resolveMutation.isLoading}>Reject</Button>
          <Button onClick={() => handleSubmit('APPROVED')} className="bg-green-600 hover:bg-green-500" disabled={resolveMutation.isLoading}>Approve</Button>
        </div>
      </div>
    </SheetContent>
  );
};

export default function QueuePage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: 'Pending', search: '' });
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['queueData', { page, limit: 20, ...filters }],
    queryFn: fetchQueue,
    keepPreviousData: true,
  });

  const handleReviewClick = (item) => {
    setSelectedItem(item);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">
          Review Queue <Badge className="ml-2">{data?.totalItems || 0}</Badge>
        </h1>
        <div className="w-1/3">
          <SearchBar
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            placeholder="Search by creator..."
          />
        </div>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          {/* Filter buttons can be added here */}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-900">
                <TableHead>Creator</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>QC Score</TableHead>
                <TableHead>Goodness</TableHead>
                <TableHead>Top Flag</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(10)].map((_, i) => <TableRow key={i} className="border-zinc-800"><TableCell colSpan={7}><SkeletonCard /></TableCell></TableRow>)
              ) : data && data.items.length > 0 ? (
                data.items.map(item => (
                  <TableRow key={item.id} className="border-zinc-800">
                    <TableCell>{item.creator.name}</TableCell>
                    <TableCell>{item.campaign.name}</TableCell>
                    <TableCell>{new Date(item.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell className={scoreColors(item.qcScore)}>{item.qcScore}</TableCell>
                    <TableCell className={scoreColors(item.goodnessScore)}>{item.goodnessScore}</TableCell>
                    <TableCell>
                      {item.flags.find(f => f.severity === 'HIGH') && <FlagBadge {...item.flags.find(f => f.severity === 'HIGH')} />}
                    </TableCell>
                    <TableCell>
                      <Sheet open={isSheetOpen && selectedItem?.id === item.id} onOpenChange={(open) => { if (!open) setSelectedItem(null); setSheetOpen(open); }}>
                        <SheetTrigger asChild>
                          <Button variant="outline" onClick={() => handleReviewClick(item)}>Review</Button>
                        </SheetTrigger>
                        {selectedItem?.id === item.id && <ReviewSheet item={item} onOpenChange={setSheetOpen} />}
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState icon={<FileQuestion />} title="No items in queue" subtitle="The review queue is currently empty." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {data && data.totalPages > 1 && (
        <TablePagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
