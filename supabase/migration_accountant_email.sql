-- Migration : ajout de la colonne accountant_email sur la table restaurants
-- Permet au restaurateur de renseigner l'email de son expert-comptable
-- pour l'envoi automatique du fichier FEC.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS accountant_email text;
