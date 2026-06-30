-- ================================================================
-- RestoPilot — Schéma initial Supabase
-- Idempotent : peut être rejoué sans erreur si les tables existent déjà.
-- À copier-coller dans l'éditeur SQL de Supabase (SQL Editor)
-- puis exécuter en une seule fois (Run).
-- ================================================================

-- ── Extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Trigger updated_at générique ──────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Fonction helper RLS ───────────────────────────────────────
-- Retourne le restaurant_id de l'utilisateur connecté.
-- SECURITY DEFINER = bypass RLS sur profiles pour éviter la récursion.
CREATE OR REPLACE FUNCTION get_user_restaurant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ================================================================
-- TABLES
-- ================================================================

-- ── restaurants ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      text        NOT NULL,
  siret                     text,
  address                   text,
  timezone                  text        NOT NULL DEFAULT 'Europe/Paris',
  plan_id                   text        NOT NULL DEFAULT 'starter',
  stripe_customer_id        text,
  last_stock_alert_sent_at  timestamptz,
  created_at                timestamptz NOT NULL DEFAULT NOW(),
  updated_at                timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS last_stock_alert_sent_at timestamptz;

CREATE OR REPLACE TRIGGER set_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── profiles ──────────────────────────────────────────────────
-- id = auth.users.id (même UUID — pas d'ID séparé)
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid        REFERENCES restaurants(id) ON DELETE SET NULL,
  role          text        NOT NULL DEFAULT 'owner'
                            CHECK (role IN ('owner', 'manager', 'staff')),
  first_name    text,
  last_name     text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT NOW()
);

-- ── products (matières premières / stocks) ────────────────────
CREATE TABLE IF NOT EXISTS products (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  uuid          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name           text          NOT NULL,
  unit           text          NOT NULL DEFAULT 'piece'
                               CHECK (unit IN ('kg','g','L','cl','piece','boite','carton')),
  buy_price      numeric(10,2) NOT NULL DEFAULT 0,
  stock_qty      numeric(10,3) NOT NULL DEFAULT 0,
  min_threshold  numeric(10,3) NOT NULL DEFAULT 0,
  supplier_name  text,
  category       text,
  created_at     timestamptz   NOT NULL DEFAULT NOW(),
  updated_at     timestamptz   NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── recipes (fiches techniques plats) ────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  uuid          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  dish_name      text          NOT NULL,
  sell_price     numeric(10,2) NOT NULL DEFAULT 0,
  category       text,
  is_active      boolean       NOT NULL DEFAULT true,
  created_at     timestamptz   NOT NULL DEFAULT NOW()
);

-- ── recipe_ingredients ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id   uuid          NOT NULL REFERENCES recipes(id)  ON DELETE CASCADE,
  product_id  uuid          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    numeric(10,4) NOT NULL DEFAULT 0
);

-- ── sales (journées de ventes) ────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date            date          NOT NULL,
  total_revenue   numeric(10,2) NOT NULL DEFAULT 0,
  covers          integer       NOT NULL DEFAULT 0,
  source          text          NOT NULL DEFAULT 'manual'
                                CHECK (source IN ('pos','manual','import')),
  pos_reference   text,
  created_at      timestamptz   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_restaurant_date
  ON sales (restaurant_id, date DESC);

-- ── sale_items (lignes de vente par plat) ────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id        uuid          NOT NULL REFERENCES sales(id)       ON DELETE CASCADE,
  restaurant_id  uuid          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  recipe_id      uuid          REFERENCES recipes(id)              ON DELETE SET NULL,
  dish_name      text          NOT NULL,
  quantity_sold  numeric(10,2) NOT NULL DEFAULT 1,
  unit_price     numeric(10,2) NOT NULL DEFAULT 0
);

-- ── stock_movements ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  uuid          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  product_id     uuid          NOT NULL REFERENCES products(id)    ON DELETE CASCADE,
  type           text          NOT NULL
                               CHECK (type IN ('in','out','adjust','sale')),
  quantity       numeric(10,4) NOT NULL,
  note           text,
  created_by     uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz   NOT NULL DEFAULT NOW()
);

-- ── employees ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  uuid          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  first_name     text          NOT NULL,
  last_name      text          NOT NULL,
  role           text          NOT NULL DEFAULT 'serveur'
                               CHECK (role IN ('cuisinier','serveur','barman','plongeur','manager','autre')),
  contract_type  text          NOT NULL DEFAULT 'CDI'
                               CHECK (contract_type IN ('CDI','CDD','extra','apprenti')),
  hourly_rate    numeric(8,2)  NOT NULL DEFAULT 0,
  weekly_hours   numeric(6,2)  NOT NULL DEFAULT 35,
  color          text          NOT NULL DEFAULT '#6366F1',
  is_active      boolean       NOT NULL DEFAULT true,
  created_at     timestamptz   NOT NULL DEFAULT NOW()
);

-- ── shifts (créneaux de travail planifiés) ────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  uuid        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  employee_id    uuid        NOT NULL REFERENCES employees(id)   ON DELETE CASCADE,
  start_time     timestamptz NOT NULL,
  end_time       timestamptz NOT NULL,
  position       text,
  status         text        NOT NULL DEFAULT 'planned'
                             CHECK (status IN ('planned','confirmed','done','absent')),
  note           text,
  created_at     timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_restaurant_start
  ON shifts (restaurant_id, start_time);

-- ── time_logs (pointages réels) ───────────────────────────────
CREATE TABLE IF NOT EXISTS time_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id       uuid        REFERENCES shifts(id)              ON DELETE SET NULL,
  employee_id    uuid        NOT NULL REFERENCES employees(id)   ON DELETE CASCADE,
  restaurant_id  uuid        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  clock_in       timestamptz,
  clock_out      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT NOW()
);

-- ── invoices (factures fournisseurs) ─────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  supplier_name   text,
  amount          numeric(10,2) NOT NULL DEFAULT 0,
  vat_amount      numeric(10,2) NOT NULL DEFAULT 0,
  invoice_date    date,
  due_date        date,
  file_url        text,
  status          text          NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','validated','paid')),
  ocr_raw_text    text,
  created_at      timestamptz   NOT NULL DEFAULT NOW()
);

-- ── pos_integrations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_integrations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    uuid        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  pos_type         text        NOT NULL
                               CHECK (pos_type IN ('lightspeed','tiller','zelty','csv')),
  access_token     text,
  refresh_token    text,
  token_expires_at timestamptz,
  api_key          text,
  is_active        boolean     NOT NULL DEFAULT true,
  last_synced_at   timestamptz,
  sync_error       text,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER set_pos_integrations_updated_at
  BEFORE UPDATE ON pos_integrations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── subscriptions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id          uuid        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  stripe_customer_id     text,
  plan                   text        NOT NULL DEFAULT 'starter'
                                     CHECK (plan IN ('starter','pro','multi')),
  status                 text        NOT NULL DEFAULT 'trialing'
                                     CHECK (status IN ('active','canceled','past_due','trialing')),
  current_period_end     timestamptz,
  created_at             timestamptz NOT NULL DEFAULT NOW(),
  updated_at             timestamptz NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE restaurants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_integrations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"  ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING    (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── restaurants ───────────────────────────────────────────────
DROP POLICY IF EXISTS "restaurants_select_own" ON restaurants;
DROP POLICY IF EXISTS "restaurants_update_own" ON restaurants;

CREATE POLICY "restaurants_select_own" ON restaurants
  FOR SELECT USING (id = get_user_restaurant_id());

CREATE POLICY "restaurants_update_own" ON restaurants
  FOR UPDATE
  USING    (id = get_user_restaurant_id())
  WITH CHECK (id = get_user_restaurant_id());

-- ── products ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_own_restaurant" ON products;

CREATE POLICY "products_own_restaurant" ON products
  FOR ALL
  USING    (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- ── recipes ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "recipes_own_restaurant" ON recipes;

CREATE POLICY "recipes_own_restaurant" ON recipes
  FOR ALL
  USING    (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- ── recipe_ingredients (jointure via recipes) ────────────────
DROP POLICY IF EXISTS "recipe_ingredients_own_restaurant" ON recipe_ingredients;

CREATE POLICY "recipe_ingredients_own_restaurant" ON recipe_ingredients
  FOR ALL
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE restaurant_id = get_user_restaurant_id()
    )
  )
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM recipes WHERE restaurant_id = get_user_restaurant_id()
    )
  );

-- ── sales ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "sales_own_restaurant" ON sales;

CREATE POLICY "sales_own_restaurant" ON sales
  FOR ALL
  USING    (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- ── sale_items ───────────────────────────────────────────────
DROP POLICY IF EXISTS "sale_items_own_restaurant" ON sale_items;

CREATE POLICY "sale_items_own_restaurant" ON sale_items
  FOR ALL
  USING    (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- ── stock_movements ──────────────────────────────────────────
DROP POLICY IF EXISTS "stock_movements_own_restaurant" ON stock_movements;

CREATE POLICY "stock_movements_own_restaurant" ON stock_movements
  FOR ALL
  USING    (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- ── employees ────────────────────────────────────────────────
DROP POLICY IF EXISTS "employees_own_restaurant" ON employees;

CREATE POLICY "employees_own_restaurant" ON employees
  FOR ALL
  USING    (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- ── shifts ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "shifts_own_restaurant" ON shifts;

CREATE POLICY "shifts_own_restaurant" ON shifts
  FOR ALL
  USING    (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- ── time_logs ────────────────────────────────────────────────
DROP POLICY IF EXISTS "time_logs_own_restaurant" ON time_logs;

CREATE POLICY "time_logs_own_restaurant" ON time_logs
  FOR ALL
  USING    (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- ── invoices ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "invoices_own_restaurant" ON invoices;

CREATE POLICY "invoices_own_restaurant" ON invoices
  FOR ALL
  USING    (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- ── pos_integrations ─────────────────────────────────────────
DROP POLICY IF EXISTS "pos_integrations_own_restaurant" ON pos_integrations;

CREATE POLICY "pos_integrations_own_restaurant" ON pos_integrations
  FOR ALL
  USING    (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- ── subscriptions ────────────────────────────────────────────
DROP POLICY IF EXISTS "subscriptions_own_restaurant" ON subscriptions;

CREATE POLICY "subscriptions_own_restaurant" ON subscriptions
  FOR ALL
  USING    (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- ================================================================
-- FIN DU SCHÉMA
-- ================================================================
-- Tables          : 14  (CREATE TABLE IF NOT EXISTS)
-- Triggers        : 4   (CREATE OR REPLACE TRIGGER)
-- Politiques RLS  : 17  (DROP IF EXISTS + CREATE)
-- Fonctions       : 2   (CREATE OR REPLACE FUNCTION)
-- ================================================================
