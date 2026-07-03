-- Migration : table shift_requests (demandes de modification de créneau)
-- À exécuter dans le SQL Editor de Supabase (projet oaykeabphjilemdpizho)

CREATE TABLE IF NOT EXISTS shift_requests (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id    uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  shift_id         uuid NOT NULL REFERENCES shifts(id)       ON DELETE CASCADE,
  employee_id      uuid NOT NULL REFERENCES employees(id)    ON DELETE CASCADE,
  type             text NOT NULL DEFAULT 'modify',
  requested_start  text NOT NULL,   -- heure HH:MM  ex: "09:00"
  requested_end    text NOT NULL,   -- heure HH:MM  ex: "15:00"
  requested_date   text NOT NULL,   -- date YYYY-MM-DD ex: "2026-07-07"
  reason           text,
  status           text NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  manager_note     text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shift_requests_restaurant_status
  ON shift_requests(restaurant_id, status);
