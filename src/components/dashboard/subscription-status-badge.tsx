import { cn } from "@/lib/utils";
import type { AccessStatus } from "@/lib/supabase/types";

const labels: Record<AccessStatus, string> = {
  trial: "Essai",
  active: "Actif",
  past_due: "Paiement en retard",
  canceled: "Résilié",
  incomplete: "Incomplet",
};

const styles: Record<AccessStatus, string> = {
  trial: "bg-blue-soft text-blue-strong",
  active: "bg-success-soft text-success-text",
  past_due: "bg-danger-soft text-danger-text",
  canceled: "bg-canvas-alt text-ink-subtle",
  incomplete: "bg-danger-soft text-danger-text",
};

export function SubscriptionStatusBadge({ status }: { status: AccessStatus | null }) {
  if (!status) {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-canvas-alt px-3 py-1 text-[13px] font-medium text-ink-subtle">
        ❌ Inactif
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-3 py-1 text-[13px] font-medium",
        styles[status]
      )}
    >
      {status === "active" ? "✅ " : ""}
      {labels[status]}
    </span>
  );
}
