import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/sections/reset-password-form";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  description: "Définissez un nouveau mot de passe pour votre compte PilotResto.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
