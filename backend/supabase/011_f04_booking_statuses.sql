-- Migration 011 — F04: Add new booking statuses + blocked slots support
-- IMPORTANT: Run the two blocks separately — Postgres requires new enum values
-- to be committed before they can be referenced in the same session.

-- ── Block 1: add new statuses ─────────────────────────────────────────────────
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'in_progress';      -- Prestation en cours
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'no_show';           -- Client absent
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rescheduled';       -- Reprogrammée
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'blocked';           -- Créneau bloqué (usage pro personnel)
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_payment';  -- En attente de paiement

-- ── Block 2: RLS policy (run AFTER block 1 is committed) ─────────────────────
-- CREATE POLICY "Pro peut créer un créneau bloqué" ON bookings
--   FOR INSERT WITH CHECK (
--     auth.uid() = pro_id
--     AND auth.uid() = owner_id
--     AND status = 'blocked'
--   );
