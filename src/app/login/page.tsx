import type { Metadata } from "next";
import { LoginForm } from "@/components/sections/login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace PilotResto.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
