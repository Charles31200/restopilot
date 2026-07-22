import { z } from "zod";
import { site } from "@/content/site";

export const demoRequestSchema = z.object({
  restaurantName: z.string().min(2, "Indiquez le nom de votre restaurant."),
  managerName: z.string().min(2, "Indiquez votre nom."),
  email: z.string().email("Adresse email invalide."),
  phone: z.string().min(8, "Numéro de téléphone invalide."),
  city: z.string().min(2, "Indiquez votre ville."),
  country: z.string().min(1, "Sélectionnez un pays."),
  restaurantCount: z.string().min(1, "Sélectionnez une option."),
  establishmentType: z.string().min(1, "Sélectionnez une option."),
  employeeCount: z.string().min(1, "Sélectionnez une option."),
  currentPos: z.string().min(1, "Sélectionnez une option."),
  message: z.string().optional(),
  rgpd: z.literal(true, {
    error: "Vous devez accepter la politique de confidentialité.",
  }),
});

export type DemoRequestInput = z.infer<typeof demoRequestSchema>;

/**
 * Submits a demo request.
 *
 * Current behaviour: opens the visitor's email client with a pre-filled
 * message, the same no-backend pattern used by the contact form.
 *
 * Future integration path (not yet wired up):
 * 1. Replace this with a Server Action that inserts the payload into a
 *    Supabase `demo_requests` table.
 * 2. From that Server Action, trigger a transactional email to the prospect
 *    (confirmation) and an internal notification to the PilotResto team
 *    (e.g. via Resend + a Slack webhook or a notifications table).
 * 3. Keep this function's signature stable so the form component doesn't
 *    need to change when the backend lands.
 */
export function submitDemoRequest(data: DemoRequestInput) {
  const subject = `Nouvelle demande de démonstration — ${data.restaurantName}`;
  const body = [
    `Restaurant : ${data.restaurantName}`,
    `Responsable : ${data.managerName}`,
    `Email : ${data.email}`,
    `Téléphone : ${data.phone}`,
    `Ville : ${data.city}`,
    `Pays : ${data.country}`,
    `Nombre de restaurants : ${data.restaurantCount}`,
    `Type d'établissement : ${data.establishmentType}`,
    `Nombre d'employés : ${data.employeeCount}`,
    `Logiciel de caisse actuel : ${data.currentPos}`,
    "",
    "Message :",
    data.message || "—",
  ].join("\n");

  const mailto = `mailto:${site.contactEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  window.location.href = mailto;
}
