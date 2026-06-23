-- Comptes de test (password = "Password1!" hashé avec bcrypt rounds=10)
-- Hash généré hors ligne pour éviter de stocker le mot de passe en clair
INSERT INTO users (id, email, password_hash, full_name, role, status) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'admin@ecotrack.fr',      '$2b$10$rOzIGbFHkQ7FH7v5R6JuCuVjkIvE2PxE0fHmMdBIHaJvWNHUPdVfi', 'Admin ECOTRACK',     'ADMIN',   'ACTIVE'),
  ('b1000000-0000-0000-0000-000000000002', 'gestionnaire@ecotrack.fr','$2b$10$rOzIGbFHkQ7FH7v5R6JuCuVjkIvE2PxE0fHmMdBIHaJvWNHUPdVfi', 'Marie Dupont',       'MANAGER', 'ACTIVE'),
  ('b1000000-0000-0000-0000-000000000003', 'agent1@ecotrack.fr',     '$2b$10$rOzIGbFHkQ7FH7v5R6JuCuVjkIvE2PxE0fHmMdBIHaJvWNHUPdVfi', 'Pierre Martin',      'AGENT',   'ACTIVE'),
  ('b1000000-0000-0000-0000-000000000004', 'agent2@ecotrack.fr',     '$2b$10$rOzIGbFHkQ7FH7v5R6JuCuVjkIvE2PxE0fHmMdBIHaJvWNHUPdVfi', 'Sophie Bernard',     'AGENT',   'ACTIVE'),
  ('b1000000-0000-0000-0000-000000000005', 'citoyen1@ecotrack.fr',   '$2b$10$rOzIGbFHkQ7FH7v5R6JuCuVjkIvE2PxE0fHmMdBIHaJvWNHUPdVfi', 'Jean Citoyen',       'CITIZEN', 'ACTIVE'),
  ('b1000000-0000-0000-0000-000000000006', 'citoyen2@ecotrack.fr',   '$2b$10$rOzIGbFHkQ7FH7v5R6JuCuVjkIvE2PxE0fHmMdBIHaJvWNHUPdVfi', 'Lucie Citoyenne',    'CITIZEN', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Note: tous les comptes partagent le mot de passe "Password1!" pour la démo.
-- À changer en production. Hash à régénérer via bcrypt(password, rounds=10).
