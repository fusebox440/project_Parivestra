import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div className="flex h-full min-h-[20rem] w-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="h-32 w-full rounded-xl bg-zinc-800 animate-pulse" />
  );
}
