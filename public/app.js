let conversaAtual = null;
let todasConversas = [];
let respostasRapidas = [];

function switchTab(tab) {
    if(tab === 'chat') {
        document.getElementById('sec-chat').classList.remove('hidden');
        document.getElementById('sec-kanban').classList.add('hidden');
        document.getElementById('tab-chat').className = 'px-4 py-1.5 rounded-md bg-slate-700 text-slate-100 transition';
        document.getElementById('tab-kanban').className = 'px-4 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition flex items-center gap-2';
    } else {
        document.getElementById('sec-chat').classList.add('hidden');
        document.getElementById('sec-kanban').classList.remove('hidden');
        document.getElementById('tab-kanban').className = 'px-4 py-1.5 rounded-md bg-slate-700 text-slate-100 transition flex items-center gap-2';
        document.getElementById('tab-chat').className = 'px-4 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition';
        renderizarKanban();
    }
}

// Toasts
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bColor = type === 'success' ? 'bg-green-600' : type === 'info' ? 'bg-blue-600' : 'bg-red-600';
    const iName = type === 'success' ? 'check-circle' : type==='info' ? 'info' : 'alert-circle';
    
    toast.className = `toast-anim flex items-center gap-3 px-4 py-3 rounded shadow-lg text-white ${bColor}`;
    toast.innerHTML = `<i data-lucide="${iName}" class="h-5 w-5"></i> <span class="text-sm font-medium">${message}</span>`;
    
    container.appendChild(toast);
    lucide.createIcons({root: toast});
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 4000);
}

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

function renderTags(tagsString) {
    if(!tagsString) return '';
    return tagsString.split(',').map(t => {
        let clean = t.trim();
        if(!clean) return '';
        let colorClass = `tag-${clean}`;
        return `<span class="tag-badge ${colorClass}">${clean}</span>`;
    }).join(' ');
}

// ===================== KANBAN =====================
const kanbanCols = [
    { id: "Novos", color: "border-primary" },
    { id: "Em Orçamento", color: "border-yellow-500" },
    { id: "Aguardando Arte/Aprovação", color: "border-purple-500" },
    { id: "Em Produção", color: "border-blue-500" },
    { id: "Finalizado", color: "border-green-500" }
];

function renderizarKanban() {
    const container = document.getElementById('kanban-container');
    container.innerHTML = '';
    
    kanbanCols.forEach(col => {
        const divCol = document.createElement('div');
        divCol.className = 'kanban-col';
        divCol.innerHTML = `<div class="kanban-col-header border-b-2 ${col.color}"><span>${col.id}</span> <span class="text-xs bg-slate-700 px-2 rounded-full" id="count-${col.id}">0</span></div>`;
        
        const cardsCont = document.createElement('div');
        cardsCont.className = 'kanban-cards-container';
        cardsCont.id = `col-${col.id}`;
        cardsCont.ondragover = (e) => e.preventDefault();
        cardsCont.ondrop = (e) => dropKanban(e, col.id);
        
        // Populate
        const items = todasConversas.filter(c => (c.status_kanban || 'Novos') === col.id);
        document.getElementById(`count-${col.id}`) && (document.getElementById(`count-${col.id}`).innerText = items.length);
        
        items.forEach(c => {
            const card = document.createElement('div');
            card.className = 'kanban-card';
            card.draggable = true;
            card.ondragstart = (e) => e.dataTransfer.setData('text/plain', c.id);
            card.onclick = () => { switchTab('chat'); abrirChat(c); };
            
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <span class="font-bold text-slate-100 text-sm truncate">${c.nome || c.telefone}</span>
                    ${c.status_bot ? '<div class="w-2 h-2 rounded-full bg-whatsapp" title="Bot Ativo"></div>' : ''}
                </div>
                <div class="text-xs text-slate-400 mb-2 truncate">${c.ultima_mensagem || ''}</div>
                <div class="flex gap-1 flex-wrap">${renderTags(c.tags)}</div>
            `;
            cardsCont.appendChild(card);
        });
        
        divCol.appendChild(cardsCont);
        container.appendChild(divCol);
    });
}

async function dropKanban(e, novoStatus) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const conversa = todasConversas.find(c => c.id === id);
    if(conversa && (conversa.status_kanban || 'Novos') !== novoStatus) {
        conversa.status_kanban = novoStatus;
        renderizarKanban(); // Optimistic
        try {
            await fetch(`/api/conversas/${id}/kanban`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status: novoStatus})});
            showToast(`Movido para ${novoStatus}`, 'info');
        } catch(e) {}
    }
}

// ===================== TAGS =====================
function abrirModalTags() {
    if(!conversaAtual) return;
    document.getElementById('input-tags').value = conversaAtual.tags || '';
    document.getElementById('modal-tags').classList.remove('hidden');
    document.getElementById('modal-tags').classList.add('flex');
}
function fecharModalTags() {
    document.getElementById('modal-tags').classList.add('hidden');
    document.getElementById('modal-tags').classList.remove('flex');
}
async function salvarTags() {
    const val = document.getElementById('input-tags').value;
    try {
        await fetch(`/api/conversas/${conversaAtual.id}/tags`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({tags: val})});
        conversaAtual.tags = val;
        document.getElementById('chat-tags-display').innerHTML = renderTags(val);
        fecharModalTags();
        carregarConversas(); // recharge list
    } catch(e) { showToast('Erro', 'error'); }
}


// ===================== CONVERSAS & CHAT =====================
async function carregarConversas(showLoading = false) {
    const lista = document.getElementById('lista-conversas');
    if(showLoading) lista.innerHTML = '<div class="text-center p-4 text-slate-500 text-sm">Atualizando...</div>';

    try {
        const res = await fetch('/api/conversas');
        todasConversas = await res.json();
        lista.innerHTML = '';
        
        if(!document.getElementById('sec-kanban').classList.contains('hidden')) renderizarKanban();

        todasConversas.forEach(c => {
            const div = document.createElement('div');
            const isActive = conversaAtual?.id === c.id;
            div.className = `p-4 border-b border-slate-700/50 cursor-pointer transition flex gap-3 ${isActive ? 'bg-navy-700 border-l-4 border-primary' : 'hover:bg-navy-700/50 border-l-4 border-transparent'}`;
            div.onclick = () => abrirChat(c);

            const statusDot = c.status_bot 
                ? `<div class="w-2.5 h-2.5 rounded-full bg-whatsapp shadow-[0_0_8px_rgba(37,211,102,0.6)]" title="Robô"></div>` 
                : `<div class="w-2.5 h-2.5 rounded-full bg-slate-500" title="Humano"></div>`;

            div.innerHTML = `
                <div class="h-10 w-10 bg-slate-700 rounded-full flex shrink-0 items-center justify-center text-slate-400">
                    <i data-lucide="user" class="h-5 w-5"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-semibold text-slate-200 truncate text-sm">${c.nome || c.telefone}</span>
                        ${statusDot}
                    </div>
                    <p class="text-xs text-slate-400 truncate mb-1">${c.ultima_mensagem || '...'}</p>
                    <div class="flex gap-1">${renderTags(c.tags)}</div>
                </div>
            `;
            lista.appendChild(div);
        });
        lucide.createIcons({root: lista});
    } catch (e) {}
}

async function abrirChat(conversa) {
    conversaAtual = conversa;
    document.getElementById('chat-empty').classList.add('hidden');
    document.getElementById('chat-active').classList.remove('hidden');
    document.getElementById('erp-area').classList.remove('hidden');

    document.getElementById('chat-nome').innerText = conversa.nome;
    document.getElementById('chat-telefone').innerText = `+${conversa.telefone}`;
    document.getElementById('chat-tags-display').innerHTML = renderTags(conversa.tags);

    renderBotBtn();
    await carregarMensagens();
    carregarConversas(); 
}

function renderBotBtn() {
    const btn = document.getElementById('btn-robo');
    if (conversaAtual.status_bot) {
        btn.innerHTML = `<i data-lucide="bot-off" class="h-4 w-4"></i> Pausar Bot`;
        btn.className = "flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md hover:bg-red-500/20 transition text-sm font-medium";
    } else {
        btn.innerHTML = `<i data-lucide="bot" class="h-4 w-4"></i> Religar Bot`;
        btn.className = "flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md hover:bg-green-500/20 transition text-sm font-medium";
    }
    lucide.createIcons({root: btn});
}

async function alternarRobo() {
    if(!conversaAtual) return;
    const acao = conversaAtual.status_bot ? 'pausar' : 'ativar';
    try {
        await fetch(`/api/conversas/${conversaAtual.id}/${acao}`, { method: 'POST' });
        conversaAtual.status_bot = !conversaAtual.status_bot;
        renderBotBtn();
        carregarConversas(); // update dot
    } catch(e) {}
}

async function carregarMensagens() {
    if (!conversaAtual) return;
    try {
        const res = await fetch(`/api/conversas/${conversaAtual.id}`);
        const data = await res.json();
        const historico = document.getElementById('chat-historico');
        historico.innerHTML = '';
        // restore popup element
        historico.innerHTML = `<div id="quick-replies-popup" class="hidden absolute bottom-2 left-4 bg-navy-800 border border-slate-600 rounded-lg shadow-xl p-2 w-64 z-30"><div class="text-xs text-slate-400 mb-2 font-medium px-2">Respostas Rápidas</div><div id="quick-replies-list" class="flex flex-col gap-1 max-h-48 overflow-y-auto"></div></div>`;
        
        data.mensagens.forEach(msg => {
            const div = document.createElement('div');
            const bgClass = msg.origem === 'cliente' ? 'msg-client text-slate-200' : msg.origem === 'bot' ? 'msg-bot text-blue-100/90' : 'msg-shop text-white shadow-md';
            div.className = `msg-bubble ${bgClass}`;
            
            let content = `<span>${msg.texto}</span>`;
            
            if(msg.mediaType === 'image') {
                content = `<div class="mb-2 bg-slate-800 rounded p-2 flex flex-col items-center justify-center"><i data-lucide="image" class="h-8 w-8 text-slate-400 mb-2"></i><span class="text-xs text-slate-400 mb-1">Imagem Recebida</span></div>` + content;
            } else if (msg.mediaType === 'audio') {
                content = `<div class="mb-2"><audio controls class="h-8 w-48 outline-none grayscale"><source src="${msg.mediaUrl}" type="audio/mpeg">Seu navegador não suporta áudio.</audio></div>` + content;
            } else if (msg.mediaType === 'document') {
                content = `<div class="mb-2 flex items-center gap-2 bg-slate-800 p-2 rounded"><i data-lucide="file-text" class="h-5 w-5 text-slate-400"></i><span class="text-xs">Documento</span></div>` + content;
            } else if (msg.mediaUrl) {
                // fallback
                content = `<div class="mb-2 bg-slate-800 rounded p-2 text-xs flex items-center gap-2"><i data-lucide="paperclip" class="h-4 w-4"></i> Anexo Enviado</div>` + content;
            }
            
            div.innerHTML = content;
            historico.appendChild(div);
        });
        lucide.createIcons({root: historico});
        historico.scrollTop = historico.scrollHeight;
        renderPedidos(data.pedidos);
    } catch(e) {}
}

async function enviarMsg() {
    const input = document.getElementById('input-msg');
    const texto = input.value.trim();
    if (!texto || !conversaAtual) return;
    input.value = '';
    fecharQuickReply();
    
    document.getElementById('chat-historico').innerHTML += `<div class="msg-bubble msg-shop text-white opacity-60"><span>${texto}</span></div>`;
    document.getElementById('chat-historico').scrollTop = document.getElementById('chat-historico').scrollHeight;

    try {
        const res = await fetch(`/api/conversas/${conversaAtual.id}/enviar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto }) });
        if(res.ok) {
            conversaAtual.status_bot = false;
            renderBotBtn();
            carregarConversas();
            setTimeout(carregarMensagens, 500);
        } else { showToast('Erro', 'error'); }
    } catch(e) {}
}

// ===================== QUICK REPLIES =====================
// Inicializar com algumas base
const fallbackQR = [
    { atalho: "/pix", texto: "Nossa chave PIX é o CNPJ: 12.345.678/0001-90 (FBS Camisetas). Envie o comprovante aqui assim que fizer! 😊" },
    { atalho: "/prazo", texto: "O nosso prazo médio de produção para esse volume é de 7 a 10 dias úteis após a aprovação da arte." },
    { atalho: "/arte", texto: "Você tem a arte pronta em vetor (PDF ou Corel) ou uma imagem em alta qualidade?" }
];

function checarQuickReply(val) {
    const popup = document.getElementById('quick-replies-popup');
    if(val === '/') {
        popup.classList.remove('hidden');
        renderListaQuickReplies();
    } else if (!val.startsWith('/')) {
        fecharQuickReply();
    }
}

function fecharQuickReply() { document.getElementById('quick-replies-popup')?.classList.add('hidden'); }

function renderListaQuickReplies() {
    const l = document.getElementById('quick-replies-list');
    l.innerHTML = '';
    fallbackQR.forEach(q => {
        const div = document.createElement('div');
        div.className = 'p-2 hover:bg-slate-700 cursor-pointer rounded-md text-sm transition';
        div.innerHTML = `<span class="font-bold text-primary mr-2">${q.atalho}</span><span class="text-slate-300 truncate">${q.texto.substring(0,30)}...</span>`;
        div.onclick = () => {
            document.getElementById('input-msg').value = q.texto;
            fecharQuickReply();
            document.getElementById('input-msg').focus();
        };
        l.appendChild(div);
    });
}

// ===================== UPLOAD ARQUIVO =====================
async function uploadArquivo() {
    const input = document.getElementById('file-uploader');
    if (!input.files || input.files.length === 0 || !conversaAtual) return;
    
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', 'Anexo da Loja');
    
    document.getElementById('modal-upload').classList.remove('hidden');
    document.getElementById('modal-upload').classList.add('flex');

    try {
        const res = await fetch(`/api/conversas/${conversaAtual.id}/enviar-midia`, { method: 'POST', body: formData });
        if(res.ok) {
            showToast('Arquivo Enviado!');
            input.value = '';
            setTimeout(carregarMensagens, 1000);
        } else {
            showToast('Falha no upload', 'error');
        }
    } catch (e) { showToast('Erro API', 'error'); }
    
    document.getElementById('modal-upload').classList.add('hidden');
    document.getElementById('modal-upload').classList.remove('flex');
}

// ===================== ERP =====================
async function salvarPedido() {
    if(!conversaAtual) return;
    const body = {
        quantidade: document.getElementById('ped-qtd').value,
        tamanho: document.getElementById('ped-tamanho').value,
        cor: document.getElementById('ped-cor').value,
        local_estampa: document.getElementById('ped-estampa').value,
        valor_total: document.getElementById('ped-valor').value,
        sinal_pago: document.getElementById('ped-sinal').value,
        status: document.getElementById('ped-status').value
    };

    if(!body.valor_total) return showToast('Preencha o valor!', 'error');

    try {
        const res = await fetch(`/api/conversas/${conversaAtual.id}/pedidos`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        if(res.ok) {
            showToast('Pedido Salvo!');
            carregarMensagens();
        }
    } catch(e) { showToast('Erro', 'error'); }
}

function renderPedidos(pedidos) {
    const lista = document.getElementById('lista-pedidos');
    lista.innerHTML = '';
    if(pedidos.length === 0) {
        lista.innerHTML = '<p class="text-xs text-slate-500">Nenhum pedido ainda.</p>';
        return;
    }
    
    pedidos.forEach(p => {
        let color = 'slate-500';
        if(p.status === 'Pronto') color = 'green-400';
        else if (p.status === 'Em Produção') color = 'blue-500';
        else if (p.status === 'Finalizado') color = 'emerald-600';
        
        lista.innerHTML += `
            <div class="bg-navy-900 border border-slate-700/80 rounded-lg p-3 text-sm">
                <div class="flex justify-between items-start mb-2 border-b border-slate-700/50 pb-2">
                    <span class="font-semibold text-slate-200">#${p.id.split('-')[0]}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full border border-${color}/30 text-${color} bg-${color}/10">${p.status}</span>
                </div>
                <div class="grid grid-cols-2 gap-1 text-xs text-slate-400 mb-2">
                    <p>Qtd: <span class="text-slate-200">${p.quantidade}</span></p>
                    <p>Tam: <span class="text-slate-200">${p.tamanho}</span></p>
                    <p class="col-span-2">Cor: <span class="text-slate-200">${p.cor}</span> | Est: ${p.local_estampa}</p>
                </div>
            </div>
        `;
    });
}

carregarConversas(true);
setInterval(() => {
    carregarConversas(false);
    if(conversaAtual) carregarMensagens();
}, 8000);
