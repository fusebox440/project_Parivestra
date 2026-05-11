"use client";

import { BarChart, Users, Video, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Loader from "@/components/Loader";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { formatDistanceToNow } from "date-fns";

const fetchDashboardData = async () => {
  const [statsRes, recentRes] = await Promise.all([
    api.get("/dashboard/stats"),
    api.get("/dashboard/recent"),
  ]);
  return { stats: statsRes.data, recent: recentRes.data };
};

export default function DashboardPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
  });

  if (isLoading) return <Loader text="Loading dashboard..." />;
  if (error)
    return <ErrorState message={error.message || "Failed to load dashboard data."} />;
  if (!data) return <EmptyState message="No dashboard data available." />;

  const { stats, recent } = data;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          icon={<Video className="h-4 w-4 text-muted-foreground" />}
          change={stats.submissionsChange}
          changeType={stats.submissionsChangeType}
        />
        <StatCard
          title="Average Score"
          value={`${stats.averageScore.toFixed(1)}/100`}
          icon={<Star className="h-4 w-4 text-muted-foreground" />}
          change={stats.scoreChange}
          changeType={stats.scoreChangeType}
        />
        <StatCard
          title="Unique Creators"
          value={stats.uniqueCreators}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          change={stats.creatorsChange}
          changeType={stats.creatorsChangeType}
        />
        <StatCard
          title="Issues Flagged"
          value={stats.totalFlags}
          icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
          change={stats.flagsChange}
          changeType={stats.flagsChangeType}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Link
                      href={`/submissions/${submission.id}`}
                      className="font-medium hover:underline"
                    >
                      {submission.creator.name}
                    </Link>
                    <p className="text-sm text-muted-foreground hidden md:block">
                      {submission.title}
                    </p>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(submission.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={submission.score > 85 ? "success" : submission.score > 60 ? "warning" : "destructive"}
                    >
                      {submission.score}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
