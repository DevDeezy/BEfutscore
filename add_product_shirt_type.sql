-- Add optional shirt_type_id to products and link to shirttypes
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shirt_type_id" INTEGER;

DO $$ BEGIN
  ALTER TABLE "products"
    ADD CONSTRAINT "products_shirt_type_id_fkey"
    FOREIGN KEY ("shirt_type_id") REFERENCES "shirttypes"("id")
    ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


