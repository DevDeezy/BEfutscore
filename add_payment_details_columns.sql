-- Add payment recipient and account info columns to orders table
ALTER TABLE "orders" ADD COLUMN "paymentRecipient" TEXT;
ALTER TABLE "orders" ADD COLUMN "paymentAccountInfo" TEXT;
