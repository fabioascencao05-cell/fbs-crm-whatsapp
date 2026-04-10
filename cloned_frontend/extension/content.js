// FBS CRM - Content Script for WhatsApp Web
// Injects the CRM UI components into the WhatsApp Web DOM

(function() {
  'use strict';

  // Wait for WhatsApp Web to fully load
  function waitForWA() {
    const app = document.querySelector('#app');
    if (app) {
      initCRM();
    } else {
      setTimeout(waitForWA, 500);
    }
  }

  // SVG icons (inline to avoid external dependencies)
  const icons = {
    kanban: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="10" rx="1"/></svg>',
    inbox: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    tags: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
    settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    moon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
    sun: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    image: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
    mic: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
    zap: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
    user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    msgCircle: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
  };

  // State
  let state = {
    activeView: 'chat', // 'chat' | 'kanban'
    showContactPanel: false,
    darkMode: true,
    contactForm: { nome: '', email: '', notas: '' },
    selectedTags: [],
  };

  // Mock data
  const labels = [
    { id: '1', name: 'Inbox', color: '#25D366' },
    { id: '2', name: 'Aprovado', color: '#00a884' },
    { id: '3', name: 'Fornecedor', color: '#53bdeb' },
    { id: '4', name: 'Em Negociação', color: '#f59e0b' },
  ];

  const mockContacts = [
    { id: '1', name: 'João Silva', phone: '+55 11 99999-0001', lastMsg: 'Quero 50 camisetas personalizadas', tags: ['Inbox'], avatar: 'JS' },
    { id: '2', name: 'Maria Santos', phone: '+55 21 98888-0002', lastMsg: 'Orçamento aprovado!', tags: ['Aprovado'], avatar: 'MS' },
    { id: '3', name: 'Pedro Costa', phone: '+55 31 97777-0003', lastMsg: 'Enviei as artes por email', tags: ['Fornecedor'], avatar: 'PC' },
    { id: '4', name: 'Ana Oliveira', phone: '+55 41 96666-0004', lastMsg: 'Podemos negociar o prazo?', tags: ['Em Negociação', 'Inbox'], avatar: 'AO' },
    { id: '5', name: 'Carlos Lima', phone: '+55 51 95555-0005', lastMsg: 'Preciso de uniformes escolares', tags: ['Inbox'], avatar: 'CL' },
    { id: '6', name: 'Fernanda Souza', phone: '+55 61 94444-0006', lastMsg: 'Pagamento via PIX', tags: ['Aprovado', 'Fornecedor'], avatar: 'FS' },
  ];

  function initCRM() {
    // Create root container
    const root = document.createElement('div');
    root.id = 'fbs-crm-root';
    document.body.appendChild(root);

    render();
  }

  function render() {
    const root = document.getElementById('fbs-crm-root');
    if (!root) return;

    root.innerHTML = '';

    // 1. Side Nav
    root.appendChild(createSideNav());

    // 2. Chat Toolbar (visible when in chat view)
    if (state.activeView === 'chat') {
      root.appendChild(createChatToolbar());
    }

    // 3. Contact Panel (toggleable)
    if (state.showContactPanel) {
      root.appendChild(createContactPanel());
    }

    // 4. Kanban Board (replaces chat)
    if (state.activeView === 'kanban') {
      root.appendChild(createKanbanBoard());
    }
  }

  function createSideNav() {
    const nav = document.createElement('div');
    nav.className = 'fbs-sidenav';

    // Logo
    const logo = document.createElement('div');
    logo.className = 'fbs-sidenav-logo';
    logo.textContent = 'FBS';
    nav.appendChild(logo);

    // Nav buttons
    const navItems = [
      { id: 'chat', icon: icons.inbox, label: 'Inbox' },
      { id: 'kanban', icon: icons.kanban, label: 'Kanban' },
      { id: 'tags', icon: icons.tags, label: 'Etiquetas', action: () => { state.showContactPanel = !state.showContactPanel; render(); } },
      { id: 'settings', icon: icons.settings, label: 'Configurações' },
    ];

    navItems.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'fbs-sidenav-btn' + (state.activeView === item.id ? ' active' : '');
      btn.innerHTML = item.icon;
      btn.title = item.label;
      btn.onclick = item.action || (() => {
        state.activeView = item.id === 'settings' ? state.activeView : item.id;
        render();
      });
      nav.appendChild(btn);
    });

    // Spacer
    const spacer = document.createElement('div');
    spacer.className = 'fbs-sidenav-spacer';
    nav.appendChild(spacer);

    // Dark mode toggle
    const darkBtn = document.createElement('button');
    darkBtn.className = 'fbs-sidenav-btn';
    darkBtn.innerHTML = state.darkMode ? icons.sun : icons.moon;
    darkBtn.title = 'Alternar tema';
    darkBtn.onclick = () => { state.darkMode = !state.darkMode; render(); };
    nav.appendChild(darkBtn);

    // Contact panel toggle
    const contactBtn = document.createElement('button');
    contactBtn.className = 'fbs-sidenav-btn' + (state.showContactPanel ? ' active' : '');
    contactBtn.innerHTML = icons.user;
    contactBtn.title = 'Perfil do Contato';
    contactBtn.onclick = () => { state.showContactPanel = !state.showContactPanel; render(); };
    nav.appendChild(contactBtn);

    return nav;
  }

  function createContactPanel() {
    const panel = document.createElement('div');
    panel.className = 'fbs-contact-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'fbs-contact-header';

    const avatar = document.createElement('div');
    avatar.className = 'fbs-contact-avatar';
    avatar.textContent = 'JS';

    const info = document.createElement('div');
    info.style.flex = '1';
    info.innerHTML = '<div class="fbs-contact-name">João Silva</div><div class="fbs-contact-phone">+55 11 99999-0001</div>';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fbs-toolbar-btn';
    closeBtn.innerHTML = icons.x;
    closeBtn.onclick = () => { state.showContactPanel = false; render(); };

    header.appendChild(avatar);
    header.appendChild(info);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Name field
    panel.appendChild(createField('Nome', 'input', state.contactForm.nome, v => { state.contactForm.nome = v; }));

    // Email field
    panel.appendChild(createField('E-mail', 'input', state.contactForm.email, v => { state.contactForm.email = v; }));

    // Notes field
    panel.appendChild(createField('Anotações', 'textarea', state.contactForm.notas, v => { state.contactForm.notas = v; }));

    // Tags section
    const tagsSection = document.createElement('div');
    tagsSection.className = 'fbs-contact-section';

    const tagsLabel = document.createElement('div');
    tagsLabel.className = 'fbs-contact-label';
    tagsLabel.textContent = 'Etiquetas';
    tagsSection.appendChild(tagsLabel);

    const tagsContainer = document.createElement('div');
    tagsContainer.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';

    labels.forEach(label => {
      const tag = document.createElement('span');
      const isSelected = state.selectedTags.includes(label.id);
      tag.className = 'fbs-tag-badge' + (isSelected ? ' selected' : '');
      tag.style.cssText = `background:${label.color}20;color:${label.color};${isSelected ? 'border-color:' + label.color : ''}`;
      tag.textContent = label.name;
      tag.onclick = () => {
        if (isSelected) {
          state.selectedTags = state.selectedTags.filter(id => id !== label.id);
        } else {
          state.selectedTags.push(label.id);
        }
        render();
      };
      tagsContainer.appendChild(tag);
    });

    tagsSection.appendChild(tagsContainer);
    panel.appendChild(tagsSection);

    return panel;
  }

  function createField(label, type, value, onChange) {
    const section = document.createElement('div');
    section.className = 'fbs-contact-section';

    const lbl = document.createElement('div');
    lbl.className = 'fbs-contact-label';
    lbl.textContent = label;
    section.appendChild(lbl);

    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    input.className = type === 'textarea' ? 'fbs-contact-textarea' : 'fbs-contact-input';
    input.value = value;
    input.placeholder = `Digite ${label.toLowerCase()}...`;
    input.oninput = (e) => onChange(e.target.value);
    section.appendChild(input);

    return section;
  }

  function createKanbanBoard() {
    const overlay = document.createElement('div');
    overlay.className = 'fbs-kanban-overlay';

    // Header
    const header = document.createElement('div');
    header.className = 'fbs-kanban-header';
    header.innerHTML = `
      <div>
        <div class="fbs-kanban-title">Pipeline</div>
        <div class="fbs-kanban-subtitle">${mockContacts.length} contatos no funil</div>
      </div>
    `;
    overlay.appendChild(header);

    // Columns container
    const columns = document.createElement('div');
    columns.className = 'fbs-kanban-columns';

    labels.forEach(label => {
      const contacts = mockContacts.filter(c => c.tags.includes(label.name));
      const col = document.createElement('div');
      col.className = 'fbs-kanban-column';

      // Column header
      const colHeader = document.createElement('div');
      colHeader.className = 'fbs-kanban-col-header';
      colHeader.innerHTML = `
        <div class="fbs-kanban-col-title">
          <span class="fbs-kanban-col-accent" style="background:${label.color}"></span>
          ${label.name}
        </div>
        <span class="fbs-kanban-col-count">${contacts.length}</span>
      `;
      col.appendChild(colHeader);

      // Column body
      const colBody = document.createElement('div');
      colBody.className = 'fbs-kanban-col-body';

      contacts.forEach(contact => {
        const card = document.createElement('div');
        card.className = 'fbs-kanban-card';

        const tagsHtml = contact.tags.map(t => {
          const lbl = labels.find(l => l.name === t);
          return `<span class="fbs-kanban-card-tag" style="background:${lbl ? lbl.color + '20' : '#3b4a54'};color:${lbl ? lbl.color : '#8696a0'}">${t}</span>`;
        }).join('');

        card.innerHTML = `
          <div class="fbs-kanban-card-top">
            <div class="fbs-kanban-card-avatar">${contact.avatar}</div>
            <div style="flex:1;min-width:0">
              <div class="fbs-kanban-card-name">${contact.name}</div>
              <div class="fbs-kanban-card-msg">${icons.msgCircle} ${contact.lastMsg}</div>
            </div>
          </div>
          <div class="fbs-kanban-card-tags">${tagsHtml}</div>
        `;

        colBody.appendChild(card);
      });

      col.appendChild(colBody);
      columns.appendChild(col);
    });

    overlay.appendChild(columns);
    return overlay;
  }

  function createChatToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'fbs-chat-toolbar';

    const buttons = [
      { icon: icons.image, label: 'Enviar Imagem', action: () => console.log('FBS CRM: Enviar imagem') },
      { icon: icons.mic, label: 'Enviar Áudio', action: () => console.log('FBS CRM: Enviar áudio') },
      null, // divider
      { icon: icons.zap, label: 'Respostas Rápidas', action: () => console.log('FBS CRM: Respostas rápidas') },
    ];

    buttons.forEach(btn => {
      if (!btn) {
        const div = document.createElement('div');
        div.className = 'fbs-toolbar-divider';
        toolbar.appendChild(div);
        return;
      }
      const el = document.createElement('button');
      el.className = 'fbs-toolbar-btn';
      el.innerHTML = btn.icon;
      el.title = btn.label;
      el.onclick = btn.action;
      toolbar.appendChild(el);
    });

    return toolbar;
  }

  // Start
  waitForWA();
})();
