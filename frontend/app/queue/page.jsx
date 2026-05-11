"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueue, resolveQueueItem } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/Loader";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import SearchBar from "@/components/SearchBar";
import TablePagination from "@/components/TablePagination";
import VideoPlayer from "@/components/VideoPlayer";
import ScoreCard from "@/components/ScoreCard";
import FlagBadge from "@/components/FlagBadge";
import { Card } from "@/components/ui/card";

const QueuePage = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewerNotes, setReviewerNotes] = useState("");

  const queryClient = useQueryClient();

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["queue", page, filters],
    queryFn: () => getQueue({ page, limit: 10, ...filters }),
    keepPreviousData: true,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, reviewerNotes }) =>
      resolveQueueItem(id, { status, reviewerNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries(["queue"]);
      setSelectedItem(null);
    },
  });

  const handleResolve = (status) => {
    if (selectedItem) {
      mutation.mutate({ id: selectedItem.id, status, reviewerNotes });
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters({ ...filters, search: searchTerm });
    setPage(1);
  };

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

  if (isLoading) return <Loader size="lg" />;
  if (error)
    return (
      <ErrorState
        title="Failed to load queue"
        message={error.message}
        onRetry={refetch}
      />
    );

  const { items = [], totalPages = 1, totalItems = 0 } = data || {};

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Human Review Queue</h1>
      <div className="mb-4">
        <SearchBar onSearch={handleSearch} />
      </div>

      {isFetching && <Loader />}

      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent className="w-full md:w-3/4 lg:w-1/2 overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle>Review Submission: {selectedItem.id}</SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-6">
                <VideoPlayer src={selectedItem.videoUrl} />
                <div className="grid grid-cols-2 gap-4">
                  <ScoreCard score={selectedItem.qcScore} title="QC Score" />
                  <ScoreCard score={selectedItem.goodnessScore} title="Goodness Score" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Transcript</h3>
                  <div className="h-48 overflow-y-auto p-2 border rounded-md bg-gray-50">
                    {selectedItem.transcript}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Flags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.flags?.map((flag) => (
                      <FlagBadge key={flag} flag={flag} />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Reviewer Notes</h3>
                  <Textarea
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Add your notes here..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleResolve("REJECTED")}
                    disabled={mutation.isLoading}
                  >
                    Reject
                  </Button>
                  <Button
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => handleResolve("APPROVED")}
                    disabled={mutation.isLoading}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {items.length === 0 ? (
        <EmptyState
          title="No items in the queue"
          message="Everything is up to date."
        />
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>QC Score</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setReviewerNotes(item.reviewerNotes || "");
                    }}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell className="font-medium">{item.id.substring(0, 8)}...</TableCell>
                    <TableCell>{renderStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.qcScore}</TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">Review</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={10}
            totalItems={totalItems}
          />
        </>
      )}
    </div>
  );
};

export default QueuePage;
