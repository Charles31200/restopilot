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

export const signupSchema = z
  .object({
    email: z.string().email("Adresse email invalide."),
    password: z.string().min(8, "8 caractères minimum."),
    confirmPassword: z.string().min(1, "Confirmation requise."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "8 caractères minimum."),
    confirmPassword: z.string().min(1, "Confirmation requise."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * PilotResto's product (POS, planning, stock, etc.) is used inside a
 * separate application at this domain. The marketing site owns account
 * creation, billing and login (via Supabase); once signed in, customers are
 * offered a link to open the real app from their dashboard.
 */
export const APP_URL = "https://app.pilotresto.pro";
