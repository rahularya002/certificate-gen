-- Migration: add file_url to templates for storing DOCX location
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS file_url TEXT;


