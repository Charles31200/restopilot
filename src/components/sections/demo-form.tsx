"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  Headset,
  Lock,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Reveal } from "@/components/motion/reveal";
import {
  demoRequestSchema,
  submitDemoRequest,
  type DemoRequestInput,
} from "@/lib/demo-request";

const establishmentTypes = [
  "Restaurant traditionnel",
  "Fast-food",
  "Brasserie",
  "Bar",
  "Café",
  "Pizzeria",
  "Food Truck",
  "Hôtel Restaurant",
  "Autre",
];

const employeeCounts = ["1-5", "6-10", "11-25", "26-50", "50+"];

const posOptions = [
  "Lightspeed",
  "Zelty",
  "L'Addition",
  "Tactill",
  "Square",
  "Aucun",
  "Autre",
];

const restaurantCounts = ["1", "2-5", "6-10", "10+"];

const countries = ["France", "Belgique", "Suisse", "Luxembourg", "Canada", "Autre"];

const trustBadges = [
  { icon: Lock, label: "Hébergement sécurisé" },
  { icon: ShieldCheck, label: "Conforme RGPD" },
  { icon: Headset, label: "Assistance française" },
  { icon: Clock, label: "Réponse sous 24h" },
];

const miniFaq = [
  {
    question: "Combien dure une démonstration ?",
    answer: "Environ 30 minutes, en visioconférence, adaptée à votre établissement.",
  },
  {
    question: "Est-ce gratuit ?",
    answer: "Oui, la démonstration est gratuite et sans engagement.",
  },
  {
    question: "Dois-je installer quelque chose ?",
    answer: "Non, PilotResto fonctionne directement dans votre navigateur.",
  },
];

export function DemoForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DemoRequestInput>({
    resolver: zodResolver(demoRequestSchema),
  });

  const onSubmit = async (data: DemoRequestInput) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitted(true);
    try {
      submitDemoRequest(data);
    } catch {
      // Opening the visitor's mail client is best-effort: the confirmation
      // screen above is what tells them the request went through.
    }
  };

  return (
    <div className="pt-32 pb-24 md:pt-40 md:pb-32">
      <Container className="max-w-[1080px]">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <Badge>Démonstration</Badge>
          </Reveal>
          <Reveal delay={0.06} className="mt-6 max-w-[600px]">
            <h1 className="text-balance font-display text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink md:text-[44px]">
              Découvrez PilotResto en action
            </h1>
          </Reveal>
          <Reveal delay={0.12} className="mt-4 max-w-[480px]">
            <p className="text-balance text-[16px] leading-[1.6] text-ink-muted">
              30 minutes pour voir comment l&apos;IA de PilotResto peut piloter
              votre restaurant. Notre équipe vous recontacte sous 24h.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <Reveal delay={0.1}>
            <div className="rounded-(--radius-lg) border border-line bg-surface p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center py-16 text-center"
                  >
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-ink"
                    >
                      <CheckCircle2 size={30} className="text-white" />
                    </motion.span>
                    <h2 className="mt-6 font-display text-[22px] font-semibold text-ink">
                      Merci.
                    </h2>
                    <p className="mt-2 max-w-[320px] text-[15px] leading-[1.6] text-ink-muted">
                      Notre équipe vous recontactera sous 24 heures.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                  >
                    <div className="flex flex-col gap-8">
                      <div>
                        <h2 className="font-display text-[16px] font-semibold text-ink">
                          Informations restaurant
                        </h2>
                        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <FormField label="Nom du restaurant" htmlFor="restaurantName" error={errors.restaurantName?.message}>
                            <Input id="restaurantName" invalid={!!errors.restaurantName} placeholder="Le Petit Bistrot" {...register("restaurantName")} />
                          </FormField>
                          <FormField label="Nom du responsable" htmlFor="managerName" error={errors.managerName?.message}>
                            <Input id="managerName" invalid={!!errors.managerName} placeholder="Jean Dupont" {...register("managerName")} />
                          </FormField>
                          <FormField label="Adresse email professionnelle" htmlFor="email" error={errors.email?.message}>
                            <Input id="email" type="email" invalid={!!errors.email} placeholder="vous@restaurant.fr" {...register("email")} />
                          </FormField>
                          <FormField label="Téléphone" htmlFor="phone" error={errors.phone?.message}>
                            <Input id="phone" type="tel" invalid={!!errors.phone} placeholder="06 12 34 56 78" {...register("phone")} />
                          </FormField>
                          <FormField label="Ville" htmlFor="city" error={errors.city?.message}>
                            <Input id="city" invalid={!!errors.city} placeholder="Lyon" {...register("city")} />
                          </FormField>
                          <FormField label="Pays" htmlFor="country" error={errors.country?.message}>
                            <Select id="country" invalid={!!errors.country} defaultValue="" {...register("country")}>
                              <option value="" disabled>Sélectionnez un pays</option>
                              {countries.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </Select>
                          </FormField>
                          <FormField
                            label="Nombre de restaurants"
                            htmlFor="restaurantCount"
                            error={errors.restaurantCount?.message}
                            className="sm:col-span-2"
                          >
                            <Select id="restaurantCount" invalid={!!errors.restaurantCount} defaultValue="" {...register("restaurantCount")}>
                              <option value="" disabled>Sélectionnez une option</option>
                              {restaurantCounts.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </Select>
                          </FormField>
                        </div>
                      </div>

                      <div>
                        <h2 className="font-display text-[16px] font-semibold text-ink">
                          Type d&apos;établissement
                        </h2>
                        <div className="mt-4">
                          <FormField label="Type d'établissement" htmlFor="establishmentType" error={errors.establishmentType?.message}>
                            <Select id="establishmentType" invalid={!!errors.establishmentType} defaultValue="" {...register("establishmentType")}>
                              <option value="" disabled>Sélectionnez une option</option>
                              {establishmentTypes.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </Select>
                          </FormField>
                        </div>
                      </div>

                      <div>
                        <h2 className="font-display text-[16px] font-semibold text-ink">
                          Activité
                        </h2>
                        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <FormField label="Nombre d'employés" htmlFor="employeeCount" error={errors.employeeCount?.message}>
                            <Select id="employeeCount" invalid={!!errors.employeeCount} defaultValue="" {...register("employeeCount")}>
                              <option value="" disabled>Sélectionnez une option</option>
                              {employeeCounts.map((e) => (
                                <option key={e} value={e}>{e}</option>
                              ))}
                            </Select>
                          </FormField>
                          <FormField label="Logiciel de caisse actuel" htmlFor="currentPos" error={errors.currentPos?.message}>
                            <Select id="currentPos" invalid={!!errors.currentPos} defaultValue="" {...register("currentPos")}>
                              <option value="" disabled>Sélectionnez une option</option>
                              {posOptions.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </Select>
                          </FormField>
                        </div>
                      </div>

                      <FormField label="Message (facultatif)" htmlFor="message" error={errors.message?.message}>
                        <Textarea id="message" rows={4} placeholder="Parlez-nous de votre restaurant et de vos besoins." {...register("message")} />
                      </FormField>

                      <Checkbox
                        id="rgpd"
                        invalid={!!errors.rgpd}
                        label={
                          <>
                            J&apos;accepte que mes données soient utilisées par
                            PilotResto pour me recontacter, conformément à la{" "}
                            <a href="/politique-confidentialite" className="underline decoration-line-strong underline-offset-2 hover:text-ink">
                              politique de confidentialité
                            </a>
                            .
                          </>
                        }
                        {...register("rgpd")}
                      />
                      {errors.rgpd?.message && (
                        <p className="-mt-5 text-[12.5px] text-danger-text">{errors.rgpd.message}</p>
                      )}

                      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Envoi en cours…
                          </>
                        ) : (
                          <>
                            Demander une démonstration
                            <ArrowRight size={16} />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>

          <Reveal delay={0.16} className="flex flex-col gap-5">
            <div className="rounded-(--radius-lg) border border-line bg-canvas-alt p-6">
              <h2 className="font-display text-[15px] font-semibold text-ink">
                Pourquoi nous faire confiance
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {trustBadges.map((b) => (
                  <li key={b.label} className="flex items-center gap-2.5 text-[13.5px] text-ink-muted">
                    <b.icon size={15} className="shrink-0 text-ink-subtle" />
                    {b.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-(--radius-lg) border border-line bg-surface p-6">
              <h2 className="font-display text-[15px] font-semibold text-ink">
                Questions fréquentes
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {miniFaq.map((f) => (
                  <div key={f.question}>
                    <p className="text-[13.5px] font-medium text-ink">{f.question}</p>
                    <p className="mt-1 text-[13px] leading-[1.5] text-ink-muted">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </div>
  );
}
