import type { Metadata } from "next";
import { DemoForm } from "@/components/sections/demo-form";

export const metadata: Metadata = {
  title: "Demander une démonstration",
  description:
    "Réservez une démonstration de PilotResto et découvrez comment l'IA peut piloter votre restaurant.",
};

export default function DemoPage() {
  return <DemoForm />;
}
