-- Migration — Lien profil ↔ employé (invitations)
-- Idempotent : peut être rejoué sans erreur.
--
-- Un profil role='staff' créé via une invitation doit savoir à quelle
-- ligne `employees` il correspond, pour pouvoir filtrer son propre
-- planning / ses propres demandes sur le dashboard employé. Voir :
--   src/app/api/invitations/[token]/route.ts (POST — remplit la colonne)
--   src/app/employee/dashboard/page.tsx (lecture)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES employees(id) ON DELETE SET NULL;
