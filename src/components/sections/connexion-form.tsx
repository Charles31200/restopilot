"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { GoogleIcon } from "@/components/ui/google-icon";
import { AppleIcon } from "@/components/ui/apple-icon";
import { Reveal } from "@/components/motion/reveal";
import { loginSchema, type LoginInput } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast-provider";

export function ConnexionForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("toast") === "logout") {
      toast("Déconnexion réussie", "info");
      router.replace("/connexion");
    }
  }, [searchParams, toast, router]);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        setFormError(
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect."
            : error.message
        );
        return;
      }
      toast("Connexion réussie", "success");
      router.push("/dashboard");
      router.refresh();
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
        options: { redirectTo: `${window.location.origin}/auth/callback` },
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
            Le pilotage de votre restaurant, partout où vous êtes.
          </h1>
          <p className="mt-4 text-[15px] leading-[1.6] text-[#a1a1aa]">
            Retrouvez votre abonnement, vos factures et l&apos;accès à
            l&apos;application depuis votre espace client.
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

          <h2 className="font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">
            Se connecter
          </h2>
          <p className="mt-2 text-[14.5px] text-ink-muted">
            Accédez à votre espace PilotResto.
          </p>

          {!configured && (
            <p className="mt-6 rounded-(--radius-sm) bg-canvas-alt px-3.5 py-2.5 text-[13px] text-ink-subtle">
              La connexion n&apos;est pas encore configurée.
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

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-5">
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
                autoComplete="current-password"
                invalid={!!errors.password}
                placeholder="••••••••"
                disabled={!configured}
                {...register("password")}
              />
            </FormField>

            {formError && (
              <p className="rounded-(--radius-sm) bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger-text">
                {formError}
              </p>
            )}

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!configured || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connexion…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-[13.5px] text-ink-muted">
            Pas encore de compte ?{" "}
            <Link
              href="/inscription"
              className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-blue"
            >
              Créer un compte
            </Link>
          </p>
        </Reveal>
      </div>
    </div>
  );
}
