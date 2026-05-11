"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const formatFlagCode = (code) => {
  return code
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const FlagBadge = ({ flag }) => {
  const getSeverityVariant = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'secondary';
      case 'LOW':
      default:
        return 'outline';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={getSeverityVariant(flag.severity)}>
            {formatFlagCode(flag.code)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{flag.detail}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FlagBadge;
