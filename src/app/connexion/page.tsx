import type { Metadata } from "next";
import { Suspense } from "react";
import { ConnexionForm } from "@/components/sections/connexion-form";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace PilotResto.",
  robots: { index: false, follow: false },
};

export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionForm configured={isSupabaseConfigured()} />
    </Suspense>
  );
}
