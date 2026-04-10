import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ConversaList } from '@/components/chat/ConversaList';
import { ChatArea } from '@/components/chat/ChatArea';
import { ClientPanel } from '@/components/chat/ClientPanel';
import { fetchConversas, fetchMensagens, fetchRespostas } from '@/services/api';
import type { Conversa, Mensagem, RespostaRapida } from '@/types/crm';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [active, setActive] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [respostas, setRespostas] = useState<RespostaRapida[]>([]);
  const [mobileView, setMobileView] = useState<'list' | 'chat' | 'panel'>('list');

  useEffect(() => {
    const load = () => {
      fetchConversas().then(setConversas);
      if (active) {
        fetchMensagens(active.id).then(data => setMensagens(data.mensagens));
      }
    };

    // Initial load
    fetchConversas().then(data => {
      setConversas(data);
      const chatId = searchParams.get('chat');
      if (chatId) {
        const found = data.find(c => c.id === chatId);
        if (found) handleSelect(found);
      }
    });
    fetchRespostas().then(setRespostas);

    // Fast Polling (3s) for real-time feel
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [active?.id, searchParams]);

  const handleSelect = async (c: Conversa) => {
    setActive(c);
    const data = await fetchMensagens(c.id);
    setMensagens(data.mensagens);
    setMobileView('chat');
  };

  const handleMensagemEnviada = (m: Mensagem) => {
    setMensagens(prev => [...prev, m]);
  };

  const handleConversaUpdate = (c: Conversa) => {
    setActive(c);
    setConversas(prev => prev.map(x => x.id === c.id ? c : x));
  };

  const handleRespostasUpdate = (r: RespostaRapida[]) => {
    setRespostas(r);
  };

  const handleDelete = (id: string) => {
    setConversas(prev => prev.filter(c => c.id !== id));
    setActive(null);
    setMobileView('list');
  };

  return (
    <div className="flex h-full w-full">
      {/* Col 1: Conversations List */}
      <div className={cn(
        'w-80 shrink-0 border-r',
        'max-lg:absolute max-lg:inset-0 max-lg:w-full max-lg:z-20 max-lg:bg-card',
        mobileView !== 'list' && 'max-lg:hidden'
      )}>
        <ConversaList conversas={conversas} activeId={active?.id ?? null} onSelect={handleSelect} />
      </div>

      {/* Col 2: Chat */}
      <div className={cn(
        'flex-1 min-w-0',
        'max-lg:absolute max-lg:inset-0 max-lg:z-20 max-lg:bg-background',
        mobileView !== 'chat' && 'max-lg:hidden'
      )}>
        {active ? (
          <ChatArea
            conversa={active}
            mensagens={mensagens}
            respostas={respostas}
            onMensagemEnviada={handleMensagemEnviada}
            onConversaUpdate={handleConversaUpdate}
            onBack={() => setMobileView('list')}
            onOpenPanel={() => {}} // Painel removido
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <MessageSquareIcon className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold italic">FBS Camisetas — Selecione uma conversa para faturar</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
