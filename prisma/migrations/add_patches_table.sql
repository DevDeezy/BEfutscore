-- Create patches table
CREATE TABLE "patches" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "price" DOUBLE PRECISION DEFAULT 0,
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Insert some sample patches
INSERT INTO "patches" ("name", "image", "price", "active", "created_at", "updated_at") VALUES
('Patch Nike', 'https://via.placeholder.com/100x100/FF6B6B/FFFFFF?text=Nike', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Patch Adidas', 'https://via.placeholder.com/100x100/4ECDC4/FFFFFF?text=Adidas', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Patch Puma', 'https://via.placeholder.com/100x100/45B7D1/FFFFFF?text=Puma', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Patch Under Armour', 'https://via.placeholder.com/100x100/96CEB4/FFFFFF?text=UA', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Patch New Balance', 'https://via.placeholder.com/100x100/FFEAA7/000000?text=NB', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Patch Reebok', 'https://via.placeholder.com/100x100/DDA0DD/FFFFFF?text=Reebok', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 