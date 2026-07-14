-- Migration — Invitations employés
-- Idempotent : peut être rejoué sans erreur.
--
-- Permet au patron d'inviter un employé existant (table `employees`) par
-- email pour qu'il crée son propre compte. Voir :
--   src/app/api/invitations/route.ts
--   src/app/api/invitations/[token]/route.ts
--   src/app/invite/[token]/page.tsx

CREATE TABLE IF NOT EXISTS employee_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurant_own_invitations" ON employee_invitations;

CREATE POLICY "restaurant_own_invitations" ON employee_invitations
  FOR ALL USING (restaurant_id IN (
    SELECT restaurant_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (restaurant_id IN (
    SELECT restaurant_id FROM profiles WHERE id = auth.uid()
  ));
