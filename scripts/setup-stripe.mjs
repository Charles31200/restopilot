// One-off setup script: creates the single PilotResto Product/Price and the
// webhook endpoint this integration expects (see src/lib/stripe/pricing-service.ts
// and src/app/api/stripe/webhook/route.ts). Safe to re-run — it skips
// creation of anything that already exists.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_... node scripts/setup-stripe.mjs
// or add STRIPE_SECRET_KEY to .env.local and just run:
//   node scripts/setup-stripe.mjs
//
// Optional env overrides:
//   STRIPE_PLAN_AMOUNT_CENTS=2900   (default: 2900 = 29,00 €)
//   STRIPE_PLAN_CURRENCY=eur        (default: eur)
//   SITE_URL=https://restopilot.pro (default: production URL — used for the webhook)

import { readFileSync, existsSync } from "node:fs";
import Stripe from "stripe";

function loadDotEnvLocal() {
  const path = new URL("../.env.local", import.meta.url);
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnvLocal();

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error(
    "STRIPE_SECRET_KEY is not set. Add it to .env.local or pass it inline:\n" +
      "  STRIPE_SECRET_KEY=sk_... node scripts/setup-stripe.mjs"
  );
  process.exit(1);
}

const amount = Number(process.env.STRIPE_PLAN_AMOUNT_CENTS ?? "2900");
const currency = process.env.STRIPE_PLAN_CURRENCY ?? "eur";
const siteUrl = process.env.SITE_URL ?? "https://restopilot.pro";
const webhookUrl = `${siteUrl.replace(/\/$/, "")}/api/stripe/webhook`;

const stripe = new Stripe(secretKey, { apiVersion: "2026-07-29.dahlia" });

const isTestMode = secretKey.startsWith("sk_test_");
console.log(`Stripe mode: ${isTestMode ? "TEST" : "LIVE"}`);
if (!isTestMode) {
  console.log("⚠️  This key is LIVE — objects created below are real.");
}

async function findExistingProduct() {
  const products = await stripe.products.list({ active: true, limit: 100 });
  return products.data.find((p) => p.metadata.managed_by === "pilotresto-setup-script") ?? null;
}

async function ensureProductAndPrice() {
  let product = await findExistingProduct();

  if (product) {
    console.log(`✓ Product already exists: ${product.id} (${product.name})`);
  } else {
    product = await stripe.products.create({
      name: "PilotResto",
      description: "Le copilote IA conçu pour les restaurateurs.",
      marketing_features: [
        { name: "Gestion des commandes et de la salle" },
        { name: "Analyse IA de vos marges et performances" },
        { name: "Automatisation des tâches répétitives" },
        { name: "Connexion à vos outils existants" },
        { name: "Support français" },
      ],
      metadata: { managed_by: "pilotresto-setup-script", order: "1" },
    });
    console.log(`✓ Created product: ${product.id}`);
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 20 });
  let price = prices.data.find(
    (p) => p.recurring?.interval === "month" && p.unit_amount === amount && p.currency === currency
  );

  if (price) {
    console.log(`✓ Monthly price already exists: ${price.id}`);
  } else {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency,
      recurring: { interval: "month" },
    });
    console.log(`✓ Created monthly price: ${price.id} (${(amount / 100).toFixed(2)} ${currency.toUpperCase()}/mois)`);
  }

  if (product.default_price !== price.id) {
    await stripe.products.update(product.id, { default_price: price.id });
  }

  return { product, price };
}

async function ensureWebhook() {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((e) => e.url === webhookUrl);

  if (existing) {
    console.log(`✓ Webhook endpoint already exists for ${webhookUrl} (${existing.id})`);
    console.log("  Signing secret is only shown at creation — reuse the one already in STRIPE_WEBHOOK_SECRET.");
    return;
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: [
      "checkout.session.completed",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ],
  });

  console.log(`✓ Created webhook endpoint: ${endpoint.id} -> ${webhookUrl}`);
  console.log(`\n  STRIPE_WEBHOOK_SECRET=${endpoint.secret}\n`);
  console.log("  Copy that into .env.local (and your Vercel project's env vars).");
}

const { product, price } = await ensureProductAndPrice();
await ensureWebhook();

console.log("\nDone. The site will pick this up automatically — no code changes needed.");
console.log(`Product: ${product.id}  Price: ${price.id}`);
