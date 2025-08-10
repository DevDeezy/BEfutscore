-- Add tracking fields to orders table
ALTER TABLE "orders" ADD COLUMN "trackingText" TEXT;
ALTER TABLE "orders" ADD COLUMN "trackingImages" TEXT[] DEFAULT '{}'; 