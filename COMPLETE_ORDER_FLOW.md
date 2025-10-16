# Fluxo Completo de Encomendas

## 📋 Visão Geral

Este documento descreve o fluxo completo de gestão de encomendas, desde a criação até a entrega final.

## 🔄 Fluxo Completo de Estados

```
Pending (Pendente)
    ↓
    [Validar Pagamento]
    ↓
Enviar para a Fábrica
    ↓
    [Adicionar ao CSV]
    ↓
CSV
    ↓
    [Exportar CSV]
    ↓
Em Pagamento na Fábrica
    ↓
    [Marcar como Pago]
    ↓
Em Processamento
    ↓
Completed (Concluída) / Cancelled (Cancelada)
```

## 📊 Estados e Transições

### 1️⃣ **Pending (Pendente)**
- **Key**: `pending`
- **Cor**: Laranja
- **Descrição**: Encomenda criada e aguardando validação de pagamento
- **Ação Disponível**: Botão **"Validar Pagamento"** (Azul)
- **Próximo Estado**: `enviar_para_fabrica`

---

### 2️⃣ **Enviar para a Fábrica** 🆕
- **Key**: `enviar_para_fabrica`
- **Cor**: `#2196F3` (Azul)
- **Descrição**: Pagamento validado, encomenda pronta para ser enviada à fábrica
- **Ação Disponível**: Botão **"Adicionar ao CSV"** (Secundário)
- **Próximo Estado**: `csv`

---

### 3️⃣ **CSV**
- **Key**: `csv`
- **Cor**: Castanho
- **Descrição**: Encomenda marcada para exportação CSV
- **Ação Disponível**: Botão **"Exportar para CSV"** (no topo da página)
- **Próximo Estado**: `em_pagamento_fabrica` (automático ao exportar)

---

### 4️⃣ **Em Pagamento na Fábrica** 🆕
- **Key**: `em_pagamento_fabrica`
- **Cor**: `#FF9800` (Laranja)
- **Descrição**: Encomenda exportada para CSV, aguardando confirmação de pagamento à fábrica
- **Ação Disponível**: Botão **"Marcar como Pago"** (Verde)
- **Próximo Estado**: `em_processamento`

---

### 5️⃣ **Em Processamento**
- **Key**: `em_processamento`
- **Cor**: Azul
- **Descrição**: Encomenda em produção/processamento na fábrica
- **Ação Disponível**: Mudança manual de estado para `completed`
- **Próximo Estado**: `completed`

---

### 6️⃣ **Completed (Concluída)**
- **Key**: `completed`
- **Cor**: Verde
- **Descrição**: Encomenda finalizada e entregue
- **Estado Final**

---

### 7️⃣ **Cancelled (Cancelada)**
- **Key**: `cancelled`
- **Cor**: Vermelho
- **Descrição**: Encomenda cancelada
- **Estado Final**

---

## 🎯 Estados Especiais

### Para Analisar
- **Key**: `para_analizar`
- **Cor**: Roxo
- **Descrição**: Encomenda precisa de análise técnica antes de prosseguir
- **Uso**: Encomendas que precisam de verificação manual

### A Orçamentar
- **Key**: `a_orcamentar`
- **Cor**: Azul Escuro
- **Descrição**: Encomenda aguarda cálculo de preço final e orçamento
- **Uso**: Encomendas personalizadas sem preço definido
- **Ação**: Admin define o preço manualmente

### Em Pagamento (Cliente)
- **Key**: `em_pagamento`
- **Cor**: Vermelho
- **Descrição**: Encomenda aguarda pagamento do cliente
- **Ação**: Cliente adiciona prova de pagamento
- **Próximo Estado**: `pending`

---

## 🛠️ Implementação Técnica

### Scripts SQL de Migration

#### 1. Estado "Enviar para a Fábrica"
**Arquivo**: `add_send_to_factory_state.sql`

```sql
INSERT INTO "order_states" ("key", "name", "color", "description") VALUES
('enviar_para_fabrica', 'Enviar para a Fábrica', '#2196F3', 'Pagamento validado, encomenda pronta para ser enviada à fábrica')
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "color" = EXCLUDED."color",
  "description" = EXCLUDED."description",
  "updated_at" = NOW();
```

#### 2. Estado "Em Pagamento na Fábrica"
**Arquivo**: `add_factory_payment_state.sql`

```sql
INSERT INTO "order_states" ("key", "name", "color", "description") VALUES
('em_pagamento_fabrica', 'Em Pagamento na Fábrica', '#FF9800', 'Encomenda exportada para CSV, aguardando confirmação de pagamento à fábrica')
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "color" = EXCLUDED."color",
  "description" = EXCLUDED."description",
  "updated_at" = NOW();
```

### Frontend - Botões de Ação

**Arquivo**: `FEfutscore/src/pages/AdminPanel.tsx`

```typescript
// 1. Validar Pagamento (pending -> enviar_para_fabrica)
const handleValidatePayment = async (orderId: string) => {
  try {
    await dispatch(updateOrderStatus({ orderId, status: 'enviar_para_fabrica' }));
    dispatch(fetchOrders({ page: currentPage, limit: 10 }));
    alert('Pagamento validado! Encomenda pronta para enviar à fábrica.');
  } catch (err) {
    alert('Falha ao validar pagamento');
  }
};

// 2. Adicionar ao CSV (enviar_para_fabrica -> csv)
const handleAddToCSV = async (orderId: string) => {
  try {
    await dispatch(updateOrderStatus({ orderId, status: 'csv' }));
    dispatch(fetchOrders({ page: currentPage, limit: 10 }));
  } catch (err) {
    alert('Falha ao marcar encomenda para CSV');
  }
};

// 3. Marcar como Pago (em_pagamento_fabrica -> em_processamento)
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

### Renderização Condicional dos Botões

```typescript
{order.status === 'pending' && (
  <Button 
    onClick={() => handleValidatePayment(order.id.toString())} 
    color="primary" 
    variant="contained"
  >
    Validar Pagamento
  </Button>
)}

{order.status === 'enviar_para_fabrica' && (
  <Button 
    onClick={() => handleAddToCSV(order.id.toString())} 
    color="secondary" 
    variant="outlined"
  >
    Adicionar ao CSV
  </Button>
)}

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

---

## 📝 Instruções de Uso - Passo a Passo

### Para Administradores

#### **Etapa 1: Validar Pagamento**
1. Filtre encomendas pelo estado "Pending"
2. Verifique a prova de pagamento do cliente
3. Clique em **"Validar Pagamento"**
4. Estado muda para "Enviar para a Fábrica"

#### **Etapa 2: Adicionar ao CSV**
1. Filtre encomendas pelo estado "Enviar para a Fábrica"
2. Clique em **"Adicionar ao CSV"**
3. Estado muda para "CSV"

#### **Etapa 3: Exportar para CSV**
1. Filtre encomendas pelo estado "CSV"
2. Clique no botão **"Exportar para CSV"** (no topo)
3. Baixa o ficheiro Excel com todas as encomendas
4. Estados mudam automaticamente para "Em Pagamento na Fábrica"

#### **Etapa 4: Confirmar Pagamento à Fábrica**
1. Filtre encomendas pelo estado "Em Pagamento na Fábrica"
2. Após confirmar o pagamento à fábrica
3. Clique em **"Marcar como Pago"**
4. Estado muda para "Em Processamento"

#### **Etapa 5: Finalizar**
1. Quando a encomenda for entregue
2. Mude manualmente o estado para "Concluída"

---

## 🔧 Deploy

### Ordem de Execução

1. **Executar Migrations SQL**
   ```bash
   psql -U your_user -d your_database -f BEfutscore/add_send_to_factory_state.sql
   psql -U your_user -d your_database -f BEfutscore/add_factory_payment_state.sql
   ```

2. **Deploy do Backend**
   ```bash
   cd BEfutscore
   npm run deploy
   ```

3. **Deploy do Frontend**
   ```bash
   cd FEfutscore
   npm run build
   npm run deploy
   ```

---

## ✅ Checklist de Deployment

- [ ] Executar `add_send_to_factory_state.sql`
- [ ] Executar `add_factory_payment_state.sql`
- [ ] Verificar que ambos os estados foram criados na BD
- [ ] Deploy do backend
- [ ] Deploy do frontend
- [ ] Testar fluxo completo:
  - [ ] Pending → Validar Pagamento → Enviar para a Fábrica
  - [ ] Enviar para a Fábrica → Adicionar ao CSV → CSV
  - [ ] CSV → Exportar → Em Pagamento na Fábrica
  - [ ] Em Pagamento na Fábrica → Marcar como Pago → Em Processamento

---

## 📊 Fluxo Visual Completo

```
┌─────────────────────┐
│   CLIENTE CRIA      │
│    ENCOMENDA        │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│   Em Pagamento      │
│    (Cliente)        │
└──────────┬──────────┘
           │
           │ Cliente adiciona
           │ prova de pagamento
           v
┌─────────────────────┐
│     PENDING         │
│    (Pendente)       │
└──────────┬──────────┘
           │
           │ [Admin: Validar Pagamento] 🆕
           v
┌─────────────────────┐
│  Enviar para a      │
│     Fábrica         │ 🆕
└──────────┬──────────┘
           │
           │ [Admin: Adicionar ao CSV]
           v
┌─────────────────────┐
│        CSV          │
└──────────┬──────────┘
           │
           │ [Admin: Exportar CSV]
           │ (Automático)
           v
┌─────────────────────┐
│  Em Pagamento na    │
│      Fábrica        │ 🆕
└──────────┬──────────┘
           │
           │ [Admin: Marcar como Pago] 🆕
           v
┌─────────────────────┐
│      Em             │
│   Processamento     │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│    CONCLUÍDA        │
└─────────────────────┘
```

---

## 🎨 Cores dos Estados

| Estado | Cor | Código Hex |
|--------|-----|------------|
| Pending | Laranja | (dinâmico) |
| **Enviar para a Fábrica** 🆕 | **Azul** | **#2196F3** |
| CSV | Castanho | (dinâmico) |
| **Em Pagamento na Fábrica** 🆕 | **Laranja** | **#FF9800** |
| Em Processamento | Azul | (dinâmico) |
| Concluída | Verde | (dinâmico) |
| Cancelada | Vermelho | (dinâmico) |

---

## 🐛 Troubleshooting

### Problema: Botão "Validar Pagamento" não aparece
**Solução**: Verifique se a encomenda está no estado `pending`

### Problema: Não consigo adicionar ao CSV
**Solução**: Verifique se a encomenda está no estado `enviar_para_fabrica`

### Problema: Estados novos não aparecem
**Solução**: Execute os scripts SQL de migration e reinicie o servidor

### Problema: Erro ao validar pagamento
**Solução**: Verifique que o estado `enviar_para_fabrica` existe na tabela `order_states`

