-- Add password reset columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetCode" VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetCodeExpiry" TIMESTAMP;
