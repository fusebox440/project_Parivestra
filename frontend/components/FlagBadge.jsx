"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Mic, MessageSquare, Camera, Tag } from 'lucide-react';

const flagConfig = {
    'profanity': { icon: <AlertTriangle className="h-3 w-3" />, color: 'destructive' },
    'clarity': { icon: <Mic className="h-3 w-3" />, color: 'warning' },
    'sentiment': { icon: <MessageSquare className="h-3 w-3" />, color: 'warning' },
    'lighting': { icon: <Camera className="h-3 w-3" />, color: 'warning' },
    'stability': { icon: <Camera className="h-3 w-3" />, color: 'warning' },
    'keyword': { icon: <Tag className="h-3 w-3" />, color: 'secondary' },
    'object': { icon: <Tag className="h-3 w-3" />, color: 'secondary' },
    'default': { icon: <AlertTriangle className="h-3 w-3" />, color: 'default' }
};

export default function FlagBadge({ flag }) {
    const { icon, color } = flagConfig[flag.type] || flagConfig.default;
    const value = flag.value || flag.type;

    return (
        <Badge variant={color} className="flex items-center gap-1.5 text-xs font-medium">
            {icon}
            <span className="capitalize">{value}</span>
        </Badge>
    );
}
