-- Add parent_id column to enable hierarchical product types
ALTER TABLE "product_types" ADD COLUMN IF NOT EXISTS "parent_id" INTEGER;

-- Add foreign key constraint to self-reference product_types
ALTER TABLE "product_types"
  ADD CONSTRAINT IF NOT EXISTS product_types_parent_fk
  FOREIGN KEY ("parent_id") REFERENCES "product_types"("id") ON DELETE SET NULL;

-- Optional index for faster hierarchical queries
CREATE INDEX IF NOT EXISTS idx_product_types_parent_id ON "product_types"("parent_id");

