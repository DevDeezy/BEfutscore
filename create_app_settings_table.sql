-- Create AppSettings table for global application customization
CREATE TABLE IF NOT EXISTS "app_settings" (
    "id" SERIAL PRIMARY KEY,
    "key" VARCHAR(100) UNIQUE NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Insert default app settings
INSERT INTO "app_settings" ("key", "value", "description") VALUES
('logo', '', 'Logo da aplicação em base64'),
('background_image', '', 'Imagem de fundo da aplicação em base64'),
('logo_height', '40', 'Altura do logo em pixels'),
('background_opacity', '0.1', 'Opacidade da imagem de fundo (0.0 a 1.0)'),
('navbar_color', '#1976d2', 'Cor de fundo da barra de navegação'),
('navbar_text_color', '#ffffff', 'Cor do texto da barra de navegação'),
('footer_color', '#f5f5f5', 'Cor de fundo do footer'),
('footer_text_color', '#666666', 'Cor do texto do footer'),
('primary_color', '#1976d2', 'Cor primária da aplicação'),
('secondary_color', '#dc004e', 'Cor secundária da aplicação')
ON CONFLICT ("key") DO UPDATE SET
  "value" = EXCLUDED."value",
  "description" = EXCLUDED."description",
  "updated_at" = NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "idx_app_settings_key" ON "app_settings" ("key");

-- Add comment to table
COMMENT ON TABLE "app_settings" IS 'Global application settings and customization options';
