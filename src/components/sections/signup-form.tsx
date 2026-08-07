"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { GoogleIcon } from "@/components/ui/google-icon";
import { AppleIcon } from "@/components/ui/apple-icon";
import { Reveal } from "@/components/motion/reveal";
import { signupSchema, type SignupInput } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast-provider";

export function SignupForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data: SignupInput) => {
    setFormError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=/subscribe` },
      });

      if (error) {
        setFormError(
          error.message === "User already registered"
            ? "Un compte existe déjà avec cet email."
            : error.message
        );
        return;
      }

      if (signUpData.session) {
        toast("Compte créé", "success");
        router.push("/subscribe");
        router.refresh();
        return;
      }

      setNeedsEmailConfirmation(true);
    } catch {
      setFormError("Une erreur est survenue. Réessayez dans un instant.");
    }
  };

  async function handleOAuth(provider: "google" | "apple") {
    setFormError(null);
    setOauthLoading(provider);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback?redirect_to=/subscribe` },
      });
      if (error) {
        setFormError(error.message);
        setOauthLoading(null);
      }
    } catch {
      setFormError("Une erreur est survenue. Réessayez dans un instant.");
      setOauthLoading(null);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/[0.06] blur-[120px]"
        />
        <Link href="/" className="relative w-fit">
          <Logo inverted />
        </Link>

        <div className="relative max-w-[420px]">
          <h1 className="text-balance font-display text-[32px] font-semibold leading-[1.2] tracking-[-0.02em]">
            Rejoignez les restaurateurs qui pilotent avec PilotResto.
          </h1>
          <p className="mt-4 text-[15px] leading-[1.6] text-[#a1a1aa]">
            Créez votre compte, puis souscrivez à l&apos;abonnement en
            quelques secondes.
          </p>
        </div>

        <p className="relative text-[13px] text-[#a1a1aa]">
          © {new Date().getFullYear()} PilotResto
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <Reveal className="w-full max-w-[380px]">
          <Link href="/" className="mb-10 flex w-fit lg:hidden">
            <Logo />
          </Link>

          {needsEmailConfirmation ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink">
                <CheckCircle2 size={26} className="text-white" />
              </span>
              <h1 className="mt-6 font-display text-[20px] font-semibold text-ink">
                Vérifiez votre email
              </h1>
              <p className="mt-2 max-w-[300px] text-[14.5px] leading-[1.6] text-ink-muted">
                Confirmez votre adresse email pour activer votre compte, puis
                connectez-vous pour souscrire à l&apos;abonnement.
              </p>
              <Link
                href="/connexion"
                className="mt-6 text-[13.5px] font-medium text-ink hover:text-blue"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">
                Créer un compte
              </h2>
              <p className="mt-2 text-[14.5px] text-ink-muted">
                Puis souscrivez à PilotResto Pro en quelques secondes.
              </p>

              {!configured && (
                <p className="mt-6 rounded-(--radius-sm) bg-canvas-alt px-3.5 py-2.5 text-[13px] text-ink-subtle">
                  L&apos;inscription n&apos;est pas encore configurée.
                </p>
              )}

              <div className="mt-7 flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={!configured || oauthLoading !== null}
                  onClick={() => handleOAuth("google")}
                  className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-(--radius-sm) border border-line-strong text-[14px] font-medium text-ink transition-colors hover:border-ink disabled:opacity-50"
                >
                  {oauthLoading === "google" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <GoogleIcon size={16} />
                  )}
                  Continuer avec Google
                </button>
                <button
                  type="button"
                  disabled={!configured || oauthLoading !== null}
                  onClick={() => handleOAuth("apple")}
                  className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-(--radius-sm) border border-line-strong text-[14px] font-medium text-ink transition-colors hover:border-ink disabled:opacity-50"
                >
                  {oauthLoading === "apple" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <AppleIcon size={16} />
                  )}
                  Continuer avec Apple
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3 text-[12.5px] text-ink-subtle">
                <span className="h-px flex-1 bg-line" />
                ou
                <span className="h-px flex-1 bg-line" />
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="mt-6 flex flex-col gap-5"
              >
                <FormField label="Email" htmlFor="email" error={errors.email?.message}>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    invalid={!!errors.email}
                    placeholder="vous@restaurant.fr"
                    disabled={!configured}
                    {...register("email")}
                  />
                </FormField>

                <FormField label="Mot de passe" htmlFor="password" error={errors.password?.message}>
                  <PasswordInput
                    id="password"
                    autoComplete="new-password"
                    invalid={!!errors.password}
                    placeholder="••••••••"
                    disabled={!configured}
                    {...register("password")}
                  />
                </FormField>

                <FormField
                  label="Confirmer le mot de passe"
                  htmlFor="confirmPassword"
                  error={errors.confirmPassword?.message}
                >
                  <PasswordInput
                    id="confirmPassword"
                    autoComplete="new-password"
                    invalid={!!errors.confirmPassword}
                    placeholder="••••••••"
                    disabled={!configured}
                    {...register("confirmPassword")}
                  />
                </FormField>

                {formError && (
                  <p className="rounded-(--radius-sm) bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger-text">
                    {formError}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={!configured || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Création…
                    </>
                  ) : (
                    <>
                      Créer mon compte
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-8 text-center text-[13.5px] text-ink-muted">
                Déjà un compte ?{" "}
                <Link
                  href="/connexion"
                  className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-blue"
                >
                  Se connecter
                </Link>
              </p>
            </>
          )}
        </Reveal>
      </div>
    </div>
  );
}
