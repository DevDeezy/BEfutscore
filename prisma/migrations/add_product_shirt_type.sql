-- Add optional shirt_type_id to products and reference shirttypes
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS shirt_type_id INTEGER;

-- Add foreign key constraint if not exists (Postgres doesn't support IF NOT EXISTS for FK, so wrap)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'products'
      AND tc.constraint_name = 'products_shirt_type_id_fkey'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_shirt_type_id_fkey
      FOREIGN KEY (shirt_type_id)
      REFERENCES shirttypes(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END$$;

-- Helpful index for lookups
CREATE INDEX IF NOT EXISTS idx_products_shirt_type_id ON products (shirt_type_id);

