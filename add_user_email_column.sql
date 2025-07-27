-- Add userEmail column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS "userEmail" VARCHAR(255);

-- Add comment to the column
COMMENT ON COLUMN public.users."userEmail" IS 'User email for notifications, optional'; 