# Sistema de Configurações Globais da Aplicação

## 📋 Visão Geral

Este documento descreve o novo sistema de configurações globais que substitui o localStorage local por um sistema centralizado na base de dados, com cache otimizado.

## 🔄 Mudanças Implementadas

### **Antes (LocalStorage)**
- ❌ Configurações apenas para o utilizador local
- ❌ Perdidas ao limpar cache do navegador
- ❌ Não sincronizadas entre dispositivos
- ❌ Renderizações constantes

### **Depois (Sistema Global)**
- ✅ Configurações globais para toda a plataforma
- ✅ Persistidas na base de dados
- ✅ Sincronizadas entre todos os utilizadores
- ✅ Cache otimizado (1 hora)
- ✅ Carregamento único na inicialização

## 🛠️ Implementação Técnica

### **1. Base de Dados**
**Arquivo**: `create_app_settings_table.sql`

```sql
CREATE TABLE "app_settings" (
    "id" SERIAL PRIMARY KEY,
    "key" VARCHAR(100) UNIQUE NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);
```

**Configurações Iniciais**:
- `logo`: Logo da aplicação em base64
- `background_image`: Imagem de fundo em base64
- `logo_height`: Altura do logo em pixels
- `background_opacity`: Opacidade da imagem de fundo
- `navbar_color`: Cor de fundo da navbar
- `navbar_text_color`: Cor do texto da navbar
- `footer_color`: Cor de fundo do footer
- `footer_text_color`: Cor do texto do footer
- `primary_color`: Cor primária da aplicação
- `secondary_color`: Cor secundária da aplicação

### **2. API Backend**

#### **getAppSettings.js**
- **Método**: GET
- **Cache**: 1 hora (`Cache-Control: max-age=3600`)
- **Resposta**: Todas as configurações em formato JSON
- **Uso**: Carregamento inicial da aplicação

#### **updateAppSettings.js**
- **Método**: PUT
- **Autenticação**: Token de admin obrigatório
- **Funcionalidade**: Atualiza configurações na base de dados
- **Cache**: Limpa cache automaticamente

### **3. Frontend**

#### **AppInitializer.tsx** (Novo)
- **Função**: Carrega configurações uma única vez no início
- **Cache**: Evita renderizações desnecessárias
- **Loading**: Mostra spinner durante carregamento inicial
- **Error Handling**: Continua com configurações padrão em caso de erro

#### **appSettingsSlice.ts** (Atualizado)
- **API Integration**: Usa endpoints em vez de localStorage
- **Transformação**: Converte entre formatos de BD e interface
- **CSS Application**: Aplica configurações via CSS custom properties

#### **App.tsx** (Atualizado)
- **AppInitializer**: Substitui AppBackground
- **Estrutura**: Configurações carregadas antes de renderizar a app

## 🚀 Fluxo de Funcionamento

### **1. Inicialização da Aplicação**
```
App Start → AppInitializer → fetchAppSettings() → API Call → Cache (1h)
```

### **2. Aplicação de Configurações**
```
Settings Loaded → applySettingsToCSS() → CSS Custom Properties → Visual Update
```

### **3. Atualização de Configurações (Admin)**
```
Admin Changes → updateAppSettings() → API Call → DB Update → Cache Clear → Visual Update
```

## 📊 Cache Strategy

### **HTTP Cache Headers**
```javascript
// GET request
'Cache-Control': 'public, max-age=3600, s-maxage=3600'

// PUT request (after update)
'Cache-Control': 'no-cache, no-store, must-revalidate'
```

### **Frontend Cache**
- Configurações carregadas apenas uma vez por sessão
- Redux store mantém estado durante navegação
- CSS custom properties aplicadas imediatamente

## 🔧 Deploy Instructions

### **Passo 1: Base de Dados**
```bash
psql -U your_user -d your_database -f BEfutscore/create_app_settings_table.sql
```

### **Passo 2: Backend**
```bash
cd BEfutscore
npm run deploy
```

### **Passo 3: Frontend**
```bash
cd FEfutscore
npm run build
npm run deploy
```

## ✅ Checklist de Deployment

- [ ] Executar script SQL na base de dados
- [ ] Verificar que tabela `app_settings` foi criada
- [ ] Deploy do backend (Netlify Functions)
- [ ] Deploy do frontend
- [ ] Testar carregamento inicial da aplicação
- [ ] Testar personalização como admin
- [ ] Verificar cache (não deve fazer requests desnecessários)
- [ ] Testar em diferentes navegadores/dispositivos

## 🎯 Benefícios

### **Performance**
- ✅ Cache HTTP de 1 hora reduz requests
- ✅ Carregamento único evita renderizações
- ✅ CSS custom properties para mudanças instantâneas

### **Consistência**
- ✅ Configurações iguais para todos os utilizadores
- ✅ Sincronização automática entre dispositivos
- ✅ Persistência garantida na base de dados

### **Manutenibilidade**
- ✅ Configurações centralizadas
- ✅ Fácil backup e restore
- ✅ Logs de alterações via timestamps

## 🐛 Troubleshooting

### **Problema: Configurações não carregam**
**Soluções**:
1. Verificar se tabela `app_settings` existe
2. Verificar se API endpoints estão deployados
3. Verificar console para erros de rede
4. Verificar se há configurações na BD

### **Problema: Mudanças não se aplicam**
**Soluções**:
1. Verificar se utilizador é admin
2. Verificar token de autenticação
3. Limpar cache do navegador
4. Verificar se API retorna sucesso

### **Problema: Cache não funciona**
**Soluções**:
1. Verificar headers HTTP na rede
2. Verificar se CDN respeita cache headers
3. Verificar se browser suporta cache
4. Testar em modo incógnito

## 📝 Notas de Desenvolvimento

### **Estrutura de Dados**
```typescript
interface AppSettings {
  logo?: string;                    // base64 image
  backgroundImage?: string;         // base64 image  
  logoHeight?: number;              // pixels
  backgroundOpacity?: number;       // 0.0 - 1.0
  navbarColor?: string;             // hex color
  navbarTextColor?: string;         // hex color
  footerColor?: string;             // hex color
  footerTextColor?: string;         // hex color
  primaryColor?: string;            // hex color
  secondaryColor?: string;          // hex color
}
```

### **CSS Custom Properties**
```css
:root {
  --app-logo: url(data:image/...);
  --app-logo-height: 40px;
  --app-background: url(data:image/...);
  --app-background-opacity: 0.1;
  --navbar-color: #1976d2;
  --navbar-text-color: #ffffff;
  --footer-color: #f5f5f5;
  --footer-text-color: #666666;
  --primary-color: #1976d2;
  --secondary-color: #dc004e;
}
```

### **API Response Format**
```json
{
  "success": true,
  "data": {
    "logo": "data:image/png;base64,...",
    "background_image": "data:image/jpg;base64,...",
    "logo_height": "40",
    "background_opacity": "0.1",
    "navbar_color": "#1976d2",
    "navbar_text_color": "#ffffff",
    "footer_color": "#f5f5f5",
    "footer_text_color": "#666666",
    "primary_color": "#1976d2",
    "secondary_color": "#dc004e"
  }
}
```

## 🚀 Próximos Passos

### **Melhorias Futuras**
- [ ] Sistema de versionamento de configurações
- [ ] Rollback de configurações
- [ ] Preview de mudanças antes de aplicar
- [ ] Configurações por ambiente (dev/prod)
- [ ] API de webhooks para notificar mudanças
- [ ] Métricas de uso das configurações

---

**Sistema implementado com sucesso!** 🎉
As configurações agora são globais, persistentes e otimizadas para performance.
