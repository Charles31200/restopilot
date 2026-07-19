import {
  Boxes,
  Workflow,
  BarChart3,
  Plug,
  ShoppingBag,
  LayoutGrid,
  Users,
  Truck,
  CheckCircle2,
  Circle,
  CreditCard,
  CalendarClock,
  Calculator,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { features } from "@/content/site";
import { cn } from "@/lib/utils";

const icons = [Boxes, Workflow, BarChart3, Plug];

const bars = [40, 65, 50, 78, 60, 92, 70];

function CentralizeIllustration() {
  const items = [
    { icon: ShoppingBag, label: "Commandes" },
    { icon: LayoutGrid, label: "Salle" },
    { icon: Users, label: "Équipes" },
    { icon: Truck, label: "Fournisseurs" },
  ];
  return (
    <div className="grid h-full grid-cols-2 gap-3 p-6">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex flex-col items-center justify-center gap-2 rounded-(--radius-md) border border-line bg-surface py-6"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) bg-accent-soft text-accent-text">
            <it.icon size={16} />
          </span>
          <span className="text-[12px] font-medium text-ink-muted">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function AutomateIllustration() {
  const items = [
    { label: "Commande reçue", done: true },
    { label: "Ticket envoyé en cuisine", done: true },
    { label: "Stock mis à jour", done: false },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-6">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-center gap-3 rounded-(--radius-md) border border-line bg-surface px-4 py-3"
        >
          {it.done ? (
            <CheckCircle2 size={16} className="shrink-0 text-accent-text" />
          ) : (
            <Circle size={16} className="shrink-0 text-ink-subtle" />
          )}
          <span
            className={cn(
              "text-[13px] font-medium",
              it.done ? "text-ink" : "text-ink-subtle"
            )}
          >
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function AnalyzeIllustration() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-6">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[26px] font-medium text-ink">18 420 €</span>
        <span className="text-[12px] font-medium text-success-text">+9,2%</span>
      </div>
      <div className="flex h-20 items-end gap-2">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-[3px] bg-gradient-to-t from-accent/25 to-accent"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ConnectIllustration() {
  const tools = [
    { icon: CreditCard, label: "Caisse" },
    { icon: CalendarClock, label: "Réservation" },
    { icon: Calculator, label: "Comptabilité" },
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
      {tools.map((tool) => (
        <div
          key={tool.label}
          className="flex w-full max-w-[220px] items-center gap-3 rounded-full border border-line bg-surface py-2.5 pl-2.5 pr-4"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent-text">
            <tool.icon size={13} />
          </span>
          <span className="text-[13px] font-medium text-ink">{tool.label}</span>
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-success-text" />
        </div>
      ))}
    </div>
  );
}

const illustrations = [
  CentralizeIllustration,
  AutomateIllustration,
  AnalyzeIllustration,
  ConnectIllustration,
];

export function Features() {
  return (
    <section id="fonctionnalites" className="border-t border-line py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Fonctionnalités"
          title="Une plateforme complète, pensée pour le terrain"
          subtitle="Quatre piliers pour reprendre le contrôle du quotidien de votre restaurant."
        />

        <div className="mt-16 flex flex-col gap-16 md:gap-24">
          {features.map((feature, i) => {
            const Icon = icons[i] ?? Boxes;
            const Illustration = illustrations[i] ?? CentralizeIllustration;
            const reversed = i % 2 === 1;
            return (
              <div
                key={feature.title}
                className={cn(
                  "grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16",
                  reversed && "md:[&>*:first-child]:order-2"
                )}
              >
                <Reveal>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-(--radius-md) bg-ink text-ink-inverse">
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-5 font-display text-[24px] font-semibold tracking-[-0.01em] text-ink md:text-[28px]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-[420px] text-[15.5px] leading-[1.65] text-ink-muted">
                    {feature.description}
                  </p>
                </Reveal>
                <Reveal delay={0.08}>
                  <div className="h-[280px] overflow-hidden rounded-(--radius-xl) border border-line bg-canvas-alt">
                    <Illustration />
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
