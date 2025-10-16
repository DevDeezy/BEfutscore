# Fluxo de Pagamento à Fábrica

## 📋 Visão Geral

Este documento descreve o novo fluxo de pagamento à fábrica implementado no sistema de gestão de encomendas.

## 🔄 Fluxo de Estados

### Antes da Implementação
```
CSV → Em Processamento
```

### Depois da Implementação
```
CSV → Em Pagamento na Fábrica → Em Processamento
```

## 🆕 Novo Estado: "Em Pagamento na Fábrica"

### Detalhes do Estado
- **Key**: `em_pagamento_fabrica`
- **Nome**: "Em Pagamento na Fábrica"
- **Cor**: `#FF9800` (Laranja)
- **Descrição**: Encomenda exportada para CSV, aguardando confirmação de pagamento à fábrica

### Regra de Negócio
Quando as encomendas são exportadas para CSV, elas automaticamente mudam para o estado "Em Pagamento na Fábrica". Neste estado:
- O administrador deve confirmar o pagamento à fábrica
- Um botão "Marcar como Pago" fica disponível no painel de administração
- Após marcar como pago, a encomenda muda automaticamente para "Em Processamento"

## 🛠️ Implementação Técnica

### 1. Migration SQL
Arquivo: `add_factory_payment_state.sql`

```sql
INSERT INTO "order_states" ("key", "name", "color", "description") VALUES
('em_pagamento_fabrica', 'Em Pagamento na Fábrica', '#FF9800', 'Encomenda exportada para CSV, aguardando confirmação de pagamento à fábrica')
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "color" = EXCLUDED."color",
  "description" = EXCLUDED."description",
  "updated_at" = NOW();
```

### 2. Backend - Exportação CSV
Arquivo: `netlify/functions/exportorders.js`

**Alteração na linha 262-266:**
```javascript
// Update status of exported orders to 'em_pagamento_fabrica'
await prisma.order.updateMany({
  where: { id: { in: orderIds } },
  data: { status: 'em_pagamento_fabrica' },
});
```

### 3. Frontend - Botão "Marcar como Pago"
Arquivo: `FEfutscore/src/pages/AdminPanel.tsx`

**Nova função (linhas 747-756):**
```typescript
const handleMarkFactoryPaid = async (orderId: string) => {
  try {
    await dispatch(updateOrderStatus({ orderId, status: 'em_processamento' }));
    dispatch(fetchOrders({ page: currentPage, limit: 10 }));
    alert('Pagamento à fábrica confirmado! Encomenda em processamento.');
  } catch (err) {
    alert('Falha ao marcar pagamento como pago');
  }
};
```

**Renderização do botão (linhas 1480-1488):**
```typescript
{order.status === 'em_pagamento_fabrica' && (
  <Button 
    onClick={() => handleMarkFactoryPaid(order.id.toString())} 
    color="success" 
    variant="contained"
  >
    Marcar como Pago
  </Button>
)}
```

## 📝 Instruções de Uso

### Para Administradores

1. **Exportar Encomendas para CSV**
   - Marque as encomendas desejadas como "CSV"
   - Clique em "Exportar para CSV"
   - As encomendas mudarão automaticamente para "Em Pagamento na Fábrica"

2. **Confirmar Pagamento à Fábrica**
   - Filtre as encomendas pelo estado "Em Pagamento na Fábrica"
   - Quando o pagamento à fábrica for confirmado, clique no botão "Marcar como Pago"
   - A encomenda mudará automaticamente para "Em Processamento"

## 🔧 Deploy

### Passo 1: Executar Migration
Execute o script SQL no seu banco de dados:
```bash
psql -U your_user -d your_database -f add_factory_payment_state.sql
```

### Passo 2: Deploy do Backend
```bash
cd BEfutscore
npm run deploy
```

### Passo 3: Deploy do Frontend
```bash
cd FEfutscore
npm run build
npm run deploy
```

## ✅ Checklist de Deployment

- [ ] Executar `add_factory_payment_state.sql` na base de dados
- [ ] Fazer deploy do backend (Netlify Functions)
- [ ] Fazer deploy do frontend (Build React)
- [ ] Verificar que o novo estado aparece no painel de admin
- [ ] Testar o fluxo completo: CSV → Em Pagamento na Fábrica → Em Processamento
- [ ] Verificar que o botão "Marcar como Pago" aparece corretamente

## 🎯 Estados Relacionados

| Estado | Key | Quando Usar |
|--------|-----|-------------|
| CSV | `csv` | Encomenda marcada para exportação |
| Em Pagamento na Fábrica | `em_pagamento_fabrica` | Após exportar CSV, aguardando pagamento |
| Em Processamento | `em_processamento` | Após confirmar pagamento à fábrica |

## 📊 Fluxo Visual

```
┌─────────────────┐
│   Encomendas    │
│   Normais       │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Marcar como    │
│      CSV        │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Exportar CSV   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Em Pagamento   │
│   na Fábrica    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Marcar como Pago│
└────────┬────────┘
         │
         v
┌─────────────────┐
│     Em          │
│  Processamento  │
└─────────────────┘
```

## 🐛 Troubleshooting

### Problema: O novo estado não aparece
**Solução**: Verifique se executou o script SQL `add_factory_payment_state.sql`

### Problema: Botão "Marcar como Pago" não aparece
**Solução**: Limpe o cache do navegador e recarregue a página. Certifique-se de que a encomenda está no estado `em_pagamento_fabrica`

### Problema: Erro ao marcar como pago
**Solução**: Verifique que o estado `em_processamento` existe na tabela `order_states`

