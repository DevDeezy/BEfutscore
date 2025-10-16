-- Create OrderStates table
CREATE TABLE IF NOT EXISTS "order_states" (
    "id" SERIAL PRIMARY KEY,
    "key" VARCHAR(50) UNIQUE NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Insert default order states with business rules descriptions
INSERT INTO "order_states" ("key", "name", "color", "description") VALUES
('pending', 'Pendente', 'orange', 'Encomenda criada e aguardando processamento inicial'),
('para_analizar', 'Para Analisar', 'purple', 'Encomenda precisa de análise técnica antes de prosseguir'),
('a_orcamentar', 'A Orçamentar', 'darkblue', 'Encomenda aguarda cálculo de preço final e orçamento'),
('em_pagamento', 'Em Pagamento', 'red', 'Encomenda aguarda pagamento do cliente - gera notificação automática'),
('em_processamento', 'Em Processamento', 'blue', 'Encomenda em produção/processamento'),
('csv', 'CSV', 'brown', 'Encomenda exportada para CSV para processamento externo'),
('completed', 'Concluída', 'green', 'Encomenda finalizada e entregue'),
('cancelled', 'Cancelada', 'red', 'Encomenda cancelada pelo cliente ou sistema')
ON CONFLICT ("key") DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "idx_order_states_key" ON "order_states" ("key");

-- Add comment to table
COMMENT ON TABLE "order_states" IS 'Dynamic order states configuration with colors and business rules';
