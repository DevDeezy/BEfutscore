-- Migration: Add name_user and name_admin columns to order_states table
-- This allows different display names for users and admins

ALTER TABLE order_states 
ADD COLUMN IF NOT EXISTS name_user VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_admin VARCHAR(255);

-- Update existing records: set name_admin to current name, and name_user to current name as default
-- This ensures backward compatibility
UPDATE order_states 
SET name_admin = name, name_user = name 
WHERE name_admin IS NULL OR name_user IS NULL;

