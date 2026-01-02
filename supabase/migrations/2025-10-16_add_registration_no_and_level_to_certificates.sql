-- Migration: add registration_no, level, and candidate_id to certificates
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS registration_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS level VARCHAR(50),
  ADD COLUMN IF NOT EXISTS candidate_id VARCHAR(100);

