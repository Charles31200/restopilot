"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/motion/reveal";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/auth";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <Reveal className="w-full max-w-[380px]">
        <Link href="/" className="mb-10 flex w-fit">
          <Logo />
        </Link>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center py-6 text-center"
            >
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-ink"
              >
                <CheckCircle2 size={26} className="text-white" />
              </motion.span>
              <h1 className="mt-6 font-display text-[20px] font-semibold text-ink">
                Email envoyé
              </h1>
              <p className="mt-2 max-w-[300px] text-[14.5px] leading-[1.6] text-ink-muted">
                Si un compte existe avec cette adresse, vous recevrez un lien
                de réinitialisation sous quelques minutes.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink transition-colors hover:text-blue"
              >
                <ArrowLeft size={14} />
                Retour à la connexion
              </Link>
            </motion.div>
          ) : (
            <motion.div key="form">
              <h1 className="font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">
                Mot de passe oublié
              </h1>
              <p className="mt-2 text-[14.5px] text-ink-muted">
                Indiquez votre email, nous vous enverrons un lien de
                réinitialisation.
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

                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    <>
                      Envoyer
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </form>

              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                <ArrowLeft size={14} />
                Retour à la connexion
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </Reveal>
    </div>
  );
}
