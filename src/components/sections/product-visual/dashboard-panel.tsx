import { TrendingUp, Users, Wallet } from "lucide-react";

const bars = [38, 52, 44, 61, 58, 72, 66, 80, 74, 90, 84, 96];

const kpis = [
  { icon: Wallet, label: "CA du jour", value: "3 240 €", trend: "+12,4%" },
  { icon: TrendingUp, label: "Marge brute", value: "67,3 %", trend: "+2,1 pt" },
  { icon: Users, label: "Équipe en salle", value: "6 / 8", trend: "à l'heure" },
];

export function DashboardPanel() {
  return (
    <div className="grid gap-4 bg-canvas-alt p-5 sm:p-7">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-(--radius-md) border border-line bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-(--radius-sm) bg-accent-soft text-accent-text">
                <kpi.icon size={15} />
              </span>
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success-text">
                {kpi.trend}
              </span>
            </div>
            <div className="mt-3 font-mono text-[22px] font-medium tracking-tight text-ink">
              {kpi.value}
            </div>
            <div className="text-[12px] text-ink-subtle">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-(--radius-md) border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] font-medium text-ink-muted">
            Chiffre d&apos;affaires — 12 derniers services
          </span>
          <span className="text-[12px] text-ink-subtle">Cette semaine</span>
        </div>
        <div className="flex h-28 items-end gap-2">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[3px] bg-gradient-to-t from-accent/30 to-accent"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
