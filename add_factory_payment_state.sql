-- Add new order state: "Em pagamento na fábrica"
-- This state is used after CSV export and before processing

INSERT INTO "order_states" ("key", "name", "color", "description") VALUES
('em_pagamento_fabrica', 'Em Pagamento na Fábrica', '#FF9800', 'Encomenda exportada para CSV, aguardando confirmação de pagamento à fábrica')
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "color" = EXCLUDED."color",
  "description" = EXCLUDED."description",
  "updated_at" = NOW();

-- Verify the new state was added
SELECT * FROM "order_states" WHERE "key" = 'em_pagamento_fabrica';

