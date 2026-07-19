import { ShoppingBag, CalendarCheck, PackageX } from "lucide-react";

const notifications = [
  {
    icon: ShoppingBag,
    title: "Nouvelle commande — Table 4",
    time: "à l'instant",
  },
  {
    icon: CalendarCheck,
    title: "Réservation confirmée — 20h30",
    time: "il y a 4 min",
  },
  {
    icon: PackageX,
    title: "Stock faible — Tomates",
    time: "il y a 12 min",
  },
];

export function NotificationsPanel() {
  return (
    <div className="flex flex-col gap-2.5 bg-canvas-alt p-3">
      {notifications.map((n) => (
        <div
          key={n.title}
          className="flex items-start gap-3 rounded-(--radius-md) border border-line bg-surface p-3"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-(--radius-sm) bg-accent-soft text-accent-text">
            <n.icon size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium leading-[1.4] text-ink">
              {n.title}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-subtle">{n.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
