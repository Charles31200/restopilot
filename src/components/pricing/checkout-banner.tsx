"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

export function CheckoutBanner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("checkout");

  if (status !== "success" && status !== "cancel") return null;

  if (status === "success") {
    return (
      <div className="mx-auto mb-10 flex max-w-[560px] items-center gap-2.5 rounded-(--radius-md) bg-success-soft px-4 py-3 text-[14px] text-success-text">
        <CheckCircle2 size={18} className="shrink-0" />
        Paiement réussi — votre abonnement PilotResto Pro est actif. Un
        email de confirmation vous a été envoyé.
      </div>
    );
  }

  return (
    <div className="mx-auto mb-10 flex max-w-[560px] items-center gap-2.5 rounded-(--radius-md) bg-danger-soft px-4 py-3 text-[14px] text-danger-text">
      <XCircle size={18} className="shrink-0" />
      Le paiement a été annulé, aucun montant n&apos;a été prélevé.
    </div>
  );
}
