import type { Metadata } from "next";
import { ContactForm } from "@/components/sections/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez l'équipe PilotResto pour une démonstration ou toute question sur la plateforme.",
};

export default function ContactPage() {
  return <ContactForm />;
}
