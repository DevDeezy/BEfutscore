-- Add available_shirt_type_ids integer[] column to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS available_shirt_type_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[];

