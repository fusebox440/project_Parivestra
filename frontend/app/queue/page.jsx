"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import Loader from "@/components/Loader";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { formatDistanceToNow } from "date-fns";
import TablePagination from "@/components/TablePagination";
import { useState } from "react";

const fetchQueue = async ({ queryKey }) => {
  const [_key, { page, limit }] = queryKey;
  const response = await api.get("/queue", { params: { page, limit } });
  return response.data;
};

const requeueItem = async (id) => {
  await api.post(`/queue/${id}/requeue`);
};

export default function QueuePage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const queryClient = useQueryClient();

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ["queue", { page, limit }],
    queryFn: fetchQueue,
    keepPreviousData: true,
  });

  const mutation = useMutation({
    mutationFn: requeueItem,
    onSuccess: () => {
      queryClient.invalidateQueries(["queue"]);
    },
  });

  const handleRequeue = (id) => {
    mutation.mutate(id);
  };

  const renderStatus = (status) => {
    switch (status) {
      case "processing":
        return (
          <Badge variant="secondary">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-2 h-4 w-4" />Failed
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success">
            <CheckCircle className="mr-2 h-4 w-4" />Completed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) return <Loader text="Loading queue..." />;
  if (error)
    return <ErrorState message={error.message || "Failed to load queue."} />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Processing Queue</CardTitle>
        {isFetching && <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />}
      </CardHeader>
      <CardContent>
        {data?.items.length === 0 ? (
          <EmptyState message="The processing queue is empty." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.video.title}</TableCell>
                    <TableCell>{renderStatus(item.status)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === "failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequeue(item.id)}
                          disabled={mutation.isLoading}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />Requeue
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              totalPages={data?.totalPages}
              setPage={setPage}
              hasNextPage={data?.hasNextPage}
              hasPrevPage={data?.hasPrevPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
