"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Video, CheckCircle, IndianRupee, Clock } from "lucide-react";
import StatCard from "@/components/StatCard";
import { SkeletonCard } from "@/components/Loader";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

const fetchStats = async () => {
  const res = await api.get("/dashboard/stats");
  return res.data;
};

const fetchRecent = async () => {
  const res = await api.get("/dashboard/queue?limit=10");
  return res.data;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm shadow-lg">
        <p className="text-zinc-400">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{`${p.name}: ${p.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const scoreColor = (score) => {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
};

const decisionBadge = (decision) => {
  if (decision === "APPROVED") return "bg-green-500/20 text-green-400 border-green-500/30";
  if (decision === "REJECTED") return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-amber-500/20 text-amber-400 border-amber-500/30";
};

export default function DashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 60000,
  });

  const {
    data: recentData,
    isLoading: recentLoading,
  } = useQuery({
    queryKey: ["recentQueue"],
    queryFn: fetchRecent,
    refetchInterval: 60000,
  });

  if (statsLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (statsError) {
    return <ErrorState message="Failed to load dashboard. Make sure backend is running on port 3000." />;
  }

  const recent = recentData?.items || recentData?.queue || recentData || [];

  // Build chart data from stats if available
  const decisionChartData = stats?.last7Days || [
    { date: "Mon", Approved: 0, Rejected: 0 },
    { date: "Tue", Approved: 0, Rejected: 0 },
    { date: "Wed", Approved: 0, Rejected: 0 },
    { date: "Thu", Approved: 0, Rejected: 0 },
    { date: "Fri", Approved: 0, Rejected: 0 },
    { date: "Sat", Approved: 0, Rejected: 0 },
    { date: "Sun", Approved: 0, Rejected: 0 },
  ];

  const rejectionChartData = stats?.topRejectionReasons || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-1">CreatorQC overview and metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Videos Today"
          value={stats?.totalToday ?? 0}
          icon={<Video />}
          color="purple"
        />
        <StatCard
          title="Approval Rate"
          value={`${stats?.approvalRate ?? 0}%`}
          icon={<CheckCircle />}
          color="green"
        />
        <StatCard
          title="Avg Cost/Video"
          value={`₹${stats?.avgCostInr ?? "0.00"}`}
          icon={<IndianRupee />}
          color="blue"
        />
        <StatCard
          title="Pending Reviews"
          value={stats?.pendingReviews ?? 0}
          icon={<Clock />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">QC Decisions (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={decisionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "14px", color: "#a1a1aa" }} />
                <Line type="monotone" dataKey="Approved" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: "#22c55e" }} />
                <Line type="monotone" dataKey="Rejected" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Top Rejection Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            {rejectionChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-zinc-500">
                No rejection data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rejectionChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis type="number" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="reason" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} width={140} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#27272a" }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Recent Submissions</CardTitle>
          <Link href="/queue" className="text-sm font-medium text-indigo-400 hover:underline">
            View All →
          </Link>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <SkeletonCard />
          ) : Array.isArray(recent) && recent.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Creator</TableHead>
                  <TableHead className="text-zinc-400">Campaign</TableHead>
                  <TableHead className="text-zinc-400">QC Score</TableHead>
                  <TableHead className="text-zinc-400">Decision</TableHead>
                  <TableHead className="text-zinc-400">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((item) => (
                  <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-medium text-white">
                      {item.creator?.name || item.qcResult?.submission?.deliverable?.creator?.name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {item.campaign?.name || item.qcResult?.submission?.deliverable?.campaign?.name || "Unknown"}
                    </TableCell>
                    <TableCell className={`font-mono font-semibold ${scoreColor(item.qcScore || item.qcResult?.qcScore)}`}>
                      {item.qcScore || item.qcResult?.qcScore || "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${decisionBadge(item.decision || item.qcResult?.decision)}`}>
                        {(item.decision || item.qcResult?.decision || "UNKNOWN").replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {item.submittedAt || item.createdAt
                        ? formatDistanceToNow(new Date(item.submittedAt || item.createdAt), { addSuffix: true })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-zinc-500">
              No submissions yet. Upload a video to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}