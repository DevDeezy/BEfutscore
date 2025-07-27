-- Create the pricing_config table
CREATE TABLE IF NOT EXISTS public.pricing_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pricing configurations
INSERT INTO public.pricing_config (key, name, price, cost_price, description) VALUES
('patch_price', 'Preço por Patch', 2.00, 1.00, 'Preço de venda e custo por patch aplicado em camisolas'),
('number_price', 'Preço por Número', 3.00, 1.50, 'Preço de venda e custo por número aplicado em camisolas'),
('name_price', 'Preço por Nome', 3.00, 1.50, 'Preço de venda e custo por nome aplicado em camisolas')
ON CONFLICT (key) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_config_key ON public.pricing_config(key); 