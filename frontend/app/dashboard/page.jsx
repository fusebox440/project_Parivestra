"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Video, CheckCircle, IndianRupee, Clock } from "lucide-react";
import StatCard from "@/components/StatCard";
import { SkeletonCard } from "@/components/Loader";
import ErrorState from "@/components/ErrorState";
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
import { formatDistanceToNow } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const fetchDashboardData = async () => {
  const [statsRes, recentRes, chartsRes] = await Promise.all([
    api.get("/dashboard/stats"),
    api.get("/dashboard/queue?limit=10"),
    api.get("/dashboard/charts"), // Assuming a new endpoint for chart data
  ]);
  return { stats: statsRes.data, recent: recentRes.data, charts: chartsRes.data };
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm shadow-lg">
        <p className="label text-zinc-400">{`${label}`}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {`${p.name}: ${p.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const decisionColors = {
  APPROVED: "success",
  REJECTED: "destructive",
  HUMAN_REVIEW: "warning",
};

const scoreColors = (score) => {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
};

export default function DashboardPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (error) return <ErrorState message={error.message || "Failed to load dashboard data."} />;

  const { stats, recent, charts } = data;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Videos Today" value={stats.totalToday} icon={<Video />} color="purple" />
        <StatCard title="Approval Rate" value={`${stats.approvalRate}%`} icon={<CheckCircle />} color="green" />
        <StatCard title="Avg Cost/Video" value={`₹${stats.avgCostInr}`} icon={<IndianRupee />} color="blue" />
        <StatCard title="Pending Reviews" value={stats.pendingReviews} icon={<Clock />} color="amber" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">QC Decisions (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.decisions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "14px" }} />
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.rejectionReasons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis type="number" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="reason" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#3f3f46" }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Recent Submissions</CardTitle>
          <Link href="/queue" className="text-sm font-medium text-indigo-400 hover:underline">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Creator</TableHead>
                <TableHead className="text-zinc-400">Campaign</TableHead>
                <TableHead className="text-zinc-400">QC Score</TableHead>
                <TableHead className="text-zinc-400">Decision</TableHead>
                <TableHead className="text-zinc-400">Time Ago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((item) => (
                <TableRow key={item.id} className="border-zinc-800">
                  <TableCell className="font-medium text-white">{item.creator.name}</TableCell>
                  <TableCell className="text-zinc-300">{item.campaign.name}</TableCell>
                  <TableCell className={`font-mono font-semibold ${scoreColors(item.qcScore)}`}>{item.qcScore}</TableCell>
                  <TableCell>
                    <Badge variant={decisionColors[item.decision]}>{item.decision.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
