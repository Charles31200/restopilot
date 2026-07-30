"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";

// Indicative assumptions used only to illustrate an order of magnitude —
// never presented as a guarantee. Conservative on purpose: a modest margin
// gain from waste/pricing optimization, plus time saved on repetitive tasks
// valued at an average French loaded hourly labor cost.
const ESTIMATED_MARGIN_GAIN_RATE = 0.02;
const HOURLY_LABOR_COST_EUR = 16;

function formatEuros(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function RoiCalculator() {
  const [covers, setCovers] = useState(50);
  const [avgTicket, setAvgTicket] = useState(22);
  const [employees, setEmployees] = useState(5);

  const result = useMemo(() => {
    const monthlyRevenue = covers * avgTicket * 30;
    const annualRevenue = monthlyRevenue * 12;
    const marginGain = annualRevenue * ESTIMATED_MARGIN_GAIN_RATE;
    const hoursSavedPerWeek = 4 + Math.min(employees, 10) * 0.3;
    const laborSavings = hoursSavedPerWeek * 52 * HOURLY_LABOR_COST_EUR;

    return {
      hoursSavedPerWeek,
      annualGain: Math.round(marginGain + laborSavings),
    };
  }, [covers, avgTicket, employees]);

  return (
    <div className="rounded-(--radius-lg) border border-line bg-surface p-7 md:p-9">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-(--radius-sm) bg-ink text-ink-inverse">
          <Calculator size={16} />
        </span>
        <h3 className="font-display text-[19px] font-semibold text-ink">
          Estimez votre gain potentiel
        </h3>
      </div>
      <p className="mt-2 max-w-[520px] text-[13.5px] leading-[1.6] text-ink-muted">
        Exemple : un restaurant de 50 couverts par jour avec un ticket moyen
        de 22 € pourrait gagner jusqu&apos;à 12 400 € par an. Ajustez les
        valeurs ci-dessous pour votre établissement.
      </p>

      <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-muted">
            Couverts par jour
          </span>
          <Input
            type="number"
            min={0}
            value={covers}
            onChange={(e) => setCovers(Number(e.target.value) || 0)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-muted">
            Ticket moyen (€)
          </span>
          <Input
            type="number"
            min={0}
            value={avgTicket}
            onChange={(e) => setAvgTicket(Number(e.target.value) || 0)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-muted">
            Nombre d&apos;employés
          </span>
          <Input
            type="number"
            min={0}
            value={employees}
            onChange={(e) => setEmployees(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 border-t border-line pt-7 sm:grid-cols-2">
        <div>
          <span className="font-mono text-[28px] font-semibold tracking-tight text-ink">
            {result.hoursSavedPerWeek.toFixed(1)} h
          </span>
          <p className="mt-1 text-[13px] text-ink-muted">
            gagnées chaque semaine sur les tâches répétitives
          </p>
        </div>
        <div>
          <span className="font-mono text-[28px] font-semibold tracking-tight text-ink">
            {formatEuros(result.annualGain)}
          </span>
          <p className="mt-1 text-[13px] text-ink-muted">
            de gain annuel estimé (marge + temps gagné)
          </p>
        </div>
      </div>

      <p className="mt-6 text-[12px] text-ink-subtle">
        Estimation indicative basée sur des hypothèses moyennes, à titre
        illustratif — les résultats réels dépendent de votre établissement.
      </p>
    </div>
  );
}
