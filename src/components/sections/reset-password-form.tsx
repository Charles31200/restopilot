"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { Reveal } from "@/components/motion/reveal";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordInput) => {
    setFormError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) {
        setFormError(error.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError(
        "Le lien de réinitialisation a expiré ou est invalide. Refaites une demande."
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <Reveal className="w-full max-w-[380px]">
        <Link href="/" className="mb-10 flex w-fit">
          <Logo />
        </Link>

        <h1 className="font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">
          Nouveau mot de passe
        </h1>
        <p className="mt-2 text-[14.5px] text-ink-muted">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-5">
          <FormField label="Nouveau mot de passe" htmlFor="password" error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              invalid={!!errors.password}
              placeholder="••••••••"
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
              {...register("confirmPassword")}
            />
          </FormField>

          {formError && (
            <p className="rounded-(--radius-sm) bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger-text">
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                Enregistrer
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
      </Reveal>
    </div>
  );
}
