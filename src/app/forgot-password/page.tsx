import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/sections/forgot-password-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Réinitialisez le mot de passe de votre compte PilotResto.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
