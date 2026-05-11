"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import ScoreCard from "@/components/ScoreCard";
import FlagBadge from "@/components/FlagBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Loader, { SkeletonCard } from "@/components/Loader";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { FileText, Clock, User, Phone, Instagram } from "lucide-react";

const fetchSubmission = async ({ queryKey }) => {
  const [_key, { id }] = queryKey;
  const { data } = await api.get(`/dashboard/submissions/${id}`);
  return data;
};

const decisionConfig = {
  APPROVED: { variant: "success", text: "Approved" },
  REJECTED: { variant: "destructive", text: "Rejected" },
  HUMAN_REVIEW: { variant: "warning", text: "Needs Review" },
};

const CreatorInfo = ({ creator, campaign }) => (
  <Card className="border-zinc-800 bg-zinc-900">
    <CardContent className="pt-6">
      <div className="flex items-center space-x-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
          {creator.name.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-white">{creator.name}</p>
          <p className="text-sm text-zinc-400">+{creator.phone.slice(0, -4).replace(/./g, "X")}{creator.phone.slice(-4)}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        {creator.instagram && (
          <p className="flex items-center gap-2 text-zinc-300">
            <Instagram className="h-4 w-4" /> {creator.instagram}
          </p>
        )}
        <p className="text-zinc-300">Campaign: {campaign.name} <Badge variant="secondary">{campaign.status}</Badge></p>
      </div>
    </CardContent>
  </Card>
);

const AnalysisDetail = ({ title, value }) => (
  <div className="flex justify-between text-sm">
    <p className="text-zinc-400">{title}</p>
    <p className="font-mono text-white">{value}</p>
  </div>
);

const AuditLogTimeline = ({ logs }) => (
  <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-zinc-800">
    {logs.map((log) => (
      <div key={log.id} className="relative flex items-start">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 ring-8 ring-zinc-900">
          <Clock className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="ml-4">
          <p className="font-bold text-white">{log.action}</p>
          <p className="text-sm text-zinc-400">{log.summary}</p>
          <p className="text-xs text-zinc-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
        </div>
      </div>
    ))}
  </div>
);

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const { data: sub, isLoading, isError, error } = useQuery({
    queryKey: ["submission", { id }],
    queryFn: fetchSubmission,
    enabled: !!id,
  });

  if (isLoading) return <Loader />;
  if (isError) return <ErrorState message={error.response?.status === 404 ? "Submission not found." : "Failed to load submission."} />;
  if (!sub) return null;

  const decision = decisionConfig[sub.decision] || decisionConfig.HUMAN_REVIEW;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <VideoPlayer src={sub.videoUrl} />
        <CreatorInfo creator={sub.creator} campaign={sub.campaign} />
      </div>
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <ScoreCard score={sub.qcScore} label="QC Score" size="lg" />
          <ScoreCard score={sub.goodnessScore} label="Goodness" size="lg" />
        </div>
        <Card className="border-zinc-800 bg-zinc-900 text-center p-4">
          <Badge variant={decision.variant} className="text-lg px-4 py-1">
            {decision.text}
          </Badge>
          <p className="text-zinc-400 text-sm mt-2">
            Processing Cost: <span className="font-bold text-white">₹{sub.cost.toFixed(2)}</span>
          </p>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader><CardTitle>Flags</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {sub.flags.map(flag => <FlagBadge key={flag.code} {...flag} />)}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        <Tabs defaultValue="transcript" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
          <TabsContent value="transcript" className="mt-4">
            {sub.transcript ? (
              <div className="prose prose-invert max-w-none h-96 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-900 p-4 font-mono text-zinc-300 leading-relaxed">
                <p>{sub.transcript}</p>
              </div>
            ) : <EmptyState icon={<FileText />} title="No Transcript" subtitle="Transcript is not available for this submission." />}
          </TabsContent>
          <TabsContent value="analysis" className="mt-4">
            <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
              {Object.entries(sub.analysis).map(([key, values], i) => (
                <AccordionItem key={key} value={`item-${i+1}`} className="border-zinc-800 bg-zinc-900 px-4 rounded-lg mb-2">
                  <AccordionTrigger className="text-white">{key.replace(/([A-Z])/g, ' $1').trim()}</AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-2">
                    {Object.entries(values).map(([title, value]) => <AnalysisDetail key={title} title={title} value={value} />)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            <AuditLogTimeline logs={sub.auditLog} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
