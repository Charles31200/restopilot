import { Clock } from "lucide-react";

export function EstimatedReadingTime({ minutes }: { minutes: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-subtle">
      <Clock size={14} />
      {minutes} min de lecture
    </span>
  );
}
