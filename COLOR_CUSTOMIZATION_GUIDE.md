# Guia de Personalização de Cores

## 📋 Visão Geral

Este documento descreve a nova funcionalidade de personalização de cores da interface da aplicação FutScore.

## 🎨 Cores Personalizáveis

### 1. **Cores da Barra de Navegação**
- **Cor de Fundo**: Define a cor de fundo da navbar
- **Cor do Texto**: Define a cor do texto e links da navbar

### 2. **Cores do Footer**
- **Cor de Fundo**: Define a cor de fundo do footer
- **Cor do Texto**: Define a cor do texto do footer

### 3. **Cores Principais**
- **Cor Primária**: Usada em botões principais e elementos destacados
- **Cor Secundária**: Usada em botões secundários e elementos de apoio

## 🛠️ Como Usar

### Aceder à Personalização
1. Entre no **Painel de Administração**
2. Clique no separador **"Personalização"**
3. Na secção **"Cores da Interface"**, clique em **"Personalizar Cores"**

### Configurar Cores
1. **Cores da Navbar**:
   - Clique no color picker ao lado de "Cor de Fundo da Navbar"
   - Escolha a cor desejada
   - Repita para "Cor do Texto da Navbar"

2. **Cores do Footer**:
   - Clique no color picker ao lado de "Cor de Fundo do Footer"
   - Escolha a cor desejada
   - Repita para "Cor do Texto do Footer"

3. **Cores Principais**:
   - Configure a "Cor Primária" para botões principais
   - Configure a "Cor Secundária" para botões secundários

### Pré-visualização
- Veja a pré-visualização em tempo real no dialog
- A secção "Pré-visualização em Tempo Real" mostra como ficará a interface
- As cores são aplicadas imediatamente após clicar em "Guardar Cores"

### Restaurar Padrões
- Clique em **"Restaurar Padrões"** para voltar às cores originais
- Isto aplicará as cores padrão do Material-UI

## 🎯 Cores Padrão

| Elemento | Cor Padrão | Hex |
|----------|------------|-----|
| Navbar (Fundo) | Azul | `#1976d2` |
| Navbar (Texto) | Branco | `#ffffff` |
| Footer (Fundo) | Cinza Claro | `#f5f5f5` |
| Footer (Texto) | Cinza | `#666666` |
| Primária | Azul | `#1976d2` |
| Secundária | Rosa | `#dc004e` |

## 💾 Persistência

- As cores são guardadas automaticamente no `localStorage` do navegador
- As configurações persistem entre sessões
- As cores são aplicadas globalmente através de CSS custom properties

## 🔧 Implementação Técnica

### CSS Custom Properties
As cores são aplicadas usando CSS custom properties:
```css
:root {
  --navbar-color: #1976d2;
  --navbar-text-color: #ffffff;
  --footer-color: #f5f5f5;
  --footer-text-color: #666666;
  --primary-color: #1976d2;
  --secondary-color: #dc004e;
}
```

### Estrutura de Dados
```typescript
interface AppSettings {
  logo?: string;
  backgroundImage?: string;
  logoHeight?: number;
  backgroundOpacity?: number;
  navbarColor?: string;
  navbarTextColor?: string;
  footerColor?: string;
  footerTextColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
}
```

### Redux Store
- Estado gerido através do `appSettingsSlice`
- Persistência via `localStorage`
- Aplicação automática de CSS custom properties

## 📱 Interface de Usuário

### Secção Principal
- **Título**: "Cores da Interface"
- **Descrição**: Explicação sobre as funcionalidades
- **Pré-visualização**: Mostra as cores atuais
- **Botões**: "Personalizar Cores" e "Restaurar Padrões"

### Dialog de Personalização
- **Organização**: Dividido em secções (Navbar, Footer, Cores Principais)
- **Color Pickers**: Inputs HTML5 tipo "color" com preview
- **Pré-visualização**: Visualização em tempo real
- **Ações**: Cancelar ou Guardar

### Pré-visualização em Tempo Real
- **Navbar**: Barra simulada com as cores escolhidas
- **Footer**: Footer simulado com as cores escolhidas
- **Botões**: Exemplos de botões primários e secundários

## 🎨 Dicas de Design

### Boas Práticas
1. **Contraste**: Mantenha bom contraste entre texto e fundo
2. **Consistência**: Use cores complementares
3. **Acessibilidade**: Evite combinações que dificultem a leitura
4. **Identidade**: Escolha cores que reflitam a marca

### Combinações Sugeridas
- **Azul + Branco**: Profissional e limpo
- **Verde + Branco**: Natural e confiável
- **Roxo + Branco**: Criativo e moderno
- **Cinza + Azul**: Sofisticado e neutro

## 🐛 Troubleshooting

### Problema: Cores não são aplicadas
**Solução**: 
- Verifique se clicou em "Guardar Cores"
- Limpe o cache do navegador
- Verifique se há erros no console

### Problema: Cores voltam ao padrão
**Solução**:
- As cores são guardadas no localStorage
- Verifique se o localStorage não foi limpo
- Tente recarregar a página

### Problema: Pré-visualização não funciona
**Solução**:
- Verifique se o JavaScript está habilitado
- Recarregue a página
- Verifique se há conflitos de CSS

## 📝 Notas de Desenvolvimento

### Futuras Melhorias
- [ ] Mais opções de cores (cores de hover, focus, etc.)
- [ ] Temas predefinidos
- [ ] Exportar/importar configurações de cores
- [ ] Modo escuro/claro
- [ ] Personalização de tipografia

### Limitações Atuais
- Cores aplicadas apenas via CSS custom properties
- Não afeta todos os componentes Material-UI
- Personalização limitada aos elementos principais

## 🚀 Deploy

### Não é necessário deploy do backend
Esta funcionalidade é completamente frontend e usa apenas localStorage.

### Deploy do frontend
```bash
cd FEfutscore
npm run build
npm run deploy
```

### Verificação pós-deploy
1. Aceder ao Painel de Admin
2. Ir à secção "Personalização"
3. Verificar se a secção "Cores da Interface" aparece
4. Testar a funcionalidade de personalização
5. Verificar se as cores são aplicadas corretamente

---

## ✅ Checklist de Funcionalidades

- [x] Interface de personalização de cores
- [x] Color pickers para todas as cores
- [x] Pré-visualização em tempo real
- [x] Persistência no localStorage
- [x] Aplicação automática via CSS custom properties
- [x] Botão para restaurar padrões
- [x] Validação de cores
- [x] Interface responsiva
- [x] Documentação completa

---

**Desenvolvido para FutScore** 🏆
