import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Adresse email invalide."),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * PilotResto's actual product (authentication, dashboard, data) lives in a
 * separate application at this domain. The marketing site never handles
 * real credentials itself — /login and /forgot-password validate the form,
 * then hand off to the real app once a backend is connected.
 */
export const APP_URL = "https://app.pilotresto.pro";

/**
 * Hands off to the real app's login screen, pre-filling the email the
 * visitor already typed. No credentials ever travel through this redirect.
 */
export function redirectToAppLogin(email: string) {
  window.location.href = `${APP_URL}/login?email=${encodeURIComponent(email)}`;
}
