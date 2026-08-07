import type { Metadata } from "next";
import { SignupForm } from "@/components/sections/signup-form";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Créez votre compte PilotResto pour souscrire à l'abonnement.",
  robots: { index: false, follow: false },
};

export default function InscriptionPage() {
  return <SignupForm configured={isSupabaseConfigured()} />;
}
