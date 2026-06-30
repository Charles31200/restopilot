-- Migration — Alertes stocks par email
-- Idempotent : peut être rejoué sans erreur si la colonne existe déjà.
--
-- Ajoute le champ utilisé pour limiter l'envoi des alertes de stock
-- bas à 1 email / 24h / restaurant (voir src/lib/alerts/stock-alerts.ts
-- et src/app/api/cron/stock-alerts/route.ts).

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS last_stock_alert_sent_at timestamptz;
