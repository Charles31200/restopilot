"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Clock, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Reveal } from "@/components/motion/reveal";
import { loginSchema, redirectToAppLogin, type LoginInput } from "@/lib/auth";

const stats = [
  { icon: Clock, value: "Jusqu'à 6h", label: "gagnées chaque semaine" },
  { icon: TrendingUp, value: "+12%", label: "de marge potentielle" },
  { icon: Sparkles, value: "24/7", label: "analyse continue par l'IA" },
];

export function LoginForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    await new Promise((resolve) => setTimeout(resolve, 500));
    redirectToAppLogin(data.email);
  };

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
            Retrouvez votre tableau de bord, vos équipes et vos performances
            en un instant.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-2 border-t border-white/10 pt-4">
                <stat.icon size={16} className="text-white/60" />
                <span className="font-mono text-[18px] font-medium">{stat.value}</span>
                <span className="text-[11.5px] leading-[1.4] text-[#a1a1aa]">{stat.label}</span>
              </div>
            ))}
          </div>
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

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-5">
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                invalid={!!errors.email}
                placeholder="vous@restaurant.fr"
                {...register("email")}
              />
            </FormField>

            <FormField label="Mot de passe" htmlFor="password" error={errors.password?.message}>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                invalid={!!errors.password}
                placeholder="••••••••"
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

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
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
            <Link href="/demo" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-blue">
              Demander une démonstration
            </Link>
          </p>
        </Reveal>
      </div>
    </div>
  );
}
