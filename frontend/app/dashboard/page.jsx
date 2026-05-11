"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/lib/api";
import StatCard from "@/components/StatCard";
import Loader from "@/components/Loader";
import ErrorState from "@/components/ErrorState";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { DollarSign, CheckCircle, XCircle, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DashboardPage = () => {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getStats,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 60000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) return <Loader size="lg" />;
  if (error)
    return (
      <ErrorState
        title="Failed to load dashboard"
        message={error.message}
        onRetry={refetch}
      />
    );

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  const kpiCards = [
    {
      title: "Approval Rate",
      value: `${stats.approvalRate?.toFixed(2) || 0}%`,
      icon: <CheckCircle className="w-6 h-6 text-gray-400" />,
    },
    {
      title: "Rejection Rate",
      value: `${stats.rejectionRate?.toFixed(2) || 0}%`,
      icon: <XCircle className="w-6 h-6 text-gray-400" />,
    },
    {
      title: "Pending Review",
      value: stats.pendingReviewCount || 0,
      icon: <Clock className="w-6 h-6 text-gray-400" />,
    },
    {
      title: "Avg. QC Score",
      value: stats.avgQcScore?.toFixed(2) || 0,
      icon: <Zap className="w-6 h-6 text-gray-400" />,
    },
    {
      title: "Avg. Processing Time",
      value: `${stats.avgProcessingTime?.toFixed(2) || 0}s`,
      icon: <DollarSign className="w-6 h-6 text-gray-400" />,
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </div>
      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submissions Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.submissionsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Decision Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.decisionBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" fill="#82ca9d" />
                <Bar dataKey="rejected" fill="#ff6b6b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
