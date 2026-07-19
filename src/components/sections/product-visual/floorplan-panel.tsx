const tables = [
  { x: 10, y: 12, size: 15, status: "free" },
  { x: 32, y: 12, size: 15, status: "occupied" },
  { x: 54, y: 12, size: 15, status: "reserved" },
  { x: 76, y: 12, size: 15, status: "occupied" },
  { x: 10, y: 40, size: 15, status: "occupied" },
  { x: 32, y: 40, size: 15, status: "free" },
  { x: 54, y: 40, size: 15, status: "occupied" },
  { x: 76, y: 40, size: 15, status: "free" },
  { x: 18, y: 68, size: 22, status: "reserved" },
  { x: 58, y: 68, size: 22, status: "occupied" },
] as const;

const statusStyles: Record<string, string> = {
  free: "bg-canvas-alt border-line-strong",
  occupied: "bg-accent/20 border-accent/50",
  reserved: "bg-[#3b6fe0]/12 border-[#3b6fe0]/40",
};

const legend = [
  { label: "Libre", swatch: "bg-canvas-alt border border-line-strong" },
  { label: "Occupée", swatch: "bg-accent/20 border border-accent/50" },
  { label: "Réservée", swatch: "bg-[#3b6fe0]/12 border border-[#3b6fe0]/40" },
];

export function FloorplanPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "bg-canvas-alt p-3" : "bg-canvas-alt p-5 sm:p-7"}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span
          className={
            compact
              ? "text-[11px] font-medium text-ink-muted"
              : "text-[13px] font-medium text-ink-muted"
          }
        >
          Plan de salle
        </span>
        {!compact && (
          <div className="flex items-center gap-3">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
                <span className={`h-2.5 w-2.5 rounded-[3px] ${l.swatch}`} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        className={
          compact
            ? "relative h-[150px] rounded-(--radius-sm) border border-line bg-surface"
            : "relative h-[260px] rounded-(--radius-md) border border-line bg-surface"
        }
      >
        {tables.map((t, i) => (
          <div
            key={i}
            className={`absolute rounded-(--radius-sm) border ${statusStyles[t.status]}`}
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              width: `${t.size}%`,
              height: `${t.size * 1.4}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
