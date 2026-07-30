import { Check, Minus } from "lucide-react";
import { COMPARISON_ROWS, type PricingPlan } from "@/lib/stripe/pricing-service";

function Cell({ value }: { value: PricingPlan["comparison"][string] | undefined }) {
  if (value === "premium") {
    return (
      <span className="text-[12.5px] font-semibold uppercase tracking-[0.04em] text-blue">
        Premium
      </span>
    );
  }
  if (value === "yes") {
    return <Check size={17} className="mx-auto text-ink" />;
  }
  return <Minus size={15} className="mx-auto text-ink-subtle" />;
}

export function ComparisonTable({ plans }: { plans: PricingPlan[] }) {
  if (plans.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-(--radius-lg) border border-line">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-canvas-alt">
            <th className="p-4 text-[13px] font-semibold text-ink-subtle">
              Fonctionnalité
            </th>
            {plans.map((plan) => (
              <th
                key={plan.productId}
                className="p-4 text-center text-[14px] font-semibold text-ink"
              >
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, index) => (
            <tr
              key={row.key}
              className={index % 2 === 0 ? "bg-surface" : "bg-canvas"}
            >
              <td className="p-4 text-[14px] text-ink-muted">{row.label}</td>
              {plans.map((plan) => (
                <td key={plan.productId} className="p-4 text-center">
                  <Cell value={plan.comparison[row.key]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
