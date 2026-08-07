import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionStatusBadge } from "@/components/dashboard/subscription-status-badge";
import { InvoiceList, type InvoiceRow } from "@/components/dashboard/invoice-list";
import { EditProfileForm } from "@/components/dashboard/edit-profile-form";
import { BillingPortalButtons } from "@/components/dashboard/billing-portal-buttons";
import { CheckoutBanner } from "@/components/pricing/checkout-banner";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { APP_URL } from "@/lib/auth";
import type { AccessStatus, ProfileRow, RestaurantRow } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Espace client",
  robots: { index: false, follow: false },
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    // Proxy already redirects here when Supabase isn't configured; this
    // only guards static generation, which can't know that.
    return (
      <p className="text-[15px] text-ink-muted">
        L&apos;espace client n&apos;est pas encore configuré.
      </p>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proxy already guarantees a session, but render defensively.
  if (!user) {
    return (
      <p className="text-[15px] text-ink-muted">
        Votre session a expiré.{" "}
        <Link href="/connexion" className="font-medium text-ink underline">
          Reconnectez-vous
        </Link>
        .
      </p>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<ProfileRow>();

  const { data: restaurant } = profile?.restaurant_id
    ? await supabase
        .from("restaurants")
        .select("*")
        .eq("id", profile.restaurant_id)
        .single<RestaurantRow>()
    : { data: null };

  if (!restaurant?.stripe_customer_id) {
    return (
      <div className="mx-auto max-w-[480px] text-center">
        <h1 className="font-display text-[22px] font-semibold text-ink">
          Aucun abonnement actif
        </h1>
        <p className="mt-2 text-[14.5px] text-ink-muted">
          Votre compte n&apos;est pas encore relié à un abonnement PilotResto.
        </p>
        <Button href="/subscribe" size="md" className="mt-6">
          Voir l&apos;offre
        </Button>
      </div>
    );
  }

  let liveStatus: AccessStatus | null = restaurant.access_status;
  let currentPeriodEnd = restaurant.trial_ends_at;
  const plan = restaurant.plan_id;
  let cancelAtPeriodEnd = false;
  let invoices: InvoiceRow[] = [];

  try {
    const stripe = getStripeClient();

    if (restaurant.stripe_subscription_id) {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        restaurant.stripe_subscription_id
      );
      cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
      currentPeriodEnd = stripeSubscription.items.data[0]?.current_period_end
        ? new Date(stripeSubscription.items.data[0].current_period_end * 1000).toISOString()
        : null;
      if (stripeSubscription.status === "active") {
        liveStatus = "active";
      }
    }

    const invoiceList = await stripe.invoices.list({
      customer: restaurant.stripe_customer_id,
      limit: 12,
    });
    invoices = invoiceList.data.map((invoice) => ({
      id: invoice.id ?? invoice.number ?? crypto.randomUUID(),
      number: invoice.number,
      createdAt: new Date(invoice.created * 1000).toISOString(),
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      hostedUrl: invoice.hosted_invoice_url ?? null,
      pdfUrl: invoice.invoice_pdf ?? null,
    }));
  } catch (err) {
    console.error("Failed to load live Stripe data for dashboard:", err);
  }

  const needsReactivation =
    liveStatus === "canceled" || liveStatus === "past_due" || liveStatus === "incomplete";

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-ink">
          Mon espace client
        </h1>
        <p className="text-[14.5px] text-ink-muted">{user.email}</p>
      </div>

      <Suspense fallback={null}>
        <CheckoutBanner />
      </Suspense>

      {needsReactivation && (
        <div className="flex items-start gap-3 rounded-(--radius-md) border border-danger-text/20 bg-danger-soft px-5 py-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger-text" />
          <div>
            <p className="text-[14px] font-medium text-danger-text">
              {liveStatus === "past_due"
                ? "Votre dernier paiement a échoué."
                : "Votre abonnement n'est plus actif."}
            </p>
            <p className="mt-1 text-[13.5px] text-danger-text/90">
              Réactivez votre abonnement pour retrouver l&apos;accès à
              PilotResto.
            </p>
          </div>
        </div>
      )}

      <section className="rounded-(--radius-lg) border border-line bg-surface p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
              Abonnement
            </span>
            <h2 className="mt-2 font-display text-[19px] font-semibold text-ink">
              {plan ?? "PilotResto Pro"}
            </h2>
            <div className="mt-2">
              <SubscriptionStatusBadge status={liveStatus} />
            </div>
          </div>
          <Button href={APP_URL} external size="md" variant="secondary">
            Ouvrir l&apos;application
            <ArrowUpRight size={15} />
          </Button>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-[12.5px] text-ink-subtle">
              {cancelAtPeriodEnd ? "Se termine le" : "Prochain renouvellement"}
            </dt>
            <dd className="mt-1 text-[14.5px] font-medium text-ink">
              {formatDate(currentPeriodEnd)}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] text-ink-subtle">Restaurant</dt>
            <dd className="mt-1 text-[14.5px] font-medium text-ink">
              {restaurant.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] text-ink-subtle">Date d&apos;inscription</dt>
            <dd className="mt-1 text-[14.5px] font-medium text-ink">
              {formatDate(profile?.created_at ?? null)}
            </dd>
          </div>
        </dl>

        {cancelAtPeriodEnd && (
          <p className="mt-6 text-[13.5px] text-ink-muted">
            Résiliation programmée — l&apos;abonnement restera actif jusqu&apos;à
            cette date.
          </p>
        )}
      </section>

      <section className="rounded-(--radius-lg) border border-line bg-surface p-7">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
          Facturation
        </span>
        <div className="mt-5">
          <BillingPortalButtons />
        </div>
      </section>

      <section className="rounded-(--radius-lg) border border-line bg-surface p-7">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
          Mes informations
        </span>
        <div className="mt-5">
          <EditProfileForm
            firstName={profile?.first_name ?? null}
            lastName={profile?.last_name ?? null}
            restaurantName={restaurant.name}
          />
        </div>
      </section>

      <section className="rounded-(--radius-lg) border border-line bg-surface p-7">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
          Historique des factures
        </span>
        <div className="mt-5">
          <InvoiceList invoices={invoices} />
        </div>
      </section>
    </div>
  );
}
