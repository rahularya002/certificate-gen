-- Migration: add grade to certificates
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS grade VARCHAR(20);



