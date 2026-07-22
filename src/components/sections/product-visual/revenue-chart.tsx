const values = [42, 48, 45, 58, 54, 66, 62, 74, 70, 82, 78, 92];
const max = Math.max(...values);
const min = Math.min(...values);

function toPoints(width: number, height: number, padding: number) {
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;
  return values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * usableW;
    const y = padding + usableH - ((v - min) / (max - min)) * usableH;
    return { x, y };
  });
}

function smoothPath(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const midX = (prev.x + p.x) / 2;
      return `Q ${prev.x} ${prev.y} ${midX} ${(prev.y + p.y) / 2} T ${p.x} ${p.y}`;
    })
    .join(" ");
}

const W = 400;
const H = 200;
const PAD = 16;

export function RevenueChart() {
  const points = toPoints(W, H, PAD);
  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H - PAD} L ${points[0].x} ${H - PAD} Z`;
  const last = points[points.length - 1];

  return (
    <div className="flex h-full flex-col justify-between p-6 sm:p-7">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[12.5px] font-medium text-ink-muted">
            Chiffre d&apos;affaires — 12 derniers services
          </p>
          <p className="mt-1 font-mono text-[26px] font-medium tracking-tight text-ink">
            18 420&nbsp;€
          </p>
        </div>
        <span className="rounded-full bg-success-soft px-2.5 py-1 text-[12px] font-medium text-success-text">
          +9,2%
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-auto w-full">
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD}
            x2={W - PAD}
            y1={PAD + f * (H - PAD * 2)}
            y2={PAD + f * (H - PAD * 2)}
            stroke="var(--line)"
            strokeDasharray="2 5"
            strokeWidth="1"
          />
        ))}

        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--ink)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#revenue-fill)" />
        <path d={linePath} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />

        <circle cx={last.x} cy={last.y} r="5" fill="var(--canvas)" stroke="var(--ink)" strokeWidth="2.5" />
      </svg>
    </div>
  );
}
