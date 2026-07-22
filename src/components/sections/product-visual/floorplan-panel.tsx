const tables = [
  { x: 8, y: 10, size: 15, status: "free" },
  { x: 30, y: 10, size: 15, status: "occupied" },
  { x: 52, y: 10, size: 15, status: "reserved" },
  { x: 74, y: 10, size: 15, status: "occupied" },
  { x: 8, y: 38, size: 15, status: "occupied" },
  { x: 30, y: 38, size: 15, status: "free" },
  { x: 52, y: 38, size: 15, status: "occupied" },
  { x: 74, y: 38, size: 15, status: "free" },
  { x: 16, y: 66, size: 24, status: "reserved" },
  { x: 60, y: 66, size: 24, status: "occupied" },
] as const;

const statusStyles: Record<string, string> = {
  free: "bg-canvas-alt border-line-strong",
  occupied: "bg-ink/15 border-ink/40",
  reserved: "bg-blue/12 border-blue/40",
};

const legend = [
  { label: "Libre", swatch: "bg-canvas-alt border border-line-strong" },
  { label: "Occupée", swatch: "bg-ink/15 border border-ink/40" },
  { label: "Réservée", swatch: "bg-blue/12 border border-blue/40" },
];

export function FloorplanPanel() {
  return (
    <div className="flex h-full flex-col p-6 sm:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[12.5px] font-medium text-ink-muted">Plan de salle</p>
          <p className="mt-1 font-mono text-[26px] font-medium tracking-tight text-ink">
            18 / 24
          </p>
        </div>
        <div className="flex items-center gap-3">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
              <span className={`h-2.5 w-2.5 rounded-[3px] ${l.swatch}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative min-h-[280px] flex-1 rounded-(--radius-md) border border-line bg-canvas-alt">
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
