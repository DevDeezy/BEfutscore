-- Add userEmail column to users table (if not exists)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS "userEmail" VARCHAR(255);

-- Make userEmail NOT NULL (you may need to update existing rows first)
-- UPDATE public.users SET "userEmail" = email WHERE "userEmail" IS NULL;
ALTER TABLE public.users 
ALTER COLUMN "userEmail" SET NOT NULL;

-- Add unique constraint to userEmail
ALTER TABLE public.users 
ADD CONSTRAINT users_user_email_unique UNIQUE ("userEmail");

-- Add comment to the column
COMMENT ON COLUMN public.users."userEmail" IS 'User email for notifications, required and unique'; 