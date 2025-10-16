-- Script para migrar estados existentes das encomendas para o novo sistema
-- Execute este script DEPOIS de criar a tabela order_states

-- Passo 1: Verificar estados atuais
SELECT DISTINCT status, COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

-- Passo 2: Mapear estados antigos para os novos keys (snake_case)
-- Isto garante compatibilidade com a nova tabela order_states

UPDATE orders 
SET status = 'para_analizar' 
WHERE status = 'Para analizar';

UPDATE orders 
SET status = 'a_orcamentar' 
WHERE status = 'A Orçamentar' OR status = 'A Orçamentar';

UPDATE orders 
SET status = 'em_pagamento' 
WHERE status = 'Em pagamento';

UPDATE orders 
SET status = 'em_processamento' 
WHERE status = 'Em Processamento' OR status = 'processing';

UPDATE orders 
SET status = 'csv' 
WHERE status = 'CSV';

-- Estados que já estão corretos (não precisam de atualização):
-- 'pending', 'completed', 'cancelled'

-- Passo 3: Verificar se há estados não mapeados
SELECT DISTINCT status, COUNT(*) as count
FROM orders
WHERE status NOT IN ('pending', 'para_analizar', 'a_orcamentar', 'em_pagamento', 'em_processamento', 'csv', 'completed', 'cancelled')
GROUP BY status;

-- Passo 4: Verificar a distribuição final
SELECT 
  os.name as estado_nome,
  os.key as estado_key,
  os.color as cor,
  COUNT(o.id) as total_encomendas
FROM order_states os
LEFT JOIN orders o ON o.status = os.key
GROUP BY os.id, os.name, os.key, os.color
ORDER BY total_encomendas DESC;

-- Passo 5: Adicionar comentários informativos
COMMENT ON COLUMN orders.status IS 'Estado da encomenda - referencia order_states.key';

-- Nota: Este script é idempotente e pode ser executado múltiplas vezes com segurança
