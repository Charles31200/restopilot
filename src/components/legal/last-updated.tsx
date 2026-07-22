import { Calendar } from "lucide-react";

function formatDate(iso: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function LastUpdated({ date }: { date: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-subtle">
      <Calendar size={14} />
      Mis à jour le {formatDate(date)}
    </span>
  );
}
