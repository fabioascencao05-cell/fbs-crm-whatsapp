

## Extensão Chrome CRM para WhatsApp Web

### Resumo
Criar os arquivos de uma extensão Chrome (Manifest V3) dentro do projeto, contendo 4 componentes React visuais injetáveis no DOM do WhatsApp Web, empacotados como ZIP para download na página de Configurações.

### Arquitetura

```text
extension/
├── manifest.json
├── content.css
├── content.js          (monta React root no DOM do WA)
├── popup.html
└── src/
    ├── index.tsx        (entry point, cria container no DOM)
    ├── App.tsx          (gerencia views: chat vs kanban)
    ├── SideNav.tsx      (menu lateral esquerdo flutuante)
    ├── ContactPanel.tsx (painel direito de perfil)
    ├── KanbanBoard.tsx  (visão kanban tela cheia)
    ├── ChatToolbar.tsx  (barra de atalhos acima do input)
    └── styles.css       (Tailwind compilado, dark theme WA)
```

### Componentes

**1. SideNav** -- Barra fixa esquerda, `z-index: 99999`, fundo `#111b21`, ícones Lucide (Kanban, Inbox, Tags, Settings, Dark toggle), item ativo com `#25D366`.

**2. ContactPanel** -- Overlay direito sobre dados do contato WA. Inputs: Nome, Email, Notas, seletor de tags com badges coloridas. Tudo em state local (sem API).

**3. KanbanBoard** -- Substitui painel central quando ativo. Colunas estáticas: "Inbox", "Aprovado", "Fornecedor", "Em Negociação". Cards com avatar placeholder, nome, ícone de última mensagem, badges de etiquetas. Fundo `#202c33`, cards `#2a3942`.

**4. ChatToolbar** -- Barra fina horizontal acima do input do WA. Botões: Imagem, Áudio, Respostas Rápidas. Todos com `onClick={() => console.log('ação')}`.

### Paleta Dark (WhatsApp)
- `#111b21` (bg principal), `#202c33` (painéis), `#2a3942` (inputs/cards)
- `#3b4a54` (bordas), `#e9edef` (texto), `#8696a0` (muted)
- `#25D366` (verde destaque)

### Entrega
- Build Vite gera bundle em `extension/dist/`
- ZIP empacotado em `public/crm-extension.zip`
- Botão de download + instruções de instalação adicionados em `SettingsPage.tsx`

### Arquivos Modificados
- **Criados**: `extension/manifest.json`, `extension/src/*.tsx` (6 componentes), `extension/vite.config.ts`, `extension/tailwind.config.ts`, `extension/package.json`
- **Modificado**: `src/pages/SettingsPage.tsx` (seção de download da extensão)

### Restrições
- Zero lógica de backend/API/webhook
- Apenas visual e state local React
- CRM existente intocado

