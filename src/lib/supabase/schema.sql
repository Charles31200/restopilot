-- =============================================================
-- RestoPilot -- Full database schema for Supabase
-- Run in: Dashboard > SQL Editor > New query > Run
-- =============================================================


-- 1. RESTAURANTS
CREATE TABLE restaurants (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT        NOT NULL,
  siret              TEXT,
  address            TEXT,
  timezone           TEXT        NOT NULL DEFAULT 'Europe/Paris',
  plan_id            TEXT        NOT NULL DEFAULT 'starter',
  stripe_customer_id TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2. PROFILES (extends auth.users)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL DEFAULT 'staff'
                  CHECK (role IN ('owner', 'manager', 'staff')),
  first_name    TEXT,
  last_name     TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 3. PRODUCTS (stock ingredients & items)
CREATE TABLE products (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  unit          TEXT        NOT NULL DEFAULT 'piece'
                  CHECK (unit IN ('kg', 'g', 'L', 'cl', 'piece', 'boite', 'carton')),
  buy_price     DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_qty     DECIMAL(10,3) NOT NULL DEFAULT 0,
  min_threshold DECIMAL(10,3) NOT NULL DEFAULT 0,
  supplier_name TEXT,
  category      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 4. RECIPES (dish technical sheets)
CREATE TABLE recipes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  dish_name     TEXT        NOT NULL,
  sell_price    DECIMAL(10,2) NOT NULL DEFAULT 0,
  category      TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 5. RECIPE_INGREDIENTS (recipe <-> product join)
CREATE TABLE recipe_ingredients (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  UUID          NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  product_id UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   DECIMAL(10,3) NOT NULL,
  UNIQUE (recipe_id, product_id)
);


-- 6. SALES (daily revenue records)
CREATE TABLE sales (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date          DATE        NOT NULL,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  covers        INTEGER     NOT NULL DEFAULT 0,
  source        TEXT        NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('pos', 'manual', 'import')),
  pos_reference TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 7. SALE_ITEMS (line items per sale)
--    restaurant_id is denormalized here so RLS can filter directly
--    without a join back through sales.
CREATE TABLE sale_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id       UUID        NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  restaurant_id UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  recipe_id     UUID        REFERENCES recipes(id) ON DELETE SET NULL,
  dish_name     TEXT        NOT NULL,
  quantity_sold INTEGER     NOT NULL DEFAULT 1,
  unit_price    DECIMAL(10,2) NOT NULL DEFAULT 0
);


-- 8. STOCK_MOVEMENTS (stock journal)
CREATE TABLE stock_movements (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  product_id    UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type          TEXT          NOT NULL CHECK (type IN ('in', 'out', 'adjust', 'sale')),
  quantity      DECIMAL(10,3) NOT NULL,
  note          TEXT,
  created_by    UUID          REFERENCES profiles(id),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- 9. EMPLOYEES
CREATE TABLE employees (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  first_name    TEXT        NOT NULL,
  last_name     TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'serveur'
                  CHECK (role IN ('cuisinier', 'serveur', 'barman', 'plongeur', 'manager', 'autre')),
  contract_type TEXT        NOT NULL DEFAULT 'CDI'
                  CHECK (contract_type IN ('CDI', 'CDD', 'extra', 'apprenti')),
  hourly_rate   DECIMAL(8,2)  NOT NULL DEFAULT 11.88,
  weekly_hours  INTEGER       NOT NULL DEFAULT 35,
  color         TEXT          NOT NULL DEFAULT '#3B82F6',
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- 10. SHIFTS (schedule slots)
CREATE TABLE shifts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  employee_id   UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  position      TEXT,
  status        TEXT        NOT NULL DEFAULT 'planned'
                  CHECK (status IN ('planned', 'confirmed', 'done', 'absent')),
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 11. TIME_LOGS (actual clock-in / clock-out)
CREATE TABLE time_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id      UUID        REFERENCES shifts(id) ON DELETE SET NULL,
  employee_id   UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  restaurant_id UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  clock_in      TIMESTAMPTZ,
  clock_out     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 12. INVOICES (supplier invoices)
CREATE TABLE invoices (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  supplier_name TEXT,
  amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  vat_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
  invoice_date  DATE,
  due_date      DATE,
  file_url      TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'validated', 'paid')),
  ocr_raw_text  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 13. SUBSCRIPTIONS (Stripe billing)
CREATE TABLE subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id          UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT        UNIQUE,
  stripe_customer_id     TEXT,
  plan                   TEXT        NOT NULL DEFAULT 'starter'
                           CHECK (plan IN ('starter', 'pro', 'multi')),
  status                 TEXT        NOT NULL DEFAULT 'trialing'
                           CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 14. POS_INTEGRATIONS (cash register connections)
CREATE TABLE pos_integrations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID        NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
  pos_type         TEXT        NOT NULL
                     CHECK (pos_type IN ('lightspeed', 'tiller', 'zelty', 'csv')),
  access_token     TEXT,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  api_key          TEXT,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  last_synced_at   TIMESTAMPTZ,
  sync_error       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX idx_sales_restaurant_date       ON sales(restaurant_id, date DESC);
CREATE INDEX idx_sale_items_restaurant       ON sale_items(restaurant_id);
CREATE INDEX idx_sale_items_sale             ON sale_items(sale_id);
CREATE INDEX idx_stock_movements_product     ON stock_movements(product_id, created_at DESC);
CREATE INDEX idx_shifts_restaurant_date      ON shifts(restaurant_id, start_time);
CREATE INDEX idx_products_restaurant         ON products(restaurant_id);
CREATE INDEX idx_employees_restaurant        ON employees(restaurant_id, is_active);
CREATE INDEX idx_invoices_restaurant_status  ON invoices(restaurant_id, status);
CREATE INDEX idx_time_logs_employee          ON time_logs(employee_id, clock_in DESC);
CREATE INDEX idx_pos_integrations_restaurant ON pos_integrations(restaurant_id);
CREATE INDEX idx_pos_integrations_active     ON pos_integrations(is_active, pos_type);


-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE restaurants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_integrations ENABLE ROW LEVEL SECURITY;


-- Helper function: returns the restaurant_id of the logged-in user
CREATE OR REPLACE FUNCTION get_user_restaurant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT restaurant_id FROM profiles WHERE id = auth.uid();
$$;


-- Restaurants: each user sees only their own restaurant
CREATE POLICY "owner_restaurant" ON restaurants
  FOR ALL
  USING (id = get_user_restaurant_id());

-- Profiles: each user sees only their own profile
CREATE POLICY "owner_profile" ON profiles
  FOR ALL
  USING (restaurant_id = get_user_restaurant_id());

-- All tables with a direct restaurant_id column
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products',
    'recipes',
    'sales',
    'sale_items',
    'stock_movements',
    'employees',
    'shifts',
    'time_logs',
    'invoices',
    'subscriptions',
    'pos_integrations'
  ]
  LOOP
    EXECUTE format(
      $fmt$
        CREATE POLICY "owner_%I" ON %I
          FOR ALL
          USING (restaurant_id = get_user_restaurant_id())
      $fmt$,
      t, t
    );
  END LOOP;
END;
$$;

-- recipe_ingredients: no direct restaurant_id, filter via recipes
CREATE POLICY "owner_recipe_ingredients" ON recipe_ingredients
  FOR ALL
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE restaurant_id = get_user_restaurant_id()
    )
  );
