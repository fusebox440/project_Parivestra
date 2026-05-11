"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const severityConfig = {
    HIGH: { icon: <AlertTriangle className="h-4 w-4" />, variant: 'destructive' },
    MEDIUM: { icon: <AlertCircle className="h-4 w-4" />, variant: 'warning' },
    LOW: { icon: <Info className="h-4 w-4" />, variant: 'secondary' },
};

const formatCode = (code) => {
    if (!code) return '';
    return code
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export default function FlagBadge({ code, severity, detail }) {
    const config = severityConfig[severity] || severityConfig.LOW;

    return (
        <div className="flex flex-col items-start">
            <Badge variant={config.variant} className="inline-flex items-center gap-x-1.5 py-1 px-2.5">
                {config.icon}
                <span className="text-xs font-semibold">{formatCode(code)}</span>
            </Badge>
            {detail && <p className="mt-1 text-xs text-zinc-400">{detail}</p>}
        </div>
    );
}
