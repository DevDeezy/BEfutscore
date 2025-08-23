-- Add tracking videos field to orders table
ALTER TABLE "orders" ADD COLUMN "trackingVideos" TEXT[] DEFAULT '{}';
