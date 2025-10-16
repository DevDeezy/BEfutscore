# Migração: Sistema de Estados de Encomendas Dinâmicos

## Visão Geral
Esta migração transforma os estados das encomendas de valores hardcoded para um sistema dinâmico gerenciável através do painel de administração.

## Alterações Realizadas

### 1. Base de Dados
- **Nova Tabela**: `order_states` - Armazena os estados das encomendas com cores e descrições
- **Relação**: `orders.status` → `order_states.key` (relação opcional para manter compatibilidade)

### 2. Estados Pré-configurados
Os seguintes estados são criados automaticamente:

| Key | Nome | Cor | Descrição |
|-----|------|-----|-----------|
| `pending` | Pendente | orange | Encomenda criada e aguardando processamento inicial |
| `para_analizar` | Para Analisar | purple | Encomenda precisa de análise técnica antes de prosseguir |
| `a_orcamentar` | A Orçamentar | darkblue | Encomenda aguarda cálculo de preço final e orçamento |
| `em_pagamento` | Em Pagamento | red | Encomenda aguarda pagamento do cliente - gera notificação automática |
| `em_processamento` | Em Processamento | blue | Encomenda em produção/processamento |
| `csv` | CSV | brown | Encomenda exportada para CSV para processamento externo |
| `completed` | Concluída | green | Encomenda finalizada e entregue |
| `cancelled` | Cancelada | red | Encomenda cancelada pelo cliente ou sistema |

### 3. APIs Criadas

#### GET `/getOrderStates`
Retorna todos os estados de encomendas disponíveis.

**Resposta:**
```json
[
  {
    "id": 1,
    "key": "pending",
    "name": "Pendente",
    "color": "orange",
    "description": "Encomenda criada e aguardando processamento inicial",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

#### PUT `/updateOrderState`
Atualiza um estado de encomenda existente (apenas nome, cor e descrição).

**Body:**
```json
{
  "id": 1,
  "name": "Novo Nome",
  "color": "blue",
  "description": "Nova descrição"
}
```

### 4. Frontend

#### Novos Componentes
- `OrderStateManager.tsx` - Interface de gestão de estados no painel admin
- `orderStateSlice.ts` - Redux slice para gestão de estados

#### Componentes Atualizados
- `AdminPanel.tsx` - Nova tab "Estados das Encomendas"
- `PreviousOrders.tsx` - Usa estados dinâmicos
- `types/index.ts` - Novo tipo `OrderState`

### 5. Cores Disponíveis
O sistema suporta as seguintes cores predefinidas:
- `orange` (#ff9800)
- `purple` (#9c27b0)
- `darkblue` (#1565c0)
- `red` (#f44336)
- `blue` (#2196f3)
- `green` (#4caf50)
- `brown` (#795548)
- `gray` (#757575)

Também é possível usar códigos hexadecimais personalizados.

## Instruções de Instalação

### Passo 1: Executar SQL de Criação
Execute o ficheiro SQL para criar a tabela e inserir os estados iniciais:

```bash
psql -U seu_usuario -d sua_database -f create_order_states_table.sql
```

### Passo 2: Atualizar Prisma Schema
O schema já foi atualizado com o modelo `OrderState`. Execute:

```bash
cd BEfutscore
npx prisma generate
```

### Passo 3: Atualizar Encomendas Existentes
As encomendas existentes continuarão a funcionar, mas precisam ter os estados mapeados. Execute este script SQL para garantir compatibilidade:

```sql
-- Mapear estados antigos para os novos keys
UPDATE orders SET status = 'para_analizar' WHERE status = 'Para analizar';
UPDATE orders SET status = 'a_orcamentar' WHERE status = 'A Orçamentar';
UPDATE orders SET status = 'em_pagamento' WHERE status = 'Em pagamento';
UPDATE orders SET status = 'em_processamento' WHERE status = 'Em Processamento' OR status = 'processing';
UPDATE orders SET status = 'csv' WHERE status = 'CSV';
UPDATE orders SET status = 'cancelled' WHERE status = 'cancelled';
```

### Passo 4: Instalar Dependências Frontend
```bash
cd FEfutscore
npm install
```

### Passo 5: Build e Deploy
```bash
# Frontend
cd FEfutscore
npm run build

# Backend (se necessário)
cd ../BEfutscore
npm install
```

## Funcionalidades

### Painel de Administração
1. Aceda ao painel de admin
2. Clique na tab "Estados das Encomendas"
3. Edite o nome, cor ou descrição de qualquer estado
4. As alterações refletem-se imediatamente em toda a plataforma

### Regras de Negócio Mantidas
- **Notificações**: Encomendas com estado `em_pagamento` continuam a gerar notificações automáticas
- **Emails**: Sistema de emails mantém-se funcional para estado `em_pagamento`
- **Filtros**: Todos os filtros e pesquisas foram atualizados para usar estados dinâmicos

## Compatibilidade
- ✅ Encomendas antigas continuam a funcionar
- ✅ APIs antigas continuam compatíveis
- ✅ Nenhuma perda de dados
- ✅ Estados não podem ser eliminados (apenas editados)

## Notas Importantes
- **Não é possível criar novos estados** - apenas os 8 estados predefinidos existem
- **Não é possível eliminar estados** - para manter integridade dos dados
- **Keys dos estados são imutáveis** - apenas nome, cor e descrição são editáveis
- **Regras de negócio baseadas em keys** - O sistema ainda verifica a key `em_pagamento` para enviar notificações

## Suporte
Para questões ou problemas, contacte a equipa de desenvolvimento.
