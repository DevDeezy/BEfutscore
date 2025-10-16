-- Add new order state: "Enviar para a fábrica"
-- This state is used after payment validation and before adding to CSV

INSERT INTO "order_states" ("key", "name", "color", "description") VALUES
('enviar_para_fabrica', 'Enviar para a Fábrica', '#2196F3', 'Pagamento validado, encomenda pronta para ser enviada à fábrica')
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "color" = EXCLUDED."color",
  "description" = EXCLUDED."description",
  "updated_at" = NOW();

-- Verify the new state was added
SELECT * FROM "order_states" WHERE "key" = 'enviar_para_fabrica';

