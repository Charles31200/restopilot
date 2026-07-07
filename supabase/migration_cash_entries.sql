-- Migration — Espèces déclarées (dashboard)
-- Idempotent : peut être rejoué sans erreur.
--
-- Permet au restaurateur de déclarer manuellement un montant d'espèces
-- reçu (jour ou semaine) depuis la card "Espèces déclarées" du dashboard.
-- Voir src/app/api/cash-entries/route.ts et
-- src/components/dashboard/CashEntryCard.tsx.

CREATE TABLE IF NOT EXISTS cash_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  date date NOT NULL,
  amount numeric(10,2) NOT NULL,
  period text NOT NULL DEFAULT 'day' CHECK (period IN ('day', 'week')),
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cash_entries_restaurant_date_idx
  ON cash_entries (restaurant_id, date DESC);

ALTER TABLE cash_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurant_own_cash_entries" ON cash_entries;

CREATE POLICY "restaurant_own_cash_entries" ON cash_entries
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (restaurant_id IN (
    SELECT restaurant_id FROM profiles WHERE id = auth.uid()
  ));
